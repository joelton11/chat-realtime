const socket = io();

const loginDiv = document.getElementById("login");
const chatDiv = document.getElementById("chat");
const joinBtn = document.getElementById("joinBtn");
const nameInput = document.getElementById("nameInput");
const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const fileInput = document.getElementById("file");

let userName = "";

// Entrar na sala
joinBtn.addEventListener("click", () => {
  userName = nameInput.value.trim() || "Anônimo";
  socket.emit("join", { name: userName });
  loginDiv.classList.add("hidden");
  chatDiv.classList.remove("hidden");
});

// Receber mensagens
socket.on("chat", (data) => {
  const item = document.createElement("li");

  if (data.type === "text") {
    item.innerHTML = `<strong>${data.name}:</strong> ${data.msg}`;
  } else if (data.type === "file") {
    if (data.fileData.startsWith("data:image")) {
      item.innerHTML = `<strong>${data.name}:</strong><br>
        <img src="${data.fileData}" alt="${data.fileName}" style="max-width:200px; border-radius:8px;">`;
    } else {
      item.innerHTML = `<strong>${data.name}:</strong> 
        <a href="${data.fileData}" download="${data.fileName}">📎 ${data.fileName}</a>`;
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
