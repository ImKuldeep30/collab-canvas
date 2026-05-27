const mongoose = require('mongoose');
const SessionData = require('./models/SessionData');
require('dotenv').config();

async function checkData() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/canvas");
  const sessions = await SessionData.find({});
  for (let s of sessions) {
    console.log(`Team Name: ${s.teamName}, Team ID: ${s.teamId}`);
  }
  process.exit(0);
}

checkData();
