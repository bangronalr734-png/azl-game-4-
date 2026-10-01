const API_BASE = '';
function getPlayerId(){
  let id = localStorage.getItem('azlgame_playerId');
  if(!id){ id = 'player-'+Date.now()+'-'+Math.random().toString(36).slice(2,8); localStorage.setItem('azlgame_playerId', id); }
  return id;
}
const playerId = getPlayerId();
let state = { unlocked:1, coins:0, soundOn:true, lastLevel:1, stars:{} };
async function fetchProgress(){ const r = await fetch(`${API_BASE}/api/progress/${playerId}`); if(r.ok) state = await r.json(); }
async function saveProgress(){ await fetch(`${API_BASE}/api/progress/${playerId}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)}); }

let audioCtx=null;
function playTone(f,d,t){ if(!state.soundOn)return; try{ if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)(); const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.type=t||'sine'; o.frequency.value=f; g.gain.value=0.15; o.connect(g);g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+d); o.stop(audioCtx.currentTime+d);}catch(e){} }
function sfxTap(){playTone(440,0.08,'square');}
function sfxWrong(){playTone(160,0.3,'sawtooth');}
function sfxWin(){playTone(660,0.15,'sine');setTimeout(()=>playTone(880,0.2,'sine'),120);}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id==='screen-menu') document.getElementById('menu-coins').textContent=state.coins;
  if(id==='screen-levels') renderLevelGrid();
  if(id==='screen-settings') renderSettings();
}
window.addEventListener('load', async ()=>{ await fetchProgress(); setTimeout(()=>showScreen('screen-menu'),2000); });

const TYPES=[
  {key:'kata',icon:'🔤',color:'#F0997B'},
  {key:'geser',icon:'👉',color:'#8FB9E8'},
  {key:'goyang',icon:'📳',color:'#F5C4B3'},
  {key:'zoom',icon:'🔍',color:'#97C459'},
  {key:'angka',icon:'🔢',color:'#FAC775'},
  {key:'urutan',icon:'🔗',color:'#C6A4E8'}
];
function isPrime(x){ if(x<2)return false; for(let i=2;i*i<=x;i++) if(x%i===0) return false; return true; }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

function kataLevel(n,diff,type){
  const decoys=['JAWABAN ','JAWABAB','JAWAB4N','JAWABAN!','jawaban','JAVABAN','JAWABANN'].slice(0,2+diff);
  return { id:n, type, title:'Kata Jebakan', instruction:'Tekan tombol bertuliskan persis JAWABAN. Awas, banyak tulisan mirip!',
    render(root,api){
      const opts=shuffle(['JAWABAN',...decoys]);
      opts.forEach(txt=>{ const b=document.createElement('button'); b.className='btn-secondary'; b.textContent=txt; b.onclick=()=> txt==='JAWABAN'?api.win():api.wrong(); root.appendChild(b); });
    }};
}
function geserLevel(n,diff,type){
  const dir = n%2===0 ? 'kanan' : 'kiri';
  const threshold = 60+diff*15;
  return { id:n, type, title:'Geser Soal', instruction:`Jawabannya tersembunyi di balik teks ini. Geser teks soal ini ke ${dir}!`,
    render(root,api){
      const decoy=document.createElement('button'); decoy.className='btn-danger'; decoy.textContent='Tombol Palsu'; decoy.style.position='absolute'; decoy.onclick=api.wrong;
      const hidden=document.createElement('button'); hidden.className='btn-green'; hidden.textContent='JAWABAN'; hidden.style.cssText='position:absolute;opacity:0;pointer-events:none'; hidden.onclick=api.win;
      root.style.position='relative'; root.appendChild(decoy); root.appendChild(hidden);
      api.onInstructionDrag=(dx)=>{ const ok = dir==='kanan' ? dx>threshold : dx<-threshold; if(ok){ hidden.style.opacity='1'; hidden.style.pointerEvents='auto'; } };
    }};
}
function goyangLevel(n,diff,type){
  const decoys=['Elus Kucing','Beri Susu','Nyanyikan Lagu','Matikan Lampu','Tutup Pintu'].slice(0,1+diff);
  return { id:n, type, title:'Bangunkan', instruction:'Kucing ini tidur pulas 😴. Goyangkan HP kamu (atau tekan tombol Goyang) untuk membangunkannya!',
    render(root,api){
      const cat=document.createElement('div'); cat.style.fontSize='3em'; cat.textContent='😴';
      const shakeBtn=document.createElement('button'); shakeBtn.className='btn-green'; shakeBtn.textContent='📳 Goyang'; shakeBtn.onclick=api.win;
      root.appendChild(cat); root.appendChild(shakeBtn);
      decoys.forEach(txt=>{ const d=document.createElement('button'); d.className='btn-danger'; d.textContent=txt; d.onclick=api.wrong; root.appendChild(d); });
      function motion(e){ const a=e.accelerationIncludingGravity; if(!a)return; if(Math.abs(a.x||0)+Math.abs(a.y||0)+Math.abs(a.z||0)>30) api.win(); }
      window.addEventListener('devicemotion',motion); api.onCleanup=()=>window.removeEventListener('devicemotion',motion);
    }};
}
function zoomLevel(n,diff,type){
  const threshold=90+diff*20, step=Math.max(6,18-diff*2);
  return { id:n, type, title:'Perbesar', instruction:'Semut ini terlalu kecil dilihat gajah. Perbesar semutnya!',
    render(root,api){
      let size=24; const box=document.createElement('div'); box.className='ant-box';
      const ant=document.createElement('div'); ant.textContent='🐜'; ant.style.fontSize=size+'px';
      const row=document.createElement('div');
      const plus=document.createElement('button'); plus.className='btn-green'; plus.textContent='+';
      plus.onclick=()=>{ size+=step; ant.style.fontSize=size+'px'; sfxTap(); if(size>=threshold) api.win(); };
      const minus=document.createElement('button'); minus.className='btn-danger'; minus.textContent='Perkecil Gajah'; minus.style.marginLeft='8px'; minus.onclick=api.wrong;
      row.appendChild(plus); row.appendChild(minus); box.appendChild(ant); box.appendChild(row); root.appendChild(box);
    }};
}
function angkaLevel(n,diff,type){
  const rules=['genap','ganjil','kelipatan3','prima']; const rule=rules[n%4];
  const check=(v)=> rule==='genap'?v%2===0: rule==='ganjil'?v%2===1: rule==='kelipatan3'?v%3===0: isPrime(v);
  let nums=[]; while(nums.length<4+Math.min(diff,2)){ const v=2+Math.floor(Math.random()*30); if(!nums.includes(v)) nums.push(v); }
  if(!nums.some(check)) nums[0]= rule==='prima'?7: rule==='kelipatan3'?9: rule==='genap'?8:9;
  const ruleTxt={genap:'GENAP',ganjil:'GANJIL',kelipatan3:'KELIPATAN 3',prima:'BILANGAN PRIMA'}[rule];
  return { id:n, type, title:'Angka Jebakan', instruction:`Tap apel yang angkanya ${ruleTxt}. Jangan tertipu ukurannya!`,
    render(root,api){
      shuffle(nums).forEach(v=>{ const sizes=['1.6em','2em','2.6em','3.2em']; const f=document.createElement('div'); f.className='fruit'; f.style.fontSize=sizes[Math.floor(Math.random()*sizes.length)];
        f.innerHTML='🍎<span>'+v+'</span>'; f.onclick=()=> check(v)?api.win():api.wrong(); root.appendChild(f); });
    }};
}
function urutanLevel(n,diff,type){
  const count=3+Math.min(diff,3);
  return { id:n, type, title:'Urutkan', instruction:`Tap ${count} bola ini berurutan dari angka TERKECIL ke TERBESAR.`,
    render(root,api){
      let nums=[]; while(nums.length<count){ const v=1+Math.floor(Math.random()*99); if(!nums.includes(v)) nums.push(v); }
      const sorted=[...nums].sort((a,b)=>a-b); let idx=0;
      shuffle([...nums]).forEach(v=>{ const b=document.createElement('button'); b.className='btn-secondary'; b.textContent=v; b.style.borderRadius='50%'; b.style.width='56px'; b.style.height='56px';
        b.onclick=()=>{ if(v===sorted[idx]){ idx++; b.disabled=true; b.classList.add('btn-green'); if(idx===sorted.length) api.win(); } else { idx=0; api.wrong(); root.querySelectorAll('button').forEach(x=>{x.disabled=false;x.classList.remove('btn-green');}); } };
        root.appendChild(b); });
    }};
}
const BUILDERS={kata:kataLevel,geser:geserLevel,goyang:goyangLevel,zoom:zoomLevel,angka:angkaLevel,urutan:urutanLevel};
const TOTAL_SLOTS=50;
const levels=[]; for(let n=1;n<=TOTAL_SLOTS;n++){ const type=TYPES[(n-1)%6]; levels.push(BUILDERS[type.key](n,Math.floor((n-1)/6),type)); }

function renderLevelGrid(){
  const grid=document.getElementById('level-grid'); grid.innerHTML='';
  for(let i=1;i<=TOTAL_SLOTS;i++){
    const cell=document.createElement('div'); const unlocked=i<=state.unlocked;
    cell.className='level-cell'+(unlocked?'':' locked');
    if(unlocked){ const star=state.stars[i]||0; cell.innerHTML=i+'<div class="stars">'+'⭐'.repeat(star)+'☆'.repeat(3-star)+'</div>'; cell.onclick=()=>startLevel(i); }
    else cell.innerHTML='🔒';
    grid.appendChild(cell);
  }
}
function renderSettings(){ document.getElementById('sound-switch').className='switch'+(state.soundOn?' on':''); }
async function toggleSound(){ state.soundOn=!state.soundOn; await saveProgress(); renderSettings(); }
async function resetProgress(){ if(confirm('Reset semua progress, koin, dan bintang?')){ const r=await fetch(`${API_BASE}/api/progress/${playerId}/reset`,{method:'POST'}); state=await r.json(); renderSettings(); } }

let currentLevel=null, attempts=0, hintUsed=false, cleanupFn=null;
function goPlay(){ startLevel(state.lastLevel||1); }
async function startLevel(n){
  currentLevel=n; attempts=0; hintUsed=false; state.lastLevel=n; await saveProgress();
  const lvl=levels[n-1];
  const instr=document.getElementById('level-instruction');
  instr.style.transform='translateX(0px)';
  instr.style.setProperty('--accent', lvl.type.color);
  instr.classList.remove('soal-pop'); void instr.offsetWidth; instr.classList.add('soal-pop');
  instr.innerHTML=`<div class="soal-badge" style="background:${lvl.type.color}">${lvl.type.icon} Level ${n} · ${lvl.title}</div><div class="soal-text">${lvl.instruction}</div>`;
  document.getElementById('game-coins').textContent=state.coins;
  const content=document.getElementById('level-content'); content.innerHTML=''; content.classList.remove('shake-anim');
  const api={ win:onLevelWin, wrong:onLevelWrong, onInstructionDrag:null, onCleanup:null };
  if(cleanupFn){ cleanupFn(); cleanupFn=null; }
  lvl.render(content, api); cleanupFn=api.onCleanup;
  setupInstructionDrag(api);
  showScreen('screen-game');
}
function setupInstructionDrag(api){
  const el=document.getElementById('level-instruction'); let startX=0,dragging=false,cur=0;
  function down(e){ dragging=true; startX=(e.touches?e.touches[0].clientX:e.clientX); }
  function move(e){ if(!dragging)return; const x=(e.touches?e.touches[0].clientX:e.clientX); cur=x-startX; el.style.transform='translateX('+cur+'px)'; if(api.onInstructionDrag) api.onInstructionDrag(cur); }
  function up(){ dragging=false; }
  el.onmousedown=down; el.ontouchstart=down; window.onmousemove=move; window.ontouchmove=move; window.onmouseup=up; window.ontouchend=up;
}
function onLevelWrong(){
  attempts++; sfxWrong();
  const content=document.getElementById('level-content'); content.classList.remove('shake-anim'); void content.offsetWidth; content.classList.add('shake-anim');
  if(navigator.vibrate) navigator.vibrate(200);
}
async function onLevelWin(){
  sfxWin();
  const stars = hintUsed?1:(attempts===0?3:(attempts<=2?2:1));
  state.stars[currentLevel]=Math.max(state.stars[currentLevel]||0, stars);
  state.coins += 10;
  if(currentLevel+1>state.unlocked && currentLevel<TOTAL_SLOTS) state.unlocked=currentLevel+1;
  await saveProgress();
  document.getElementById('win-coins').textContent=10;
  document.getElementById('win-stars').innerHTML='<span class="win-star">'+'⭐'.repeat(stars)+'☆'.repeat(3-stars)+'</span>';
  document.getElementById('win-modal').classList.remove('hidden');
}
function goNextLevel(){
  document.getElementById('win-modal').classList.add('hidden');
  if(currentLevel<TOTAL_SLOTS) startLevel(currentLevel+1);
  else { alert('Selamat! Kamu menyelesaikan semua 50 level!'); showScreen('screen-menu'); }
}
function openHint(){ document.getElementById('hint-modal').classList.remove('hidden'); }
function closeHint(){ document.getElementById('hint-modal').classList.add('hidden'); }
async function requestHint(method){
  const res=await fetch(`${API_BASE}/api/hint`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({playerId, levelId:currentLevel, method})});
  const data=await res.json();
  if(!res.ok){ alert(data.message||'Gagal mengambil hint.'); return; }
  hintUsed=true; state.coins=data.coins; document.getElementById('game-coins').textContent=state.coins; closeHint();
  alert('Petunjuk: '+data.hint);
}
function watchAdForHint(){
  const btn=event.target; btn.disabled=true; let t=3; btn.textContent='Iklan sedang tayang... '+t;
  const iv=setInterval(()=>{ t--; btn.textContent='Iklan sedang tayang... '+t; if(t<=0){ clearInterval(iv); btn.disabled=false; btn.textContent='📺 Tonton Iklan (gratis)'; requestHint('ad'); } },1000);
}
function payCoinForHint(){ requestHint('coin'); }
