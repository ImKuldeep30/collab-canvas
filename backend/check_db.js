const mongoose = require('mongoose');
const SessionData = require('./models/SessionData');
require('dotenv').config();

async function checkData() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/canvas");
  const sessions = await SessionData.find({});
  console.log("Total sessions:", sessions.length);
  for (let s of sessions) {
    console.log('---');
    console.log(`Team: ${s.teamName}`);
    console.log(`Team ID: ${s.teamId}`);
    console.log(`CreatedBy: ${s.createdBy}`);
    console.log(`Chats Count: ${s.chatHistory ? s.chatHistory.length : 0}`);
    console.log(`Last Modified: ${s.lastModified}`);
    if (s.chatHistory && s.chatHistory.length > 0) {
      console.log("Sample chat:", s.chatHistory[0]);
    }
  }
  process.exit(0);
}

checkData();
