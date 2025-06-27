const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// ✅ السماح لجميع Origins
app.use(cors());

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ✅ تقديم الملفات الثابتة (index.html و styles.css)
app.use(express.static("public"));

// ✅ تخزين الرسائل في الذاكرة
const messages = [];

// ✅ التعامل مع WebSocket
io.on("connection", (socket) => {
  console.log("🔵 مستخدم متصل");

  // إرسال الرسائل القديمة
  socket.emit("loadMessages", messages);

  // استقبال رسالة جديدة
  socket.on("chatMessage", (data) => {
    messages.push(data);
    io.emit("chatMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 مستخدم غادر");
  });
});

// ✅ تشغيل الخادم
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});
