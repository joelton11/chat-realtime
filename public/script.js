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
const fileNameEl = document.getElementById('fileName');

const socket = io();
let myName = '';

function fmtTime(ts){
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function addMsg({ name, msg, time, type, img }){
  const div = document.createElement('div');
  div.className = 'msg ' + (name === myName ? 'me' : 'other');
  let content = '';
  if(type === 'image' && img){
    content = `<img src="${img}" alt="Imagem enviada">`;
    if(msg) content = `<span>${msg}</span>` + content;
  } else {
    const safe = (msg || '').replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]));
    content = `<span>${safe}</span>`;
  }
  div.innerHTML = content + `<div class="meta">${name} • ${fmtTime(time)}</div>`;
  log.appendChild(div);
  div.scrollIntoView({ behavior:'smooth' });
}

function updateUsers(list){
  usersList.innerHTML = '';
  list.forEach(u => {
    const li = document.createElement('li');
    if(u === myName){
      li.textContent = `${u} (Você)`;
      li.className = 'you';
    } else li.textContent = u;
    usersList.appendChild(li);
  });
}

// Eventos do servidor
socket.on('connect', () => { youEl.textContent = 'Conectado'; });
socket.on('system', (text) => {
  const div = document.createElement('div');
  div.className = 'system';
  div.textContent = `• ${text}`;
  log.appendChild(div);
  div.scrollIntoView({ behavior:'smooth' });
});
socket.on('chat', (data) => addMsg(data));
socket.on('typing', ({ name, isTyping }) => { typingEl.textContent = isTyping ? `${name} está digitando…` : ''; });
socket.on('users', (list) => updateUsers(list));

// Enviar mensagem
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if(!text && !fileInput.files[0]) return;

  if(fileInput.files[0]){
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('chat', { type:'image', img: reader.result, msg: text });
    };
    reader.readAsDataURL(fileInput.files[0]);
    fileNameEl.textContent = "Nenhum arquivo escolhido";
    fileInput.value = '';
  } else {
    socket.emit('chat', { type:'text', msg: text });
  }
  input.value = '';
  socket.emit('typing', false);
});

// Indicador de digitando
let t;
input.addEventListener('input', () => {
  socket.emit('typing', true);
  clearTimeout(t);
  t = setTimeout(() => socket.emit('typing', false), 900);
});

// Input de arquivo
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  fileNameEl.textContent = file ? file.name : "Nenhum arquivo escolhido";
});

// Entrar com nome
joinBtn.addEventListener('click', () => {
  myName = (nameInput.value || 'Anônimo').trim() || 'Anônimo';
  socket.emit('join', myName);
  youEl.textContent = `Você: ${myName}`;
  modal.remove();
  input.focus();
});

nameInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter'){ joinBtn.click(); }
});
