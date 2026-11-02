# TECHNICAL PLANNING

## File Converter Desktop

**Tahap:** 4 — Technical Planning  
**Platform:** Windows 10/11 64-bit  
**Development:** Solo Developer  
**Architecture:** Local-first Desktop Application

---

# 1. PROJECT OVERVIEW

## 1.1 Deskripsi

File Converter Desktop adalah aplikasi desktop untuk mengonversi dan mengelola berbagai format file secara lokal tanpa mengunggah file pengguna ke layanan online.

## 1.2 Tech Stack

| Bagian            | Teknologi                |
| ----------------- | ------------------------ |
| Desktop Framework | Tauri 2                  |
| Backend           | Rust                     |
| Frontend          | React                    |
| Language          | TypeScript               |
| Build Tool        | Vite                     |
| Styling           | Tailwind CSS             |
| UI Components     | shadcn/ui                |
| State Management  | Zustand                  |
| HTTP Client       | Axios (belum diperlukan) |
| Target OS         | Windows 10/11 64-bit     |

## 1.3 Development Principles

- Solo developer.
- Fokus MVP.
- Offline-first.
- Local file processing.
- Clean architecture sederhana.
- Reusable components.
- Easy maintenance.
- Avoid over-engineering.
- Hindari dependency yang tidak diperlukan.

---

# 2. MVP FEATURES

## 2.1 Priority P0

Fitur utama MVP:

- Word to PDF.
- Image to PDF.
- Merge PDF.
- Split PDF.
- File selection.
- File management.
- Conversion progress.
- Error handling.
- Output location selection.

## 2.2 Priority P1

Fitur pengembangan berikutnya:

- PDF to Image.
- PDF to Word.

Catatan: PDF to Word memiliki tantangan dalam mempertahankan layout, tabel, gambar, dan format dokumen.

## 2.3 Future Features

- Excel conversion.
- File compression.
- Batch conversion.
- OCR.
- ZIP tools.
- Conversion history.
- Advanced settings.

---

# 3. APPLICATION ARCHITECTURE

## 3.1 Architecture Overview

Gunakan arsitektur desktop lokal dengan React sebagai frontend dan Rust sebagai backend.

```text
┌────────────────────────────────────┐
│         FRONTEND - REACT            │
│                                    │
│  Pages                             │
│  Components                        │
│  Features                          │
│  Zustand Store                     │
│  Tauri Services                    │
└─────────────────┬──────────────────┘
                  │
             TAURI IPC
          Commands / Events
                  │
┌─────────────────▼──────────────────┐
│          BACKEND - RUST             │
│                                    │
│  Commands                          │
│  Services                          │
│  Converters                        │
│  File Manager                      │
│  Error Handling                    │
│  Events                            │
└─────────────────┬──────────────────┘
                  │
          ┌───────┴────────┐
          │                │
┌─────────▼──────┐ ┌──────▼─────────┐
│ Conversion     │ │ Local File     │
│ Engines        │ │ System         │
└────────────────┘ └────────────────┘
```

## 3.2 Frontend Responsibilities

Frontend bertanggung jawab untuk:

- UI dan user interaction.
- File selection.
- Menampilkan informasi file.
- Memilih conversion operation.
- Mengatur output location.
- Menampilkan conversion progress.
- Menampilkan error dan result.
- Mengelola application state.

Frontend tidak menjalankan conversion logic.

## 3.3 Backend Responsibilities

Rust bertanggung jawab untuk:

- File validation.
- Conversion processing.
- Menjalankan conversion engine.
- File system operations.
- Temporary file management.
- Error handling.
- Progress event.
- Output generation.

## 3.4 Architecture Rules

- Pisahkan UI dan business logic.
- Pisahkan command handler dan conversion service.
- Setiap converter memiliki tanggung jawab spesifik.
- Hindari menempatkan seluruh logic dalam satu file.
- Gunakan abstraksi hanya jika memang diperlukan.
- Prioritaskan maintainability.

---

# 4. FOLDER STRUCTURE PLANNING

Struktur folder berikut adalah rancangan target untuk implementasi.

Jangan membuat folder sekarang. Pembuatan struktur dilakukan pada Tahap 6 — Project Setup.

```text
file-converter/
│
├── src/
│   │
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── shared/
│   │
│   ├── features/
│   │   ├── converter/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   │
│   │   ├── file-manager/
│   │   └── settings/
│   │
│   ├── hooks/
│   │
│   ├── services/
│   │   └── tauri/
│   │
│   ├── stores/
│   │
│   ├── types/
│   │
│   ├── utils/
│   │
│   └── main.tsx
│
├── src-tauri/
│   │
│   ├── src/
│   │   ├── commands/
│   │   ├── services/
│   │   ├── converters/
│   │   ├── file_manager/
│   │   ├── events/
│   │   ├── errors/
│   │   ├── lib.rs
│   │   └── main.rs
│   │
│   ├── capabilities/
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── public/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 4.1 Folder Responsibilities

| Folder            | Responsibility                |
| ----------------- | ----------------------------- |
| app               | Application entry dan routing |
| components/ui     | Reusable UI components        |
| components/layout | Application layout            |
| components/shared | Shared components             |
| features          | Feature-based modules         |
| hooks             | Custom React hooks            |
| services/tauri    | Tauri communication           |
| stores            | Zustand state                 |
| types             | TypeScript types              |
| utils             | Helper functions              |
| commands          | Tauri command handlers        |
| services          | Backend business logic        |
| converters        | Conversion implementations    |
| file_manager      | File operations               |
| events            | Tauri event handling          |
| errors            | Backend error handling        |

---

# 5. CONVERSION ENGINE PLANNING

Bagian ini merupakan salah satu keputusan teknis terpenting.

Jangan mengasumsikan satu library dapat menangani seluruh format konversi.

Setiap kandidat perlu dievaluasi berdasarkan:

- Windows compatibility.
- Offline support.
- Conversion quality.
- Performance.
- Maintenance.
- Documentation.
- License.
- Binary size.
- External dependencies.

## 5.1 Initial Technology Candidates

| Feature      | Candidate                     | Status      |
| ------------ | ----------------------------- | ----------- |
| Word to PDF  | LibreOffice Headless          | Needs PoC   |
| Image to PDF | printpdf / lopdf              | Needs PoC   |
| Merge PDF    | lopdf                         | Needs PoC   |
| Split PDF    | lopdf                         | Needs PoC   |
| PDF to Image | PDFium / Poppler              | Deferred P1 |
| PDF to Word  | Specialized conversion engine | Deferred P1 |

Kandidat di atas belum merupakan keputusan final.

Periksa dokumentasi resmi dan lisensi versi yang akan digunakan sebelum menyetujui dependency.

## 5.2 Word to PDF

Rekomendasi awal:

LibreOffice Headless.

Pertimbangan:

- Dapat melakukan konversi DOCX ke PDF secara lokal.
- Mendukung berbagai format dokumen.
- Tidak membutuhkan koneksi internet saat proses konversi.
- Membutuhkan binary eksternal.

Hal yang perlu dievaluasi:

1. Strategi bundling LibreOffice.
2. Ukuran installer.
3. Cara mendeteksi executable.
4. Process execution melalui Rust.
5. Error handling.
6. Font compatibility.
7. Lisensi distribusi.

Jangan menganggap LibreOffice sudah tersedia di komputer pengguna.

## 5.3 Image to PDF

Evaluasi:

- printpdf.
- lopdf.

Kriteria pengujian:

- JPEG.
- PNG.
- Transparent PNG.
- Image resolution.
- Page orientation.
- Page size.
- Image scaling.
- Multiple images.

Pilih library setelah melakukan PoC.

## 5.4 Merge PDF

Kandidat awal: lopdf.

Pengujian:

- Menggabungkan dua PDF.
- Menggabungkan banyak PDF.
- Mempertahankan urutan halaman.
- PDF dengan ukuran halaman berbeda.
- PDF dengan gambar.
- PDF dengan font.
- PDF terenkripsi.

## 5.5 Split PDF

Kandidat awal: lopdf.

Pengujian:

- Split satu halaman.
- Split berdasarkan range.
- Split seluruh halaman.
- Validasi output.
- Penanganan halaman yang tidak valid.

## 5.6 Conversion Engine Decision

Gunakan status:

- PROPOSED: Kandidat awal.
- NEEDS_POC: Memerlukan pengujian.
- APPROVED: Sudah diuji dan dipilih.
- REJECTED: Tidak digunakan.

Jangan menetapkan APPROVED sebelum melakukan pengujian.

---

# 6. FILE PROCESSING WORKFLOW

## 6.1 General Workflow

```text
1. User selects file
        |
        v
2. Frontend validation
        |
        v
3. Send request to Rust
        |
        v
4. Backend validation
        |
        v
5. Prepare temporary workspace
        |
        v
6. Run conversion engine
        |
        v
7. Send progress events
        |
        v
8. Validate generated output
        |
        v
9. Save output file
        |
        v
10. Return result to frontend
        |
        v
11. Display success or error
```

## 6.2 File Validation

Backend harus melakukan validasi:

- File exists.
- File readable.
- File format supported.
- File size within allowed limits.
- Output directory accessible.
- Output path writable.
- File extension matches expected operation.

Ekstensi saja tidak cukup untuk memastikan format file. Gunakan pemeriksaan signature atau parser jika memungkinkan.

## 6.3 Temporary File Management

Aturan:

- Gunakan temporary directory aplikasi.
- Gunakan nama file sementara yang unik.
- Jangan mengubah file asli.
- Bersihkan temporary files setelah proses selesai.
- Bersihkan temporary files jika proses gagal.
- Jangan menghapus file pengguna.

## 6.4 Output Management

- User memilih output directory.
- Hindari overwrite tanpa konfirmasi atau aturan yang jelas.
- Validasi hasil sebelum menyatakan sukses.
- Tampilkan lokasi hasil kepada pengguna.
- Jangan menganggap file parsial sebagai hasil berhasil.

## 6.5 Progress Management

Gunakan Tauri Events.

Status proses:

- queued
- validating
- processing
- finalizing
- completed
- failed
- cancelled (jika cancellation sudah didukung)

Jangan menampilkan persentase progress palsu.

Jika conversion engine tidak menyediakan progress aktual, gunakan indeterminate progress atau status proses.

---

# 7. TAURI COMMUNICATION PLANNING

Gunakan dua mekanisme:

1. Tauri Commands.
2. Tauri Events.

## 7.1 Commands

Commands digunakan untuk request frontend ke backend.

Rancangan awal:

| Command              | Function               |
| -------------------- | ---------------------- |
| get_file_info        | Membaca informasi file |
| convert_word_to_pdf  | Word to PDF            |
| convert_image_to_pdf | Image to PDF           |
| merge_pdf            | Merge PDF              |
| split_pdf            | Split PDF              |

## 7.2 Request Example

Contoh kontrak konseptual:

```ts
type ConvertWordToPdfRequest = {
  inputPath: string;
  outputPath: string;
};

type ConversionResult = {
  jobId: string;
  outputPath: string;
  status: "completed";
};
```

Kontrak final harus disesuaikan dengan serialisasi Rust dan TypeScript.

## 7.3 Events

| Event                | Function          |
| -------------------- | ----------------- |
| conversion-progress  | Mengirim progress |
| conversion-completed | Mengirim hasil    |
| conversion-error     | Mengirim error    |

Gunakan jobId untuk menghubungkan event dengan pekerjaan yang benar.

Contoh:

```ts
type ConversionProgressEvent = {
  jobId: string;
  stage: string;
  progress?: number;
  message?: string;
};
```

## 7.4 Communication Rules

- Gunakan request dan response yang terstruktur.
- Gunakan error contract yang konsisten.
- Gunakan job ID untuk proses asynchronous.
- Bersihkan event listener setelah tidak digunakan.
- Hindari mengirim data file besar melalui IPC jika path lokal sudah cukup.
- Batasi akses file sesuai kebutuhan aplikasi.

---

# 8. ZUSTAND STATE MANAGEMENT

Zustand digunakan untuk mengelola shared application state.

## 8.1 State Planning

| State            | Description            |
| ---------------- | ---------------------- |
| selectedFiles    | File yang dipilih      |
| activeOperation  | Jenis operasi          |
| conversionStatus | Status konversi        |
| progress         | Progress jika tersedia |
| outputDirectory  | Lokasi output          |
| conversionResult | Hasil konversi         |
| error            | Informasi error        |

## 8.2 State Management Rules

- Hindari menyimpan seluruh data file dalam store.
- Simpan path dan metadata seperlunya.
- Gunakan local state untuk interaksi sederhana.
- Pisahkan store jika memang diperlukan.
- Hindari menyimpan derived state yang dapat dihitung.
- Jangan menggunakan Zustand sebagai pengganti seluruh state React.

## 8.3 Frontend Tauri Services

Rancangan:

```text
src/services/tauri/
├── commands.ts
├── events.ts
└── types.ts
```

Tujuannya agar komunikasi Tauri tidak tersebar di seluruh komponen.

---

# 9. ERROR HANDLING

## 9.1 Error Categories

| Error                | Description                      |
| -------------------- | -------------------------------- |
| UNSUPPORTED_FORMAT   | Format tidak didukung            |
| INVALID_FILE         | File rusak atau tidak valid      |
| FILE_NOT_FOUND       | File tidak ditemukan             |
| PERMISSION_DENIED    | Akses ditolak                    |
| OUTPUT_CONFLICT      | File output sudah ada            |
| INSUFFICIENT_STORAGE | Storage tidak cukup              |
| ENGINE_NOT_FOUND     | Conversion engine tidak tersedia |
| CONVERSION_FAILED    | Konversi gagal                   |
| PROCESS_TIMEOUT      | Proses terlalu lama              |
| UNKNOWN_ERROR        | Error tidak diketahui            |

## 9.2 Error Rules

- Backend menjadi sumber utama error teknis.
- Frontend menampilkan pesan yang mudah dipahami.
- Jangan menampilkan stack trace kepada pengguna.
- Detail teknis dapat dicatat untuk debugging.
- Jangan mencatat isi dokumen pengguna.
- Bersihkan temporary files saat gagal.
- Berikan solusi yang dapat dilakukan pengguna jika memungkinkan.

---

# 10. SECURITY AND PRIVACY

Walaupun aplikasi berjalan lokal, keamanan tetap diperlukan.

Aturan:

- Tidak mengunggah file pengguna ke server.
- Tidak mengirim file ke layanan AI.
- Validasi semua operasi file di backend.
- Hindari arbitrary filesystem access.
- Jangan menyusun shell command dari input pengguna.
- Gunakan process API dengan argumen terpisah untuk binary eksternal.
- Batasi Tauri capabilities.
- Hindari permission yang terlalu luas.
- Jangan menyimpan informasi sensitif dalam log.
- Bersihkan temporary files.

---

# 11. TESTING STRATEGY

## 11.1 Testing Types

| Testing          | Focus                        |
| ---------------- | ---------------------------- |
| Unit Test        | Helper dan validasi          |
| Integration Test | Integrasi conversion service |
| Conversion Test  | Kualitas hasil               |
| File Test        | Format dan variasi dokumen   |
| Error Test       | File invalid dan permission  |
| UI Test          | Interaksi frontend           |
| Manual Test      | Pengujian Windows            |

## 11.2 Test Fixtures

Siapkan file sampel:

```text
tests/
└── fixtures/
    ├── word/
    │   ├── simple.docx
    │   └── complex-layout.docx
    │
    ├── images/
    │   ├── sample.jpg
    │   ├── sample.png
    │   └── transparent.png
    │
    └── pdf/
        ├── one-page.pdf
        ├── multi-page.pdf
        ├── mixed-size.pdf
        ├── scanned.pdf
        └── corrupted.pdf
```

Pastikan file test fixtures memiliki izin penggunaan dan distribusi yang sesuai.

## 11.3 MVP Testing Criteria

- Word to PDF menghasilkan PDF valid.
- Image to PDF menghasilkan dokumen sesuai pengaturan.
- Merge PDF mempertahankan urutan halaman.
- Split PDF menghasilkan halaman sesuai permintaan.
- File input tidak berubah.
- Error ditangani dengan benar.
- Output divalidasi.
- UI tetap responsif selama konversi.

---

# 12. DEPENDENCY AND LICENSE PLANNING

Buat inventaris dependency.

| Component      | Purpose          | Status          |
| -------------- | ---------------- | --------------- |
| Tauri 2        | Desktop runtime  | Existing stack  |
| Rust crates    | Backend          | Need evaluation |
| React          | Frontend         | Existing stack  |
| TypeScript     | Type safety      | Existing stack  |
| Vite           | Build tool       | Existing stack  |
| Tailwind CSS   | Styling          | Existing stack  |
| shadcn/ui      | Components       | Existing stack  |
| Zustand        | State management | Existing stack  |
| LibreOffice    | Word to PDF      | Needs PoC       |
| PDFium/Poppler | PDF rendering    | Deferred P1     |

## 12.1 License Checklist

Untuk setiap dependency:

- Nama dan versi.
- Official documentation.
- Official repository.
- License.
- Redistribution permission.
- Attribution requirements.
- Source disclosure obligations.
- Binary size.
- Maintenance status.

Periksa lisensi dependency utama dan dependency transitif yang relevan.

Jangan menganggap suatu library bebas digunakan untuk distribusi komersial tanpa memeriksa lisensinya.

---

# 13. BUILD AND DISTRIBUTION PLANNING

Pertimbangkan hal berikut:

- Windows 10/11 64-bit.
- Installer format.
- WebView2 requirements.
- Binary external dependencies.
- LibreOffice bundling strategy.
- Installer size.
- Offline functionality.
- Application update strategy.
- License compliance.

Pengujian akhir nantinya harus dilakukan pada Windows yang bersih untuk memastikan aplikasi tidak bergantung pada tool development yang terpasang di komputer developer.

Detail build dan release dikerjakan pada Tahap 11.

---

# 14. TECHNICAL RISKS

| Risk                       | Impact                    | Mitigation                 |
| -------------------------- | ------------------------- | -------------------------- |
| LibreOffice tidak tersedia | Word conversion gagal     | Tentukan bundling strategy |
| Installer terlalu besar    | Distribusi kurang praktis | Evaluasi ukuran binary     |
| Layout Word kompleks       | Output berbeda            | Uji dokumen kompleks       |
| PDF tidak standar          | Merge/split gagal         | Uji variasi PDF            |
| Library tidak aktif        | Maintenance risk          | Periksa repository         |
| Binary gagal dijalankan    | Conversion gagal          | Validasi executable        |
| File besar                 | Memory usage tinggi       | Batasi concurrency         |
| Temporary files tertinggal | Storage/privacy risk      | Cleanup strategy           |
| Progress tidak tersedia    | Progress UI terbatas      | Indeterminate progress     |
| License incompatibility    | Distribution risk         | License audit              |

---

# 15. TECHNICAL DECISIONS

Gunakan status berikut:

- PROPOSED
- NEEDS_POC
- APPROVED
- REJECTED
- DEFERRED
- TBD

| Decision                        | Initial Status |
| ------------------------------- | -------------- |
| Tauri + React + Rust            | PROPOSED       |
| Frontend folder structure       | PROPOSED       |
| Backend folder structure        | PROPOSED       |
| LibreOffice for Word to PDF     | NEEDS_POC      |
| printpdf/lopdf for Image to PDF | NEEDS_POC      |
| lopdf for Merge PDF             | NEEDS_POC      |
| lopdf for Split PDF             | NEEDS_POC      |
| PDF to Image engine             | DEFERRED       |
| PDF to Word engine              | DEFERRED       |
| Tauri Commands and Events       | PROPOSED       |
| Zustand architecture            | PROPOSED       |
| Binary bundling strategy        | TBD            |
| Conversion concurrency          | TBD            |

Setiap keputusan yang belum pasti harus memiliki rencana validasi.

---

# 16. ACCEPTANCE CRITERIA

Tahap 4 dinyatakan selesai apabila:

- [ ] Application architecture terdokumentasi.
- [ ] Frontend/backend responsibilities jelas.
- [ ] Folder structure dirancang.
- [ ] Seluruh fitur P0 memiliki rencana implementasi.
- [ ] Conversion engine dievaluasi.
- [ ] Word to PDF strategy dirancang.
- [ ] Tauri Commands dirancang.
- [ ] Tauri Events dirancang.
- [ ] File processing workflow ditentukan.
- [ ] Zustand state direncanakan.
- [ ] Error handling dirancang.
- [ ] Security dan privacy dipertimbangkan.
- [ ] Testing strategy tersedia.
- [ ] Dependency dan license dievaluasi.
- [ ] Risiko teknis terdokumentasi.
- [ ] Keputusan TBD memiliki rencana validasi.
- [ ] Dokumen final sudah direview.

---

# 17. AI CODING ASSISTANT MASTER PROMPT

Gunakan prompt berikut untuk menyelesaikan tahap Technical Planning.

```text
TASK: Tahap 4 — Technical Planning
Project: File Converter Desktop

TECH STACK:
- Tauri 2
- Rust
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Zustand

TARGET:
- Windows 10/11 64-bit
- Solo developer
- MVP-first
- Offline-first
- Local file processing

MVP FEATURES:
- Word to PDF
- Image to PDF
- Merge PDF
- Split PDF
- File management
- Progress
- Error handling
- Output location selection

TASK:

Buat dokumen TECHNICAL_PLANNING.md yang mencakup:

1. Application architecture.
2. Frontend/backend responsibilities.
3. Folder structure.
4. Conversion engine evaluation.
5. LibreOffice evaluation.
6. Tauri Commands and Events.
7. Request/response contracts.
8. File processing workflow.
9. Zustand state management.
10. Error handling.
11. Security and privacy.
12. Testing strategy.
13. Dependencies and licenses.
14. Build and distribution.
15. Technical risks.
16. Technical decisions.

IMPORTANT RULES:

- Periksa kondisi repository sebelum bekerja.
- Gunakan dokumentasi resmi.
- Verifikasi kompatibilitas Windows.
- Verifikasi maintenance dan lisensi.
- Jangan menganggap satu library menangani semua format.
- Tandai keputusan yang belum pasti.
- Hindari over-engineering.
- Jangan membuat implementasi converter.
- Jangan mengubah source code.
- Jangan menginstal dependency.
- Jangan mengubah konfigurasi project.
- Jangan menimpa file tanpa izin.
- Jangan melanjutkan ke tahap berikutnya.

OUTPUT:

Buat TECHNICAL_PLANNING.md.

Setelah selesai laporkan:

- File yang dibuat.
- Arsitektur yang direkomendasikan.
- Conversion engine candidates.
- Dependency yang perlu dievaluasi.
- Risiko teknis.
- Keputusan TBD.
- Sumber dokumentasi yang digunakan.

Acceptance Criteria:
Seluruh fitur P0 memiliki rencana implementasi,
komunikasi frontend/backend terdokumentasi,
dependency dan lisensi dievaluasi,
dan tidak ada perubahan source code.
```

---

# 18. SEQUENTIAL EXECUTION WORKFLOW

Kerjakan setiap bagian secara berurutan.

Jangan meminta AI mengerjakan semua bagian sekaligus.

## PART 1 — Repository Inspection

Tujuan:
Memeriksa kondisi project tanpa mengubah file.

```text
Periksa kondisi repository saat ini.

Identifikasi:
- Project structure.
- Existing dependencies.
- Tauri configuration.
- Rust configuration.
- Frontend configuration.
- Existing source files.

Bandingkan kondisi aktual dengan rencana project.

Jangan membuat atau mengubah file.

Laporkan hasil inspection.
```

Acceptance Criteria:

- Kondisi project diketahui.
- Dependency yang sudah ada diketahui.
- Tidak ada perubahan file.

## PART 2 — Architecture Planning

Tujuan:
Menentukan arsitektur aplikasi.

```text
Berdasarkan hasil Part 1:

Rancang arsitektur Tauri 2 + React + Rust.

Tentukan:
- Frontend responsibilities.
- Backend responsibilities.
- Commands.
- Services.
- Converters.
- File manager.
- Events.
- Error handling.

Buat rancangan folder.

Jangan mengimplementasikan kode.
```

Acceptance Criteria:

- Arsitektur jelas.
- Tanggung jawab setiap modul jelas.
- Struktur folder dirancang.

## PART 3 — Conversion Engine Research

Tujuan:
Mengevaluasi conversion engine.

```text
Evaluasi conversion engine untuk:

- Word to PDF.
- Image to PDF.
- Merge PDF.
- Split PDF.

Periksa:
- Official documentation.
- Repository.
- Windows compatibility.
- API.
- Maintenance.
- License.
- Offline support.
- Binary requirements.

Evaluasi LibreOffice untuk Word to PDF.

Berikan rekomendasi berdasarkan bukti.
Tandai kandidat yang membutuhkan PoC.

Jangan menginstal dependency.
```

Acceptance Criteria:

- Kandidat setiap fitur diketahui.
- Lisensi dievaluasi.
- Risiko teknis dicatat.
- Kandidat PoC ditentukan.

## PART 4 — Communication and State Planning

Tujuan:
Merancang komunikasi frontend dan backend.

```text
Rancang:

- Tauri Commands.
- Tauri Events.
- Request payload.
- Response payload.
- Error contract.
- Job ID.
- Progress handling.
- Zustand state.

Pastikan frontend tidak menjalankan conversion logic.

Jangan membuat implementasi kode.
```

Acceptance Criteria:

- IPC contract terdokumentasi.
- Event flow jelas.
- State management dirancang.

## PART 5 — Testing, Security and Distribution

Tujuan:
Menentukan pengujian dan kebutuhan distribusi.

```text
Buat perencanaan:

- Unit testing.
- Integration testing.
- Conversion testing.
- Error testing.
- Security.
- Privacy.
- Temporary file cleanup.
- External binary requirements.
- Offline distribution.
- License compliance.

Identifikasi risiko dan mitigasinya.

Jangan mengimplementasikan kode.
```

Acceptance Criteria:

- Testing strategy tersedia.
- Security dipertimbangkan.
- Distribution requirements diketahui.

## PART 6 — Documentation Finalization

Tujuan:
Menggabungkan hasil seluruh bagian.

```text
Gabungkan seluruh hasil Part 1 sampai Part 5.

Buat atau perbarui:

TECHNICAL_PLANNING.md

Pastikan:
- Tidak ada duplikasi.
- Tidak ada inkonsistensi.
- Semua fitur P0 tercakup.
- Semua keputusan memiliki status.
- Risiko teknis tercatat.
- Acceptance criteria tersedia.

Jangan mengubah source code.
Jangan menginstal dependency.
Jangan melanjutkan ke tahap berikutnya.

Laporkan hasil akhir.
```

---

# 19. GIT CHECKPOINT

Setelah dokumen selesai dan direview:

```bash
git status

git add TECHNICAL_PLANNING.md

git commit -m "docs: complete technical planning"
```

Jika file berada dalam folder docs, sesuaikan path Git.

---

# 20. PROJECT DEVELOPMENT ROADMAP

| Tahap | Aktivitas                  | Status               |
| ----- | -------------------------- | -------------------- |
| 1     | Product Brief              | Completed            |
| 2     | PRD                        | Completed            |
| 3     | Environment Preparation    | Pending confirmation |
| 4     | Technical Planning         | In Progress          |
| 5     | UI/UX Design               | Pending              |
| 6     | Project Setup              | Pending              |
| 7     | Frontend Development       | Pending              |
| 8     | Backend Development (Rust) | Pending              |
| 9     | Integration                | Pending              |
| 10    | Testing & Optimization     | Pending              |
| 11    | Build & Deployment         | Pending              |

---

# NEXT STEP

Setelah Tahap 4 selesai:

Lanjutkan ke Tahap 5 — UI/UX Design.

Gunakan:

- PRD sebagai acuan kebutuhan produk.
- TECHNICAL_PLANNING.md sebagai acuan kemampuan teknis.

Jangan masuk ke Project Setup sebelum perencanaan UI/UX selesai.

Jangan mulai implementasi converter sebelum tahap implementasi yang sesuai.

```

```
