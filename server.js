const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "public")));

// Rotas separadas
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// Map para armazenar usuários conectados
const users = new Map();

// Socket.io
io.on("connection", (socket) => {
  // Entrar no chat
  socket.on("join", ({ name }) => {
    const userName = (name || "Anônimo").trim() || "Anônimo";
    socket.data.name = userName;

    users.set(socket.id, userName);
    io.emit("system", `${userName} entrou na sala`);
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

  // Enviar arquivo
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

  // Desconectar
  socket.on("disconnect", () => {
    const name = users.get(socket.id);
    if (name) {
      users.delete(socket.id);
      io.emit("system", `${name} saiu da sala`);
      io.emit("users", Array.from(users.values()));
    }
  });
});

// Porta
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Servidor rodando em http://localhost:${PORT}`));
