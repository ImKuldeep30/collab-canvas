const mongoose = require('mongoose');
const SessionData = require('./models/SessionData');
require('dotenv').config();

async function testSave() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/canvas");
  
  // Try manually saving a chat to an existing session
  const testChat = {
    username: "TestUser",
    message: "This is a test message",
    timestamp: new Date().toISOString()
  };
  
  // Get the first session's teamId and createdBy
  const existing = await SessionData.findOne({});
  if (!existing) {
    console.log("No sessions in DB to test with");
    process.exit(1);
  }

  console.log("Testing save for team:", existing.teamName, "teamId:", existing.teamId);
  console.log("Existing chats:", existing.chatHistory?.length || 0);

  const result = await SessionData.findOneAndUpdate(
    { teamId: existing.teamId },
    {
      $set: {
        chatHistory: [testChat],
        lastModified: new Date()
      }
    },
    { new: true }
  );
  
  console.log("After save - chats:", result.chatHistory?.length || 0);
  console.log("Chat content:", result.chatHistory[0]);
  process.exit(0);
}

testSave().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
