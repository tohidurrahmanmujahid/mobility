import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { serialize, parse } from 'cookie';
import { NextApiRequest, NextApiResponse } from 'next';
import { User, UserRole, Dealer, DealerRole } from '@prisma/client';

const getJWTSecret = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('JWT_SECRET environment variable is not set');
    throw new Error('JWT_SECRET environment variable is required');
  }
  return JWT_SECRET;
};
const MAX_AGE = 60 * 60 * 24 * 1; // 1 day

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// Generate token for User (admin/staff)
export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      dealerId: user.dealerId,
      userType: 'USER' // Distinguish between User and Dealer
    },
    getJWTSecret(),
    { expiresIn: MAX_AGE }
  );
}

// Generate token for Dealer (owner or staff)
export function generateDealerToken(dealer: Dealer, parentDealer?: Dealer): string {
  const isStaff = dealer.role === DealerRole.STAFF;
  const companyName = isStaff && parentDealer ? parentDealer.companyName : dealer.companyName;
  const dealerId = isStaff ? dealer.dealerId : dealer.id;

  return jwt.sign(
    {
      id: dealer.id,
      email: dealer.email,
      role: dealer.role === DealerRole.OWNER ? 'DEALER' : 'DEALER_STAFF',
      name: dealer.name,
      companyName: companyName,
      dealerId: dealerId,
      userType: dealer.role === DealerRole.OWNER ? 'DEALER' : 'DEALER_STAFF'
    },
    getJWTSecret(),
    { expiresIn: MAX_AGE }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, getJWTSecret());
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Client-safe token decoding (doesn't verify signature)
// Use this on the client side to read token claims
// Server-side verification will happen on API calls
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('JWT decoding failed:', error);
    return null;
  }
}

export function setTokenCookie(res: NextApiResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookie = serialize('auth_token', token, {
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1000),
    httpOnly: true,
    secure: isProduction,
    path: '/',
    sameSite: 'lax',
    domain: isProduction && process.env.COOKIE_DOMAIN ? process.env.COOKIE_DOMAIN : undefined,
  });

  res.setHeader('Set-Cookie', cookie);
}

export function removeTokenCookie(res: NextApiResponse): void {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookie = serialize('auth_token', '', {
    maxAge: -1,
    path: '/',
    secure: isProduction,
    sameSite: 'lax',
    domain: isProduction && process.env.COOKIE_DOMAIN ? process.env.COOKIE_DOMAIN : undefined,
  });

  res.setHeader('Set-Cookie', cookie);
}

export function setTokenToLocalStorage(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function getTokenFromLocalStorage(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

export function removeTokenFromLocalStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

export function getTokenFromRequest(req: NextApiRequest): string | null {
  const cookies = parse(req.headers.cookie || '');
  const cookieToken = cookies.auth_token;

  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export function authenticateUser(req: NextApiRequest): any {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  
  return verifyToken(token);
}

export function requireRole(requiredRole: UserRole, user: any): boolean {
  if (!user) return false;
  
  // Admin has access to everything
  if (user.role === UserRole.ADMIN) return true;
  
  // Dealer staff can only access dealer features
  if (user.role === UserRole.DEALER_STAFF && requiredRole === UserRole.DEALER) return true;
  
  // Exact role match
  return user.role === requiredRole;
}