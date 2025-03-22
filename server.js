const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // لجعل الملفات الثابتة متاحة

io.on('connection', (socket) => {
    console.log('🔵 مستخدم متصل');

    socket.on('chatMessage', (msg) => {
        io.emit('chatMessage', msg); // إرسال الرسالة للجميع
    });

    socket.on('disconnect', () => {
        console.log('🔴 مستخدم غادر');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});
