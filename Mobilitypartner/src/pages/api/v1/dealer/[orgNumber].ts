import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { orgNumber } = req.query;

      if (!orgNumber || typeof orgNumber !== 'string') {
        return res.status(400).json({ message: 'Organization number is required' });
      }

      // Find dealer by organization number
      const dealer = await prisma.dealer.findUnique({
        where: { orgNumber },
        include: {
          owner: true,
          staff: {
            where: {
              role: 'DEALER'
            },
            select: {
              email: true,
              phone: true,
              name: true
            }
          },
          _count: {
            select: {
              warranties: true,
              invoices: true
            }
          }
        }
      });

      if (!dealer) {
        return res.status(404).json({ message: 'Dealer not found' });
      }

      // Get all vehicles associated with the dealer's owner ID
      let vehicles = [];
      if (dealer.ownerId) {
        vehicles = await prisma.vehicleApiCache.findMany({
          where: {
            ownerId: dealer.ownerId
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      }

      res.status(200).json({
        dealer,
        vehicles
      });
    } catch (error) {
      console.error('Error fetching dealer and vehicles:', error);
      res.status(500).json({ message: 'Failed to fetch dealer and vehicles' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
