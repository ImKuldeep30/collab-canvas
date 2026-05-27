const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

const protect = async (req, res, next) => {
  let token;
  const cookies = parseCookies(req.headers.cookie);

  // Check if token is in Authorization header or in cookies
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (cookies.accessToken) {
    token = cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // Verify the token using secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user from the DB and attach to the 'req' object
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if token is blacklisted (logged out)
    if (user.tokenBlacklist && user.tokenBlacklist.includes(token)) {
      return res.status(401).json({ message: "Token has been revoked" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = { protect };