const socket = io();
const userName = localStorage.getItem("chatName") || "Anônimo";

const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const fileInput = document.getElementById("file");
const userList = document.getElementById("userList");
const logoutBtn = document.getElementById("logoutBtn");

// Conectar ao chat
socket.emit("join", { name: userName });

// Receber mensagens
socket.on("chat", (data) => {
  const item = document.createElement("li");

  // Alinhamento
  if (data.name === userName) item.classList.add("message", "mine");
  else item.classList.add("message", "other");

  const time = new Date(data.time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

  if(data.type === "text") {
    item.innerHTML = `<strong>${data.name}</strong>: ${data.msg} <span class="time">${time}</span>`;
  } else if(data.type === "file") {
    if(data.fileData.startsWith("data:image")) {
      item.innerHTML = `<strong>${data.name}</strong>:<br>
        <img src="${data.fileData}" alt="${data.fileName}">
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
socket.on("system", msg => {
  const item = document.createElement("li");
  item.className = "system";
  item.textContent = `• ${msg}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

// Lista de usuários
socket.on("users", users => userList.textContent = `👥 ${users.length} online`);

// Enviar mensagem
form.addEventListener("submit", e => {
  e.preventDefault();
  if(input.value){
    socket.emit("chat", input.value);
    input.value="";
  }
});

// Enviar arquivo
fileInput.addEventListener("change", ()=>{
  const file = fileInput.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=> socket.emit("file",{fileName:file.name,fileData:reader.result});
  reader.readAsDataURL(file);
});

// Logout
logoutBtn.addEventListener("click",()=>{
  localStorage.removeItem("chatName");
  window.location.href="/";
});
