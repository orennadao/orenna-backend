// Projects - Get single project by ID
const { withDatabase, dbUtils } = require('../../lib/db');

async function projectHandler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = req.db;

  // Extract project ID from URL
  const projectId = req.url?.split('/').pop() || req.query.id;
  
  if (!projectId) {
    return dbUtils.errorResponse(res, 400, 'Project ID is required');
  }

  if (req.method === 'GET') {
    try {
      const project = await db.project.findUnique({
        where: { id: parseInt(projectId) },
        include: {
          LiftUnit: {
            orderBy: { createdAt: 'desc' },
            include: {
              LiftUnitEvent: {
                take: 10,
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          Payment: {
            orderBy: { createdAt: 'desc' },
            include: {
              PaymentEvent: {
                take: 5,
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          MintRequest: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          ProjectPaymentConfig: true,
          _count: {
            select: {
              LiftUnit: true,
              Payment: true,
              MintRequest: true
            }
          }
        }
      });

      if (!project) {
        return dbUtils.errorResponse(res, 404, 'Project not found');
      }

      return dbUtils.successResponse(res, project);

    } catch (error) {
      console.error('Get project error:', error);
      return dbUtils.errorResponse(res, 500, 'Failed to fetch project', error.message);
    }
  }

  if (req.method === 'PUT') {
    try {
      const { 
        name,
        description,
        ownerAddress,
        chainId,
        contractAddress,
        meta
      } = req.body || {};

      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (ownerAddress) updateData.ownerAddress = ownerAddress.toLowerCase();
      if (chainId) updateData.chainId = parseInt(chainId);
      if (contractAddress !== undefined) updateData.contractAddress = contractAddress;
      if (meta !== undefined) updateData.meta = meta;

      if (Object.keys(updateData).length === 0) {
        return dbUtils.errorResponse(res, 400, 'No valid update fields provided');
      }

      const project = await db.project.update({
        where: { id: parseInt(projectId) },
        data: updateData,
        include: {
          _count: {
            select: {
              LiftUnit: true,
              Payment: true,
              MintRequest: true
            }
          }
        }
      });

      return dbUtils.successResponse(res, project);

    } catch (error) {
      if (error.code === 'P2025') {
        return dbUtils.errorResponse(res, 404, 'Project not found');
      }
      console.error('Update project error:', error);
      return dbUtils.errorResponse(res, 500, 'Failed to update project', error.message);
    }
  }

  if (req.method === 'DELETE') {
    try {
      await db.project.delete({
        where: { id: parseInt(projectId) }
      });

      return dbUtils.successResponse(res, { 
        message: 'Project deleted successfully',
        projectId 
      });

    } catch (error) {
      if (error.code === 'P2025') {
        return dbUtils.errorResponse(res, 404, 'Project not found');
      }
      console.error('Delete project error:', error);
      return dbUtils.errorResponse(res, 500, 'Failed to delete project', error.message);
    }
  }

  return dbUtils.errorResponse(res, 405, 'Method not allowed');
}

module.exports = withDatabase(projectHandler);