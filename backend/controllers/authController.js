const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { Resend } = require("resend");

// --- Helper: Setup Resend Client ---
const resend = new Resend(process.env.RESEND_API_KEY);

// front-end url for redirects; set via env or default to localhost:5173 (Vite)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

const getVerificationEmailTemplate = (name, url) => `
  <div style="background-color: #0a0a0c; background-image: radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15) 0%, rgba(10, 10, 12, 0) 55%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.15) 0%, rgba(10, 10, 12, 0) 55%); padding: 60px 15px; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; color: #ffffff;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: rgba(18, 18, 20, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
      <tr>
        <td style="padding: 45px 36px; text-align: center;">
          
          <!-- CoCanvas 3D Isometric Brand Icon -->
          <div style="margin-bottom: 24px; display: inline-block;">
            <table align="center" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width: 60px; height: 60px; text-align: center; vertical-align: middle;">
                  <img src="${FRONTEND_URL}/cocanvas-logo.svg" width="60" height="60" alt="CoCanvas Logo" style="display: block; border: 0; outline: none; text-decoration: none; margin: 0 auto;" />
                </td>
              </tr>
            </table>
          </div>
          
          <h2 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 12px 0; letter-spacing: -0.5px;">Welcome to CoCanvas!</h2>
          <p style="color: #818cf8; font-size: 15px; font-weight: 700; margin: 0 0 24px 0;">Hello ${name},</p>
          
          <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 28px 0; font-weight: 500;">
            We're thrilled to have you join our real-time visual collaboration workspace! Sketch workflows, brainstorm systems, and interact instantly with your team on persistent whiteboard spaces.
          </p>
          
          <p style="color: #ffffff; font-size: 13px; line-height: 1.6; margin: 0 0 28px 0; font-weight: 500;">
            Please verify your email address to activate your CoCanvas account:
          </p>
          
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto;">
            <tr>
              <td align="center">
                <a href="${url}" target="_blank" style="font-size: 13px; color: #ffffff; text-decoration: none; border-radius: 14px; padding: 14px 32px; display: inline-block; font-weight: 700; background-color: #6366f1; background-image: linear-gradient(to right, #6366f1, #7c3aed); box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);">
                  Verify Email Address
                </a>
              </td>
            </tr>
          </table>
          
          <p style="color: #6b7280; font-size: 11px; line-height: 1.5; margin: 0 0 24px 0; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px; font-weight: 500;">
            If you did not create a CoCanvas account, you can safely ignore this mail.
          </p>
          
          <p style="color: #4b5563; font-size: 10px; font-weight: 600; margin: 0;">
            &copy; ${new Date().getFullYear()} CoCanvas. All rights reserved.
          </p>
          
          <!-- Unique marker to prevent Gmail from grouping and trimming email content -->
          <div style="display: none !important; font-size: 1px; color: #0a0a0c; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; height: 0; width: 0;">
            ${Date.now()}-${Math.random().toString(36).substring(2, 7)}
          </div>
        </td>
      </tr>
    </table>
  </div>
`;

const getForgotPasswordEmailTemplate = (name, url) => `
  <div style="background-color: #0a0a0c; background-image: radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15) 0%, rgba(10, 10, 12, 0) 55%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.15) 0%, rgba(10, 10, 12, 0) 55%); padding: 60px 15px; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; color: #ffffff;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: rgba(18, 18, 20, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
      <tr>
        <td style="padding: 45px 36px; text-align: center;">
          
          <!-- CoCanvas 3D Isometric Brand Icon -->
          <div style="margin-bottom: 24px; display: inline-block;">
            <table align="center" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width: 60px; height: 60px; text-align: center; vertical-align: middle;">
                  <img src="${FRONTEND_URL}/cocanvas-logo.svg" width="60" height="60" alt="CoCanvas Logo" style="display: block; border: 0; outline: none; text-decoration: none; margin: 0 auto;" />
                </td>
              </tr>
            </table>
          </div>
          
          <h2 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 12px 0; letter-spacing: -0.5px;">Password Reset Request</h2>
          <p style="color: #818cf8; font-size: 15px; font-weight: 700; margin: 0 0 24px 0;">Hello ${name},</p>
          
          <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 28px 0; font-weight: 500;">
            We received a request to reset the password for your CoCanvas account. No problem, we've got you covered!
          </p>
          
          <p style="color: #ffffff; font-size: 13px; line-height: 1.6; margin: 0 0 28px 0; font-weight: 500;">
            Click the button below to choose a new password:
          </p>
          
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto;">
            <tr>
              <td align="center">
                <a href="${url}" target="_blank" style="font-size: 13px; color: #ffffff; text-decoration: none; border-radius: 14px; padding: 14px 32px; display: inline-block; font-weight: 700; background-color: #6366f1; background-image: linear-gradient(to right, #6366f1, #7c3aed); box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);">
                  Reset Password
                </a>
              </td>
            </tr>
          </table>
          
          <p style="color: #6b7280; font-size: 11px; line-height: 1.5; margin: 0 0 24px 0; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px; font-weight: 500;">
            If you did not request a password reset, you can safely ignore this email. This link will expire in 1 hour.
          </p>
          
          <p style="color: #4b5563; font-size: 10px; font-weight: 600; margin: 0;">
            &copy; ${new Date().getFullYear()} CoCanvas. All rights reserved.
          </p>
          
          <!-- Unique marker to prevent Gmail from grouping and trimming email content -->
          <div style="display: none !important; font-size: 1px; color: #0a0a0c; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; height: 0; width: 0;">
            ${Date.now()}-${Math.random().toString(36).substring(2, 7)}
          </div>
        </td>
      </tr>
    </table>
  </div>
`;

const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts.shift().trim();
    const value = parts.join("=");
    try {
      list[key] = decodeURIComponent(value);
    } catch {
      list[key] = value;
    }
  });
  return list;
};

//  Validation Functions 
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 number, 1 special character
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

//  Generate Tokens 
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character (@$!%*?&)",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate a random verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = new User({
      name,
      email,
      password,
      verificationToken,
    });

    await user.save();

    // Send verification email
    const url = `${BACKEND_URL}/api/auth/verify-email/${verificationToken}`;
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "CoCanvas <onboarding@resend.dev>",
      to: user.email,
      subject: "Welcome to CoCanvas - Verify your Email",
      html: getVerificationEmailTemplate(user.name, url),
    });

    res
      .status(201)
      .json({
        message: "Registered! Please check your email to verify account.",
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const commonHeadAndStyles = `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #0a0a0c;
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        overflow: hidden;
        color: white;
        position: relative;
      }

      /* Background Decorative Blur Blobs */
      .blur-blob {
        position: absolute;
        border-radius: 50%;
        filter: blur(130px);
        opacity: 0.12;
        pointer-events: none;
        z-index: 0;
      }
      .blob-indigo {
        top: -10%;
        left: -10%;
        width: 50vw;
        height: 50vw;
        background: #6366f1;
      }
      .blob-pink {
        bottom: -10%;
        right: -10%;
        width: 45vw;
        height: 45vw;
        background: #ec4899;
      }

      .container {
        background-color: rgba(18, 18, 20, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        padding: 40px;
        border-radius: 24px;
        width: 90%;
        max-width: 420px;
        text-align: center;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        position: relative;
        z-index: 10;
        box-sizing: border-box;
        animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .icon-wrapper {
        width: 64px;
        height: 64px;
        border-radius: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 auto 24px auto;
        font-size: 28px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      }

      .icon-success {
        background-color: rgba(74, 222, 128, 0.1);
        border: 1px solid rgba(74, 222, 128, 0.2);
        color: #4ade80;
        animation: pulseSuccess 2s infinite;
      }

      .icon-failed {
        background-color: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: #ef4444;
        animation: shakeError 0.5s ease-in-out;
      }

      @keyframes pulseSuccess {
        0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); }
        100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
      }

      @keyframes shakeError {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-6px); }
        40%, 80% { transform: translateX(6px); }
      }

      h2 {
        color: white;
        font-size: 22px;
        font-weight: 800;
        margin: 0 0 12px 0;
        letter-spacing: -0.5px;
      }

      p {
        color: #9ca3af;
        font-size: 13px;
        line-height: 1.6;
        margin: 0 0 24px 0;
        font-weight: 500;
      }

      .button {
        display: block;
        width: 100%;
        box-sizing: border-box;
        padding: 14px 20px;
        background: linear-gradient(to right, #6366f1, #7c3aed);
        color: white;
        border-radius: 14px;
        text-decoration: none;
        font-weight: 700;
        font-size: 13px;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);
        cursor: pointer;
        border: none;
      }

      .button:hover {
        transform: translateY(-2px) scale(1.01);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        background: linear-gradient(to right, #4f46e5, #6d28d9);
      }

      .button:active {
        transform: translateY(0) scale(0.99);
      }
    </style>
  `;

  try {
    const user = await User.findOne({ verificationToken: req.params.token });

    if (!user) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Verification Failed | CoCanvas</title>
          ${commonHeadAndStyles}
        </head>
        <body>
          <div class="blur-blob blob-indigo"></div>
          <div class="blur-blob blob-pink"></div>
          
          <div class="container">
            <div class="icon-wrapper icon-failed">❌</div>
            <h2>Verification Failed</h2>
            <p>The link is invalid or has expired. Please try registering again or resend the verification email.</p>
            <a href="${FRONTEND_URL}/login" class="button">Back to Registration</a>
          </div>
        </body>
        </html>
      `);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Email Verified Successful | CoCanvas</title>
        ${commonHeadAndStyles}
      </head>
      <body>
        <div class="blur-blob blob-indigo"></div>
        <div class="blur-blob blob-pink"></div>
        
        <div class="container">
          <div class="icon-wrapper icon-success">✓</div>
          <h2>Account Verified!</h2>
          <p>Your email has been verified successfully. You can now login to your CoCanvas account and start creating.</p>
          <a href="${FRONTEND_URL}/login" class="button">Go to Login</a>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Verification Error | CoCanvas</title>
        ${commonHeadAndStyles}
      </head>
      <body>
        <div class="blur-blob blob-indigo"></div>
        <div class="blur-blob blob-pink"></div>
        
        <div class="container">
          <div class="icon-wrapper icon-failed">⚠️</div>
          <h2>System Error</h2>
          <p>Something went wrong on our servers. Please try again later.</p>
          <a href="${FRONTEND_URL}/login" class="button">Back to Login</a>
        </div>
      </body>
      </html>
    `);
  }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user verified their email
    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: "Please verify your email first" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookies for secure session handling
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        canvasDarkMode: user.canvasDarkMode,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Blacklist the refresh token by clearing it from database
    if (user) {
      user.refreshToken = null;
      // Add current token to blacklist (store access tokens that are revoked)
      if (!user.tokenBlacklist) {
        user.tokenBlacklist = [];
      }
      const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
      if (token) {
        user.tokenBlacklist.push(token);
      }

      await user.save();
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();

    const url = `${BACKEND_URL}/api/auth/reset-password/${resetToken}`;
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "CoCanvas <onboarding@resend.dev>",
      to: user.email,
      subject: "Password Reset Request | CoCanvas",
      html: getForgotPasswordEmailTemplate(user.name, url),
    });

    res.json({ message: "Password reset link sent to email" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.showResetPasswordForm = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invalid Token | CoCanvas</title>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body {
              margin: 0; padding: 0; background-color: #0a0a0c;
              font-family: 'Plus Jakarta Sans', sans-serif;
              display: flex; justify-content: center; align-items: center; min-height: 100vh;
              color: #ffffff; overflow: hidden; position: relative;
            }
            .blob-1 { position: absolute; top: -10%; left: -10%; width: 400px; height: 400px; background: rgba(99, 102, 241, 0.1); border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; }
            .container {
              background-color: rgba(18, 18, 20, 0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
              padding: 40px; border-radius: 24px; width: 90%; max-width: 400px;
              border: 1px solid rgba(255, 255, 255, 0.08); text-align: center; z-index: 10;
            }
            h2 { color: #f43f5e; font-size: 22px; font-weight: 800; margin: 0 0 12px 0; }
            p { color: #9ca3af; font-size: 14px; margin: 0; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="blob-1"></div>
          <div class="container">
            <h2>Link Expired or Invalid ❌</h2>
            <p>This password reset link is invalid or has expired. Please request a new one.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Send an HTML form where user can enter their new password
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password | CoCanvas</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #0a0a0c;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #ffffff;
            overflow: hidden;
            position: relative;
          }

          /* Background Blur Blobs */
          .blob-1 {
            position: absolute;
            top: -10%;
            left: -10%;
            width: 450px;
            height: 450px;
            background: rgba(99, 102, 241, 0.1);
            border-radius: 50%;
            filter: blur(120px);
            pointer-events: none;
            z-index: 0;
          }

          .blob-2 {
            position: absolute;
            bottom: -10%;
            right: -10%;
            width: 450px;
            height: 450px;
            background: rgba(236, 72, 153, 0.1);
            border-radius: 50%;
            filter: blur(120px);
            pointer-events: none;
            z-index: 0;
          }

          .container {
            background-color: rgba(18, 18, 20, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 40px;
            border-radius: 24px;
            width: 90%;
            max-width: 400px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.03);
            text-align: center;
            z-index: 10;
            box-sizing: border-box;
          }

          .logo-container {
            width: 54px;
            height: 54px;
            margin: 0 auto 24px auto;
          }

          h2 {
            font-size: 24px;
            font-weight: 800;
            margin: 0 0 10px 0;
            letter-spacing: -0.5px;
            color: #ffffff;
          }

          p {
            color: #9ca3af;
            font-size: 14px;
            margin: 0 0 28px 0;
            font-weight: 500;
            line-height: 1.5;
          }

          .form-group {
            text-align: left;
            margin-bottom: 24px;
          }

          label {
            display: block;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #9ca3af;
            margin-bottom: 8px;
            margin-left: 4px;
          }

          input {
            width: 100%;
            padding: 14px 16px;
            background-color: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            font-size: 14px;
            outline: none;
            transition: all 0.3s ease;
            box-sizing: border-box;
          }

          input:focus {
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
            background-color: rgba(0, 0, 0, 0.5);
          }

          button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(to right, #6366f1, #7c3aed, #db2777);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
            transition: all 0.3s ease;
          }

          button:hover {
            opacity: 0.95;
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
          }

          button:active {
            transform: translateY(0);
          }
        </style>
      </head>
      <body>
        <div class="blob-1"></div>
        <div class="blob-2"></div>
        <div class="container">
          <div class="logo-container">
            <svg style="width: 100%; height: 100%;" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="face-top" x1="16" y1="3" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#818cf8" />
                  <stop offset="100%" stop-color="#6366f1" />
                </linearGradient>
                <linearGradient id="face-left" x1="5" y1="16" x2="16" y2="29" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#a855f7" stop-opacity="0.85" />
                  <stop offset="100%" stop-color="#7c3aed" stop-opacity="0.85" />
                </linearGradient>
                <linearGradient id="face-right" x1="16" y1="16" x2="27" y2="22.5" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#ec4899" stop-opacity="0.9" />
                  <stop offset="100%" stop-color="#db2777" stop-opacity="0.9" />
                </linearGradient>
              </defs>
              <g>
                <path d="M16 3L27 9.5L16 16L5 9.5Z" fill="url(#face-top)" />
                <path d="M5 9.5L16 16V29L5 22.5Z" fill="url(#face-left)" />
                <path d="M27 9.5L16 16V29L27 22.5Z" fill="url(#face-right)" />
                <path d="M16 3L27 9.5V22.5L16 29L5 22.5V9.5Z" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" opacity="0.3" />
                <path d="M16 16L5 9.5M16 16L27 9.5M16 16V29" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" opacity="0.3" />
              </g>
            </svg>
          </div>
          <h2>Reset Your Password</h2>
          <p>Enter your new password below</p>

          <form method="POST" action="/api/auth/reset-password/${req.params.token}">
            <div class="form-group">
              <label for="password">New Password</label>
              <input 
                type="password" 
                name="password" 
                id="password"
                placeholder="Enter new password" 
                required 
              />
            </div>
            <button type="submit">Reset Password</button>
          </form>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }, // Check if token is still valid
    });

    if (!user) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invalid Token | CoCanvas</title>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body {
              margin: 0; padding: 0; background-color: #0a0a0c;
              font-family: 'Plus Jakarta Sans', sans-serif;
              display: flex; justify-content: center; align-items: center; min-height: 100vh;
              color: #ffffff; overflow: hidden; position: relative;
            }
            .blob-1 { position: absolute; top: -10%; left: -10%; width: 400px; height: 400px; background: rgba(99, 102, 241, 0.1); border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; }
            .container {
              background-color: rgba(18, 18, 20, 0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
              padding: 40px; border-radius: 24px; width: 90%; max-width: 400px;
              border: 1px solid rgba(255, 255, 255, 0.08); text-align: center; z-index: 10;
            }
            h2 { color: #f43f5e; font-size: 22px; font-weight: 800; margin: 0 0 12px 0; }
            p { color: #9ca3af; font-size: 14px; margin: 0; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="blob-1"></div>
          <div class="container">
            <h2>Link Expired or Invalid ❌</h2>
            <p>This password reset link is invalid or has expired. Please request a new one.</p>
          </div>
        </body>
        </html>
      `);
    }

    user.password = req.body.password; // The pre-save hook in User.js will hash this
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful | CoCanvas</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #0a0a0c;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #ffffff;
            overflow: hidden;
            position: relative;
          }

          /* Background Blur Blobs */
          .blob-1 {
            position: absolute;
            top: -10%;
            left: -10%;
            width: 450px;
            height: 450px;
            background: rgba(99, 102, 241, 0.1);
            border-radius: 50%;
            filter: blur(120px);
            pointer-events: none;
            z-index: 0;
          }

          .blob-2 {
            position: absolute;
            bottom: -10%;
            right: -10%;
            width: 450px;
            height: 450px;
            background: rgba(236, 72, 153, 0.1);
            border-radius: 50%;
            filter: blur(120px);
            pointer-events: none;
            z-index: 0;
          }

          .container {
            background-color: rgba(18, 18, 20, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 45px 40px;
            border-radius: 24px;
            width: 90%;
            max-width: 400px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.03);
            text-align: center;
            z-index: 10;
            box-sizing: border-box;
          }

          .success-icon {
            width: 64px;
            height: 64px;
            background-color: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 20px;
            color: #10b981;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px auto;
          }

          h2 {
            font-size: 24px;
            font-weight: 800;
            margin: 0 0 12px 0;
            letter-spacing: -0.5px;
            color: #10b981;
          }

          p {
            color: #9ca3af;
            font-size: 14px;
            margin: 0 0 28px 0;
            font-weight: 500;
            line-height: 1.6;
          }

          .btn-login {
            display: block;
            width: 100%;
            padding: 14px;
            background: linear-gradient(to right, #6366f1, #7c3aed, #db2777);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
            transition: all 0.3s ease;
            box-sizing: border-box;
          }

          .btn-login:hover {
            opacity: 0.95;
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
          }
        </style>
      </head>
      <body>
        <div class="blob-1"></div>
        <div class="blob-2"></div>
        <div class="container">
          <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2>Password Reset Successful</h2>
          <p>Your password has been updated successfully. You can now close this tab or return to the login page.</p>
          <a href="${FRONTEND_URL}/login" class="btn-login">Go to Login</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get current user profile (requires authentication)
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -refreshToken",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Change password (requires authentication)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Input validation
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character (@$!%*?&)",
      });
    }

    const user = await User.findById(req.user.id);

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Refresh access token
exports.refreshToken = async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const rToken = req.body.refreshToken || cookies.refreshToken;

    if (!rToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(rToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token matches the one in database
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== rToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

// Resend verification email
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate a new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    // Send verification email
    const url = `http://localhost:3000/api/auth/verify-email/${verificationToken}`;
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "CoCanvas <onboarding@resend.dev>",
      to: user.email,
      subject: "Verify your Email | CoCanvas",
      html: getVerificationEmailTemplate(user.name, url),
    });

    res.json({ message: "Verification email sent. Please check your inbox." });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Update user profile (requires authentication)
exports.updateProfile = async (req, res) => {
  try {
    const { name, canvasDarkMode } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update name if provided
    if (name !== undefined) {
      user.name = name;
    }

    // Update canvasDarkMode preference if provided
    if (canvasDarkMode !== undefined) {
      user.canvasDarkMode = canvasDarkMode;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        canvasDarkMode: user.canvasDarkMode,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Delete user account (requires authentication)
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ message: "Password is required to delete account" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password before deletion
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ message: "Incorrect password. Account not deleted." });
    }

    // Delete user
    await User.findByIdAndDelete(req.user.id);

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
