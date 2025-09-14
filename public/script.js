const socket = io();
const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const fileInput = document.getElementById("file");

// Entrar na sala
const name = prompt("Digite seu nome:") || "Anônimo";
socket.emit("join", { name });

// Receber mensagens normais
socket.on("chat", (data) => {
  const item = document.createElement("li");

  if (data.type === "text") {
    // Texto normal
    item.innerHTML = `<strong>${data.name}:</strong> ${data.msg}`;
  } else if (data.type === "file") {
    // Arquivos e imagens
    if (data.fileData.startsWith("data:image")) {
      // Imagem
      item.innerHTML = `<strong>${data.name}:</strong><br>
        <img src="${data.fileData}" alt="${data.fileName}" style="max-width:200px; border-radius:8px;">`;
    } else {
      // Arquivo para download
      item.innerHTML = `<strong>${data.name}:</strong> 
        <a href="${data.fileData}" download="${data.fileName}">📎 ${data.fileName}</a>`;
    }
  }

  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

// Receber mensagens do sistema (entrar/sair)
socket.on("system", (msg) => {
  const item = document.createElement("li");
  item.style.color = "gray";
  item.style.fontStyle = "italic";
  item.textContent = `• ${msg}`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
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
