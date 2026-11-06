// Navigasi, tema, dan animasi ringan MotionPic.
(function () {
  'use strict';

  var tombolTema = document.getElementById('tema');
  var tombolMenu = document.getElementById('tombol-menu');
  var menu = document.getElementById('menu');
  var kunciTema = 'motionpic-theme';

  function bacaTema() {
    try {
      return localStorage.getItem(kunciTema);
    } catch (err) {
      return null;
    }
  }

  function simpanTema(nilai) {
    try {
      localStorage.setItem(kunciTema, nilai);
    } catch (err) {
      // Tema tetap bisa dipakai sampai halaman ditutup.
    }
  }

  function terapkanTema(terang) {
    document.body.classList.toggle('light', terang);
    tombolTema.textContent = terang ? 'Tema Gelap' : 'Tema Terang';
    tombolTema.setAttribute('aria-pressed', terang ? 'true' : 'false');
  }

  terapkanTema(bacaTema() === 'light');

  tombolTema.addEventListener('click', function () {
    var terang = !document.body.classList.contains('light');
    terapkanTema(terang);
    simpanTema(terang ? 'light' : 'dark');
  });

  function tutupMenu() {
    menu.classList.remove('buka');
    tombolMenu.setAttribute('aria-expanded', 'false');
    tombolMenu.innerHTML = '&#9776;';
  }

  tombolMenu.setAttribute('aria-controls', 'menu');
  tombolMenu.setAttribute('aria-expanded', 'false');
  tombolMenu.addEventListener('click', function () {
    var terbuka = menu.classList.toggle('buka');
    tombolMenu.setAttribute('aria-expanded', terbuka ? 'true' : 'false');
    tombolMenu.innerHTML = terbuka ? '&times;' : '&#9776;';
  });

  menu.querySelectorAll('a').forEach(function (tautan) {
    tautan.addEventListener('click', tutupMenu);
  });

  document.addEventListener('click', function (event) {
    if (!menu.contains(event.target) && !tombolMenu.contains(event.target)) {
      tutupMenu();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') tutupMenu();
  });

  // Efek muncul saat bagian halaman masuk ke layar.
  var elemenAnimasi = document.querySelectorAll('.hero-teks, .hero-gambar, .judul, .sub, .kartu, .cta');
  var gerakanDikurangi = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !gerakanDikurangi) {
    elemenAnimasi.forEach(function (elemen) { elemen.classList.add('reveal'); });
    var pengamat = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('terlihat');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    elemenAnimasi.forEach(function (elemen) { pengamat.observe(elemen); });
  }
})();
