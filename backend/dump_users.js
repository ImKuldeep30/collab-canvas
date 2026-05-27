const mongoose = require("mongoose");
const User = require("./models/User");

const MONGO_URI = "mongodb+srv://kuldpkohli2003_db_user:kuldpdb30@cluster0.dmurao1.mongodb.net/authdb?retryWrites=true&w=majority";

async function dump() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");
  const users = await User.find({}, "name email");
  console.log("Users:", JSON.stringify(users, null, 2));
  process.exit(0);
}

dump().catch(console.error);
