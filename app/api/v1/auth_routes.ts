/**
 * @fileoverview Authentication router for user registration, login, and OAuth2.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { settings } from '../../config/settings.js';
import type { IStoragePort } from '../../db/storage_port.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import type { User } from '../../models/user.js';

/**
 * Creates the authentication router.
 * @param {IStoragePort} storage - The storage adapter instance.
 * @returns {Router} The configured auth router.
 */
export function createAuthRouter(storage: IStoragePort): Router {
  const router = Router();

  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      let user = await storage.find_user_by_email(email);
      if (user) {
        const token = jwt.sign({ id: user.id }, settings.jwtSecret);
        return res.json({ token, user: { id: user.id, email: user.email, display_name: user.display_name, avatar_url: user.avatar_url } });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = crypto.randomUUID();
      
      user = {
        id: userId,
        email,
        password_hash: hashedPassword,
        provider: 'local',
        created_at: new Date(),
      };
      
      await storage.save_user(user);
      
      const token = jwt.sign({ id: userId }, settings.jwtSecret);
      res.json({ token, user: { id: userId, email, display_name: user.display_name, avatar_url: user.avatar_url } });
    } catch (error) {
      console.error('Registration failed:', error);
      res.status(400).json({ error: 'Registration failed' });
    }
  });

  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await storage.find_user_by_email(email);
      
      if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ id: user.id }, settings.jwtSecret);
      res.json({ token, user: { id: user.id, email: user.email, display_name: user.display_name, avatar_url: user.avatar_url } });
    } catch (error) {
      console.error('Login failed:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // OAuth Routes
  if (settings.google) {
    router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    router.get('/google/callback', 
      passport.authenticate('google', { failureRedirect: '/login', session: false }),
      (req: Request, res: Response) => {
        const user = req.user as User;
        const token = jwt.sign({ id: user.id }, settings.jwtSecret);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${token}`);
      }
    );
  }

  if (settings.github) {
    router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
    router.get('/github/callback', 
      passport.authenticate('github', { failureRedirect: '/login', session: false }),
      (req: Request, res: Response) => {
        const user = req.user as User;
        const token = jwt.sign({ id: user.id }, settings.jwtSecret);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${token}`);
      }
    );
  }

  router.get('/me', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user_id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      const user = await storage.get_user_by_id(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      res.json({
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        provider: user.provider,
        created_at: user.created_at
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  return router;
}
