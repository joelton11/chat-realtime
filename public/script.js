const log = document.getElementById('log');
const typingEl = document.getElementById('typing');
const youEl = document.getElementById('you');
const form = document.getElementById('form');
const input = document.getElementById('m');
const modal = document.getElementById('nameModal');
const nameInput = document.getElementById('nameInput');
const joinBtn = document.getElementById('joinBtn');
const usersList = document.getElementById('usersList');
const fileInput = document.getElementById('fileInput');

const socket = io();
let myName = '';

function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function addMsg({ name, msg, file, time }) {
  const div = document.createElement('div');
  div.className = 'msg ' + (name === myName ? 'me' : 'other');

  if (file) {
    let content;
    if (file.type.startsWith("image/")) {
      content = `<img src="${file.data}" alt="imagem" style="max-width:200px;border-radius:8px;" />`;
    } else {
      content = `<a href="${file.data}" download="${file.name}">📎 ${file.name}</a>`;
    }
    div.innerHTML = `${content}<div class="meta">${name} • ${fmtTime(time)}</div>`;
  } else {
    const safe = (msg || '').replace(/[<>&]/g, s => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[s]));
    div.innerHTML = `<span>${safe}</span><div class="meta">${name} • ${fmtTime(time)}</div>`;
  }

  log.appendChild(div);
  div.scrollIntoView({ behavior: 'smooth' });
}

function updateUsers(list) {
  usersList.innerHTML = '';
  list.forEach(u => {
    const li = document.createElement('li');
    li.textContent = u;
    if (u === myName) li.className = 'you';
    usersList.appendChild(li);
  });
}

// Eventos
socket.on('connect', () => { youEl.textContent = 'Conectado'; });
socket.on('system', (text) => {
  const div = document.createElement('div');
  div.className = 'system';
  div.textContent = `• ${text}`;
  log.appendChild(div);
  div.scrollIntoView({ behavior: 'smooth' });
});
socket.on('chat', (data) => addMsg(data));
socket.on('typing', ({ name, isTyping }) => {
  typingEl.textContent = isTyping ? `${name} está digitando…` : '';
});
socket.on('users', (list) => updateUsers(list));

// Enviar texto
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text) {
    socket.emit('chat', { msg: text });
    input.value = '';
    socket.emit('typing', false);
  }
});

// Enviar arquivo
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    socket.emit('chat', { file: { name: file.name, type: file.type, data: reader.result } });
  };
  reader.readAsDataURL(file);
  fileInput.value = "";
});

// Digitando
let t;
input.addEventListener('input', () => {
  socket.emit('typing', true);
  clearTimeout(t);
  t = setTimeout(() => socket.emit('typing', false), 900);
});

// Entrar
joinBtn.addEventListener('click', () => {
  myName = (nameInput.value || 'Anônimo').trim() || 'Anônimo';
  socket.emit('join', { name: myName });
  youEl.textContent = `Você: ${myName}`;
  modal.remove();
  input.focus();
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') joinBtn.click();
});
