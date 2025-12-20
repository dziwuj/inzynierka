import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import pool from "../db";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

// Use BACKEND_URL for OAuth callback (should be set to your frontend domain)
const BACKEND_URL = process.env.BACKEND_URL || "https://localhost:3000";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn(
    "⚠️  Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.",
  );
}

const callbackURL = `${BACKEND_URL}/api/auth/google/callback`;
console.log(`🔐 Google OAuth callback URL: ${callbackURL}`);

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName;

        if (!email) {
          return done(new Error("No email provided by Google"), undefined);
        }

        // Check if user exists
        let result = await pool.query(
          "SELECT id, username, email, is_admin, email_verified FROM users WHERE email = $1",
          [email],
        );

        let user;

        if (result.rows.length > 0) {
          // User exists, update last login
          user = result.rows[0];
          await pool.query(
            "UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1",
            [user.id],
          );
        } else {
          // Create new user
          const username = email.split("@")[0] + "_" + Date.now().toString(36);

          result = await pool.query(
            `INSERT INTO users (username, email, password_hash, email_verified) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, username, email, is_admin, email_verified`,
            [
              username,
              email,
              "", // Empty password hash for OAuth users
              true, // Google users are pre-verified
            ],
          );

          user = result.rows[0];
        }

        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error as Error, undefined);
      }
    },
  ),
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, is_admin, email_verified FROM users WHERE id = $1",
      [id],
    );

    if (result.rows.length > 0) {
      done(null, result.rows[0]);
    } else {
      done(new Error("User not found"), null);
    }
  } catch (error) {
    done(error, null);
  }
});

export default passport;
