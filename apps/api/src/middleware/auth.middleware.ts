import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './error.middleware';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'UNAUTHORIZED', 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      username: string;
    };

    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'UNAUTHORIZED', 'Invalid token'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET;

      if (secret) {
        const decoded = jwt.verify(token, secret) as {
          userId: string;
          email: string;
          username: string;
        };

        req.userId = decoded.userId;
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          username: decoded.username,
        };
      }
    }

    next();
  } catch (error) {
    // Silently continue without auth for optional auth
    next();
  }
};
