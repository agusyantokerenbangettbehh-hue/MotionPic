// Login opsional dan panel admin lokal MotionPic.
// Akun pertama menjadi admin; akun berikutnya menjadi pengguna biasa.
(function () {
  'use strict';

  var KUNCI_USER = 'mp-users';
  var KUNCI_MAKS = 'mp-maks';
  var KUNCI_SESI = 'mp-sesi';
  var MAKS_BAWAAN = 5;
  var MAKS_TERTINGGI = 60;
  var daftarUser = Object.create(null);
  var authSedangDiproses = false;

  function ambil(id) { return document.getElementById(id); }
  function punya(objek, kunci) { return Object.prototype.hasOwnProperty.call(objek, kunci); }

  function bacaUser() {
    try {
      var data = JSON.parse(localStorage.getItem(KUNCI_USER) || '{}');
      daftarUser = Object.create(null);
      if (!data || typeof data !== 'object' || Array.isArray(data)) return;
      Object.keys(data).forEach(function (nama) {
        var user = data[nama];
        if (!/^[a-z0-9_]{3,20}$/.test(nama) || !user || typeof user !== 'object') return;
        if (typeof user.garam !== 'string' || typeof user.hash !== 'string') return;
        // Migrasi akun OWNER lama menjadi ADMIN. Tidak ada role OWNER lagi.
        var role = user.role === 'owner' || user.role === 'admin' ? 'admin' : 'user';
        daftarUser[nama] = { garam: user.garam, hash: user.hash, role: role };
      });
      simpanUser();
    } catch (err) {
      daftarUser = Object.create(null);
    }
  }

  function simpanUser() {
    try {
      localStorage.setItem(KUNCI_USER, JSON.stringify(daftarUser));
      return true;
    } catch (err) { return false; }
  }

  function adaAdmin() {
    return Object.keys(daftarUser).some(function (nama) { return daftarUser[nama].role === 'admin'; });
  }

  function jumlahAdmin() {
    return Object.keys(daftarUser).filter(function (nama) { return daftarUser[nama].role === 'admin'; }).length;
  }

  function userAktif() {
    try {
      var nama = sessionStorage.getItem(KUNCI_SESI);
      return nama && punya(daftarUser, nama) ? nama : null;
    } catch (err) { return null; }
  }

  function ambilMaks() {
    try {
      var nilai = parseFloat(localStorage.getItem(KUNCI_MAKS));
      if (Number.isFinite(nilai) && nilai >= 1 && nilai <= MAKS_TERTINGGI) return nilai;
    } catch (err) { /* gunakan nilai bawaan */ }
    return MAKS_BAWAAN;
  }

  function hashCadangan(teks) {
    var h = 2166136261;
    for (var i = 0; i < teks.length; i++) { h ^= teks.charCodeAt(i); h = Math.imul(h, 16777619); }
    return 'local-' + (h >>> 0).toString(16);
  }

  async function buatHash(teks) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      try {
        var data = new TextEncoder().encode(teks);
        var buffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(buffer)).map(function (angka) { return angka.toString(16).padStart(2, '0'); }).join('');
      } catch (err) { /* fallback lokal */ }
    }
    return hashCadangan(teks);
  }

  function buatGaram() {
    if (window.crypto && crypto.getRandomValues) {
      var data = new Uint8Array(16);
      crypto.getRandomValues(data);
      return Array.from(data).map(function (angka) { return angka.toString(16).padStart(2, '0'); }).join('');
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function pesan(id, teks, error) {
    var elemen = ambil(id);
    if (!elemen) return;
    elemen.textContent = teks || '';
    elemen.className = error ? 'hint err' : 'hint';
  }

  function kunciTombol(status) {
    authSedangDiproses = status;
    ambil('btn-masuk').disabled = status;
    ambil('btn-daftar').disabled = status;
  }

  function bukaModal() {
    ambil('info-modal').textContent = adaAdmin()
      ? 'Login tidak wajib untuk membuat foto live. Akun diperlukan hanya untuk mengakses panel admin.'
      : 'Belum ada admin. Pendaftaran akun pertama akan otomatis menjadi admin.';
    ambil('btn-daftar').textContent = 'Daftar';
    pesan('pesan-login', '');
    ambil('modal').style.display = 'flex';
    ambil('login-nama').focus();
  }

  function tutupModal() {
    ambil('modal').style.display = 'none';
    ambil('login-pass').value = '';
    kunciTombol(false);
  }

  async function masuk() {
    if (authSedangDiproses) return;
    var nama = ambil('login-nama').value.trim().toLowerCase();
    var pass = ambil('login-pass').value;
    var user = daftarUser[nama];
    if (!user) { pesan('pesan-login', 'Username tidak ditemukan.', true); return; }
    if (!pass) { pesan('pesan-login', 'Masukkan password terlebih dahulu.', true); return; }
    kunciTombol(true);
    try {
      var hash = await buatHash(user.garam + pass);
      if (hash !== user.hash) { pesan('pesan-login', 'Password salah.', true); return; }
      try { sessionStorage.setItem(KUNCI_SESI, nama); }
      catch (err) { pesan('pesan-login', 'Browser tidak mengizinkan sesi login.', true); return; }
      tutupModal();
      tampilkanStatus();
    } finally { kunciTombol(false); }
  }

  async function daftar() {
    if (authSedangDiproses) return;
    var nama = ambil('login-nama').value.trim().toLowerCase();
    var pass = ambil('login-pass').value;
    if (!/^[a-z0-9_]{3,20}$/.test(nama)) { pesan('pesan-login', 'Username 3-20 karakter: huruf, angka, atau _.', true); return; }
    if (pass.length < 6) { pesan('pesan-login', 'Password minimal 6 karakter.', true); return; }
    if (punya(daftarUser, nama)) { pesan('pesan-login', 'Username sudah dipakai.', true); return; }

    kunciTombol(true);
    try {
      var role = adaAdmin() ? 'user' : 'admin';
      var garam = buatGaram();
      daftarUser[nama] = { garam: garam, hash: await buatHash(garam + pass), role: role };
      if (!simpanUser()) {
        delete daftarUser[nama];
        pesan('pesan-login', 'Akun tidak bisa disimpan. Periksa penyimpanan browser.', true);
        return;
      }
      try { sessionStorage.setItem(KUNCI_SESI, nama); }
      catch (err) { pesan('pesan-login', 'Akun tersimpan, tetapi sesi login tidak bisa dibuat.', true); return; }
      tutupModal();
      tampilkanStatus();
      if (role === 'admin') pesan('pesan-admin', 'Akun pertama berhasil dibuat sebagai ADMIN.');
    } finally { kunciTombol(false); }
  }

  function keluar() {
    try { sessionStorage.removeItem(KUNCI_SESI); } catch (err) { /* abaikan */ }
    tampilkanStatus();
    location.hash = '#beranda';
  }

  function tampilkanStatus() {
    var nama = userAktif();
    var role = nama ? daftarUser[nama].role : null;
    var boleh = role === 'admin';
    ambil('tombol-masuk').textContent = nama ? 'Keluar (' + nama + ')' : 'Masuk';
    ambil('admin').style.display = boleh ? '' : 'none';
    ambil('menu-admin').style.display = boleh ? '' : 'none';
    if (boleh) isiPanel(nama);
  }

  function isiPanel(nama) {
    ambil('info-role').textContent = 'Masuk sebagai ' + nama + ' (ADMIN)';
    ambil('maks-input').value = ambilMaks();
    ambil('catatan-owner').style.display = 'none';
    ambil('form-admin').style.display = '';

    var daftar = ambil('daftar-admin');
    daftar.textContent = '';
    var admins = Object.keys(daftarUser).filter(function (username) { return daftarUser[username].role === 'admin'; });
    admins.forEach(function (username) {
      var item = document.createElement('li');
      item.appendChild(document.createTextNode(username + (username === nama ? ' (kamu)' : ' ')));
      if (username !== nama && admins.length > 1) {
        var tombol = document.createElement('button');
        tombol.className = 'btn garis kecil hapus-admin';
        tombol.textContent = 'Hapus';
        tombol.setAttribute('data-nama', username);
        item.appendChild(tombol);
      }
      daftar.appendChild(item);
    });
  }

  function bolehAdmin() {
    var nama = userAktif();
    return !!nama && daftarUser[nama].role === 'admin';
  }

  function simpanMaks() {
    if (!bolehAdmin()) return;
    var nilai = parseFloat(ambil('maks-input').value);
    if (!Number.isFinite(nilai) || nilai < 1 || nilai > MAKS_TERTINGGI) {
      pesan('pesan-maks', 'Isi angka antara 1 sampai ' + MAKS_TERTINGGI + ' detik.', true);
      return;
    }
    try { localStorage.setItem(KUNCI_MAKS, String(nilai)); }
    catch (err) { pesan('pesan-maks', 'Pengaturan tidak bisa disimpan.', true); return; }
    if (typeof window.terapkanMaks === 'function') window.terapkanMaks();
    pesan('pesan-maks', 'Tersimpan. Durasi maksimum sekarang ' + nilai + ' detik.');
  }

  async function tambahAdmin() {
    if (!bolehAdmin() || authSedangDiproses) return;
    var nama = ambil('admin-nama').value.trim().toLowerCase();
    var pass = ambil('admin-pass').value;
    if (!/^[a-z0-9_]{3,20}$/.test(nama)) { pesan('pesan-admin', 'Username 3-20 karakter: huruf, angka, atau _.', true); return; }
    if (pass.length < 6) { pesan('pesan-admin', 'Password minimal 6 karakter.', true); return; }
    if (punya(daftarUser, nama)) { pesan('pesan-admin', 'Username sudah dipakai.', true); return; }
    authSedangDiproses = true;
    try {
      var garam = buatGaram();
      daftarUser[nama] = { garam: garam, hash: await buatHash(garam + pass), role: 'admin' };
      if (!simpanUser()) { delete daftarUser[nama]; pesan('pesan-admin', 'Admin tidak bisa disimpan.', true); return; }
      ambil('admin-nama').value = '';
      ambil('admin-pass').value = '';
      pesan('pesan-admin', 'Admin ' + nama + ' berhasil ditambahkan.');
      tampilkanStatus();
    } finally { authSedangDiproses = false; }
  }

  ambil('tombol-masuk').addEventListener('click', function () { if (userAktif()) keluar(); else bukaModal(); });
  ambil('tutup-modal').addEventListener('click', tutupModal);
  ambil('modal').addEventListener('click', function (event) { if (event.target === ambil('modal')) tutupModal(); });
  ambil('btn-masuk').addEventListener('click', masuk);
  ambil('btn-daftar').addEventListener('click', daftar);
  [ambil('login-nama'), ambil('login-pass')].forEach(function (input) {
    input.addEventListener('keydown', function (event) { if (event.key === 'Enter') masuk(); });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && ambil('modal').style.display === 'flex') tutupModal();
  });
  ambil('simpan-maks').addEventListener('click', simpanMaks);
  ambil('btn-tambah-admin').addEventListener('click', tambahAdmin);
  ambil('daftar-admin').addEventListener('click', function (event) {
    var nama = event.target.getAttribute('data-nama');
    if (!nama || !bolehAdmin() || !punya(daftarUser, nama) || daftarUser[nama].role !== 'admin') return;
    if (jumlahAdmin() <= 1) { pesan('pesan-admin', 'Minimal harus ada satu admin.', true); return; }
    if (!window.confirm('Hapus admin ' + nama + '?')) return;
    delete daftarUser[nama];
    if (!simpanUser()) { pesan('pesan-admin', 'Perubahan tidak bisa disimpan.', true); bacaUser(); }
    tampilkanStatus();
  });

  window.ambilMaks = ambilMaks;
  bacaUser();
  tampilkanStatus();
})();
