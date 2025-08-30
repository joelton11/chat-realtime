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

io.on("connection", (socket) => {
  // Nome do usuário (salvo no socket)
  socket.on("join", (name) => {
    socket.data.name = (name || "Anônimo").trim() || "Anônimo";
    socket.broadcast.emit("system", `${socket.data.name} entrou na sala`);
  });

  // Mensagem do chat
  socket.on("chat", (msg) => {
    const payload = {
      name: socket.data.name || "Anônimo",
      msg: (msg || "").toString().slice(0, 2000),
      time: Date.now()
    };
    io.emit("chat", payload);
  });

  // Digitando (opcional)
  socket.on("typing", (isTyping) => {
    socket.broadcast.emit("typing", {
      name: socket.data.name || "Alguém",
      isTyping: !!isTyping
    });
  });

  socket.on("disconnect", () => {
    if (socket.data?.name) {
      io.emit("system", `${socket.data.name} saiu da sala`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
