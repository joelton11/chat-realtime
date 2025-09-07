const log = document.getElementById('log');
const typingEl = document.getElementById('typing');
const youEl = document.getElementById('you');
const form = document.getElementById('form');
const input = document.getElementById('m');
const modal = document.getElementById('nameModal');
const nameInput = document.getElementById('nameInput');
const joinBtn = document.getElementById('joinBtn');
const usersList = document.getElementById('usersList');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');

const socket = io();
let myName = '';

function fmtTime(ts){
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}

function addMsg({name, msg, img, time}){
  const div = document.createElement('div');
  div.className = 'msg ' + (name===myName?'me':'other');

  let html = '';
  if(msg) html += `<span>${msg.replace(/[<>&]/g,s=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]))}</span>`;
  if(img) html += `<img src="${img}" style="max-width:200px; max-height:200px; border-radius:8px; margin-top:4px;">`;

  html += `<div class="meta">${name} • ${fmtTime(time)}</div>`;
  div.innerHTML = html;
  log.appendChild(div);
  div.scrollIntoView({behavior:'smooth'});
}

function updateUsers(list){
  usersList.innerHTML = '';
  list.forEach(u => {
    const li = document.createElement('li');
    if(u===myName){ li.textContent=`${u} (Você)`; li.className='you'; }
    else li.textContent=u;
    usersList.appendChild(li);
  });
}

// Eventos do servidor
socket.on('connect', ()=>{ youEl.textContent='Conectado'; });
socket.on('system', text=>{
  const div=document.createElement('div');
  div.className='system';
  div.textContent=`• ${text}`;
  log.appendChild(div);
  div.scrollIntoView({behavior:'smooth'});
});
socket.on('chat', data => addMsg(data));
socket.on('typing', ({name,isTyping})=>{ typingEl.textContent=isTyping?`${name} está digitando…`:''; });
socket.on('users', list => updateUsers(list));

// Abrir seleção de arquivos
attachBtn.addEventListener('click', ()=>fileInput.click());

// Atualizar placeholder quando selecionar arquivos
fileInput.addEventListener('change', ()=>{
  input.placeholder = fileInput.files.length>0?`${fileInput.files.length} arquivo(s) selecionado(s)`:"Escreva sua mensagem...";
});

// Enviar mensagem
form.addEventListener('submit', e=>{
  e.preventDefault();
  const text = input.value.trim();
  if(!text && !fileInput.files[0]) return;

  if(fileInput.files[0]){
    const reader = new FileReader();
    reader.onload = e=>{
      socket.emit('chat',{ msg:text, img:e.target.result });
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    socket.emit('chat',{ msg:text });
  }

  input.value='';
  fileInput.value='';
  input.placeholder="Escreva sua mensagem...";
  socket.emit('typing', false);
});

// Indicador digitando
let t;
input.addEventListener('input', ()=>{
  socket.emit('typing', true);
  clearTimeout(t);
  t=setTimeout(()=>socket.emit('typing', false), 900);
});

// Entrar com nome
joinBtn.addEventListener('click', ()=>{
  myName=(nameInput.value||'Anônimo').trim()||'Anônimo';
  socket.emit('join', myName);
  youEl.textContent=`Você: ${myName}`;
  modal.remove();
  input.focus();
});
nameInput.addEventListener('keydown', e=>{ if(e.key==='Enter') joinBtn.click(); });
