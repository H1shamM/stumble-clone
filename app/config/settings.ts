/**
 * @fileoverview Configuration settings for the application.
 */

/**
 * Application settings interface.
 */
export interface AppSettings {
  /** The port the application runs on. */
  port: number;
  /** The path to the SQLite database. */
  dbPath: string;
  /** The environment mode (development, production, etc.). */
  env: string;
  /** JWT secret for authentication. */
  jwtSecret: string;
  /** Default user ID used when dev auth bypass is enabled. */
  devUserId: string;
}

/**
 * Application configuration loaded from environment variables.
 */
export const settings: AppSettings = {
  port: parseInt(process.env.PORT || '3000', 10),
  dbPath: process.env.DB_PATH || 'stumble.db',
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'secret',
  devUserId: process.env.DEV_USER_ID || 'dev-user',
};
