const mongoose = require('mongoose');
const SessionData = require('./backend/models/SessionData');
require('dotenv').config({ path: './backend/.env' });

async function checkData() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/canvas");
  const sessions = await SessionData.find({});
  console.log("Total sessions:", sessions.length);
  for (let s of sessions) {
    console.log(`Team: ${s.teamName}, Chats Count: ${s.chatHistory ? s.chatHistory.length : 0}`);
    if (s.chatHistory && s.chatHistory.length > 0) {
      console.log("Sample chat:", s.chatHistory[0]);
    }
  }
  process.exit(0);
}

checkData();
