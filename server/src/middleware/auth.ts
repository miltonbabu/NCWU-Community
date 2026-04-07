import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/auth.js';
import { get } from '../config/database.js';
import type { User, JWTPayload, UserRole } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

export type AuthRequest = Request & { user?: User; userId?: string };

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
  
  const user = get<User>('SELECT * FROM users WHERE id = ?', [decoded.userId]);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User not found.',
    });
  }
  
  if (user.is_banned) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been banned. Please contact administrator.',
    });
  }
  
  req.user = user;
  req.userId = user.id;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Not authenticated.',
      });
    }
    
    const userRole = req.user.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient privileges.',
      });
    }
    next();
  };
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. SuperAdmin privileges required.',
    });
  }
  next();
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = await get<User>('SELECT * FROM users WHERE id = ?', [decoded.userId]);
      if (user && !user.is_banned) {
        req.user = user;
        req.userId = user.id;
      }
    }
  }
  next();
}
