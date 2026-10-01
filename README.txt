Azl Game's - 50 Level, Frontend & Backend Terpisah
====================================================

Struktur:
azl-game/
├── frontend/  (index.html, style.css, script.js) - tampilan & interaksi
└── backend/   (server.js, package.json, data/players.json) - simpan progress & validasi hint

CARA MENJALANKAN
  cd azl-game/backend
  npm install
  npm start
Buka browser: http://localhost:3000

TENTANG 50 LEVEL
Level dibangun otomatis dari 6 tipe mekanik yang berputar (kata jebakan, geser
tersembunyi, goyang HP, perbesar objek, angka jebakan, urutkan angka). Setiap
kali siklus 6 level selesai, tingkat kesulitannya naik (lebih banyak tombol
jebakan, ambang batas lebih besar, aturan makin variatif) sehingga level akhir
terasa lebih sulit daripada level awal walau mekaniknya berulang - ini cara
efisien membuat 50 level tanpa harus menulis 50 soal unik satu per satu.

Tampilan soal (kotak instruksi) sekarang berupa kartu dengan badge warna sesuai
tipe mekanik + nama level, animasi muncul, dan bisa tetap digeser (drag) untuk
level bertipe "geser".

Endpoint API tidak berubah: /api/progress/:playerId, /api/progress/:playerId/reset,
/api/hint, /api/levels.

DEPLOY KE HOSTING (pakai render.yaml)
========================================
1. Buat repo baru di GitHub, lalu push folder azl-game ini:
     cd azl-game
     git init
     git add .
     git commit -m "Azl Game's - initial commit"
     git branch -M main
     git remote add origin <URL_REPO_GITHUB_KAMU>
     git push -u origin main

2. Buka https://render.com, daftar/login pakai akun GitHub.
3. Klik "New +" -> "Blueprint", pilih repo azl-game kamu.
   Render akan otomatis membaca render.yaml dan mengisi semua pengaturan
   (root directory backend, build command, start command) tanpa perlu
   isi manual.
4. Klik Deploy. Setelah selesai, kamu dapat URL seperti azl-game.onrender.com.
5. Untuk pasang domain sendiri: buka menu Settings > Custom Domain di
   dashboard Render, masukkan domainmu, lalu tambahkan CNAME/A record
   sesuai instruksi yang muncul di panel DNS domainmu.

File Procfile disertakan sebagai cadangan kalau kamu memilih hosting lain
seperti Railway yang juga bisa membaca Procfile untuk tahu cara menjalankan
server (isinya: masuk folder backend lalu npm start).

.gitignore sudah disiapkan supaya node_modules dan data pemain
(backend/data/players.json) tidak ikut ter-upload ke GitHub.
