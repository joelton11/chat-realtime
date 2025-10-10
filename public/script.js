const socket = io();

const loginDiv = document.getElementById("login");
const chatDiv = document.getElementById("chat");
const joinBtn = document.getElementById("joinBtn");
const nameInput = document.getElementById("nameInput");
const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const fileInput = document.getElementById("file");
const userList = document.getElementById("userList");

let userName = "";

// Entrar no chat
joinBtn.addEventListener("click", () => {
  userName = nameInput.value.trim() || "Anônimo";
  socket.emit("join", { name: userName });

  // Animação suave de transição
  loginDiv.classList.add("fade-out");
  setTimeout(() => {
    loginDiv.classList.add("hidden");
    chatDiv.classList.remove("hidden");
    chatDiv.classList.add("fade-in");
  }, 500);
});

// Receber mensagens
socket.on("chat", (data) => {
  const item = document.createElement("li");
  item.classList.add("message");

  if (data.name === userName) {
    item.classList.add("mine");
  } else {
    item.classList.add("other");
  }

  const time = new Date(data.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (data.type === "text") {
    item.innerHTML = `<strong>${data.name}</strong>: ${data.msg} <span class="time">${time}</span>`;
  } else if (data.type === "file") {
    if (data.fileData.startsWith("data:image")) {
      item.innerHTML = `<strong>${data.name}</strong>:<br>
        <img src="${data.fileData}" alt="${data.fileName}" style="max-width:200px; border-radius:8px;">
        <span class="time">${time}</span>`;
    } else {
      item.innerHTML = `<strong>${data.name}</strong>: 
        <a href="${data.fileData}" download="${data.fileName}">📎 ${data.fileName}</a>
        <span class="time">${time}</span>`;
    }
  }

  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

// Mensagens do sistema
socket.on("system", (msg) => {
  const item = document.createElement("li");
  item.className = "system";
  item.textContent = `• ${msg}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

// Lista de usuários online
socket.on("users", (users) => {
  userList.textContent = `👥 ${users.length} online`;
});

// Enviar mensagem de texto
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat", input.value);
    input.value = "";
  }
});

// Enviar arquivo
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    socket.emit("file", {
      fileName: file.name,
      fileData: reader.result
    });
  };
  reader.readAsDataURL(file);
});
