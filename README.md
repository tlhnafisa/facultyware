# FTI Document Control

FTI Document Control adalah sistem informasi berbasis web yang dikembangkan untuk mendukung pengelolaan dokumen secara terpusat di lingkungan Fakultas Teknologi Informasi. Sistem ini memungkinkan administrator untuk melakukan pengelolaan kategori dokumen, pengelolaan data dokumen, pengendalian versi dokumen, publikasi dokumen, serta pembuatan laporan.

Pengguna dapat mengakses dokumen yang telah dipublikasikan melalui fitur pencarian, penyaringan berdasarkan kategori, dan pengunduhan dokumen. Sistem juga menyediakan layanan RESTful API yang memungkinkan pertukaran data dalam format JSON guna mendukung integrasi dengan aplikasi lain.

Dengan penerapan sistem ini, diharapkan proses penyimpanan, pengelolaan, dan distribusi dokumen dapat dilakukan secara lebih efektif, efisien, dan terdokumentasi dengan baik.

---

## Fitur Utama

- **Autentikasi & Otorisasi**: Login aman untuk pengguna dengan pembatasan hak akses berbasis Role (RBAC: Admin, Staff, Student, dll.).
- **Manajemen Kategori (Admin)**: CRUD (Create, Read, Update, Delete) kategori dokumen.
- **Manajemen Dokumen (Admin)**: 
  - Tambah, lihat detail, edit, dan hapus dokumen.
  - Fitur ubah dokumen dengan **Auto-Increment Versi** (v1, v2, v3, dst.) secara otomatis.
- **Akses Dokumen (User)**: Cari, filter, detail, dan unduh dokumen.
- **Ekspor Dokumen**: Ekspor daftar dokumen ke format Excel dan PDF, dilengkapi dengan statistik dokumen.
- **RESTful API**: API endpoint untuk manajemen kategori dan dokumen admin.
- **E2E Testing**: Pengujian otomatis menyeluruh untuk seluruh alur fitur menggunakan Playwright.

---

## Spesifikasi Teknologi

- **Backend** : ExpressJS (Node.js)
- **Database** : MySQL
- **Frontend UI** : Basecoat UI (untuk layout dan styling)
- **Version Control** : Git (repository di GitHub)
- **Interactivity & Testing** : HTMX (untuk dynamic updates & navigasi cepat) & Playwright (untuk End-to-End Testing)

---

## Instalasi dan Cara Menjalankan

### 1. Prasyarat
Pastikan Anda sudah menginstal:
- [Node.js](https://nodejs.org/) (versi 16 atau lebih baru)
- [MySQL Database Server](https://www.mysql.com/)

### 2. Kloning Repositori
```bash
git clone https://github.com/tlhnafisa/facultyware.git
cd facultyware
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Konfigurasi Database & Environment
Buat file `.env` di direktori utama (root) proyek dan sesuaikan konfigurasi database Anda:
```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=password_mysql_kamu
DB_NAME=facultyware
SESSION_SECRET=rahasia_super_aman_123
PORT=3000
```
*Pastikan database dengan nama `facultyware` sudah dibuat di MySQL Anda.*

### 5. Inisialisasi Database (Opsional)
Jalankan script untuk menginisialisasi tabel default:
```bash
node scripts/init_db.js
```

### 6. Menjalankan Aplikasi
- **Mode Development (dengan Nodemon)**:
  ```bash
  npm run dev
  ```
- **Mode Production**:
  ```bash
  npm start
  ```
Aplikasi akan berjalan di `http://localhost:3000`.

### 7. Menjalankan Pengujian (Playwright)
Untuk menjalankan semua tes E2E secara otomatis:
```bash
npx playwright test
```

---

## Pembagian Tugas Anggota

Berikut adalah pembagian tugas dan kontribusi pengerjaan fitur untuk masing-masing anggota tim:

### 1. Zahra Aulia Nasution (@zhraulia)
- **Kategori Dokumen**: Implementasi CRUD Kategori Dokumen (Fitur 1-4) beserta antarmuka admin.
- **RESTful API**: Membuat endpoint API kategori & dokumen admin (Fitur 22, 23) serta pengujian API spec.
- **Struktur Core & Integrasi**:
  - Konfigurasi router utama dan middleware pada `app.js`.
  - Penanganan error aplikasi via `middlewares/error.js`.
  - Pembuatan controller profil pengguna (`controllers/usersController.js`).

### 2. Talitha Nafisa Khairul (@tlhnafisa)
- **Manajemen Dokumen (Admin)**: Fitur tambah dokumen, daftar dokumen, dan detail dokumen admin (Fitur 5-7).
- **Ekspor & Laporan**: Implementasi ekspor daftar dokumen ke format Excel, PDF, dan halaman Statistik Dokumen (Fitur 19-21) beserta pengujian ekspor spec.
- **Styling Antarmuka**: Penyelarasan serta penyesuaian file stylesheet utama (`public/assets/styles.css`) berbasis Basecoat CSS.

### 3. Nasywa Hasanah Herida (@tyrsx)
- **Edit & Versi Dokumen (Admin)**: Fitur edit dokumen, hapus dokumen, pencarian dokumen admin (Fitur 8-10) dengan sistem Auto-Increment Versi dokumen.
- **Akses Dokumen (User)**: Halaman dashboard user, profil user, daftar dokumen, pencarian, penyaringan/filter, dan unduh dokumen untuk pengguna umum (Fitur 14-18).
- **Autentikasi & Dashboard Admin**: Pengelolaan pengguna dan hak akses role (NIM/NIP) (Fitur 11-13) serta penyesuaian login view (menghapus tombol lupa sandi dan daftar).
- **E2E Testing & Konfigurasi**: Pembuatan skenario pengujian Playwright (`tests/auth.spec.js`, `tests/user_akses.spec.js`) dan konfigurasi Playwright.
