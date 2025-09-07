const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e7 // permite enviar arquivos maiores (10MB)
});

app.use(express.static(path.join(__dirname, "public")));

// Lista de usuários conectados
const users = new Map();

io.on("connection", socket => {

  // Usuário entra com nome
  socket.on("join", name => {
    const userName = (name || "Anônimo").trim() || "Anônimo";
    socket.data.name = userName;
    users.set(socket.id, userName);

    io.emit("system", `${userName} entrou na sala`);
    io.emit("users", Array.from(users.values()));
  });

  // Mensagem do chat (texto + imagem opcional)
  socket.on("chat", ({ msg, img }) => {
    const payload = {
      name: socket.data.name || "Anônimo",
      msg: msg ? msg.toString().slice(0, 2000) : null,
      img: img || null,
      time: Date.now()
    };
    io.emit("chat", payload);
  });

  // Indicador digitando
  socket.on("typing", isTyping => {
    socket.broadcast.emit("typing", {
      name: socket.data.name || "Alguém",
      isTyping: !!isTyping
    });
  });

  // Usuário saiu
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
server.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
