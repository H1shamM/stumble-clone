import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { settings } from '../config/settings.js';
import type { IStoragePort } from '../db/storagePort.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export class AuthController {
  constructor(private storage: IStoragePort) {}

  register = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    let user = await this.storage.findUserByEmail(email);
    if (user) {
      const token = jwt.sign({ id: user.id }, settings.jwtSecret as string);
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
    await this.storage.saveUser(user);

    const token = jwt.sign({ id: userId }, settings.jwtSecret as string);
    res.json({ token, user: { id: userId, email, display_name: user.display_name, avatar_url: user.avatar_url } });
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await this.storage.findUserByEmail(email);
    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError('Invalid credentials', 401);
    }
    const token = jwt.sign({ id: user.id }, settings.jwtSecret as string);
    res.json({ token, user: { id: user.id, email: user.email, display_name: user.display_name, avatar_url: user.avatar_url } });
  };

  me = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user_id) throw new AppError('Unauthorized', 401);
    const user = await this.storage.getUserById(req.user_id);
    if (!user) throw new AppError('User not found', 404);
    res.json({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      provider: user.provider,
      created_at: user.created_at,
    });
  };
}
