const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, "public")));

const ROOM_PASSWORD = "minhasala123"; // senha da sala
const users = new Map();

// ADM conectado
let adminSocketId = null;

io.on("connection", (socket) => {
  socket.on("join", ({ name, password }) => {
    if (password !== ROOM_PASSWORD) {
      socket.emit("system", "Senha incorreta! Não foi possível entrar na sala.");
      return;
    }

    const userName = (name || "Anônimo").trim() || "Anônimo";
    socket.data.name = userName;

    // ADM
    if (userName === "ADM") adminSocketId = socket.id;

    users.set(socket.id, userName);
    io.emit("system", `${userName}${userName === "ADM" ? " (ADM)" : ""} entrou na sala`);
    io.emit("users", Array.from(users.values()));
  });

  socket.on("chat", (msg) => {
    const payload = {
      name: socket.data.name || "Anônimo",
      msg: (msg || "").toString().slice(0, 2000),
      time: Date.now()
    };
    io.emit("chat", payload);
  });

  socket.on("typing", (isTyping) => {
    socket.broadcast.emit("typing", {
      name: socket.data.name || "Alguém",
      isTyping: !!isTyping
    });
  });

  // ADM expulsar usuário
  socket.on("kick", (userName) => {
    if (socket.id !== adminSocketId) return; // só ADM pode expulsar

    for (let [id, name] of users.entries()) {
      if (name === userName && id !== adminSocketId) {
        io.to(id).emit("kicked");
        io.sockets.sockets.get(id).disconnect(true);
        break;
      }
    }
  });

  socket.on("disconnect", () => {
    const name = users.get(socket.id);
    if (name) {
      users.delete(socket.id);
      if (socket.id === adminSocketId) adminSocketId = null;
      io.emit("system", `${name}${name === "ADM" ? " (ADM)" : ""} saiu da sala`);
      io.emit("users", Array.from(users.values()));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
  