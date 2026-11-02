# 01 — Product Planning: File Converter Desktop

> **Status:** Product planning  
> **Dokumen:** `docs/01-product-brief.md`  
> **Platform awal:** Windows 10/11 (64-bit)  
> **Pendekatan:** Desktop, local processing, offline-first  
> **Target pengembangan:** Solo developer dengan bantuan AI coding assistant (vibe coding)

---

## 1. Analisis Ide Aplikasi

### 1.1 Konsep Produk

Membangun aplikasi desktop untuk mengonversi dan mengelola berbagai format file dalam satu tempat. Pengguna dapat melakukan konversi dokumen, menggabungkan atau memisahkan PDF, serta mengelola file melalui antarmuka yang sederhana.

Aplikasi memproses file secara lokal di komputer pengguna menggunakan Rust sebagai processing engine dan Tauri sebagai desktop framework. Fitur inti ditargetkan dapat digunakan tanpa mengunggah file ke layanan cloud.

### 1.2 Konsep Utama

- **Local file processing:** file diproses di perangkat pengguna.
- **Offline-first:** fitur yang didukung dapat digunakan tanpa koneksi internet.
- **Multi-format conversion:** mendukung beberapa format dokumen, spreadsheet, dan gambar.
- **Simple interface:** alur penggunaan mudah dipahami.
- **Privacy-focused:** tidak memerlukan akun atau upload cloud untuk fitur inti.
- **Modular:** setiap converter dikembangkan sebagai modul terpisah.

### 1.3 Jenis File yang Direncanakan

| Kategori | Format |
|---|---|
| Document | PDF, DOCX |
| Spreadsheet | XLSX, CSV |
| Image | JPG, PNG, WEBP |
| Archive | ZIP |

Tidak semua format harus tersedia pada versi pertama. Format dan arah konversi akan ditetapkan berdasarkan kelayakan teknis dan prioritas MVP.

---

## 2. Identifikasi Masalah Pengguna

| Masalah | Solusi yang Ditawarkan |
|---|---|
| Pengguna harus membuka beberapa website untuk kebutuhan konversi berbeda | Menyediakan berbagai tools dalam satu aplikasi |
| Beberapa layanan online membatasi ukuran atau jumlah file | Pemrosesan lokal mengurangi ketergantungan pada batas upload server |
| Pengguna tidak ingin mengunggah dokumen pribadi ke layanan online | File diproses secara lokal untuk fitur yang mendukung |
| Proses konversi online memiliki banyak langkah | Menyediakan alur sederhana dengan file picker dan drag-and-drop |
| Pengguna perlu mengelola beberapa dokumen sekaligus | Menambahkan dukungan pemrosesan beberapa file secara bertahap |
| Pengguna membutuhkan konversi saat tidak memiliki internet | Menyediakan fitur inti yang dapat berjalan offline |

---

## 3. Target Pengguna

Target utama adalah individu yang sering bekerja dengan berbagai format dokumen dan membutuhkan alat konversi praktis.

| Target Pengguna | Kebutuhan |
|---|---|
| Pelajar dan mahasiswa | Mengonversi tugas, laporan, dan materi |
| Pekerja kantoran | Mengelola dokumen dan spreadsheet |
| Freelancer | Mengolah dokumen dari berbagai klien |
| Staf administrasi | Menggabungkan, memisahkan, dan mengonversi PDF |
| Pengguna umum | Melakukan konversi file sehari-hari |

### Target Utama MVP

Pelajar, mahasiswa, pekerja kantoran, dan pengguna umum yang membutuhkan konversi dokumen secara praktis tanpa harus menggunakan website.

---

## 4. Analisis Kompetitor

Produk berikut digunakan sebagai referensi fitur, pengalaman pengguna, dan positioning. Analisis ini merupakan gambaran awal, bukan audit fitur atau riset pasar mendalam.

### 4.1 iLovePDF

- **Jenis produk:** platform pengelolaan dan konversi PDF.
- **Kekuatan:** banyak fitur PDF dan alur penggunaan yang mudah dipahami.
- **Referensi:** https://www.ilovepdf.com/

### 4.2 Smallpdf

- **Jenis produk:** platform konversi dan pengelolaan PDF online.
- **Kekuatan:** antarmuka modern dan alur konversi sederhana.
- **Referensi:** https://smallpdf.com/

### 4.3 PDF24 Creator

- **Jenis produk:** aplikasi desktop Windows untuk pengolahan PDF.
- **Kekuatan:** menyediakan berbagai tools PDF dan pemrosesan lokal.
- **Referensi:** https://www.pdf24.org/

### 4.4 LibreOffice

- **Jenis produk:** office suite desktop.
- **Kekuatan:** open-source, mendukung berbagai format dokumen, dan dapat digunakan untuk ekspor dokumen.
- **Referensi:** https://www.libreoffice.org/

### 4.5 Peluang Diferensiasi

Aplikasi tidak perlu menyaingi jumlah fitur kompetitor sejak awal. Fokus awal adalah:

1. Pengalaman desktop yang sederhana dan konsisten.
2. Pemrosesan lokal untuk fitur yang didukung.
3. Fitur inti dapat digunakan tanpa koneksi internet.
4. Berbagai tools file tersedia dalam satu aplikasi.
5. Alur kerja singkat dengan drag-and-drop.
6. Tidak bergantung pada proses upload dan download website.

**Catatan:** pemrosesan lokal bukan keunggulan yang sepenuhnya unik karena PDF24 Creator dan LibreOffice juga menawarkan kemampuan desktop. Diferensiasi perlu dibangun melalui kemudahan penggunaan, cakupan tools, dan kualitas hasil konversi.

---

## 5. Value Proposition

### Product Statement

> Satu aplikasi desktop untuk mengonversi dan mengelola berbagai format file dengan proses lokal, praktis, dan mudah digunakan.

### Core Value

- **Privacy:** file tetap berada di perangkat pengguna selama diproses secara lokal.
- **Convenience:** berbagai tools tersedia dalam satu aplikasi.
- **Simplicity:** alur konversi mudah dipahami.
- **Accessibility:** fitur yang mendukung dapat digunakan tanpa internet.
- **Performance:** proses konversi dijalankan secara lokal dengan penggunaan resource yang wajar.

---

## 6. Penentuan Fitur MVP

MVP difokuskan pada fitur umum yang realistis untuk dikembangkan dan dapat diuji secara menyeluruh.

### 6.1 Fitur MVP

| Fitur | Deskripsi | Prioritas |
|---|---|---|
| Word to PDF | Mengonversi DOCX menjadi PDF | P0 |
| Image to PDF | Mengubah JPG/PNG menjadi PDF | P0 |
| Merge PDF | Menggabungkan beberapa file PDF | P0 |
| Split PDF | Memisahkan halaman PDF | P0 |
| PDF to Image | Mengubah halaman PDF menjadi gambar | P1 |
| PDF to Word | Mengonversi PDF menjadi DOCX | P1 |
| File Management | Memilih file dan menentukan lokasi output | P0 |
| Conversion Progress | Menampilkan status dan progres proses | P0 |
| Error Handling | Menampilkan pesan kesalahan yang jelas | P0 |

**Prioritas:**
- **P0:** wajib tersedia untuk MVP.
- **P1:** ditambahkan setelah fitur inti P0 stabil, jika kelayakan teknis dan waktu memungkinkan.

### 6.2 Future Features

| Fitur | Deskripsi |
|---|---|
| Excel to PDF | Mengonversi spreadsheet menjadi PDF |
| PDF to Excel | Mengekstrak tabel PDF ke spreadsheet |
| Compress PDF | Mengurangi ukuran file PDF |
| Batch Conversion | Mengonversi beberapa file sekaligus |
| OCR | Mengekstrak teks dari dokumen hasil scan |
| ZIP Tools | Membuat dan mengekstrak file ZIP |
| Conversion History | Menampilkan riwayat konversi |
| Advanced Settings | Pengaturan kualitas dan output |

### 6.3 Fitur di Luar Fokus Awal

Untuk menjaga MVP tetap sederhana, fitur berikut tidak diprioritaskan:

- AI-powered conversion.
- Cloud storage.
- User authentication.
- Online account.
- Subscription dan payment.
- Team collaboration.
- Cloud processing.

---

## 7. Model Penggunaan Produk

### Alur Utama

1. Pengguna membuka aplikasi.
2. Pengguna memilih conversion tool.
3. Pengguna memilih atau melakukan drag-and-drop file.
4. Aplikasi memvalidasi file dan menampilkan pengaturan yang tersedia.
5. Pengguna memulai proses konversi.
6. Aplikasi menjalankan proses melalui conversion engine.
7. Aplikasi menampilkan status dan hasil proses.
8. Pengguna memilih lokasi penyimpanan atau membuka file hasil.

### Prinsip UX

- Pengguna selalu mengetahui file yang sedang diproses.
- Format input dan output ditampilkan dengan jelas.
- Progres atau status proses ditampilkan selama pekerjaan berlangsung.
- Kesalahan dijelaskan dengan pesan yang dapat dipahami.
- File asli tidak diubah atau ditimpa tanpa persetujuan pengguna.
- Pengguna dapat menentukan lokasi penyimpanan hasil.

---

## 8. Batasan dan Asumsi Produk

| Aspek | Keputusan Awal |
|---|---|
| Platform awal | Windows 10/11 64-bit |
| Jenis aplikasi | Desktop application |
| Processing | Local processing |
| Koneksi internet | Tidak diperlukan untuk fitur inti yang didukung |
| Backend server | Tidak diperlukan untuk MVP |
| Database | Belum diperlukan untuk MVP |
| Akun pengguna | Tidak diperlukan |
| Distribusi | Installer Windows |
| Bahasa UI | Inggris sebagai default |
| Model pengembangan | Solo developer dengan AI coding assistant |

### Catatan Kelayakan Teknis

- **Word to PDF:** kemungkinan membutuhkan LibreOffice atau document conversion engine eksternal.
- **PDF to Word:** membutuhkan rekonstruksi teks, gambar, tabel, dan layout. Kualitas hasil dapat berbeda berdasarkan struktur PDF.
- **OCR:** dokumen hasil scan membutuhkan engine OCR dan dukungan bahasa yang sesuai.
- **Offline-first:** dependency eksternal yang diperlukan harus disertakan atau disediakan melalui installer.
- **Local processing:** perlu dipastikan bahwa setiap fitur benar-benar berjalan lokal dan tidak mengirim file ke layanan eksternal.

Sebelum menetapkan PDF to Word sebagai komitmen MVP, lakukan prototype teknis dengan beberapa contoh PDF nyata untuk menguji kualitas hasil dan kelayakan engine.

---

## 9. Tujuan dan Indikator Keberhasilan

Keberhasilan MVP dinilai dari fungsi dan kualitas aplikasi, bukan jumlah pengguna terlebih dahulu.

1. Seluruh fitur P0 dapat digunakan.
2. Konversi berhasil pada berbagai contoh file yang didukung.
3. File hasil dapat dibuka menggunakan aplikasi yang sesuai.
4. Fitur inti dapat berjalan tanpa koneksi internet.
5. File asli tidak berubah selama proses.
6. Kesalahan ditampilkan secara informatif.
7. Aplikasi dapat diinstal dan dijalankan tanpa development environment.
8. Penggunaan CPU dan RAM tetap wajar untuk ukuran file yang ditargetkan.

### Kriteria Validasi Awal

Untuk setiap converter, siapkan contoh file valid, file dengan struktur kompleks, file rusak, dan file berukuran relatif besar. Periksa apakah output terbentuk, dapat dibuka, dan memiliki isi yang sesuai dengan input.

---

## 10. Kesimpulan Product Planning

### Product Vision

Menyediakan aplikasi desktop all-in-one untuk mengonversi dan mengelola berbagai format file secara lokal dengan pengalaman penggunaan yang sederhana, praktis, dan mengutamakan privasi.

### MVP Focus

- Word to PDF.
- Image to PDF.
- Merge PDF.
- Split PDF.
- File management.
- Conversion progress dan error handling.

PDF to Image dan PDF to Word menjadi prioritas lanjutan setelah kelayakan teknisnya divalidasi.

### Technology Direction

| Layer | Teknologi |
|---|---|
| Desktop framework | Tauri 2 |
| Backend | Rust |
| Frontend | React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| State management | Zustand |

Pemilihan library conversion engine akan ditentukan dan divalidasi pada tahap Technical Planning.

### Target Platform

Windows 10/11 64-bit untuk rilis awal.

---

## 11. Tahap Berikutnya

**Tahap 2 — Product Requirements Document (PRD)**

Gunakan dokumen Product Brief ini sebagai dasar untuk menyusun PRD yang mencakup:

- Product overview dan goals.
- Functional requirements setiap fitur.
- Detail perilaku setiap converter.
- User flow setiap halaman.
- UI/UX requirements.
- Non-functional requirements.
- MVP scope dan acceptance criteria.
- Error states dan edge cases.

PRD menjadi acuan utama selama frontend development, backend development, integration, testing, dan deployment.

---

## Catatan untuk AI Coding Assistant

Saat menggunakan dokumen ini sebagai konteks:

1. Perlakukan dokumen ini sebagai hasil Product Planning dan sumber konteks produk.
2. Jangan menambahkan fitur di luar ruang lingkup tanpa persetujuan.
3. Jangan menganggap semua fitur pasti dapat dibuat hanya dengan library Rust; validasi kebutuhan engine eksternal.
4. Jangan mulai implementasi kode pada tahap Planning.
5. Pada tahap PRD, uraikan kebutuhan dan acceptance criteria secara jelas tanpa mengulang seluruh isi Product Brief.
6. Jika ada keputusan yang belum pasti, tandai sebagai asumsi atau hal yang perlu divalidasi, bukan mengarang keputusan.
