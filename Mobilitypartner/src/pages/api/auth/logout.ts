import { NextApiRequest, NextApiResponse } from 'next';
import { removeTokenCookie } from '../../../utils/Auth';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  removeTokenCookie(res);
  res.status(200).json({ message: 'Logout successful' });
}