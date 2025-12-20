import bcrypt from "bcryptjs";
import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

import passport from "../config/passport";
import pool from "../db";
import { validate } from "../middleware/validation";
import {
  CreateUserSchema,
  ErrorResponseSchema,
  LoginSchema,
  User,
} from "../schemas";
import {
  generateVerificationToken,
  sendVerificationEmail,
} from "../utils/email";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const router = Router();

// ============================================================================
// Register
// ============================================================================

router.post(
  "/register",
  validate(
    z.object({
      body: CreateUserSchema,
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      // Clean up expired pending registrations
      await pool.query("SELECT cleanup_expired_pending_registrations()");

      // Check if user already exists
      const existingUser = await pool.query(
        "SELECT id, email, password_hash FROM users WHERE username = $1 OR email = $2",
        [username, email],
      );

      if (existingUser.rows.length > 0) {
        const user = existingUser.rows[0];

        // Check if this is an OAuth-only account (no password set)
        if (
          user.email === email &&
          (!user.password_hash || user.password_hash === "")
        ) {
          res.status(400).json(
            ErrorResponseSchema.parse({
              error:
                "This email is already registered via Google. Please sign in with Google or contact support to set a password.",
            }),
          );
          return;
        }

        res.status(400).json(
          ErrorResponseSchema.parse({
            error: "User with this username or email already exists",
          }),
        );
        return;
      }

      // Check if there's already a pending registration
      const existingPending = await pool.query(
        "SELECT id FROM pending_registrations WHERE username = $1 OR email = $2",
        [username, email],
      );

      if (existingPending.rows.length > 0) {
        res.status(400).json(
          ErrorResponseSchema.parse({
            error:
              "A registration with this username or email is already pending verification. Please check your email.",
          }),
        );
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate verification token
      const verificationToken = generateVerificationToken();
      const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store in pending_registrations table instead of users table
      const insertResult = await pool.query(
        `INSERT INTO pending_registrations (username, email, password_hash, verification_token, verification_expires_at) 
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          username,
          email,
          hashedPassword,
          verificationToken,
          verificationExpiresAt,
        ],
      );

      console.log(
        `Pending registration created: ID=${insertResult.rows[0]?.id}, email=${email}, token=${verificationToken.substring(0, 20)}...`,
      );

      // Send verification email
      try {
        await sendVerificationEmail(email, username, verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue with registration even if email fails
      }

      res.status(201).json({
        message:
          "Registration successful. Please check your email to verify your account.",
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

// ============================================================================
// Login
// ============================================================================

router.post(
  "/login",
  validate(
    z.object({
      body: LoginSchema,
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      const result = await pool.query(
        `SELECT id, username, email, password_hash, is_admin, email_verified, created_at, updated_at 
         FROM users 
         WHERE username = $1 OR email = $1`,
        [username],
      );

      if (result.rows.length === 0) {
        res.status(401).json(
          ErrorResponseSchema.parse({
            error: "Invalid credentials",
          }),
        );
        return;
      }

      const user = result.rows[0];

      // Check if this is an OAuth-only account
      if (!user.password_hash || user.password_hash === "") {
        res.status(400).json(
          ErrorResponseSchema.parse({
            error:
              "This account uses Google sign-in. Please click 'Sign in with Google'.",
          }),
        );
        return;
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        res.status(401).json(
          ErrorResponseSchema.parse({
            error: "Invalid credentials",
          }),
        );
        return;
      }

      // Check if email is verified
      if (!user.email_verified) {
        res.status(403).json(
          ErrorResponseSchema.parse({
            error:
              "Email not verified. Please check your inbox for the verification link.",
          }),
        );
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          isAdmin: user.is_admin,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions,
      );

      // Remove password_hash from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash: _password, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

// ============================================================================
// Verify Email
// ============================================================================

router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    console.log("Email verification attempt with token:", token);

    if (!token || typeof token !== "string") {
      console.log("Token validation failed - missing or invalid type");
      res.status(400).json(
        ErrorResponseSchema.parse({
          error: "Verification token is required",
        }),
      );
      return;
    }

    // Find pending registration with this token
    const pendingResult = await pool.query(
      `SELECT id, username, email, password_hash, verification_expires_at 
       FROM pending_registrations 
       WHERE verification_token = $1`,
      [token],
    );

    console.log("Pending registrations found:", pendingResult.rows.length);

    if (pendingResult.rows.length === 0) {
      // Token not found in pending registrations
      // Check if there's a verified user (token already used)
      console.log(
        "No pending registration found for token, checking if already verified",
      );

      // We can't match by token since we don't store it after verification
      // Just return a helpful message
      res.status(200).json({
        message:
          "This verification link has already been used or has expired. If you already verified your email, you can log in.",
        alreadyVerified: true,
      });
      return;
    }

    const pending = pendingResult.rows[0];

    // Check if token expired
    if (
      pending.verification_expires_at &&
      new Date(pending.verification_expires_at) < new Date()
    ) {
      // Clean up expired registration
      await pool.query("DELETE FROM pending_registrations WHERE id = $1", [
        pending.id,
      ]);

      res.status(400).json(
        ErrorResponseSchema.parse({
          error: "Verification token has expired. Please register again.",
        }),
      );
      return;
    }

    // Check if user already exists (in case of duplicate request)
    const existingUserCheck = await pool.query(
      `SELECT id, email_verified FROM users WHERE email = $1`,
      [pending.email],
    );

    if (existingUserCheck.rows.length > 0) {
      // User already created (duplicate request), just delete pending and return success
      await pool.query("DELETE FROM pending_registrations WHERE id = $1", [
        pending.id,
      ]);

      res.status(200).json({
        message: "Email verified successfully. You can now log in.",
      });
      return;
    }

    // Create the actual user account
    await pool.query(
      `INSERT INTO users (username, email, password_hash, email_verified) 
       VALUES ($1, $2, $3, TRUE)`,
      [pending.username, pending.email, pending.password_hash],
    );

    // Delete from pending_registrations
    await pool.query("DELETE FROM pending_registrations WHERE id = $1", [
      pending.id,
    ]);

    res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json(
      ErrorResponseSchema.parse({
        error: "Internal server error",
      }),
    );
  }
});

// ============================================================================
// Resend Verification Email
// ============================================================================

router.post(
  "/resend-verification",
  validate(
    z.object({
      body: z.object({
        email: z.string().email(),
      }),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      // Check pending registrations first
      const pendingResult = await pool.query(
        `SELECT id, username, email 
         FROM pending_registrations 
         WHERE email = $1`,
        [email],
      );

      if (pendingResult.rows.length > 0) {
        const pending = pendingResult.rows[0];

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const verificationExpiresAt = new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        );

        // Update token in pending_registrations
        await pool.query(
          `UPDATE pending_registrations 
           SET verification_token = $1, 
               verification_expires_at = $2 
           WHERE id = $3`,
          [verificationToken, verificationExpiresAt, pending.id],
        );

        // Send verification email
        await sendVerificationEmail(email, pending.username, verificationToken);

        res.status(200).json({
          message: "Verification email sent. Please check your inbox.",
        });
        return;
      }

      // Check if user already exists and is verified
      const userResult = await pool.query(
        `SELECT email_verified FROM users WHERE email = $1`,
        [email],
      );

      if (userResult.rows.length > 0) {
        if (userResult.rows[0].email_verified) {
          res.status(400).json(
            ErrorResponseSchema.parse({
              error: "Email is already verified. You can log in.",
            }),
          );
          return;
        }
      }

      // Don't reveal if email doesn't exist
      res.status(200).json({
        message:
          "If a pending registration with that email exists, a verification email has been sent.",
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

// ============================================================================
// Google OAuth - Initiate
// ============================================================================

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// ============================================================================
// Google OAuth - Callback
// ============================================================================

router.get(
  "/google/callback",
  (req: Request, res: Response, next) => {
    console.log("🔵 Google OAuth callback received:", {
      url: req.url,
      query: req.query,
      headers: {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer,
      },
    });
    next();
  },
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed`,
  }),
  (req: Request, res: Response) => {
    try {
      console.log("✅ Google OAuth authentication successful");
      const user = req.user as User;

      if (!user) {
        console.log("❌ No user after OAuth");
        res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          isAdmin: user.is_admin,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions,
      );

      console.log("🔑 JWT token generated, redirecting to frontend");
      // Redirect to frontend with token
      res.redirect(
        `${FRONTEND_URL}/login?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`,
      );
    } catch (error) {
      console.error("❌ Google OAuth callback error:", error);
      res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  },
);

export default router;
