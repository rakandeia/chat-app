const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ✅ CORS لكل origins
app.use(cors());

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// تقديم الملفات الثابتة
app.use(express.static('public'));

// MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat-app';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("✅ تم الاتصال بقاعدة البيانات");
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
  });
})
.catch(err => {
  console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err);
  process.exit(1);
});

// Model
const MessageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// Socket.io
io.on('connection', async (socket) => {
  console.log('🔵 مستخدم متصل');

  const messages = await Message.find().sort({ timestamp: 1 });
  socket.emit('loadMessages', messages);

  socket.on('chatMessage', async (data) => {
    const newMessage = new Message({ username: data.username, message: data.message });
    await newMessage.save();
    io.emit('chatMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 مستخدم غادر');
  });
});
