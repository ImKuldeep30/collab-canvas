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
      subject: "Verify your Email",
      html: `Click <a href="${url}">here</a> to verify your account.`,
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
  try {
    const user = await User.findOne({ verificationToken: req.params.token });

    if (!user) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verification</title>
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
              color: #ef4444;
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
            <h2>Verification Failed ❌</h2>
            <p>Invalid or expired verification link, you can close this tab now.</p>
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
      <html>
      <head>
        <title>Email Verified</title>
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
          <h2>Email Verified Successfully ✅</h2>
          <p>Your email has been verified.</p>
          <p>You can now login to your account, This tab can now be closed.</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
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
            text-align: center;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          }
          h2 { color: #ef4444; }
          p { color: #ccc; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Server Error ❌</h2>
          <p>Something went wrong. Please try again later.</p>
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

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
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
    user.refreshToken = null;
    // Add current token to blacklist (store access tokens that are revoked)
    if (!user.tokenBlacklist) {
      user.tokenBlacklist = [];
    }
    user.tokenBlacklist.push(req.headers.authorization.split(" ")[1]);

    await user.save();

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
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token matches the one in database
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

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
      subject: "Verify your Email",
      html: `Click <a href="${url}">here</a> to verify your account.`,
    });

    res.json({ message: "Verification email sent. Please check your inbox." });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Update user profile (requires authentication)
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    // Update email if provided - requires re-verification
    if (email && email !== user.email) {
      // Check if new email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Generate new verification token for new email
      user.email = email;
      user.isVerified = false;
      const verificationToken = crypto.randomBytes(32).toString("hex");
      user.verificationToken = verificationToken;

      // Send verification email for new email
      const url = `http://localhost:3000/api/auth/verify-email/${verificationToken}`;
      await transporter.sendMail({
        to: user.email,
        subject: "Verify your New Email",
        html: `Click <a href="${url}">here</a> to verify your new email address.`,
      });
    }

    await user.save();

    res.json({
      message:
        email && email !== user.email
          ? "Profile updated. Please verify your new email."
          : "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
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
