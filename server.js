const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const app = express();
const server = http.createServer(app);

// إعداد CORS للسماح بالتواصل مع Firebase Hosting
const allowedOrigins = [
  'https://chatterx-19c9a.web.app',
  'http://localhost:5000'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true
}));


const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// تقديم الملفات الثابتة (public folder)
app.use(express.static('public'));

// MongoDB connection (كما عندك)
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

    // بدء تشغيل الخادم بعد نجاح الاتصال
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
    });

// مخطط الرسائل في MongoDB
const MessageSchema = new mongoose.Schema({
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// التعامل مع WebSocket
io.on('connection', async (socket) => {
    console.log('🔵 مستخدم متصل');

    // إرسال الرسائل السابقة
    const messages = await Message.find().sort({ timestamp: 1 });
    socket.emit('loadMessages', messages);

    // استقبال الرسائل الجديدة
    socket.on('chatMessage', async (data) => {
        const newMessage = new Message({ username: data.username, message: data.message });
        await newMessage.save();
        io.emit('chatMessage', data);
    });

    socket.on('disconnect', () => {
        console.log('🔴 مستخدم غادر');
    });
});
