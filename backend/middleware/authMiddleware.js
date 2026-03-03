const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // 1. Check if token is in the Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // 2. Extract the token from the "Bearer <token>" string
      token = req.headers.authorization.split(" ")[1];

      // 3. Verify the token using your secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find the user from the DB and attach them to the 'req' object
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // 5. Check if token is blacklisted (logged out)
      if (user.tokenBlacklist && user.tokenBlacklist.includes(token)) {
        return res.status(401).json({ message: "Token has been revoked" });
      }

      req.user = user;
      next(); // Move to the next function (the actual route handler)
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };