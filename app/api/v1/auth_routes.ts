/**
 * @fileoverview Authentication router for user registration and login.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { settings } from '../../config/settings.js';
import type { IStoragePort } from '../../db/storage_port.js';

/**
 * Creates the authentication router.
 * @param {IStoragePort} storage - The storage adapter instance.
 * @returns {Router} The configured auth router.
 */
export function createAuthRouter(storage: IStoragePort): Router {
  const router = Router();
  // Accessing DB directly is discouraged but necessary due to current adapter design
  const db = (storage as unknown as { db: Database.Database }).db;

  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as { id: string; email: string; password_hash: string } | undefined;
      if (existingUser) {
        const token = jwt.sign({ id: existingUser.id }, settings.jwtSecret);
        return res.json({ token, user: { id: existingUser.id, email: existingUser.email } });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = crypto.randomUUID();
      
      db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
        userId, email, hashedPassword, new Date().toISOString()
      );
      
      const token = jwt.sign({ id: userId }, settings.jwtSecret);
      res.json({ token, user: { id: userId, email } });
    } catch (error) {
      console.error('Registration failed:', error);
      res.status(400).json({ error: 'Registration failed' });
    }
  });

  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as { id: string, email: string, password_hash: string } | undefined;
      
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ id: user.id }, settings.jwtSecret);
      res.json({ token, user: { id: user.id, email: user.email } });
    } catch (error) {
      console.error('Login failed:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  return router;
}
