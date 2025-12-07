import crypto from "crypto";
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || SMTP_USER;
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "3D Model Viewer";

// Auto-detect frontend URL: use FRONTEND_URL if set, otherwise construct from VERCEL_URL
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://localhost:5173");

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth:
    SMTP_USER && SMTP_PASSWORD
      ? {
          user: SMTP_USER,
          pass: SMTP_PASSWORD,
        }
      : undefined,
});

/**
 * Generate a secure random token for email verification
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  username: string,
  token: string,
): Promise<void> {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  // In development without SMTP credentials, just log the verification URL
  if (!SMTP_USER || !SMTP_PASSWORD || SMTP_USER === "your-email@gmail.com") {
    console.log("\n=================================");
    console.log("📧 EMAIL VERIFICATION (DEV MODE)");
    console.log("=================================");
    console.log(`To: ${email}`);
    console.log(`Username: ${username}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log("=================================\n");
    return;
  }

  const mailOptions = {
    from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
    to: email,
    subject: "Verify Your Email - 3D Model Viewer",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #333; font-size: 28px;">Welcome to 3D Model Viewer!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 30px 40px; color: #666; font-size: 16px; line-height: 1.6;">
                      <p>Hi <strong>${username}</strong>,</p>
                      <p>Thank you for registering! Please verify your email address to activate your account and start exploring 3D models.</p>
                      <p style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" style="display: inline-block; padding: 14px 40px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Verify Email Address</a>
                      </p>
                      <p style="font-size: 14px; color: #999;">
                        Or copy and paste this link into your browser:<br>
                        <a href="${verificationUrl}" style="color: #007bff; word-break: break-all;">${verificationUrl}</a>
                      </p>
                      <p style="font-size: 14px; color: #999; margin-top: 30px;">
                        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; text-align: center; color: #999; font-size: 12px;">
                      <p style="margin: 0;">© ${new Date().getFullYear()} 3D Model Viewer. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Hi ${username},

Thank you for registering! Please verify your email address to activate your account.

Click the link below to verify your email:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

© ${new Date().getFullYear()} 3D Model Viewer. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  username: string,
  token: string,
): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  // In development without SMTP credentials, just log the reset URL
  if (!SMTP_USER || !SMTP_PASSWORD || SMTP_USER === "your-email@gmail.com") {
    console.log("\n=================================");
    console.log("🔒 PASSWORD RESET (DEV MODE)");
    console.log("=================================");
    console.log(`To: ${email}`);
    console.log(`Username: ${username}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("=================================\n");
    return;
  }

  const mailOptions = {
    from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
    to: email,
    subject: "Reset Your Password - 3D Model Viewer",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #333; font-size: 28px;">Reset Your Password</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 30px 40px; color: #666; font-size: 16px; line-height: 1.6;">
                      <p>Hi <strong>${username}</strong>,</p>
                      <p>We received a request to reset your password. Click the button below to create a new password.</p>
                      <p style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background-color: #dc3545; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
                      </p>
                      <p style="font-size: 14px; color: #999;">
                        Or copy and paste this link into your browser:<br>
                        <a href="${resetUrl}" style="color: #dc3545; word-break: break-all;">${resetUrl}</a>
                      </p>
                      <p style="font-size: 14px; color: #999; margin-top: 30px;">
                        This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; text-align: center; color: #999; font-size: 12px;">
                      <p style="margin: 0;">© ${new Date().getFullYear()} 3D Model Viewer. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Hi ${username},

We received a request to reset your password.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} 3D Model Viewer. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}
