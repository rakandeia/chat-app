const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const server = http.createServer(app);

// ✅ CORS
app.use(cors());

// ✅ إعداد Cloudinary
cloudinary.config({
  cloud_name: 'driv2lz3p',
  api_key: '464898967498374',
  api_secret: 'ضع_الـ_api_secret_الخاص_بك_هنا'
});

// ✅ إعداد Multer مع Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chat-images', // مجلد الصور داخل Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png']
  }
});
const upload = multer({ storage });

// ✅ Route لرفع صورة
app.post('/upload', upload.single('image'), (req, res) => {
  res.json({ imageUrl: req.file.path });
});

// ✅ MongoDB Model
const MessageSchema = new mongoose.Schema({
  username: String,
  message: String,
  imageUrl: String, // ← دعم الصور
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// ✅ تقديم ملفات ثابتة
app.use(express.static('public'));

// ✅ Socket.io
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', async (socket) => {
  console.log('🔵 مستخدم متصل');

  const messages = await Message.find().sort({ timestamp: 1 });
  socket.emit('loadMessages', messages);

  socket.on('chatMessage', async (data) => {
    const newMessage = new Message({
      username: data.username,
      message: data.message,
      imageUrl: data.imageUrl || null
    });

    await newMessage.save();
    io.emit('chatMessage', newMessage);
  });

  socket.on('disconnect', () => {
    console.log('🔴 مستخدم غادر');
  });
});
