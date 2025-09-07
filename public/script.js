const log = document.getElementById('log');
const typingEl = document.getElementById('typing');
const youEl = document.getElementById('you');
const form = document.getElementById('form');
const input = document.getElementById('m');
const modal = document.getElementById('nameModal');
const nameInput = document.getElementById('nameInput');
const passwordInput = document.getElementById('passwordInput');
const joinBtn = document.getElementById('joinBtn');
const usersList = document.getElementById('usersList');

const socket = io();
let myName = '';
let isAdmin = false;

function fmtTime(ts){
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function addMsg({ name, msg, time }){
  const div = document.createElement('div');
  const safe = (msg || '').replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]));
  div.className = 'msg ' + (name === myName ? 'me' : 'other');
  div.innerHTML = `<span>${safe}</span><div class="meta">${name} • ${fmtTime(time)}</div>`;
  log.appendChild(div);
  div.scrollIntoView({ behavior:'smooth' });
}

// Atualizar lista de usuários
function updateUsers(list){
  usersList.innerHTML = '';
  list.forEach(u => {
    const li = document.createElement('li');
    li.textContent = u;
    if(u === myName) li.className = 'you';
    if(isAdmin && u !== "ADM") {
      const btn = document.createElement('button');
      btn.textContent = "❌";
      btn.style.marginLeft = "8px";
      btn.onclick = () => socket.emit("kick", u);
      li.appendChild(btn);
    }
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
socket.on('typing', ({ name, isTyping }) => {
  typingEl.textContent = isTyping ? `${name} está digitando…` : '';
});
socket.on('users', (list) => updateUsers(list));
socket.on('kicked', () => {
  alert("Você foi expulso da sala pelo ADM!");
  location.reload();
});

// Enviar mensagem
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if(!text) return;
  socket.emit('chat', text);
  input.value = '';
  socket.emit('typing', false);
});

// Digitando
let t;
input.addEventListener('input', () => {
  socket.emit('typing', true);
  clearTimeout(t);
  t = setTimeout(() => socket.emit('typing', false), 900);
});

// Entrar com nome e senha da sala
joinBtn.addEventListener('click', () => {
  myName = (nameInput.value || 'Anônimo').trim() || 'Anônimo';
  const password = passwordInput.value;
  isAdmin = myName === "ADM";
  socket.emit('join', { name: myName, password });
  youEl.textContent = `Você: ${myName}${isAdmin ? " (ADM)" : ""}`;
  modal.remove();
  input.focus();
});

nameInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter'){ joinBtn.click(); }
});
passwordInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter'){ joinBtn.click(); }
});
