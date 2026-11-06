// MotionPic Studio: editor video, preview, dan ekspor.
(function () {
  'use strict';

  var video = document.getElementById('vid');
  var kanvas = document.getElementById('cv');
  var ctx = kanvas.getContext('2d');
  var kotak = document.getElementById('stage');
  var inputFile = document.getElementById('file');
  var areaPilih = document.getElementById('pick');

  var durasiVideo = 0;
  var urlVideo = null;
  var sibuk = false;
  var ditahan = false;
  var nomorSeek = 0;
  var timerRekam = null;
  var daftarKontrol = [
    'start', 'len', 'cover', 'aud', 'bm', 'bc', 'bv', 'nw'
  ];

  function ambil(id) {
    return document.getElementById(id);
  }

  function aturStatus(teks, error) {
    var el = ambil('msg');
    el.textContent = teks || '';
    el.className = error ? 'hint err' : 'hint';
  }

  function aturKontrol(nonaktif) {
    daftarKontrol.forEach(function (id) {
      var el = ambil(id);
      if (el) el.disabled = !!nonaktif;
    });
  }

  function tambahOpsi(pilih, detik) {
    var opsi = document.createElement('option');
    opsi.value = String(detik);
    opsi.textContent = String(detik).replace('.', ',') + ' detik';
    pilih.appendChild(opsi);
  }

  function terapkanMaks() {
    var batasAdmin = typeof window.ambilMaks === 'function' ? window.ambilMaks() : 5;
    var maks = durasiVideo > 0 ? Math.min(batasAdmin, durasiVideo) : batasAdmin;
    var pilihan = ambil('len');
    var lama = parseFloat(pilihan.value) || 3;
    var daftar = [1.5, 3, 5, 10, 15, 30, 60];

    pilihan.innerHTML = '';
    daftar.forEach(function (detik) {
      if (detik <= maks) tambahOpsi(pilihan, detik);
    });
    if (!daftar.some(function (detik) { return detik === maks; })) {
      tambahOpsi(pilihan, maks);
    }

    pilihan.value = String(Math.min(lama, maks));
    if (!pilihan.value) pilihan.selectedIndex = pilihan.options.length - 1;
    if (durasiVideo > 0) perbarui();
  }

  function panjangKlip() {
    var maks = typeof window.ambilMaks === 'function' ? window.ambilMaks() : 5;
    var nilai = parseFloat(ambil('len').value) || 1;
    nilai = Math.min(nilai, maks, durasiVideo || nilai);
    return Math.max(0.01, nilai);
  }

  function mulaiKlip() {
    return Math.max(0, parseFloat(ambil('start').value) || 0);
  }

  function waktuSampul() {
    var fraksi = Math.min(1, Math.max(0, parseFloat(ambil('cover').value) || 0));
    return Math.min(durasiVideo, mulaiKlip() + fraksi * panjangKlip());
  }

  function ukuranKanvas() {
    var lebar = video.videoWidth;
    var tinggi = video.videoHeight;
    if (!lebar || !tinggi) return false;

    var skala = Math.min(1, 1920 / Math.max(lebar, tinggi));
    var targetLebar = Math.max(1, Math.round(lebar * skala));
    var targetTinggi = Math.max(1, Math.round(tinggi * skala));

    if (kanvas.width !== targetLebar || kanvas.height !== targetTinggi) {
      kanvas.width = targetLebar;
      kanvas.height = targetTinggi;
    }
    return true;
  }

  function gambarFrame() {
    if (video.readyState < 2 || !ukuranKanvas()) return false;
    try {
      ctx.drawImage(video, 0, 0, kanvas.width, kanvas.height);
      return true;
    } catch (err) {
      return false;
    }
  }

  function tungguSeek(waktu, idSeek) {
    return new Promise(function (resolve, reject) {
      if (!Number.isFinite(waktu) || !durasiVideo) {
        reject(new Error('Waktu video tidak valid.'));
        return;
      }

      var target = Math.max(0, Math.min(waktu, Math.max(0, durasiVideo - 0.04)));
      var selesai = false;
      var batasWaktu;

      function bersihkan() {
        clearTimeout(batasWaktu);
        video.removeEventListener('seeked', saatSeek);
        video.removeEventListener('error', saatError);
      }

      function akhir(error) {
        if (selesai) return;
        selesai = true;
        bersihkan();
        if (error) reject(error);
        else resolve();
      }

      function saatSeek() {
        if (idSeek !== undefined && idSeek !== nomorSeek) {
          akhir(new Error('Pemilihan frame berubah.'));
          return;
        }
        if (!gambarFrame()) {
          akhir(new Error('Frame video gagal dibaca.'));
          return;
        }
        akhir();
      }

      function saatError() {
        akhir(new Error('Video gagal diproses oleh browser.'));
      }

      if (video.readyState >= 2 && Math.abs(video.currentTime - target) < 0.025) {
        if (gambarFrame()) resolve();
        else reject(new Error('Frame video belum siap.'));
        return;
      }

      video.addEventListener('seeked', saatSeek);
      video.addEventListener('error', saatError);
      batasWaktu = setTimeout(function () {
        akhir(new Error('Browser terlalu lama membaca frame video.'));
      }, 7000);

      try {
        video.currentTime = target;
      } catch (err) {
        akhir(new Error('Tidak bisa berpindah ke frame yang dipilih.'));
      }
    });
  }

  async function tampilkanSampul() {
    if (!durasiVideo || sibuk || !video.videoWidth) return;
    video.pause();
    var idSeek = ++nomorSeek;
    try {
      await tungguSeek(waktuSampul(), idSeek);
    } catch (err) {
      if (idSeek === nomorSeek) aturStatus(err.message, true);
      return false;
    }
    return true;
  }

  function perbarui() {
    if (!durasiVideo) return;

    var lama = panjangKlip();
    var maksimumMulai = Math.max(0, durasiVideo - lama);
    var sliderMulai = ambil('start');
    sliderMulai.max = String(maksimumMulai);
    sliderMulai.value = String(Math.min(mulaiKlip(), maksimumMulai));

    var awal = mulaiKlip();
    var akhir = Math.min(durasiVideo, awal + lama);
    var sampul = Math.min(waktuSampul(), Math.max(0, durasiVideo - 0.04));

    ambil('vs').textContent = awal.toFixed(1) + 's - ' + akhir.toFixed(1) + 's';
    ambil('cs').textContent = sampul.toFixed(1) + 's';
    ambil('win').style.left = (awal / durasiVideo * 100) + '%';
    ambil('win').style.width = (lama / durasiVideo * 100) + '%';
    ambil('pin').style.left = (sampul / durasiVideo * 100) + '%';
    tampilkanSampul();
  }

  function bersihkanVideo() {
    nomorSeek++;
    video.pause();
    video.removeAttribute('src');
    video.load();
    if (urlVideo) URL.revokeObjectURL(urlVideo);
    urlVideo = null;
    durasiVideo = 0;
    ditahan = false;
    kotak.classList.remove('play');
    kanvas.width = 1;
    kanvas.height = 1;
    kotak.style.aspectRatio = '16 / 9';
    kotak.style.maxWidth = '';
  }

  function pilihVideo(file) {
    if (!file) return;
    var nama = file.name || '';
    var kemungkinanVideo = (file.type && file.type.indexOf('video/') === 0) || /\.(mp4|mov|m4v|webm|mkv|avi|3gp)$/i.test(nama);
    if (!kemungkinanVideo) {
      aturStatus('File tidak dikenali sebagai video. Pilih file video seperti MP4 atau MOV.', true);
      return;
    }

    bersihkanVideo();
    aturStatus('Memuat video...');
    urlVideo = URL.createObjectURL(file);
    video.src = urlVideo;
    video.load();
  }

  video.addEventListener('loadedmetadata', function () {
    if (!Number.isFinite(video.duration) || video.duration <= 0 || !video.videoWidth || !video.videoHeight) {
      aturStatus('Durasi atau ukuran video tidak bisa dibaca. Coba video lain.', true);
      return;
    }

    durasiVideo = video.duration;
    ambil('tot').textContent = durasiVideo.toFixed(1) + 's';
    kotak.style.aspectRatio = video.videoWidth + ' / ' + video.videoHeight;
    kotak.style.maxWidth = Math.min(100, 65 * video.videoWidth / video.videoHeight) + 'vh';
    ambil('pick').classList.add('hide');
    ambil('ed').classList.remove('hide');
    ambil('start').value = '0';
    ambil('cover').value = '0.5';
    terapkanMaks();
    aturStatus('Video siap. Tahan preview untuk melihat klip bergerak.');
    perbarui();
  });

  video.addEventListener('error', function () {
    if (urlVideo) aturStatus('Video tidak bisa dibuka. Coba format MP4 atau MOV yang umum.', true);
  });

  inputFile.addEventListener('change', function (event) {
    var file = event.target.files && event.target.files[0];
    pilihVideo(file);
    event.target.value = '';
  });

  ambil('nw').addEventListener('click', function () {
    inputFile.click();
  });

  areaPilih.addEventListener('dragover', function (event) {
    event.preventDefault();
    areaPilih.classList.add('over');
  });
  areaPilih.addEventListener('dragleave', function () {
    areaPilih.classList.remove('over');
  });
  areaPilih.addEventListener('drop', function (event) {
    event.preventDefault();
    areaPilih.classList.remove('over');
    pilihVideo(event.dataTransfer && event.dataTransfer.files[0]);
  });

  ambil('start').addEventListener('input', perbarui);
  ambil('len').addEventListener('change', perbarui);
  ambil('cover').addEventListener('input', perbarui);

  function mulaiPutar(event) {
    if (sibuk || ditahan || !durasiVideo) return;
    ditahan = true;
    kotak.classList.add('play');
    video.muted = !ambil('aud').checked;
    if (event && event.pointerId !== undefined && kotak.setPointerCapture) {
      try { kotak.setPointerCapture(event.pointerId); } catch (err) { /* tidak semua browser mendukung */ }
    }
    var idSeek = ++nomorSeek;
    tungguSeek(mulaiKlip(), idSeek).then(function () {
      if (ditahan) {
        var hasil = video.play();
        if (hasil && typeof hasil.catch === 'function') {
          hasil.catch(function () {
            ditahan = false;
            kotak.classList.remove('play');
            video.pause();
            aturStatus('Browser menolak memutar preview. Coba tekan dan tahan lagi.', true);
          });
        }
      }
    }).catch(function (err) {
      ditahan = false;
      kotak.classList.remove('play');
      aturStatus(err.message, true);
    });
  }

  function berhentiPutar() {
    if (!ditahan) return;
    ditahan = false;
    kotak.classList.remove('play');
    video.pause();
    tampilkanSampul();
  }

  kotak.addEventListener('pointerdown', function (event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    mulaiPutar(event);
  });
  kotak.addEventListener('pointerup', berhentiPutar);
  kotak.addEventListener('pointercancel', berhentiPutar);
  kotak.addEventListener('lostpointercapture', berhentiPutar);
  kotak.addEventListener('contextmenu', function (event) { event.preventDefault(); });

  video.addEventListener('timeupdate', function () {
    if (!ditahan || sibuk) return;
    if (video.currentTime >= mulaiKlip() + panjangKlip() - 0.04) {
      video.pause();
      var idSeek = ++nomorSeek;
      tungguSeek(mulaiKlip(), idSeek).then(function () {
        if (ditahan) video.play().catch(berhentiPutar);
      }).catch(berhentiPutar);
    }
  });

  function unduhFile(nama, blob) {
    if (!blob || !blob.size) {
      aturStatus('File hasil kosong. Proses tidak berhasil.', true);
      return;
    }
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = nama;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
    aturStatus('File siap disimpan: ' + nama);
  }

  function mimeDidukung(daftarTipe) {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return null;
    for (var i = 0; i < daftarTipe.length; i++) {
      try {
        if (MediaRecorder.isTypeSupported(daftarTipe[i])) return daftarTipe[i];
      } catch (err) { /* lanjut ke format berikutnya */ }
    }
    return null;
  }

  async function rekam(daftarTipe) {
    if (sibuk || !durasiVideo) {
      throw new Error('Editor sedang sibuk atau video belum siap.');
    }
    var mime = mimeDidukung(daftarTipe);
    var capture = video.captureStream || video.mozCaptureStream;
    if (!mime || !capture) {
      throw new Error('Browser tidak mendukung format rekaman yang dibutuhkan. Coba Chrome atau browser terbaru.');
    }

    sibuk = true;
    ditahan = false;
    kotak.classList.remove('play');
    aturKontrol(true);
    ambil('pgw').classList.remove('hide');
    ambil('pg').style.width = '0%';
    video.pause();

    var stream = null;
    var recorder = null;
    var potongan = [];
    var awal = mulaiKlip();
    var lama = panjangKlip();
    var akhir = Math.min(durasiVideo, awal + lama);
    var timeoutId = null;

    function bersihkan() {
      clearInterval(timerRekam);
      timerRekam = null;
      video.pause();
      video.muted = true;
      if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
      ambil('pgw').classList.add('hide');
      ambil('pg').style.width = '0%';
      sibuk = false;
      aturKontrol(false);
      tampilkanSampul();
    }

    try {
      var idSeek = ++nomorSeek;
      await tungguSeek(awal, idSeek);
      stream = capture.call(video);
      if (!ambil('aud').checked && stream.getAudioTracks) {
        stream.getAudioTracks().forEach(function (track) { track.stop(); });
      }
      video.muted = !ambil('aud').checked;
      recorder = new MediaRecorder(stream, { mimeType: mime });

      var hasilRekam = new Promise(function (resolveHasil, rejectHasil) {
        recorder.ondataavailable = function (event) {
          if (event.data && event.data.size) potongan.push(event.data);
        };
        recorder.onerror = function (event) {
          rejectHasil(event.error || new Error('Perekaman gagal.'));
        };
        recorder.onstop = function () {
          var blob = new Blob(potongan, { type: recorder.mimeType || mime.split(';')[0] });
          resolveHasil(blob);
        };
      });
      // Pasang handler sejak awal agar error recorder tidak menjadi rejection liar saat play() masih menunggu.
      hasilRekam.catch(function () {});

      recorder.start(150);
      var janjiPutar = video.play();
      if (janjiPutar && typeof janjiPutar.then === 'function') await janjiPutar;

      timerRekam = setInterval(function () {
        var persen = Math.max(0, Math.min(100, ((video.currentTime - awal) / lama) * 100));
        ambil('pg').style.width = persen + '%';
        if (video.currentTime >= akhir - 0.04 || video.ended) {
          if (recorder && recorder.state !== 'inactive') recorder.stop();
        }
      }, 40);

      var blobHasil = await Promise.race([
        hasilRekam,
        new Promise(function (_, rejectTimeout) {
          timeoutId = setTimeout(function () {
            if (recorder && recorder.state !== 'inactive') recorder.stop();
            rejectTimeout(new Error('Perekaman melewati batas waktu.'));
          }, (lama * 3000) + 12000);
        })
      ]);
      if (!blobHasil.size) throw new Error('Browser menghasilkan file kosong.');
      return { blob: blobHasil, mime: blobHasil.type || mime, mimePilihan: mime };
    } finally {
      clearTimeout(timeoutId);
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch (err) { /* abaikan saat proses sudah berakhir */ }
      }
      bersihkan();
    }
  }

  function buatMotionPhoto(jpg, mp4, timestampUs) {
    if (!jpg || jpg.length < 4 || jpg[0] !== 0xFF || jpg[1] !== 0xD8) {
      throw new Error('Sampul JPEG tidak valid.');
    }
    if (!mp4 || !mp4.size) throw new Error('Video MP4 tidak valid.');
    var xmp = '<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>' +
      '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
      '<rdf:Description rdf:about="" xmlns:GCamera="http://ns.google.com/photos/1.0/camera/" ' +
      'xmlns:Container="http://ns.google.com/photos/1.0/container/" ' +
      'xmlns:Item="http://ns.google.com/photos/1.0/container/item/" ' +
      'GCamera:MotionPhoto="1" GCamera:MotionPhotoVersion="1" ' +
      'GCamera:MotionPhotoPresentationTimestampUs="' + timestampUs + '" ' +
      'GCamera:MicroVideo="1" GCamera:MicroVideoVersion="1" ' +
      'GCamera:MicroVideoOffset="' + mp4.size + '" ' +
      'GCamera:MicroVideoPresentationTimestampUs="' + timestampUs + '">' +
      '<Container:Directory><rdf:Seq>' +
      '<rdf:li rdf:parseType="Resource"><Container:Item Item:Mime="image/jpeg" Item:Semantic="Primary" Item:Length="0" Item:Padding="0"/></rdf:li>' +
      '<rdf:li rdf:parseType="Resource"><Container:Item Item:Mime="video/mp4" Item:Semantic="MotionPhoto" Item:Length="' + mp4.size + '" Item:Padding="0"/></rdf:li>' +
      '</rdf:Seq></Container:Directory></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';

    var payload = new TextEncoder().encode('http://ns.adobe.com/xap/1.0/\0' + xmp);
    var panjangSegmen = payload.length + 2;
    if (panjangSegmen > 65535) throw new Error('Metadata gambar terlalu besar.');

    var segmen = new Uint8Array(payload.length + 4);
    segmen[0] = 0xFF;
    segmen[1] = 0xE1;
    segmen[2] = (panjangSegmen >> 8) & 255;
    segmen[3] = panjangSegmen & 255;
    segmen.set(payload, 4);

    // XMP APP1 disisipkan tepat setelah penanda awal JPEG (SOI).
    return new Blob([jpg.subarray(0, 2), segmen, jpg.subarray(2), mp4], { type: 'image/jpeg' });
  }

  function kanvasKeJpeg() {
    return new Promise(function (resolve, reject) {
      if (!video.videoWidth || !kanvas.width || !kanvas.height) {
        reject(new Error('Frame sampul belum siap.'));
        return;
      }
      kanvas.toBlob(function (blob) {
        if (!blob) reject(new Error('Browser gagal membuat gambar JPEG.'));
        else resolve(blob);
      }, 'image/jpeg', 0.94);
    });
  }

  ambil('bc').addEventListener('click', async function () {
    if (sibuk || !durasiVideo) return;
    try {
      aturStatus('Menyiapkan sampul...');
      if (!await tampilkanSampul()) throw new Error('Frame sampul belum berhasil dimuat.');
      var blob = await kanvasKeJpeg();
      unduhFile('motionpic-sampul.jpg', blob);
    } catch (err) {
      aturStatus(err.message, true);
    }
  });

  ambil('bv').addEventListener('click', async function () {
    if (sibuk || !durasiVideo) return;
    try {
      aturStatus('Merekam klip...');
      var hasil = await rekam([
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ]);
      var ekstensi = hasil.mime.indexOf('mp4') !== -1 ? 'mp4' : 'webm';
      unduhFile('motionpic-klip.' + ekstensi, hasil.blob);
    } catch (err) {
      aturStatus(err.message, true);
    }
  });

  ambil('bm').addEventListener('click', async function () {
    if (sibuk || !durasiVideo) return;
    var mimeMp4 = mimeDidukung([
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4'
    ]);
    if (!mimeMp4) {
      aturStatus('Browser ini tidak mendukung ekspor MP4. Motion Photo Android membutuhkan video MP4. Coba Chrome versi terbaru atau simpan klip WebM.', true);
      return;
    }

    try {
      aturStatus('Menyiapkan sampul JPEG...');
      if (!await tampilkanSampul()) throw new Error('Frame sampul belum berhasil dimuat.');
      var blobJpg = await kanvasKeJpeg();
      var bufferJpg = await blobJpg.arrayBuffer();
      aturStatus('Merekam video MP4...');
      var hasil = await rekam([mimeMp4]);
      if (hasil.mime.indexOf('mp4') === -1) {
        throw new Error('Browser tidak menghasilkan MP4. Motion Photo tidak dibuat.');
      }
      var waktuFrameAktual = Math.min(waktuSampul(), Math.max(0, durasiVideo - 0.04));
      var offsetSampul = Math.max(0, waktuFrameAktual - mulaiKlip());
      var motionPhoto = buatMotionPhoto(new Uint8Array(bufferJpg), hasil.blob, Math.round(offsetSampul * 1000000));
      unduhFile('motionpic-live-photo.jpg', motionPhoto);
    } catch (err) {
      aturStatus(err.message, true);
    }
  });

  // auth.js memanggil fungsi ini saat admin mengubah batas durasi.
  window.terapkanMaks = terapkanMaks;
  terapkanMaks();

  window.addEventListener('beforeunload', function () {
    if (urlVideo) URL.revokeObjectURL(urlVideo);
  });
})();
