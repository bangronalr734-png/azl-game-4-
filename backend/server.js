const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'players.json');
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

function readDB(){ if(!fs.existsSync(DATA_FILE)) return {}; try{ return JSON.parse(fs.readFileSync(DATA_FILE,'utf-8')); }catch(e){ return {}; } }
function writeDB(db){ fs.mkdirSync(path.dirname(DATA_FILE),{recursive:true}); fs.writeFileSync(DATA_FILE, JSON.stringify(db,null,2)); }
function defaultProgress(){ return { unlocked:1, coins:0, soundOn:true, lastLevel:1, stars:{} }; }

const TYPE_KEYS = ['kata','geser','goyang','zoom','angka','urutan'];
const HINT_BY_TYPE = {
  kata: 'Perhatikan ejaan tombol dengan teliti, jawaban benar hanya satu yang penulisannya persis sama.',
  geser: 'Geser kotak soal ke arah yang benar (kiri/kanan sesuai instruksi) sampai jawaban tersembunyi muncul.',
  goyang: 'Goyangkan HP kamu (atau tekan tombol Goyang), jangan tombol lain yang menggoda.',
  zoom: 'Tekan tombol + berulang kali sampai ukurannya cukup besar.',
  angka: 'Perhatikan aturan angka yang diminta (genap/ganjil/kelipatan/prima), abaikan ukuran objeknya.',
  urutan: 'Tap objek berurutan dari angka terkecil ke terbesar.'
};
function hintForLevel(levelId){ return HINT_BY_TYPE[TYPE_KEYS[(levelId-1)%6]]; }
const TOTAL_LEVELS = 50;

app.get('/api/progress/:playerId', (req,res)=>{
  const db=readDB(); const {playerId}=req.params;
  if(!db[playerId]) db[playerId]=defaultProgress();
  res.json(db[playerId]);
});
app.post('/api/progress/:playerId', (req,res)=>{
  const db=readDB(); const {playerId}=req.params;
  db[playerId] = { ...(db[playerId]||defaultProgress()), ...req.body };
  writeDB(db); res.json(db[playerId]);
});
app.post('/api/progress/:playerId/reset', (req,res)=>{
  const db=readDB(); const {playerId}=req.params;
  db[playerId]=defaultProgress(); writeDB(db); res.json(db[playerId]);
});
app.post('/api/hint', (req,res)=>{
  const { playerId, levelId, method } = req.body;
  if(!playerId || !levelId || levelId<1 || levelId>TOTAL_LEVELS) return res.status(400).json({message:'Data tidak valid.'});
  const db=readDB(); const player = db[playerId] || defaultProgress();
  if(method==='coin'){
    if(player.coins<10) return res.status(400).json({message:'Koin kamu tidak cukup!'});
    player.coins -= 10;
  }
  db[playerId]=player; writeDB(db);
  res.json({ hint: hintForLevel(levelId), coins: player.coins });
});
app.get('/api/levels', (req,res)=>{
  const arr=[]; for(let i=1;i<=TOTAL_LEVELS;i++) arr.push({ id:i, type: TYPE_KEYS[(i-1)%6] });
  res.json(arr);
});
app.listen(PORT, ()=> console.log(`Azl Game's backend jalan di http://localhost:${PORT}`));
