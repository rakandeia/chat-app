const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// تحسين إعدادات الاتصال بـ MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat-app';
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // زيادة مهلة الاتصال
    socketTimeoutMS: 45000, // زيادة مهلة Socket
})
.then(() => {
    console.log("✅ تم الاتصال بقاعدة البيانات");
    // بدء تشغيل السيرفر فقط بعد نجاح الاتصال بقاعدة البيانات
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
    });
})
.catch(err => {
    console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err);
    process.exit(1);
});

// إنشاء نموذج للرسائل
const MessageSchema = new mongoose.Schema({
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// عند اتصال المستخدم، إرسال الرسائل المخزنة
io.on('connection', async (socket) => {
    console.log('🔵 مستخدم متصل');

    // إرسال الرسائل المحفوظة عند دخول المستخدم
    const messages = await Message.find().sort({ timestamp: 1 });
    socket.emit('loadMessages', messages);

    // استقبال الرسائل الجديدة وحفظها
    socket.on('chatMessage', async (data) => {
        const newMessage = new Message({ username: data.username, message: data.message });
        await newMessage.save();

        io.emit('chatMessage', data); // إرسال الرسالة للجميع
    });

    socket.on('disconnect', () => {
        console.log('🔴 مستخدم غادر');
    });
});
