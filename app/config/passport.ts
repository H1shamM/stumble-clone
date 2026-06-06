/**
 * @fileoverview Passport configuration for OAuth2 strategies.
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import crypto from 'crypto';
import { settings } from './settings.js';
import type { IStoragePort } from '../db/storage_port.js';
import type { User } from '../models/user.js';

/**
 * Initializes passport with OAuth2 strategies.
 * @param {IStoragePort} storage - The storage adapter.
 */
export function initPassport(storage: IStoragePort): void {
  if (settings.google) {
    passport.use(new GoogleStrategy({
      clientID: settings.google.clientId,
      clientSecret: settings.google.clientSecret,
      callbackURL: settings.google.callbackUrl,
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        let user = await storage.find_user_by_provider('google', profile.id);
        if (!user) {
          const email = profile.emails?.[0].value;
          if (!email) return done(new Error('No email found in Google profile'));
          
          user = await storage.find_user_by_email(email);
          if (user) {
            // Link existing account
            user.provider = 'google';
            user.provider_id = profile.id;
            user.display_name = user.display_name || profile.displayName;
            user.avatar_url = user.avatar_url || profile.photos?.[0].value;
            await storage.save_user(user);
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
            await storage.save_user(user);
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  if (settings.github) {
    passport.use(new GitHubStrategy({
      clientID: settings.github.clientId,
      clientSecret: settings.github.clientSecret,
      callbackURL: settings.github.callbackUrl,
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        let user = await storage.find_user_by_provider('github', profile.id);
        if (!user) {
          const email = profile.emails?.[0].value;
          if (!email) return done(new Error('No email found in GitHub profile'));
          
          user = await storage.find_user_by_email(email);
          if (user) {
            // Link existing account
            user.provider = 'github';
            user.provider_id = profile.id;
            user.display_name = user.display_name || profile.displayName;
            user.avatar_url = user.avatar_url || profile.photos?.[0].value;
            await storage.save_user(user);
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
            await storage.save_user(user);
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.get_user_by_id(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
