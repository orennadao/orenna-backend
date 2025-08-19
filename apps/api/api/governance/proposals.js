// Governance - Proposals endpoint
const { withDatabase, dbUtils } = require('../../lib/db');

async function proposalsHandler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = req.db;

  if (req.method === 'GET') {
    try {
      // Get pagination and filters
      const { limit, offset } = dbUtils.getPagination(req);
      const filters = dbUtils.getFilters(req, [
        'status', 'proposalType', 'chainId', 'proposerAddress'
      ]);

      // Build where clause
      const where = {};
      if (filters.status) where.status = filters.status;
      if (filters.proposalType) where.proposalType = filters.proposalType;
      if (filters.chainId) where.chainId = parseInt(filters.chainId);
      if (filters.proposerAddress) where.proposerAddress = filters.proposerAddress.toLowerCase();

      // Get proposals with related data
      const [proposals, totalCount] = await Promise.all([
        db.governanceProposal.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            votes: {
              include: {
                user: {
                  select: {
                    id: true,
                    address: true,
                    username: true,
                    ensName: true
                  }
                }
              }
            },
            events: {
              take: 10,
              orderBy: { createdAt: 'desc' }
            },
            _count: {
              select: {
                votes: true
              }
            }
          }
        }),
        db.governanceProposal.count({ where })
      ]);

      // Calculate vote tallies for each proposal
      const proposalsWithTallies = proposals.map(proposal => {
        const voteTally = proposal.votes.reduce((tally, vote) => {
          const support = vote.support.toString();
          tally[support] = (tally[support] || 0) + parseFloat(vote.votingPower || '0');
          return tally;
        }, {});

        return {
          ...proposal,
          voteTally: {
            against: voteTally['0'] || 0,
            for: voteTally['1'] || 0,
            abstain: voteTally['2'] || 0
          }
        };
      });

      const meta = {
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasNext: offset + limit < totalCount,
          hasPrev: offset > 0
        },
        filters
      };

      return dbUtils.successResponse(res, proposalsWithTallies, meta);

    } catch (error) {
      console.error('Get proposals error:', error);
      return dbUtils.errorResponse(res, 500, 'Failed to fetch proposals', error.message);
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        chainId,
        proposalId,
        proposerAddress,
        title,
        description,
        proposalType,
        targets,
        values,
        calldatas,
        voteStart,
        voteEnd,
        ecosystemData,
        methodRegistryData,
        financeData,
        liftTokenData
      } = req.body || {};

      // Validate required fields
      if (!chainId || !proposalId || !proposerAddress || !title || !description || !proposalType) {
        return dbUtils.errorResponse(res, 400, 
          'Missing required fields: chainId, proposalId, proposerAddress, title, description, proposalType');
      }

      // Validate Ethereum address format
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!addressRegex.test(proposerAddress)) {
        return dbUtils.errorResponse(res, 400, 'Invalid Ethereum address format');
      }

      // Check if proposal already exists
      const existingProposal = await db.governanceProposal.findUnique({
        where: {
          chainId_proposalId: {
            chainId: parseInt(chainId),
            proposalId
          }
        }
      });

      if (existingProposal) {
        return dbUtils.errorResponse(res, 409, 'Proposal already exists');
      }

      // Create proposal
      const proposal = await db.governanceProposal.create({
        data: {
          chainId: parseInt(chainId),
          proposalId,
          proposerAddress: proposerAddress.toLowerCase(),
          title,
          description,
          proposalType,
          targets: targets || [],
          values: values || [],
          calldatas: calldatas || [],
          status: 'PENDING',
          voteStart: voteStart ? new Date(voteStart) : null,
          voteEnd: voteEnd ? new Date(voteEnd) : null,
          ecosystemData: ecosystemData || {},
          methodRegistryData: methodRegistryData || {},
          financeData: financeData || {},
          liftTokenData: liftTokenData || {}
        }
      });

      return dbUtils.successResponse(res, proposal);

    } catch (error) {
      console.error('Create proposal error:', error);
      return dbUtils.errorResponse(res, 500, 'Failed to create proposal', error.message);
    }
  }

  return dbUtils.errorResponse(res, 405, 'Method not allowed');
}

module.exports = withDatabase(proposalsHandler);