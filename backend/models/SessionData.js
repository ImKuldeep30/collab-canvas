const mongoose = require('mongoose');

const sessionDataSchema = new mongoose.Schema({
  teamId: { type: String, required: true },
  teamName: { type: String, required: true },
  drawingData: [{
    type: mongoose.Schema.Types.Mixed // Store entire Excalidraw element objects
  }],
  chatHistory: [{
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  canvasWidth: Number,
  canvasHeight: Number,
  lastModified: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('SessionData', sessionDataSchema);
