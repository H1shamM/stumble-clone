/**
 * @fileoverview JWT authentication middleware.
 */

import * as express from 'express';
import jwt from 'jsonwebtoken';
import { settings } from '../config/settings.js';

/**
 * Request object extended with authenticated user ID.
 */
export interface AuthenticatedRequest extends express.Request {
  user_id?: string;
}

/**
 * Expected JWT payload structure.
 */
interface JwtPayload {
  id: string;
}

/**
 * Middleware to authenticate JWT tokens in the Authorization header.
 * @param {AuthenticatedRequest} req - The request object.
 * @param {express.Response} res - The response object.
 * @param {express.NextFunction} next - The next middleware function.
 */
export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (settings.env === 'development') {
    req.user_id = settings.devUserId;
    next();
    return;
  }

  if (!authHeader) {
    res.sendStatus(401);
    return;
  }

  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, settings.jwtSecret, (err, decoded) => {
    if (err) {
      res.sendStatus(403);
      return;
    }
    
    if (decoded && typeof decoded === 'object' && 'id' in decoded) {
      req.user_id = (decoded as JwtPayload).id;
      next();
    } else {
      res.sendStatus(403);
    }
  });
};
