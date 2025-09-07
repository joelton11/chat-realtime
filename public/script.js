const log = document.getElementById('log');
const typingEl = document.getElementById('typing');
const youEl = document.getElementById('you');
const form = document.getElementById('form');
const input = document.getElementById('m');
const fileInput = document.getElementById('fileInput');
const sendFileBtn = document.getElementById('sendFile');
const modal = document.getElementById('nameModal');
const nameInput = document.getElementById('nameInput');
const joinBtn = document.getElementById('joinBtn');
const usersList = document.getElementById('usersList');

const socket = io();
let myName = '';

function fmtTime(ts){
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function addMsg({ name, msg, time, img }){
  const div = document.createElement('div');
  div.className = 'msg ' + (name === myName ? 'me' : 'other');

  let html = '';
  if(msg) html += `<span>${msg.replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]))}</span>`;
  if(img) html += `<img src="${img}" alt="Imagem enviada">`;

  html += `<div class="meta">${name} • ${fmtTime(time)}</div>`;
  div.innerHTML = html;
  log.appendChild(div);
  div.scrollIntoView({ behavior:'smooth' });
}

function updateUsers(list){
  usersList.innerHTML = '';
  list.forEach(u => {
    const li = document.createElement('li');
    li.textContent = u === myName ? `${u} (Você)` : u;
    if(u === myName) li.className = 'you';
    usersList.appendChild(li);
  });
}

// Eventos do servidor
socket.on('connect', () => { youEl.textContent = 'Conectado'; });
socket.on('system', text => {
  const div = document.createElement('div');
  div.className = 'system';
  div.textContent = `• ${text}`;
  log.appendChild(div);
  div.scrollIntoView({ behavior:'smooth' });
});
socket.on('chat', data => addMsg(data));
socket.on('typing', ({ name, isTyping }) => {
  typingEl.textContent = isTyping ? `${name} está digitando…` : '';
});
socket.on('users', list => updateUsers(list));

// Enviar mensagem
form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if(!text) return;
  socket.emit('chat', { msg: text });
  input.value = '';
  socket.emit('typing', false);
});

// Enviar imagem
sendFileBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    socket.emit('chat', { img: reader.result });
  };
  reader.readAsDataURL(file);
  fileInput.value = '';
});

// Digitando
let t;
input.addEventListener('input', () => {
  socket.emit('typing', true);
  clearTimeout(t);
  t = setTimeout(() => socket.emit('typing', false), 900);
});

// Entrar com nome
joinBtn.addEventListener('click', () => {
  myName = (nameInput.value || 'Anônimo').trim() || 'Anônimo';
  socket.emit('join', myName);
  youEl.textContent = `Você: ${myName}`;
  modal.remove();
  input.focus();
});

nameInput.addEventListener('keydown', e => {
  if(e.key === 'Enter') joinBtn.click();
});
