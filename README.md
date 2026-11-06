# MotionPic – Buat foto mu menjadi live

MotionPic adalah editor berbasis browser untuk mengambil frame sampul dari video, memilih potongan klip, lalu mengekspornya sebagai gambar sampul, klip video, atau Motion Photo Android.

## Menjalankan

Buka `index.html` di browser modern. Chrome atau browser berbasis Chromium versi terbaru paling disarankan, terutama untuk fitur perekaman video. Pilih video, atur titik mulai dan durasinya, pilih frame sampul, lalu gunakan tombol ekspor.

## Fitur

- Pilih video dari perangkat atau seret file ke area upload.
- Preview klip dengan menekan dan menahan area video.
- Atur titik mulai, durasi klip, dan frame sampul.
- Ekspor frame sampul JPG.
- Rekam dan unduh klip MP4 atau WebM sesuai dukungan browser.
- Susun Motion Photo Android berupa JPEG dengan metadata XMP dan video MP4 di bagian akhir file.
- Tema terang/gelap dan menu mobile.
- Animasi bagian halaman yang tetap menghormati pengaturan reduced motion perangkat.
- Login lokal dan panel admin untuk mengatur durasi maksimum serta mengelola akun admin.

## Catatan kompatibilitas

- Motion Photo Android membutuhkan video MP4. Sebagian browser hanya menyediakan perekaman WebM; pada browser seperti itu, ekspor klip tetap tersedia, tetapi tombol Motion Photo akan menampilkan alasan kenapa file tidak bisa dibuat.
- Browser harus mendukung `MediaRecorder` dan `HTMLMediaElement.captureStream()` untuk merekam klip.
- Live Photo asli iPhone (HEIC + MOV) tidak dapat dibuat secara langsung oleh editor browser ini.
- Hasil Motion Photo Android belum dijamin kompatibel dengan semua aplikasi Galeri atau semua merek perangkat.
- Video yang sangat besar atau codec yang tidak didukung browser bisa gagal dibuka. Coba video MP4 H.264 jika video tidak terbaca.

## Login dan panel admin

- Login tidak wajib untuk menggunakan editor.
- Login tidak wajib; editor bisa digunakan tanpa akun.
- Pendaftaran terbuka. Akun pertama yang dibuat pada browser tersebut otomatis menjadi ADMIN.
- Akun berikutnya menjadi pengguna biasa dan tidak mendapat akses panel admin.
- ADMIN dapat mengatur durasi maksimum klip (1–60 detik), menambah admin, dan menghapus admin lain. Minimal satu admin harus tetap ada.
- Akun OWNER dari versi lama otomatis dimigrasikan menjadi ADMIN.
- Data akun, sesi, serta pengaturan disimpan di `localStorage`/`sessionStorage` browser. Data tidak tersinkron antarperangkat dan sistem ini bukan autentikasi aman untuk layanan publik. Untuk penggunaan sungguhan, gunakan backend dan database.

## Privasi

Video diproses di browser perangkat. Proyek ini tidak mengirim video ke server.
