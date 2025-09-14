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

const users = new Map();

io.on("connection", (socket) => {
  // Usuário entrou
  socket.on("join", ({ name }) => {
    const userName = (name || "Anônimo").trim() || "Anônimo";
    socket.data.name = userName;

    users.set(socket.id, userName);
    io.emit("system", `${userName} entrou na sala 👋`);
    io.emit("users", Array.from(users.values()));
  });

  // Mensagem de texto
  socket.on("chat", (msg) => {
    const payload = {
      name: socket.data.name || "Anônimo",
      msg: (msg || "").toString().slice(0, 2000),
      type: "text",
      time: Date.now()
    };
    io.emit("chat", payload);
  });

  // Upload de arquivo/imagem
  socket.on("file", ({ fileName, fileData }) => {
    const payload = {
      name: socket.data.name || "Anônimo",
      fileName,
      fileData,
      type: "file",
      time: Date.now()
    };
    io.emit("chat", payload);
  });

  // Usuário saiu
  socket.on("disconnect", () => {
    const name = users.get(socket.id);
    if (name) {
      users.delete(socket.id);
      io.emit("system", `${name} saiu da sala 👋`);
      io.emit("users", Array.from(users.values()));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
