# File Converter Desktop — PRD & Sequential Development Playbook

> Dokumen utama untuk membangun aplikasi File Converter Desktop menggunakan workflow solo developer + AI coding assistant.
>
> **Cara penggunaan:** kerjakan bagian secara berurutan. Jalankan hanya satu bagian pada satu waktu di VS Code/Vibe Coding. Jangan lanjut sebelum kriteria selesai pada bagian tersebut terpenuhi.

---

# PART A — PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1. Informasi Produk

| Item | Detail |
|---|---|
| Nama sementara | File Converter Desktop |
| Platform target | Windows 10/11 64-bit |
| Tipe aplikasi | Desktop application |
| Framework desktop | Tauri 2 |
| Frontend | React + TypeScript + Vite |
| Backend | Rust |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| State management | Zustand |
| HTTP client | Belum diperlukan untuk MVP |
| Pemrosesan file | Lokal / offline-first |
| Target developer | Solo developer dengan AI coding assistant |

## 2. Product Overview

File Converter Desktop adalah aplikasi desktop untuk mengonversi dan mengelola berbagai format file secara lokal. Pengguna dapat memilih tool, memasukkan file, menjalankan konversi, lalu menyimpan atau membuka hasilnya tanpa mengunggah file ke layanan online.

Aplikasi mengutamakan alur penggunaan yang sederhana, privasi file, hasil konversi yang dapat diandalkan, dan arsitektur modular agar format baru dapat ditambahkan secara bertahap.

## 3. Product Goals

1. Menyediakan beberapa tool konversi file dalam satu aplikasi desktop.
2. Memproses file secara lokal tanpa akun atau server aplikasi.
3. Membuat alur pemilihan file hingga penyimpanan hasil mudah dipahami.
4. Menampilkan progres dan kesalahan secara jelas.
5. Memisahkan UI, state, command Tauri, dan conversion engine agar mudah dirawat.
6. Memastikan fitur MVP dapat berjalan tanpa koneksi internet setelah aplikasi dan dependency terpasang.

## 4. Target Users

| Pengguna | Kebutuhan utama |
|---|---|
| Mahasiswa | Mengonversi dokumen dan PDF |
| Pekerja kantoran | Mengolah dokumen pekerjaan |
| Freelancer | Mengelola berbagai format file |
| Admin | Menangani dokumen harian |
| Pengguna umum | Konversi file dengan praktis dan offline |

## 5. MVP Scope

### 5.1 Prioritas fitur

| Prioritas | Fitur | Keterangan |
|---|---|---|
| P0 | Word to PDF | Mengonversi DOCX ke PDF |
| P0 | Image to PDF | Menggabungkan satu atau beberapa gambar menjadi PDF |
| P0 | Merge PDF | Menggabungkan beberapa file PDF |
| P0 | Split PDF | Memisahkan halaman atau rentang halaman PDF |
| P0 | File selection | File picker, drag-and-drop, validasi input |
| P0 | Output management | Memilih lokasi dan nama file output |
| P0 | Conversion status | Ready, Processing, Completed, Failed |
| P0 | Error handling | Pesan kesalahan yang mudah dipahami |
| P1 | PDF to Image | Mengubah halaman PDF menjadi gambar |
| P1 | PDF to Word | Konversi PDF ke DOCX; kualitas layout perlu divalidasi |

### 5.2 Di luar MVP

- OCR dan fitur AI.
- Cloud storage atau cloud processing.
- Login, autentikasi, dan akun pengguna.
- Subscription, pembayaran, dan monetisasi.
- Sinkronisasi atau kolaborasi.
- Batch conversion lanjutan.
- Conversion history permanen.
- ZIP tools dan fitur kompresi lanjutan.
- Integrasi layanan eksternal yang tidak diperlukan untuk fitur inti.

### 5.3 Aturan scope

- Selesaikan seluruh fitur P0 sebelum menambah fitur P1.
- Jangan menambahkan fitur baru tanpa memperbarui PRD.
- Jangan memasang dependency yang belum dibutuhkan.
- Jangan membuat sistem plugin, queue kompleks, atau arsitektur berlebihan untuk MVP.
- Bila sebuah format membutuhkan engine eksternal, dokumentasikan kebutuhan instalasi, lisensi, ukuran distribusi, dan perilaku offline-nya.

## 6. Functional Requirements

### FR-01 — Dashboard dan pemilihan tool

Pengguna dapat melihat tool yang tersedia dan membuka workspace tool yang dipilih.

**Acceptance criteria:**
- Setiap tool memiliki nama dan deskripsi singkat.
- Tool yang belum tersedia tidak ditampilkan sebagai fitur aktif.
- Pengguna dapat kembali ke Dashboard tanpa kehilangan aplikasi.

### FR-02 — Pemilihan file

Pengguna dapat memilih file melalui file picker dan, jika diimplementasikan, drag-and-drop.

**Acceptance criteria:**
- Aplikasi memvalidasi ekstensi dan tipe file yang didukung.
- File yang tidak sesuai ditolak dengan pesan yang jelas.
- Pengguna dapat menghapus file dari daftar sebelum memulai.
- File asli tidak diubah atau dihapus oleh proses konversi.
- Tool yang memerlukan beberapa file dapat menerima lebih dari satu input.

### FR-03 — Pengaturan konversi

Setiap tool menampilkan pengaturan yang relevan saja.

Contoh:
- Merge PDF: urutan file.
- Split PDF: rentang atau halaman yang akan dipisahkan.
- Image to PDF: urutan gambar dan pengaturan dasar halaman jika diperlukan.
- Word to PDF: input DOCX dan lokasi output.

**Acceptance criteria:**
- Pengaturan tidak relevan tidak ditampilkan.
- Nilai input divalidasi sebelum proses dimulai.
- Pengaturan memiliki nilai default yang masuk akal.

### FR-04 — Proses konversi

Proses file dilakukan melalui backend Rust/Tauri command atau service yang sesuai.

Status minimal:
- Ready
- Processing
- Completed
- Failed

**Acceptance criteria:**
- UI tidak membeku selama proses yang berjalan.
- Status proses diperbarui ke UI.
- Hasil sukses menampilkan lokasi atau aksi membuka file.
- Kegagalan tidak menyebabkan aplikasi crash.
- Pengguna dapat mencoba kembali setelah memperbaiki input.
- Detail teknis dapat dicatat untuk debugging tanpa membocorkan path atau informasi sensitif secara tidak perlu.

### FR-05 — Output management

Pengguna dapat memilih lokasi output dan mengakses hasil.

**Acceptance criteria:**
- Output disimpan pada lokasi yang dipilih.
- Nama file output memiliki ekstensi yang sesuai.
- Jika file dengan nama sama sudah ada, aplikasi tidak menimpa secara diam-diam.
- Pengguna dapat membuka file atau folder output.

### FR-06 — Offline dan privasi

**Acceptance criteria:**
- Fitur inti tidak memerlukan koneksi internet.
- File pengguna tidak diunggah ke server aplikasi.
- Dependency runtime yang dibutuhkan tersedia atau instruksi instalasinya jelas.
- Aplikasi tidak mengirim telemetry tanpa persetujuan eksplisit.

## 7. Non-Functional Requirements

| Aspek | Requirement |
|---|---|
| Reliability | Kesalahan input/proses tidak menyebabkan crash |
| Performance | UI tetap responsif saat konversi berjalan |
| Privacy | Pemrosesan lokal; tidak mengunggah file |
| Usability | Alur konversi singkat dan jelas |
| Maintainability | Modul UI, state, command, dan engine terpisah secara wajar |
| Compatibility | Windows 10/11 64-bit |
| Accessibility | Label, fokus keyboard, dan kontras UI memadai |
| Packaging | Dapat dibangun menjadi installer Windows |
| Resource usage | Tidak menggunakan resource berlebihan untuk file yang wajar |

## 8. Application Structure dan Navigation

Halaman utama MVP:

1. **Dashboard** — ringkasan dan shortcut tool utama.
2. **All Tools** — daftar tool yang tersedia.
3. **Tool Workspace** — area pemilihan file, pengaturan, proses, dan hasil.
4. **Settings** — preferensi dasar, misalnya tema dan lokasi output bila diperlukan.

Gunakan satu pola Tool Workspace yang reusable. Tidak perlu membuat halaman terpisah dengan implementasi berbeda untuk setiap jenis konversi jika pola interaksinya sama.

## 9. User Flow

1. Pengguna membuka aplikasi.
2. Pengguna memilih tool.
3. Pengguna memilih atau menarik file ke area input.
4. Aplikasi memvalidasi file.
5. Pengguna mengatur opsi yang tersedia.
6. Pengguna menentukan lokasi output.
7. Pengguna memulai konversi.
8. Aplikasi menampilkan status proses.
9. Aplikasi menampilkan hasil atau pesan kesalahan.
10. Pengguna membuka hasil, membuka folder, atau mencoba kembali.

## 10. UI/UX Requirements

Prinsip desain:
- Minimalis, modern, dan konsisten.
- Navigasi desktop sederhana.
- Fokus pada satu tugas konversi dalam satu waktu.
- Status proses mudah dikenali.
- Layout tetap nyaman pada ukuran jendela desktop yang umum.
- Gunakan shadcn/ui sebagai dasar; buat komponen khusus hanya jika diperlukan.

Komponen yang mungkin diperlukan:
- App sidebar/navigation.
- Tool card.
- File dropzone.
- File list/item.
- Conversion settings.
- Progress/status indicator.
- Result panel.
- Toast/notification.
- Confirmation dialog.

## 11. Error Handling

| Kondisi | Respons aplikasi |
|---|---|
| Format tidak didukung | Tampilkan format yang diterima |
| File tidak ditemukan | Minta pengguna memilih ulang |
| File rusak/tidak terbaca | Beri tahu file tidak dapat diproses |
| Output tidak dapat ditulis | Tampilkan masalah akses/lokasi |
| Nama output sudah ada | Minta pilihan nama lain atau konfirmasi |
| Dependency engine tidak tersedia | Tampilkan instruksi yang jelas |
| Rentang halaman tidak valid | Tampilkan validasi sebelum proses |
| Konversi gagal | Tampilkan pesan ringkas dan opsi mencoba kembali |

Jangan menampilkan raw error Rust secara langsung sebagai pesan utama. Petakan error internal ke pesan pengguna yang jelas, sambil mempertahankan detail teknis untuk debugging.

## 12. Technical Constraints

- Tauri 2 sebagai desktop shell.
- React + TypeScript + Vite sebagai frontend.
- Rust sebagai backend lokal.
- Tailwind CSS dan shadcn/ui untuk UI.
- Zustand hanya untuk state UI/client yang memang perlu dibagi.
- Tidak ada server aplikasi, database, atau autentikasi untuk MVP.
- Axios tidak diperlukan selama tidak ada kebutuhan HTTP.
- Conversion engine harus dipilih berdasarkan hasil uji nyata, lisensi, dukungan Windows, distribusi, dan kemampuan offline.
- Jangan menganggap satu crate Rust dapat menangani seluruh format dengan kualitas yang sama.

Kandidat awal untuk dievaluasi pada tahap teknis:
- `lopdf` untuk sebagian operasi PDF.
- PDFium atau engine PDF lain untuk rendering PDF.
- `image` untuk pemrosesan gambar.
- LibreOffice untuk DOCX ke PDF, jika hasil uji dan strategi distribusinya sesuai.
- PDF to DOCX harus melalui proof of concept karena mempertahankan layout merupakan masalah kompleks.

## 13. Success Criteria

MVP dinyatakan siap jika:
- Semua fitur P0 lulus pengujian.
- Output dapat dibuka dan sesuai dengan input yang diuji.
- File asli tidak berubah.
- Fitur inti dapat berjalan offline.
- UI tetap responsif selama proses.
- Kesalahan ditampilkan dengan jelas.
- Installer dapat dipasang pada Windows target tanpa environment development.
- Tidak ada crash pada alur normal dan skenario error yang diuji.

## 14. Risiko dan Catatan Kelayakan

| Risiko | Mitigasi |
|---|---|
| DOCX ke PDF membutuhkan engine eksternal | Buat proof of concept LibreOffice dan evaluasi packaging |
| PDF ke DOCX sulit mempertahankan layout | Jadikan P1 dan validasi kualitas sebelum komitmen |
| PDF library memiliki kemampuan berbeda | Uji tiap operasi dengan file sampel |
| Dependency eksternal memperbesar installer | Ukur ukuran dan evaluasi distribusi |
| Perbedaan izin akses file Windows | Uji file di folder umum dan folder dengan pembatasan |
| File besar memerlukan waktu lama | Proses di backend dan tampilkan status/progress yang akurat |

---

# PART B — SEQUENTIAL DEVELOPMENT PLAYBOOK

## Cara menjalankan dokumen ini

Dokumen ini dirancang agar AI coding assistant mengerjakan project secara bertahap.

1. Simpan dokumen ini di root repository dengan nama `PROJECT_PLAYBOOK.md`.
2. Buka folder project di VS Code.
3. Buka AI coding assistant yang digunakan.
4. Salin prompt pada bagian yang ingin dijalankan, atau minta AI membaca bagian terkait dari file ini.
5. Jalankan hanya satu PART pada satu waktu.
6. Periksa hasil perubahan, jalankan command test, dan review diff.
7. Commit hasil yang sudah diterima sebelum lanjut ke bagian berikutnya.

**Penting:** jangan meminta AI menjalankan semua bagian sekaligus. Setiap bagian memiliki output dan acceptance criteria sendiri.

## Aturan umum untuk AI coding assistant

Gunakan instruksi ini sebagai konteks untuk semua tahap:

```text
Kamu bertindak sebagai senior engineer yang membantu membangun File Converter Desktop.

Konteks:
- Baca PROJECT_PLAYBOOK.md terlebih dahulu.
- Ikuti PRD dan scope MVP di PART A.
- Stack: Tauri 2, Rust, React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand.
- Target: Windows 10/11 64-bit.
- Developer: solo developer.
- Fokus: MVP, clean architecture yang pragmatis, maintainable, reusable.
- Tidak ada server, database, autentikasi, cloud processing, AI, atau monetisasi pada MVP.

Aturan kerja:
1. Kerjakan hanya tahap yang diminta. Jangan melompat ke tahap selanjutnya.
2. Sebelum mengubah kode, periksa struktur dan konfigurasi project yang sudah ada.
3. Jangan menimpa atau menghapus pekerjaan yang sudah ada tanpa alasan dan konfirmasi.
4. Hindari over-engineering, abstraksi berlebihan, dan dependency yang belum diperlukan.
5. Jangan mengarang hasil test. Jalankan command yang relevan dan laporkan hasil sebenarnya.
6. Jika ada keputusan penting yang belum jelas, ajukan satu pertanyaan yang paling penting sebelum melanjutkan.
7. Setelah selesai, laporkan file yang dibuat/diubah, dependency yang ditambahkan, command yang dijalankan, hasil test, dan masalah yang tersisa.
8. Jangan lanjut ke tahap berikutnya tanpa instruksi pengguna.
```

---

# PHASE 0 — Environment Preparation

**Tujuan:** menyiapkan Windows development environment sebelum membuat atau menjalankan project.

Tahap ini sebagian besar dilakukan oleh developer melalui terminal/installer, bukan diserahkan sepenuhnya kepada AI coding assistant.

### 0.1 Install system tools

Buka PowerShell terminal di VS Code atau Windows Terminal.

Periksa `winget`:

```powershell
winget --version
```

Install Node.js LTS:

```powershell
winget install OpenJS.NodeJS.LTS
```

Install Git:

```powershell
winget install --id Git.Git -e
```

Install Rust:

```powershell
winget install --id Rustlang.Rustup -e
```

Atur Rust toolchain:

```powershell
rustup default stable-msvc
```

Install **Visual Studio Build Tools** melalui installer resmi:
- https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Pilih workload **Desktop development with C++**.
- Pastikan MSVC dan Windows SDK dipilih.

Periksa Microsoft Edge WebView2 Runtime:
- https://developer.microsoft.com/microsoft-edge/webview2/
- Windows modern umumnya sudah menyertakannya; pasang bila belum tersedia.

Tutup dan buka kembali VS Code setelah instalasi.

### 0.2 Verify tools

Jalankan:

```powershell
node -v
npm -v
git --version
rustc --version
cargo --version
rustup show
```

**Selesai jika:**
- Semua command dikenali.
- Rust menggunakan toolchain MSVC.
- C++ Build Tools dan Windows SDK sudah terpasang.
- WebView2 Runtime tersedia.

Jika verifikasi gagal, perbaiki environment terlebih dahulu. Jangan lanjut ke Phase 1.

---

# PHASE 1 — Project Bootstrap

**Tujuan:** membuat project dasar Tauri 2 + React + TypeScript + Vite dan memastikan desktop window dapat berjalan.

### 1.1 Create project

Pilih lokasi kerja, misalnya:

```powershell
cd $HOME
mkdir Projects -ErrorAction SilentlyContinue
cd Projects
```

Jalankan generator:

```powershell
npm create tauri-app@latest
```

Gunakan pilihan:
- Project name: `converter-desktop`
- Identifier: `com.fileconverter.desktop`
- Frontend language: TypeScript / JavaScript
- Package manager: npm
- UI template: React
- UI flavor: TypeScript

Kemudian:

```powershell
cd converter-desktop
npm install
npm run tauri dev
```

### 1.2 Prompt AI — Review bootstrap

```text
Jalankan PHASE 1 dari PROJECT_PLAYBOOK.md.

Periksa hasil generator Tauri 2 + React + TypeScript + Vite.
Jangan membangun fitur produk dahulu.

Pastikan:
- struktur project dikenali;
- konfigurasi Tauri dan Vite sesuai;
- command development dapat dijalankan;
- tidak ada dependency atau konfigurasi yang tidak diperlukan.

Jangan mengganti stack atau membuat arsitektur tambahan.
Jika ada masalah, perbaiki hanya masalah yang terkait bootstrap.

Setelah selesai, laporkan hasil verifikasi dan cara menjalankan aplikasi.
```

**Acceptance criteria:**
- `npm install` berhasil.
- `npm run tauri dev` membuka desktop window.
- Frontend React tampil.
- Tidak ada error startup yang belum dijelaskan.

**Git checkpoint:**

```powershell
git init
git add .
git commit -m "chore: bootstrap Tauri React application"
```

---

# PHASE 2 — Frontend Foundation

**Tujuan:** menyiapkan styling, UI components, dan state management dasar.

### 2.1 Install Zustand

```powershell
npm install zustand
```

### 2.2 Setup shadcn/ui

Ikuti panduan resmi untuk React + Vite:
- https://ui.shadcn.com/docs/installation/vite

Jalankan:

```powershell
npx shadcn@latest init
```

Ikuti prompt berdasarkan konfigurasi project yang dihasilkan. Jangan menyalin konfigurasi Next.js ke project Vite.

Tambahkan komponen awal yang diperlukan:

```powershell
npx shadcn@latest add button card dialog input progress separator sidebar sonner tabs tooltip
```

Jika CLI meminta penyesuaian atau komponen tertentu tidak tersedia pada versi yang digunakan, ikuti dokumentasi CLI saat itu dan jangan memaksakan konfigurasi lama.

### 2.3 Prompt AI — Frontend foundation

```text
Jalankan PHASE 2 dari PROJECT_PLAYBOOK.md.

Periksa konfigurasi frontend yang ada, lalu pastikan:
- Tailwind CSS terkonfigurasi dan bekerja;
- shadcn/ui terkonfigurasi untuk React + Vite;
- alias import konsisten;
- komponen dasar dapat digunakan;
- Zustand tersedia.

Jangan membuat dashboard lengkap atau fitur konversi dahulu.
Buat perubahan minimum yang diperlukan untuk fondasi frontend.
Jangan memasang Axios karena MVP belum membutuhkan HTTP client.

Jalankan pemeriksaan/build yang tersedia dan laporkan hasilnya.
```

**Acceptance criteria:**
- Tailwind CSS bekerja.
- Komponen shadcn/ui dapat di-import dan ditampilkan.
- Zustand dapat digunakan.
- Build frontend berhasil.

**Git checkpoint:**

```powershell
git add .
git commit -m "chore: setup frontend foundation"
```

---

# PHASE 3 — Technical Planning dan Architecture

**Tujuan:** menentukan struktur aplikasi, batas tanggung jawab frontend/Rust, dan kelayakan conversion engine sebelum implementasi fitur.

### Prompt AI

```text
Jalankan PHASE 3 dari PROJECT_PLAYBOOK.md.

Analisis PRD di PART A dan project yang sudah dibuat.
Buat technical plan yang pragmatis untuk solo developer.

Tentukan:
1. Struktur folder frontend dan src-tauri.
2. Batas tanggung jawab React, Zustand, Tauri commands, dan Rust services.
3. Pola komunikasi frontend ke Rust.
4. Penanganan file input/output dan izin akses.
5. Model status konversi dan error mapping.
6. Strategi proses yang tidak membekukan UI.
7. Kandidat library/engine untuk setiap fitur P0.
8. Kebutuhan dependency eksternal, lisensi, packaging, dan offline behavior.
9. Strategi logging dan testing.

Untuk DOCX to PDF, evaluasi LibreOffice atau alternatif yang layak.
Untuk PDF merge/split dan Image to PDF, evaluasi library Rust yang sesuai.
Jangan menyatakan sebuah library mendukung fitur sebelum memeriksa dokumentasi atau membuat proof of concept.

Pisahkan:
- keputusan yang sudah pasti;
- keputusan yang perlu proof of concept;
- fitur yang ditunda.

Hasilkan dokumen TECHNICAL_PLAN.md.
Jangan implementasikan fitur aplikasi pada tahap ini.
```

**Acceptance criteria:**
- Ada `TECHNICAL_PLAN.md`.
- Setiap fitur P0 memiliki rencana engine.
- Risiko dependency dan distribusi dicatat.
- Tidak ada implementasi fitur yang dilakukan.

**Git checkpoint:**

```powershell
git add .
git commit -m "docs: add technical plan"
```

---

# PHASE 4 — Conversion Engine Proof of Concept

**Tujuan:** membuktikan teknologi konversi utama dapat bekerja sebelum UI lengkap dibangun.

### Prompt AI

```text
Jalankan PHASE 4 dari PROJECT_PLAYBOOK.md.

Baca PRD dan TECHNICAL_PLAN.md.
Buat proof of concept terpisah untuk memvalidasi engine fitur P0.

Prioritas validasi:
1. Merge PDF.
2. Split PDF.
3. Image to PDF.
4. DOCX to PDF.

Gunakan file sampel yang legal dan tidak sensitif.
Uji hasil output secara nyata, bukan hanya memastikan fungsi berhasil dikompilasi.

Untuk setiap proof of concept, dokumentasikan:
- dependency dan versinya;
- cara menjalankan;
- input yang diuji;
- hasil yang diharapkan dan hasil aktual;
- keterbatasan;
- lisensi dan kebutuhan runtime;
- dampak terhadap ukuran installer.

Jangan membuat UI produk.
Jangan mengklaim fitur berhasil jika belum diuji.
Jika engine tidak layak, berikan alternatif dan alasan.
```

**Acceptance criteria:**
- Setiap fitur P0 memiliki hasil proof of concept atau keputusan alternatif.
- Dependency dan kebutuhan runtime terdokumentasi.
- Kualitas hasil telah diperiksa menggunakan file sampel.

**Git checkpoint:**

```powershell
git add .
git commit -m "test: validate conversion engines"
```

---

# PHASE 5 — UI/UX Design dan Application Shell

**Tujuan:** membuat kerangka visual aplikasi dan navigasi utama tanpa conversion logic.

### Prompt AI

```text
Jalankan PHASE 5 dari PROJECT_PLAYBOOK.md.

Baca PRD dan TECHNICAL_PLAN.md.
Buat application shell untuk desktop File Converter.

Halaman:
- Dashboard
- All Tools
- Tool Workspace
- Settings

Komponen:
- Sidebar navigation
- Header
- Tool card
- Reusable page container
- Empty state
- Basic notification

Ketentuan:
- Gunakan React, TypeScript, Tailwind CSS, dan shadcn/ui.
- Gunakan komponen reusable secara wajar.
- Gunakan data dummy hanya untuk preview UI.
- Jangan implementasikan konversi file.
- Jangan membuat backend command.
- Pastikan navigasi dan layout dapat digunakan.

Setelah implementasi, jalankan build dan laporkan file yang dibuat/diubah.
```

**Acceptance criteria:**
- Semua halaman dapat diakses.
- Navigasi berfungsi.
- Tampilan konsisten.
- Tidak ada conversion logic atau dummy action yang diklaim sebagai fitur nyata.

**Git checkpoint:**

```powershell
git add .
git commit -m "feat: build application shell"
```

---

# PHASE 6 — Frontend Feature Development

**Tujuan:** membangun interaksi frontend untuk alur pemilihan file dan konversi menggunakan state sementara sebelum dihubungkan dengan engine final.

### Prompt AI

```text
Jalankan PHASE 6 dari PROJECT_PLAYBOOK.md.

Implementasikan frontend workflow untuk:
- Word to PDF
- Image to PDF
- Merge PDF
- Split PDF

Buat komponen reusable untuk:
- file picker/dropzone;
- file list;
- file validation pada sisi UI;
- conversion options;
- progress/status display;
- result panel.

Gunakan Zustand hanya untuk state lintas komponen yang memang diperlukan.
Pisahkan state per concern dan hindari satu global store besar.

Untuk saat ini, gunakan mock service yang diberi label jelas sebagai mock.
Jangan berpura-pura menghasilkan file konversi nyata.
Jangan mengimplementasikan engine Rust pada tahap ini.

Pastikan empty, loading, success, dan error state dirancang.
Jalankan pemeriksaan TypeScript dan build.
```

**Acceptance criteria:**
- Pemilihan dan penghapusan file berfungsi.
- Validasi UI berjalan.
- Opsi tool ditampilkan sesuai kebutuhan.
- Status dan result state dapat diuji.
- Mock tidak disamarkan sebagai konversi nyata.

**Git checkpoint:**

```powershell
git add .
git commit -m "feat: implement conversion workflows UI"
```

---

# PHASE 7 — Rust Backend dan Tauri Commands

**Tujuan:** mengimplementasikan operasi file dan conversion service berdasarkan hasil proof of concept.

### Prompt AI

```text
Jalankan PHASE 7 dari PROJECT_PLAYBOOK.md.

Baca PRD, TECHNICAL_PLAN.md, dan hasil proof of concept.
Implementasikan backend Rust untuk fitur P0 secara bertahap.

Ketentuan:
- Pisahkan Tauri commands dari conversion services.
- Validasi input dan output path.
- Jangan mengubah file sumber.
- Gunakan error type yang konsisten.
- Hindari memblokir UI.
- Gunakan progress event jika operasi membutuhkan pelaporan progres.
- Batasi akses file sesuai kebutuhan aplikasi.
- Jangan menambahkan dependency yang tidak disetujui di technical plan.

Implementasikan satu fitur, uji, lalu lanjutkan ke fitur P0 berikutnya.
Jangan mengklaim dukungan format di luar yang benar-benar sudah diuji.
```

**Acceptance criteria:**
- Command dapat dipanggil dan diuji.
- File input divalidasi.
- File output benar-benar dihasilkan.
- Error dipetakan secara konsisten.
- Operasi tidak membuat aplikasi crash.

**Git checkpoint:**

```powershell
git add .
git commit -m "feat: implement Rust conversion services"
```

---

# PHASE 8 — Frontend and Backend Integration

**Tujuan:** mengganti mock service dengan Tauri commands yang sebenarnya.

### Prompt AI

```text
Jalankan PHASE 8 dari PROJECT_PLAYBOOK.md.

Hubungkan frontend dengan Rust backend menggunakan API Tauri yang sesuai dengan versi project.

Integrasikan:
- pemilihan file;
- validasi input;
- pengiriman opsi konversi;
- pemanggilan command;
- progress/status event;
- hasil dan output path;
- error mapping.

Ketentuan:
- Hapus mock hanya setelah integrasi nyata berhasil.
- Jangan menaruh conversion logic di React.
- Jangan menaruh UI state di Rust.
- Pastikan loading dan error state konsisten.
- Hindari pemanggilan command ganda.
- Uji setiap tool secara end-to-end.

Laporkan command yang diuji dan hasil aktual.
```

**Acceptance criteria:**
- Semua fitur P0 terhubung dengan backend nyata.
- Output file benar-benar dapat dibuka.
- Progress dan error tampil di UI.
- Tidak ada mock yang tertinggal pada jalur produksi.

**Git checkpoint:**

```powershell
git add .
git commit -m "feat: integrate frontend and Rust backend"
```

---

# PHASE 9 — Testing, Reliability, dan Optimization

**Tujuan:** memastikan fitur stabil, aman terhadap kesalahan umum, dan layak digunakan.

### Prompt AI

```text
Jalankan PHASE 9 dari PROJECT_PLAYBOOK.md.

Audit aplikasi berdasarkan acceptance criteria PRD.

Uji:
- file valid dan tidak valid;
- file rusak;
- file kosong;
- file berukuran besar yang masih wajar;
- nama output yang sudah ada;
- folder output tanpa izin tulis;
- rentang halaman yang salah;
- kegagalan engine/dependency;
- proses dibatalkan atau gagal;
- penggunaan berulang.

Periksa:
- crash dan panic;
- UI freeze;
- memory/resource usage yang tidak wajar;
- error message;
- file sumber tidak berubah;
- output dapat dibuka.

Perbaiki bug yang ditemukan.
Jangan menambahkan fitur baru.
Buat TEST_REPORT.md yang mencatat skenario, hasil aktual, bug, dan status perbaikan.
```

**Acceptance criteria:**
- Test report tersedia.
- Bug kritis diperbaiki.
- Fitur P0 lulus skenario utama.
- Batasan yang belum terselesaikan dicatat.

**Git checkpoint:**

```powershell
git add .
git commit -m "test: stabilize MVP workflows"
```

---

# PHASE 10 — Build, Packaging, dan Release

**Tujuan:** menghasilkan installer Windows dan memverifikasi aplikasi pada environment di luar development.

### Prompt AI

```text
Jalankan PHASE 10 dari PROJECT_PLAYBOOK.md.

Periksa konfigurasi build dan bundling Tauri.
Siapkan aplikasi untuk distribusi Windows 10/11 64-bit.

Periksa:
- application name dan identifier;
- version;
- application icon;
- bundle target;
- runtime/dependency eksternal;
- lokasi output;
- konfigurasi installer;
- lisensi dependency yang didistribusikan.

Jalankan build release.
Jangan mengubah konfigurasi signing atau sertifikat dengan nilai palsu.
Dokumentasikan jika code signing belum tersedia.

Uji installer pada Windows environment yang sesuai.
Pastikan aplikasi dapat dibuka tanpa menjalankan development server.
Buat RELEASE_NOTES.md dan panduan instalasi singkat.
```

Build command dasar:

```powershell
npm run tauri build
```

**Acceptance criteria:**
- Release build berhasil.
- Installer/package tersedia.
- Aplikasi dapat dipasang dan dibuka.
- Fitur inti bekerja tanpa development server.
- Kebutuhan runtime eksternal terdokumentasi.

**Git checkpoint:**

```powershell
git add .
git commit -m "release: prepare Windows MVP build"
```

---

# PART C — RUN ORDER DAN COMMAND CHEAT SHEET

## Urutan pengerjaan

| Urutan | Bagian | Output utama |
|---:|---|---|
| 0 | Environment Preparation | Tools siap |
| 1 | Project Bootstrap | Tauri + React berjalan |
| 2 | Frontend Foundation | Tailwind, shadcn, Zustand |
| 3 | Technical Planning | `TECHNICAL_PLAN.md` |
| 4 | Engine Proof of Concept | Hasil validasi engine |
| 5 | UI/UX dan Application Shell | Layout aplikasi |
| 6 | Frontend Feature Development | Workflow UI |
| 7 | Rust Backend | Conversion services |
| 8 | Integration | Frontend dan backend terhubung |
| 9 | Testing | `TEST_REPORT.md` |
| 10 | Build & Release | Installer Windows |

## Command harian

Jalankan dari root folder project.

Development:

```powershell
npm run tauri dev
```

Frontend build/check (sesuaikan script yang tersedia di `package.json`):

```powershell
npm run build
```

Rust check:

```powershell
cd src-tauri
cargo check
cd ..
```

Build installer:

```powershell
npm run tauri build
```

Lihat perubahan:

```powershell
git status
git diff
```

Commit:

```powershell
git add .
git commit -m "descriptive: summarize changes"
```

## Aturan sebelum lanjut ke phase berikutnya

Checklist ini harus dipenuhi setiap selesai satu phase:

- [ ] Output phase sudah dibuat.
- [ ] Acceptance criteria sudah diperiksa.
- [ ] Command test/build yang relevan sudah dijalankan.
- [ ] Tidak ada error yang belum dijelaskan.
- [ ] Perubahan kode sudah direview.
- [ ] Git checkpoint sudah dibuat.
- [ ] Developer menyetujui untuk lanjut.

## Format laporan yang wajib diberikan AI setelah setiap phase

```text
PHASE:
STATUS: Completed / Blocked / Partially completed

SUMMARY:
- ...

FILES CREATED:
- ...

FILES MODIFIED:
- ...

DEPENDENCIES ADDED/REMOVED:
- ...

COMMANDS EXECUTED:
- ...

TEST RESULTS:
- ...

KNOWN ISSUES / LIMITATIONS:
- ...

NEXT PHASE:
- Belum dijalankan. Menunggu instruksi pengguna.
```

---

# PART D — CATATAN PENTING

1. **PRD adalah sumber kebutuhan produk.** Jika implementasi bertentangan dengan PRD, jangan diam-diam mengubah scope.
2. **Technical Plan adalah sumber keputusan teknis.** Dependency baru harus memiliki alasan.
3. **Satu phase per satu sesi kerja.** Hindari prompt “buat seluruh aplikasi sekaligus”.
4. **Periksa perubahan AI.** Baca diff sebelum menerima perubahan, terutama konfigurasi, file system access, dan dependency.
5. **Jangan menganggap build berhasil berarti konversi benar.** Periksa file output dengan aplikasi pembaca yang sesuai.
6. **Uji file sampel yang beragam.** Dokumen sederhana tidak cukup untuk membuktikan semua format dan layout.
7. **Jaga file pengguna.** Jangan pernah menghapus atau menimpa file sumber.
8. **Jangan menambahkan Axios, database, login, AI, atau cloud service tanpa kebutuhan produk yang nyata.**
9. **Periksa lisensi dan distribusi engine eksternal** sebelum menyertakannya ke installer.
10. **Jangan lanjut otomatis.** Setiap phase harus selesai, direview, dan disetujui sebelum phase berikutnya.

---

## Referensi resmi

- Tauri prerequisites: https://v2.tauri.app/start/prerequisites/
- Tauri create project: https://v2.tauri.app/start/create-project/
- Tauri development: https://v2.tauri.app/develop/
- Tauri bundling: https://v2.tauri.app/distribute/
- Rust installation: https://www.rust-lang.org/tools/install
- shadcn/ui Vite: https://ui.shadcn.com/docs/installation/vite
- Node.js: https://nodejs.org/
- Git: https://git-scm.com/
