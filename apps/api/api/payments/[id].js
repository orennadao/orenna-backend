// Payment - Get single payment by ID and update status
const { withDatabase, dbUtils } = require('../../lib/db');

async function paymentHandler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = req.db;

  // Extract payment ID from URL
  const paymentId = req.url?.split('/').pop() || req.query.id;
  
  if (!paymentId) {
    return dbUtils.errorResponse(res, 400, 'Payment ID is required');
  }

  if (req.method === 'GET') {
    try {
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
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
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!payment) {
        return dbUtils.errorResponse(res, 404, 'Payment not found');
      }

      return dbUtils.successResponse(res, payment);

    } catch (error) {
      console.error('Get payment error:', error);
      return dbUtils.errorResponse(res, 500, 'Failed to fetch payment', error.message);
    }
  }

  if (req.method === 'PUT') {
    try {
      const { 
        status,
        txHash,
        metadata
      } = req.body || {};

      const updateData = {};
      if (status) updateData.status = status;
      if (txHash) updateData.txHash = txHash;
      if (metadata !== undefined) updateData.metadata = metadata;

      if (Object.keys(updateData).length === 0) {
        return dbUtils.errorResponse(res, 400, 'No valid update fields provided');
      }

      // Update payment
      const payment = await db.payment.update({
        where: { id: paymentId },
        data: updateData,
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
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      // Create payment event for status change
      if (status) {
        const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const eventType = status === 'CONFIRMED' ? 'PAYMENT_CONFIRMED' : 
                         status === 'COMPLETED' ? 'PAYMENT_COMPLETED' : 
                         status === 'FAILED' ? 'PAYMENT_FAILED' : 'PAYMENT_INITIATED';
        
        await db.paymentEvent.create({
          data: {
            id: eventId,
            paymentId: payment.id,
            type: eventType,
            performedBy: payment.payerAddress,
            amount: payment.amount,
            txHash: txHash || null,
            notes: `Payment status changed to ${status}`
          }
        });
      }

      return dbUtils.successResponse(res, payment);

    } catch (error) {
      if (error.code === 'P2025') {
        return dbUtils.errorResponse(res, 404, 'Payment not found');
      }
      console.error('Update payment error:', error);
      return dbUtils.errorResponse(res, 500, 'Failed to update payment', error.message);
    }
  }

  return dbUtils.errorResponse(res, 405, 'Method not allowed');
}

module.exports = withDatabase(paymentHandler);