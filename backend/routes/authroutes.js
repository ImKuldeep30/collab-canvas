const express = require("express");
const rateLimit = require("express-rate-limit");
const { 
  signup, 
  signin, 
  logout, 
  forgotPassword, 
  resetPassword, 
  showResetPasswordForm,
  verifyEmail,
  getCurrentUser,
  changePassword,
  refreshToken,
  resendVerificationEmail,
  updateProfile,
  deleteAccount
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Rate limiting middleware
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many signup attempts, please try again later",
});

const signinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: "Too many login attempts, please try again later",
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per hour
  message: "Too many password reset requests, please try again later",
});

const updateProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 updates per 15 minutes
  message: "Too many profile updates, please try again later",
});

// 1. Register/Signup
router.post("/register", signupLimiter, signup);

// 2. Login
router.post("/login", signinLimiter, signin);

// 3. Logout
router.post("/logout", protect, logout);

// 4. Forgot Password
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);

// 5. Reset Password - GET shows form, POST resets password
router.get("/reset-password/:token", showResetPasswordForm);
router.post("/reset-password/:token", resetPassword);

// 6. Verify Email
router.get("/verify-email/:token", verifyEmail);

// 7. Get current user profile (protected)
router.get("/me", protect, getCurrentUser);

// 8. Change password (protected)
router.post("/change-password", protect, changePassword);

// 9. Refresh token
router.post("/refresh-token", refreshToken);

// 10. Resend verification email
router.post("/resend-verification-email", resendVerificationEmail);

// 11. Update profile (protected)
router.put("/update-profile", protect, updateProfileLimiter, updateProfile);

// 12. Delete account (protected)
router.delete("/delete-account", protect, deleteAccount);

module.exports = router;