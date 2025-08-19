// Projects - List all projects
const { withDatabase, dbUtils } = require('../../lib/db');

async function projectsHandler(req, res) {
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
      const filters = dbUtils.getFilters(req, ['name', 'chainId', 'ownerAddress']);

      // Build where clause
      const where = {};
      if (filters.name) where.name = { contains: filters.name, mode: 'insensitive' };
      if (filters.chainId) where.chainId = parseInt(filters.chainId);
      if (filters.ownerAddress) where.ownerAddress = filters.ownerAddress.toLowerCase();

      // Get projects with related data
      const [projects, totalCount] = await Promise.all([
        db.project.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          // No includes for now - just basic project data
        }),
        db.project.count({ where })
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

      return dbUtils.successResponse(res, projects, meta);

    } catch (error) {
      console.error('Get projects error:', error);
      return dbUtils.errorResponse(res, 500, 'Failed to fetch projects', error.message);
    }
  }

  if (req.method === 'POST') {
    try {
      const { 
        name,
        slug,
        description,
        ownerAddress,
        chainId,
        contractAddress,
        meta
      } = req.body || {};

      // Validate required fields
      if (!name || !slug) {
        return dbUtils.errorResponse(res, 400, 'Missing required fields: name, slug');
      }

      // Validate Ethereum address format if provided
      if (ownerAddress) {
        const addressRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!addressRegex.test(ownerAddress)) {
          return dbUtils.errorResponse(res, 400, 'Invalid Ethereum address format');
        }
      }

      // Check if project with this slug already exists
      const existingProject = await db.project.findUnique({
        where: { slug: slug }
      });

      if (existingProject) {
        return dbUtils.errorResponse(res, 409, 'Project with this slug already exists');
      }

      // Create new project
      const project = await db.project.create({
        data: {
          name,
          slug,
          description: description || '',
          ownerAddress: ownerAddress ? ownerAddress.toLowerCase() : null,
          chainId: chainId ? parseInt(chainId) : null,
          contractAddress: contractAddress || null,
          meta: meta || null
        }
      });

      return dbUtils.successResponse(res, project);

    } catch (error) {
      console.error('Create project error:', error);
      return dbUtils.errorResponse(res, 500, 'Failed to create project', error.message);
    }
  }

  return dbUtils.errorResponse(res, 405, 'Method not allowed');
}

module.exports = withDatabase(projectsHandler);