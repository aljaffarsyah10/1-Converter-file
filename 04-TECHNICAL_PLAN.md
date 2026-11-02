# TECHNICAL_PLAN.md — File Converter Desktop Architecture & Technical Planning

> **Dokumen Teknis:** `04-TECHNICAL_PLAN.md`  
> **Status:** Finalized for Phase 3 Review  
> **Basis Acuan:** `01-PRODUCT_BRIEF.md`, `02-PRD_AND_PLAYBOOK.md`, `03-TECHNICAL_PLANNING_GUIDE.md`  
> **Target OS:** Windows 10/11 64-bit  
> **Stack Utama:** Tauri 2, Rust (Backend Engine), React + TypeScript + Vite, Tailwind CSS v4, shadcn/ui, Zustand  
> **Developer:** Solo developer (vibe coding workflow)

---

## 1. Arsitektur Aplikasi & Batas Tanggung Jawab

Aplikasi dibangun dengan arsitektur **Local-First Desktop**, memisahkan secara tegas antara lapisan antarmuka pengguna (UI/Client) dan mesin eksekusi native (Rust Backend).

```text
┌──────────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + TypeScript)                  │
│                                                                  │
│  [UI Pages & Workspace Shell]  <───>  [Zustand Stores]           │
│         │                                                        │
│         ▼                                                        │
│  [Tauri Client Wrapper / Invoker Service]                        │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ IPC (invoke commands / listen events)
┌─────────────────────────────────▼────────────────────────────────┐
│                   BACKEND (Tauri 2 + Rust)                       │
│                                                                  │
│  [Tauri Command Handlers]                                        │
│         │ (Payload validation, task dispatch)                    │
│         ▼                                                        │
│  [App Services & Task Coordinator] ──> emits Progress/Events     │
│         │ (Non-blocking async tokio / threadpool)                │
│         ▼                                                        │
│  [Converters & File Handlers]                                    │
│    ├── ImageToPdfConverter (`image` + `lopdf`/`printpdf`)        │
│    ├── PdfMergeConverter (`lopdf`)                               │
│    ├── PdfSplitConverter (`lopdf`)                               │
│    └── DocxToPdfConverter (LibreOffice CLI / Native Adapter)     │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ Local I/O
                                  ▼
                     [Local Windows Filesystem]
```

### 1.1 Batas Tanggung Jawab (Separation of Concerns)

| Layer / Modul | Tanggung Jawab Utama | Batasan Ketat |
|---|---|---|
| **React Components** | Render UI, tangkap input pengguna (drag-and-drop, form opsi, klik aksi), tampilkan indikator progress dan dialog. | Tidak boleh memproses file binary langsung atau menjalankan logic konversi. |
| **Zustand Stores** | Menyimpan state UI client-side (file terpilih sementara, opsi konversi aktif, filter, status task visual). | Tidak menjadi single global monolith; hanya menyimpan data yang dibagi lintas komponen. |
| **Tauri Commands (`src-tauri/src/commands/`)** | Entry-point IPC: deserialisasi payload frontend, validasi parameter dasar, delegasi ke Rust Service, tangani serialization response/error. | Bersih dari conversion logic; fungsi command hanya sebagai thin IPC controller. |
| **Rust Services (`src-tauri/src/services/`)** | Orkestrasi alur kerja: pembuatan temp file, pemanggilan converter engine di background task, emit event progres ke frontend. | Tidak mengurusi interaksi UI. Mengembalikan struct hasil atau enum error yang terdefinisi rapi. |
| **Converters (`src-tauri/src/converters/`)** | Algoritma konversi murni dan interfacing dengan library file (PDF manipulation, image decode/encode, headless process spawn). | Independen dari Tauri runtime sejauh mungkin agar mudah diuji via unit test Rust (`cargo test`). |

---

## 2. Struktur Direktori Terencana

Struktur folder terorganisir rapi tanpa abstraksi berlebihan (over-engineering):

```text
converter-desktop/
├── src/
│   ├── assets/               # Asset statis (ikon, ilustrasi)
│   ├── components/
│   │   ├── ui/               # Komponen dasar shadcn/ui (button, card, dialog, dsb.)
│   │   └── shared/           # Komponen reusable (FileDropzone, FileList, ResultPanel, dsb.)
│   ├── features/
│   │   ├── dashboard/        # View dashboard utama & tool cards
│   │   ├── workspace/        # Generic reusable conversion workspace shell
│   │   └── settings/         # Tampilan preferensi (theme, default output folder)
│   ├── hooks/                # Custom React hooks (useDropzone, useFileValidation)
│   ├── services/             # Abstraksi IPC Tauri (`tauriService.ts`)
│   ├── stores/               # Zustand store terfokus (`useAppStore.ts`, `useTaskStore.ts`)
│   ├── types/                # Kontrak TypeScript (Task, FileItem, ConversionOptions, Error)
│   ├── lib/                  # Helper fungsi (`utils.ts`)
│   ├── index.css             # Tailwind CSS & theme tokens
│   ├── main.tsx              # React mounting root
│   └── App.tsx               # Root container & navigation router
│
├── src-tauri/
│   ├── src/
│   │   ├── commands/         # Tauri commands (convert.rs, file_dialog.rs, system.rs)
│   │   ├── services/         # Orchestration & task runner
│   │   ├── converters/       # Modul converter per format
│   │   │   ├── pdf_merge.rs  # Logika penggabungan PDF
│   │   │   ├── pdf_split.rs  # Logika pemotongan PDF
│   │   │   ├── img_to_pdf.rs # Konversi Gambar ke PDF
│   │   │   └── docx_to_pdf.rs# Adapter DOCX ke PDF (LibreOffice CLI)
│   │   ├── models/           # Data transfer struct & config
│   │   ├── errors/           # Custom error enum & user error mapping
│   │   ├── lib.rs            # Tauri application setup & builder
│   │   └── main.rs           # Binary entry point
│   ├── capabilities/         # Konfigurasi perizinan Tauri 2
│   ├── Cargo.toml            # Dependensi Rust
│   └── tauri.conf.json       # Konfigurasi runtime Tauri desktop
```

---

## 3. Pola Komunikasi Frontend ke Rust (IPC Contract)

Komunikasi menggunakan model **Asynchronous Request-Response** dipadukan dengan **Event-Driven Progress**:

1. **Inisiasi (Invoke Command):**
   Frontend memanggil Tauri command dengan menyertakan Job ID unik dan konfigurasi konversi. Command segera mendelegasikan eksekusi ke async tokio task / worker thread dan mengembalikan `JobStatus::Started`.
2. **Streaming Progres (Tauri Event):**
   Rust Service meng-emit event `conversion-progress` melalui channel window Tauri:
   ```typescript
   interface ProgressEventPayload {
     jobId: string;
     percent: number;      // 0 - 100
     stage: string;        // "Validating", "Processing", "WritingOutput"
     message?: string;
   }
   ```
3. **Penyelesaian & Hasil:**
   Rust Service menyelesaikan proses dan meng-emit event `conversion-finished` atau mengembalikan hasil akhir:
   ```typescript
   interface ConversionResult {
     jobId: string;
     success: boolean;
     outputPath: string;
     durationMs: number;
     outputFileSize: number;
   }
   ```

---

## 4. Penanganan File I/O, Izin Akses, & Keamanan

### 4.1 Prinsip Non-Destruktif & Validasi
- **File Sumber Terlindungi (Read-Only Input):** Berkas input hanya dibuka dalam mode *read/shared-read*. Tidak ada operasi in-place modification. Berkas asli tidak pernah diubah atau dihapus.
- **Validasi Header/Magic Bytes:** Validasi tidak hanya bergantung pada ekstensi file, tetapi membaca beberapa byte awal (misal `%PDF-` untuk PDF, signature PK untuk DOCX) untuk mencegah kesalahan format.
- **Konflik Nama Berkas Output:**
  - Jika berkas output sudah ada di folder tujuan, sistem tidak menimpa tanpa izin.
  - Opsi penamaan otomatis: menambahkan suffix increment `_converted_1.pdf` atau konfirmasi pengguna via dialog.

### 4.2 Manajemen Berkas Sementara (Temp Files)
- Berkas sementara (intermediate build artifacts) disimpan di direktori temp aplikasi (`%TEMP%\file-converter-desktop\{job_id}\`).
- Semua berkas temp dijamin dibersihkan (*clean-up on drop / RAII pattern*) baik saat proses sukses maupun saat proses gagal/dibatalkan.

---

## 5. Model Status Konversi & Error Mapping

### 5.1 Siklus Hidup Status Tugas (Job Lifecycle)
```text
[Idle/Ready] ──> [Validating] ──> [Processing (0-100%)] ──> [Completed]
                                          │
                                          └──> [Failed (User Error Message)]
```

### 5.2 Rust Error Mapping ke Pesan Pengguna
Raw error internal Rust (seperti `io::Error`, syntax parsing, atau subprocess exit codes) tidak boleh diekspos mentah-mentah ke pengguna.

```rust
// src-tauri/src/errors/mod.rs
#[derive(Debug, serde::Serialize)]
pub enum ConverterError {
    FileNotFound(String),
    InvalidFileFormat { expected: String, actual: String },
    PasswordProtectedPdf,
    CorruptedFile(String),
    EngineNotAvailable(String), // e.g. LibreOffice missing
    PermissionDenied(String),
    OutputWriteFailed(String),
    ExecutionTimeout,
    Unknown(String),
}
```

Frontend menerima objek error terstruktur dan memetakannya ke teks bahasa manusia yang solutif (misal: `"Dokumen PDF ini memiliki proteksi kata sandi. Harap buka kunci terlebih dahulu."`).

---

## 6. Strategi Menjaga UI Tetap Responsif (Non-Blocking)

Untuk memastikan UI jendela desktop tidak membeku (*no UI freeze*) saat memproses file berukuran besar:
1. **Async Tokio Task / Rayon Thread Pool:**
   Operasi konversi CPU-intensive atau disk I/O berat dieksekusi di thread pool terpisah menggunakan `tokio::task::spawn_blocking` atau crate `rayon`.
2. **Process Cancellation:**
   Frontend menyediakan tombol `Batal`. Backend menyimpan `tokio::sync::watch::Sender<bool>` atau `AtomicBool` per Job ID untuk membatalkan proses dan langsung menghapus temp file jika pengguna menekan cancel.

---

## 7. Analisis & Rencana Conversion Engine (Fitur MVP P0)

| Fitur P0 | Kandidat Engine Utama | Pendekatan Teknis | Lisensi & Offline | Status Keputusan |
|---|---|---|---|---|
| **Merge PDF** | `lopdf` (Crate Rust murni) | Crate `lopdf` membaca dokumen, menggabungkan dictionary halaman (`Pages`), memperbarui catalog, dan menulis PDF baru. Sangat cepat & efisien memori. | Apache-2.0 / MIT. 100% Offline. Tidak ada dependency runtime eksternal. | **Decided** (Siap PoC) |
| **Split PDF** | `lopdf` (Crate Rust murni) | Memuat dokumen PDF, mengekstrak rentang halaman (`Page` objects) yang ditentukan pengguna, menyusun objek cross-reference baru, lalu menyimpan berkas per halaman / per range. | Apache-2.0 / MIT. 100% Offline. Tidak ada dependency runtime eksternal. | **Decided** (Siap PoC) |
| **Image to PDF** | `image` + `printpdf` / `lopdf` | Crate `image` membaca & mendekode format JPG, PNG, WEBP. Mengambil dimensi dan resolusi gambar, lalu embedding sebagai XObject image ke dalam halaman kanvas PDF (`lopdf` atau `printpdf`). | MIT / Apache-2.0. 100% Offline. Sangat ringan tanpa external binary. | **Decided** (Siap PoC) |
| **Word to PDF** (DOCX → PDF) | **LibreOffice Headless CLI** (Opsi A) / **Docx native renderer** (Opsi B) | Menggunakan LibreOffice dalam mode headless (`soffice.exe --headless --convert-to pdf --outdir <dir> <file.docx>`). Alternatif: engine portable lokal jika tersedia. | MPL 2.0. 100% Offline (bila binary tersedia di sistem). | **Needs PoC** (Validasi mode integrasi & deteksi sistem) |

---

## 8. Evaluasi Mendalam: DOCX to PDF (Word to PDF)

Konversi DOCX ke PDF memerlukan tata letak dokumen (*typesetting & text reflow engine*) yang kompleks.

### 8.1 Evaluasi Opsi:
1. **LibreOffice Headless (Pilihan Paling Realistis & Berkualitas Tinggi):**
   - **Kelebihan:** Standar industri untuk fidelity konversi dokumen Office lokal; mendukung tabel rumit, font formatting, margin, header/footer.
   - **Tantangan Windows:** Apakah LibreOffice sudah terpasang di komputer pengguna atau harus didistribusikan?
   - **Strategi MVP:**
     1. Aplikasi mendeteksi lokasi instalasi LibreOffice di path Windows umum (`C:\Program Files\LibreOffice\program\soffice.exe` atau PATH).
     2. Jika terdeteksi: konversi berjalan mulus secara offline 100%.
     3. Jika belum terdeteksi: UI menampilkan panduan ramah satu langkah atau opsi download LibreOffice / portable runner.
2. **Pure Rust Crates (`docx-rs`, dll.):**
   - Crate Rust murni saat ini hanya mendukung *reading/writing* struktur XML DOCX, belum memiliki rendering engine untuk kalkulasi layout baris/halaman ke format visual PDF. Oleh sebab itu, solusi berbasis headless runner tetap menjadi pilihan terbaik untuk kualitas output.

---

## 9. Kategorisasi Keputusan Teknis

### 9.1 Keputusan yang Sudah Pasti (Decided)
* **Desktop Shell:** Tauri v2 dengan React + Vite + TypeScript.
* **Styling & UI Kit:** Tailwind CSS v4 + shadcn/ui.
* **State Management:** Zustand untuk UI state slice terpisah (`appStore`, `taskStore`).
* **PDF Operations (Merge & Split):** Implementasi native menggunakan crate Rust `lopdf`.
* **Image to PDF:** Native Rust menggunakan crate `image` dan penyusunan stream PDF via `lopdf`/`printpdf`.
* **Keamanan:** File asli tidak ditimpa tanpa persetujuan eksplisit.

### 9.2 Keputusan yang Memerlukan Proof of Concept (Needs PoC - Phase 4)
* **PoC 1 (Merge PDF):** Validasi penggabungan PDF dengan berbagai versi (1.4 s/d 1.7) dan font embedded.
* **PoC 2 (Split PDF):** Validasi pemisahan halaman ganjil/genap, single page, dan range custom (`1-3, 5, 8-10`).
* **PoC 3 (Image to PDF):** Validasi auto-scaling orientasi halaman (A4 portrait vs landscape) dan kompresi JPEG dalam PDF.
* **PoC 4 (DOCX to PDF):** Validasi eksekusi headless process command `soffice.exe` dari Rust, deteksi exit code, dan pengukuran waktu eksekusi.

### 9.3 Fitur yang Ditunda (Deferred to P1 & Future)
* **PDF to Image (P1):** Memerlukan rendering library seperti PDFium native binding. Ditunda setelah P0 stabil.
* **PDF to Word / DOCX (P1):** Rekonstruksi layout dari PDF ke format dokumen flow sangat kompleks; ditunda untuk validasi terpisah.
* **OCR & Batch Conversion (Future):** Di luar ruang lingkup MVP.

---

## 10. Strategi Logging & Pengujian

### 10.1 Logging
- Menggunakan crate `tracing` dan `tracing-subscriber` di sisi Rust backend.
- Log ditulis ke berkas log harian di folder AppData pengguna (`%LOCALAPPDATA%\com.fileconverter.desktop\logs\`).
- Informasi sensitif (seperti path pribadi pengguna yang tidak relevan) tidak dicatat berlebihan.

### 10.2 Strategi Pengujian (Testing Matrix)
1. **Unit Testing Backend (`cargo test`):**
   - Uji parsing range string untuk Split PDF (misal: validasi input `"1-3, 5, 7-10"` menjadi vector index halaman).
   - Uji validasi ekstensi dan file integrity check.
2. **Conversion Engine PoC Tests:**
   - Direktori `tests/fixtures/` berisi sampel uji legal:
     - `sample_1.pdf`, `sample_2.pdf` (PDF standar)
     - `sample.docx` (Dokumen Word berisi teks, judul, tabel sederhana)
     - `photo.jpg`, `diagram.png`
3. **Frontend Component Tests:**
   - Uji validasi drag-and-drop dan kalkulasi ukuran file di sisi UI.

---

## 11. Kesimpulan & Rencana Aksi Phase Berikutnya
Dokumen ini menetapkan seluruh fondasi teknis yang dibutuhkan untuk masuk ke **PHASE 4 — Conversion Engine Proof of Concept**, di mana setiap modul engine P0 (`lopdf`, `image`, dan subprocess `docx`) akan diuji secara nyata dengan berkas sampel terverifikasi.

