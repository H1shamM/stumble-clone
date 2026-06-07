import type { OAuthProfile } from "../types/auth.js";
/**
 * @fileoverview Passport configuration for OAuth2 strategies.
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import crypto from 'crypto';
import { settings } from './settings.js';
import type { IStoragePort } from '../db/storagePort.js';
import type { User } from '../models/user.js';

/**
 * Initializes passport with OAuth2 strategies.
 */
export function initPassport(storage: IStoragePort): void {
  const googleConfig = settings.google;
  if (googleConfig) {
    passport.use(new GoogleStrategy({
      clientID: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
      callbackURL: googleConfig.callbackUrl,
      passReqToCallback: true,
    }, async (_req: any, _accessToken: string, _refreshToken: string, profile: OAuthProfile, done: (error: any, user?: User) => void) => {
      try {
        let user = await storage.findUserByProvider('google', profile.id);
        if (!user) {
          const email = profile.emails?.[0].value;
          if (!email) return done(new Error('No email found in Google profile'));
          
          user = await storage.findUserByEmail(email);
          if (user) {
            // Link existing account
            user.provider = 'google';
            user.provider_id = profile.id;
            user.display_name = user.display_name || profile.displayName;
            user.avatar_url = user.avatar_url || profile.photos?.[0].value;
            await storage.saveUser(user);
          } else {
            // Create new account
            user = {
              id: crypto.randomUUID(),
              email,
              password_hash: null,
              display_name: profile.displayName,
              avatar_url: profile.photos?.[0].value,
              provider: 'google',
              provider_id: profile.id,
              created_at: new Date(),
            };
            await storage.saveUser(user);
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  const githubConfig = settings.github;
  if (githubConfig) {
    passport.use(new GitHubStrategy({
      clientID: githubConfig.clientId,
      clientSecret: githubConfig.clientSecret,
      callbackURL: githubConfig.callbackUrl,
      passReqToCallback: true,
    }, async (_req: any, _accessToken: string, _refreshToken: string, profile: OAuthProfile, done: (error: any, user?: User) => void) => {
      try {
        let user = await storage.findUserByProvider('github', profile.id);
        if (!user) {
          const email = profile.emails?.[0].value;
          if (!email) return done(new Error('No email found in GitHub profile'));
          
          user = await storage.findUserByEmail(email);
          if (user) {
            // Link existing account
            user.provider = 'github';
            user.provider_id = profile.id;
            user.display_name = user.display_name || profile.displayName;
            user.avatar_url = user.avatar_url || profile.photos?.[0].value;
            await storage.saveUser(user);
          } else {
            // Create new account
            user = {
              id: crypto.randomUUID(),
              email,
              password_hash: null,
              display_name: profile.displayName || profile.username,
              avatar_url: profile.photos?.[0].value,
              provider: 'github',
              provider_id: profile.id,
              created_at: new Date(),
            };
            await storage.saveUser(user);
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  passport.serializeUser((user: any, done) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    done(null, (user as any).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
