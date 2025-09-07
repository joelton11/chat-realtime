const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin:"*" } });

app.use(express.static(path.join(__dirname, "public")));

const users = new Map();

io.on("connection", (socket) => {
  socket.on("join", (name) => {
    const userName = (name || "Anônimo").trim() || "Anônimo";
    socket.data.name = userName;
    users.set(socket.id, userName);

    io.emit("system", `${userName} entrou na sala`);
    io.emit("users", Array.from(users.values()));
  });

  socket.on("chat", (data) => {
    const payload = {
      name: socket.data.name || "Anônimo",
      type: data.type || "text",
      msg: data.msg || '',
      img: data.img || null,
      time: Date.now()
    };
    io.emit("chat", payload);
  });

  socket.on("typing", (isTyping) => {
    socket.broadcast.emit("typing", { name: socket.data.name || "Alguém", isTyping: !!isTyping });
  });

  socket.on("disconnect", () => {
    const name = users.get(socket.id);
    if(name){
      users.delete(socket.id);
      io.emit("system", `${name} saiu da sala`);
      io.emit("users", Array.from(users.values()));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Servidor rodando em http://localhost:${PORT}`));
