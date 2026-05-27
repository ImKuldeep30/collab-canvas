const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const nodemailer = require("nodemailer");

// --- Helper: Setup Email Transporter ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// front-end url for redirects; set via env or default to localhost:5173 (Vite)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const getVerificationEmailTemplate = (name, url) => `
  <div style="background-color: #0a0a0c; padding: 45px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; color: #ffffff;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #121214; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
      <tr>
        <td style="padding: 40px 32px; text-align: center;">
          
          <!-- CoCanvas Styled Brand Icon -->
          <div style="margin-bottom: 24px; display: inline-block;">
            <table align="center" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); width: 50px; height: 50px; border-radius: 14px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: 900; font-size: 22px; box-shadow: 0 4px 12px rgba(99,102,241,0.3);">
                  C
                </td>
              </tr>
            </table>
          </div>
          
          <h2 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.5px;">Welcome to CoCanvas!</h2>
          <p style="color: #818cf8; font-size: 14px; font-weight: 700; margin: 0 0 24px 0;">Hello ${name},</p>
          
          <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 28px 0; font-weight: 500;">
            We're thrilled to have you join our real-time visual collaboration workspace! Sketch workflows, brainstorm systems, and interact instantly with your team on persistent whiteboard spaces.
          </p>
          
          <p style="color: #ffffff; font-size: 13px; line-height: 1.6; margin: 0 0 28px 0; font-weight: 500;">
            Please verify your email address to active your CoCanvas account:
          </p>
          
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto;">
            <tr>
              <td align="center">
                <a href="${url}" target="_blank" style="font-size: 13px; color: #ffffff; text-decoration: none; border-radius: 12px; padding: 14px 28px; display: inline-block; font-weight: 700; background: linear-gradient(to right, #6366f1, #7c3aed); box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);">
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
    const url = `http://localhost:3000/api/auth/verify-email/${verificationToken}`;
    await transporter.sendMail({
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

    const url = `http://localhost:3000/api/auth/reset-password/${resetToken}`;
    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset",
      html: `Click <a href="${url}">here</a> to reset your password.`,
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
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Send an HTML form where user can enter their new password
    const html = `
      <!DOCTYPE html>
        <html>
        <head>
          <title>Reset Password</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #171717;
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }

            .container {
              background-color: #1f1f1f;
              padding: 40px;
              border-radius: 16px;
              width: 100%;
              max-width: 400px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            }

            h2 {
              text-align: center;
              color: white;
              margin-bottom: 20px;
            }

            p {
              text-align: center;
              color: #aaa;
              font-size: 14px;
              margin-bottom: 20px;
            }

            input {
              width: 100%;
              padding: 12px;
              margin: 10px 0;
              border-radius: 8px;
              border: 1px solid #444;
              background-color: #242424;
              color: white;
              font-size: 14px;
              outline: none;
            }

            input:focus {
              border-color: #2865de;
            }

            button {
              width: 100%;
              padding: 12px;
              margin-top: 15px;
              background-color: #2865de;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
              transition: background-color 0.3s ease;
            }

            button:hover {
              background-color: #1f4fb8;
            }
          </style>
        </head>

        <body>
          <div class="container">
            <h2>Reset Your Password</h2>
            <p>Enter your new password below</p>

            <form method="POST" action="/api/auth/reset-password/${req.params.token}">
              <input 
                type="password" 
                name="password" 
                placeholder="Enter new password" 
                required 
              />
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

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = req.body.password; // The pre-save hook in User.js will hash this
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Password Reset Successful</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #171717;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }

          .container {
            background-color: #1f1f1f;
            padding: 40px;
            border-radius: 16px;
            width: 100%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          }

          h2 {
            color: #4ade80;
            margin-bottom: 20px;
          }

          p {
            color: #ccc;
            font-size: 14px;
            margin-bottom: 20px;
          }

          .button {
            display: inline-block;
            padding: 12px 20px;
            background-color: #2865de;
            color: white;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: background-color 0.3s ease;
          }

          .button:hover {
            background-color: #1f4fb8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Successful ✅</h2>
          <p>Your password has been updated successfully.</p>
          <p>You can now close this tab and log in with your new password.</p>
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
    await transporter.sendMail({
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
