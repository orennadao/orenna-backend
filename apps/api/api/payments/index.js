// Payments - List and create payments
const { withDatabase, dbUtils } = require('../../lib/db');

async function paymentsHandler(req, res) {
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
        'status', 'paymentType', 'projectId', 'payerAddress', 'recipientAddress', 'chainId'
      ]);

      // Build where clause
      const where = {};
      if (filters.status) where.status = filters.status;
      if (filters.paymentType) where.paymentType = filters.paymentType;
      if (filters.projectId) where.projectId = parseInt(filters.projectId);
      if (filters.payerAddress) where.payerAddress = filters.payerAddress.toLowerCase();
      if (filters.recipientAddress) where.recipientAddress = filters.recipientAddress.toLowerCase();
      if (filters.chainId) where.chainId = parseInt(filters.chainId);

      // Get payments with related data
      const [payments, totalCount] = await Promise.all([
        db.payment.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                slug: true,
                ownerAddress: true
              }
            },
            PaymentEvent: {
              take: 5,
              orderBy: { createdAt: 'desc' }
            }
          }
        }),
        db.payment.count({ where })
      ]);

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

      return dbUtils.successResponse(res, payments, meta);

    } catch (error) {
      console.error('Get payments error:', error);
      return dbUtils.errorResponse(res, 500, 'Failed to fetch payments', error.message);
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        paymentType = 'PROJECT_FUNDING',
        projectId,
        amount,
        paymentToken = 'ETH',
        chainId = 1,
        payerAddress,
        payerEmail,
        recipientAddress,
        escrowContract,
        escrowConfig,
        description,
        metadata
      } = req.body || {};

      // Validate required fields
      if (!amount || !payerAddress || !recipientAddress) {
        return dbUtils.errorResponse(res, 400, 
          'Missing required fields: amount, payerAddress, recipientAddress');
      }

      // Validate Ethereum address formats
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!addressRegex.test(payerAddress)) {
        return dbUtils.errorResponse(res, 400, 'Invalid Ethereum address format for payer');
      }
      if (!addressRegex.test(recipientAddress)) {
        return dbUtils.errorResponse(res, 400, 'Invalid Ethereum address format for recipient');
      }

      // Verify project exists if projectId provided
      if (projectId) {
        const project = await db.project.findUnique({
          where: { id: parseInt(projectId) }
        });

        if (!project) {
          return dbUtils.errorResponse(res, 404, 'Project not found');
        }
      }

      // Generate unique payment ID
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create payment
      const payment = await db.payment.create({
        data: {
          id: paymentId,
          paymentType,
          projectId: projectId ? parseInt(projectId) : null,
          amount: amount.toString(),
          paymentToken,
          chainId: parseInt(chainId),
          payerAddress: payerAddress.toLowerCase(),
          payerEmail: payerEmail || null,
          recipientAddress: recipientAddress.toLowerCase(),
          escrowContract: escrowContract || null,
          escrowConfig: escrowConfig || null,
          description: description || null,
          metadata: metadata || null,
          status: 'PENDING'
        },
        include: {
          project: projectId ? {
            select: {
              id: true,
              name: true,
              slug: true,
              ownerAddress: true
            }
          } : false
        }
      });

      // Create initial payment event
      const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.paymentEvent.create({
        data: {
          id: eventId,
          paymentId: payment.id,
          type: 'PAYMENT_INITIATED',
          performedBy: payment.payerAddress,
          amount: payment.amount,
          fromAddress: payment.payerAddress,
          toAddress: payment.recipientAddress,
          notes: 'Payment initiated'
        }
      });

      return dbUtils.successResponse(res, payment);

    } catch (error) {
      console.error('Create payment error:', error);
      return dbUtils.errorResponse(res, 500, 'Failed to create payment', error.message);
    }
  }

  return dbUtils.errorResponse(res, 405, 'Method not allowed');
}

module.exports = withDatabase(paymentsHandler);