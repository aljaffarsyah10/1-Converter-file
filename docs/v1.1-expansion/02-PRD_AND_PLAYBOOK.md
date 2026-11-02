# File Converter Desktop v1.1 — PRD & Sequential Development Playbook

> Dokumen utama untuk mengembangkan **15 fitur baru** pada File Converter Desktop v1.1.
>
> **Cara penggunaan:** kerjakan bagian secara berurutan. Jalankan hanya satu fase pada satu waktu. Jangan lanjut sebelum kriteria selesai pada bagian tersebut terpenuhi.

---

# PART A — PRODUCT REQUIREMENTS DOCUMENT (PRD) v1.1

## 1. Informasi Rilis

| Item | Detail |
|---|---|
| Versi Target | 1.1 (Expansion) |
| Versi Sebelumnya | 1.0.0 (MVP — 4 fitur P0) |
| Platform | Windows 10/11 64-bit |
| Stack | Tauri 2 + React 19 + Rust + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui + Zustand |
| Pendekatan Rilis | Incremental — setiap fase menghasilkan fitur yang bisa di-build & di-test mandiri |

## 2. Ringkasan Fitur v1.0 (Sudah Selesai ✅)

| # | Fitur | Status |
|:---:|---|:---:|
| 1 | Merge PDF | ✅ |
| 2 | Split PDF | ✅ |
| 3 | Image to PDF | ✅ |
| 4 | Word to PDF | ✅ |

## 3. Daftar Fitur Baru v1.1

### 3.1 Prioritas P1 — Coming Soon (6 Fitur)

| # | ID | Fitur | Input → Output | Strategi Engine |
|:---:|---|---|---|---|
| 1 | `pdf-to-word` | PDF to Word | `.pdf` → `.docx` | Rust: ekstraksi teks `lopdf` → generate DOCX via `docx-rs` |
| 2 | `pdf-to-image` | PDF to Image | `.pdf` → `.png`/`.jpg` | Rust: render via `pdfium-render` atau `mupdf` bindings |
| 3 | `compress-pdf` | Compress PDF | `.pdf` → `.pdf` (lebih kecil) | Rust: rekompresi stream `lopdf` + `flate2`, downsample gambar |
| 4 | `excel-to-pdf` | Excel to PDF | `.xlsx`/`.csv` → `.pdf` | COM Automation (Excel/LibreOffice) — pola sama dengan Word to PDF |
| 5 | `pptx-to-pdf` | PowerPoint to PDF | `.pptx`/`.ppt` → `.pdf` | COM Automation (PowerPoint/LibreOffice) — pola sama dengan Word to PDF |
| 6 | `pdf-to-excel` | PDF to Excel | `.pdf` → `.xlsx` | Rust: ekstraksi tabel `lopdf` → generate XLSX via `rust_xlsxwriter` |

### 3.2 Prioritas Future — Planned v2.x (9 Fitur)

| # | ID | Fitur | Input → Output | Strategi Engine |
|:---:|---|---|---|---|
| 7 | `rotate-pdf` | Rotate PDF | `.pdf` → `.pdf` | Rust: `lopdf` manipulasi `/Rotate` attribute |
| 8 | `protect-pdf` | Protect PDF | `.pdf` → `.pdf` (terenkripsi) | Rust: `lopdf` enkripsi RC4/AES |
| 9 | `unlock-pdf` | Unlock PDF | `.pdf` → `.pdf` (tanpa password) | Rust: `lopdf` dekripsi dengan password |
| 10 | `watermark-pdf` | Watermark PDF | `.pdf` → `.pdf` | Rust: overlay teks/gambar via content stream `lopdf` |
| 11 | `image-compress` | Compress Image | gambar → gambar (lebih kecil) | Rust: `image` crate re-encode dengan quality tuning |
| 12 | `image-convert` | Convert Image | gambar → format lain | Rust: `image` crate transcode antar format |
| 13 | `image-resize` | Resize Image | gambar → gambar (ukuran baru) | Rust: `image` crate resize dengan filter Lanczos3 |
| 14 | `html-to-pdf` | HTML to PDF | `.html` → `.pdf` | WebView2 print-to-PDF atau `wkhtmltopdf` headless |
| 15 | `markdown-to-pdf` | Markdown to PDF | `.md` → `.pdf` | Rust: `pulldown-cmark` → HTML → PDF pipeline |

## 4. Aturan Pengembangan

1. **Satu fase, satu waktu.** Jangan melompat ke fase berikutnya sebelum acceptance criteria terpenuhi.
2. **Backward-compatible.** Semua fitur v1.0 harus tetap berfungsi setelah setiap fase.
3. **Non-breaking catalog.** Fitur baru ditambahkan ke `TOOLS_CATALOG` dengan `isAvailable: false`, diubah ke `true` hanya setelah engine & UI terintegrasi penuh.
4. **Reuse pattern.** Gunakan pola arsitektur yang sama: Rust converter → Tauri command → IPC service → ToolWorkspace UI.
5. **Test dulu, rilis kemudian.** Setiap fitur baru wajib memiliki minimal 3 unit test di Rust.

## 5. Di Luar Scope v1.1

- OCR dan fitur AI/ML.
- Cloud storage, cloud processing, atau sinkronisasi.
- Login, autentikasi, akun pengguna, dan subscription.
- Batch conversion multi-file simultan (proses tetap sekuensial).
- Plugin system atau arsitektur extension.
- macOS / Linux support.

---

# PART B — SEQUENTIAL DEVELOPMENT PLAYBOOK

## Cara Menjalankan Dokumen Ini

1. Buka folder `D:\Konverter` di VS Code / editor.
2. Buka AI coding assistant.
3. Minta AI membaca atau salin prompt pada fase yang ingin dijalankan.
4. **Jalankan hanya SATU FASE pada satu waktu.**
5. Periksa hasil, jalankan test, review diff.
6. Commit sebelum lanjut ke fase berikutnya.

## Aturan Umum untuk AI Coding Assistant

```text
Kamu bertindak sebagai senior engineer yang melanjutkan pengembangan File Converter Desktop v1.1.

Konteks:
- Project sudah berjalan dengan 4 fitur P0 (Merge/Split PDF, Image to PDF, Word to PDF).
- Baca PRD v1.1 di docs/v1.1-expansion/02-PRD_AND_PLAYBOOK.md.
- Stack: Tauri 2, Rust, React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Zustand.
- Target: Windows 10/11 64-bit.
- Fokus: menambah fitur baru tanpa merusak fitur yang sudah ada.

Aturan kerja:
1. Kerjakan hanya fase yang diminta. Jangan melompat ke fase selanjutnya.
2. Sebelum mengubah kode, periksa struktur project yang sudah ada.
3. Jangan menimpa atau menghapus fitur v1.0 yang sudah berjalan.
4. Hindari over-engineering dan dependency yang belum diperlukan.
5. Jalankan test dan laporkan hasil sebenarnya.
6. Setelah selesai, laporkan: file dibuat/diubah, dependency ditambahkan, test results, masalah tersisa.
7. Jangan lanjut ke fase berikutnya tanpa instruksi pengguna.
```

---

# FASE 1 — PDF to Word (pdf-to-word)

**Tujuan:** Mengonversi dokumen PDF menjadi berkas DOCX yang dapat diedit.

**Estimasi Kompleksitas:** 🟡 Sedang

### 1.1 Riset & Evaluasi Engine

Evaluasi pendekatan konversi PDF → DOCX di Rust:
- **Opsi A:** Ekstraksi teks per halaman dari `lopdf` + generate DOCX via crate `docx-rs`.
- **Opsi B:** Gunakan LibreOffice CLI headless (`soffice --convert-to docx`).
- **Opsi C:** Gunakan COM Automation Word (buka PDF di Word, save as DOCX).

Buat PoC kecil untuk pendekatan terpilih di `poc-converters/src/bin/poc_pdf_to_word.rs`.

**Acceptance criteria riset:**
- PoC berhasil mengonversi sample PDF ke DOCX.
- Teks dapat dibaca dan paragraph terpisah dengan benar.
- Dokumentasikan limitasi (layout, tabel, gambar yang hilang).

### 1.2 Implementasi Rust Converter

Buat file `converter-desktop/src-tauri/src/converters/pdf_to_word.rs`:
- Fungsi publik: `pub fn convert(input_path: &Path, output_path: &Path) -> Result<ConversionResult, ConvertError>`
- Daftarkan modul di `converters/mod.rs`.
- Tambahkan unit test minimal:
  1. ✅ Konversi PDF valid → DOCX berhasil dibuat.
  2. ✅ Input file tidak ditemukan → error yang jelas.
  3. ✅ PDF kosong (0 halaman) → error yang jelas.

### 1.3 Implementasi Tauri Command

Tambahkan command handler di `commands/convert.rs`:
```rust
#[tauri::command]
pub async fn convert_pdf_to_word(request: PdfToWordRequest) -> Result<ConversionResult, String>
```

Tambahkan model request/response di `models/mod.rs`.

### 1.4 Implementasi Frontend

1. Di `data/tools.ts`: ubah `pdf-to-word` dari `isAvailable: false` → `true`.
2. Di `services/tauriConversionService.ts`: tambahkan fungsi IPC `convertPdfToWord()`.
3. Di `features/workspace/ToolWorkspacePage.tsx`: tambahkan case untuk `pdf-to-word`.
4. Panel opsi: pilihan output directory (reuse pola Word to PDF).

### 1.5 Integrasi & Testing

- Jalankan `cargo test` — pastikan semua test lama + baru lulus.
- Test manual: konversi PDF dengan teks, tabel sederhana, dan multi-halaman.
- Verifikasi file DOCX output bisa dibuka di Word/LibreOffice.

**Acceptance Criteria Fase 1:**
- [x] PoC converter PDF → DOCX berfungsi (`poc-converters/src/bin/poc_pdf_to_word.rs`)
- [x] Rust converter terdaftar dan 3 unit test lulus (`test_pdf_to_word_success`, `test_pdf_to_word_file_not_found`, `test_pdf_to_word_corrupted_or_empty`)
- [x] Tauri command terintegrasi (`convert_pdf_to_word`)
- [x] UI tool card menunjukkan "Ready" dan workspace berfungsi (`data/tools.ts`, `ConversionOptionsPanel.tsx`)
- [x] Fitur v1.0 tidak terpengaruh (`cargo test` 18/18 test lulus)

**Git checkpoint:**
```powershell
git add .
git commit -m "feat: add PDF to Word converter (pdf-to-word)"
```

---

# FASE 2 — PDF to Image (pdf-to-image)

**Tujuan:** Mengonversi setiap halaman PDF menjadi gambar JPG atau PNG resolusi tinggi.

**Estimasi Kompleksitas:** 🟡 Sedang

### 2.1 Riset & Evaluasi Engine

Evaluasi pendekatan rendering PDF → gambar:
- **Opsi A:** Crate `pdfium-render` (binding ke PDFium library dari Chromium) — kualitas tinggi.
- **Opsi B:** Crate `mupdf` (binding ke MuPDF) — ringan dan cepat.
- **Opsi C:** Windows COM print-to-image atau PowerShell scripting.

Buat PoC di `poc-converters/src/bin/poc_pdf_to_image.rs`.

**Catatan penting:** Jika menggunakan binding ke library native (PDFium/MuPDF), pastikan DLL disertakan dalam bundle atau instruksi instalasi jelas.

### 2.2 Implementasi Rust Converter

Buat file `converters/pdf_to_image.rs`:
- Input: path PDF + opsi (format output: PNG/JPG, DPI: 150/300, range halaman).
- Output: daftar path gambar yang dihasilkan.
- Unit test minimal:
  1. ✅ Konversi PDF 3 halaman → 3 file PNG.
  2. ✅ Konversi halaman tunggal → 1 file JPG.
  3. ✅ PDF tidak valid → error yang jelas.

### 2.3 Implementasi Tauri Command

```rust
#[tauri::command]
pub async fn convert_pdf_to_image(request: PdfToImageRequest) -> Result<PdfToImageResult, String>
```

Model request harus mencakup: `input_path`, `output_dir`, `format` (PNG/JPG), `dpi`, `page_range` (opsional).

### 2.4 Implementasi Frontend

1. Ubah `pdf-to-image` → `isAvailable: true` di `tools.ts`.
2. Tambahkan IPC service `convertPdfToImage()`.
3. Panel opsi unik:
   - Pilihan format output: PNG / JPG
   - Pilihan DPI/resolusi: 150 (draft) / 300 (standar) / 600 (tinggi)
   - Rentang halaman (opsional): semua atau spesifik

### 2.5 Integrasi & Testing

- `cargo test` semua lulus.
- Test manual: PDF multi-halaman, PDF dengan gambar, PDF landscape.
- Verifikasi kualitas gambar output.

**Acceptance Criteria Fase 2:**
- [x] PoC rendering PDF → gambar berfungsi dengan kualitas baik (`poc-converters/src/bin/poc_pdf_to_image.rs`)
- [x] Rust converter + 3 unit test lulus (`test_pdf_to_image_png_success`, `test_pdf_to_image_jpg_single_page`, `test_pdf_to_image_invalid_inputs`)
- [x] Tauri command terintegrasi (`convert_pdf_to_image`)
- [x] UI workspace dengan opsi format/DPI/range berfungsi (`ConversionOptionsPanel.tsx`, `tools.ts`)
- [x] Semua fitur sebelumnya tetap berjalan (`cargo test` 21/21 test lulus)

**Git checkpoint:**
```powershell
git add .
git commit -m "feat: add PDF to Image converter (pdf-to-image)"
```

---

# FASE 3 — Compress PDF (compress-pdf)

**Tujuan:** Mengoptimalkan ukuran berkas PDF tanpa mengorbankan kualitas visual secara signifikan.

**Estimasi Kompleksitas:** 🟡 Sedang

### 3.1 Riset & Strategi Kompresi

Strategi kompresi PDF di Rust menggunakan `lopdf`:
1. **Re-compress content streams** — decode & re-encode dengan Flate (deflate) menggunakan `flate2`.
2. **Downsample embedded images** — decode gambar dalam PDF, resize jika resolusi > threshold, re-encode dengan kompresi lebih tinggi.
3. **Remove duplicate objects** — deduplikasi objek PDF yang identik.
4. **Strip metadata** — hapus metadata XMP/info yang tidak diperlukan (opsional).

Buat PoC di `poc-converters/src/bin/poc_compress_pdf.rs`.

### 3.2 Implementasi Rust Converter

Buat file `converters/pdf_compress.rs`:
- Input: path PDF + level kompresi (`low` / `medium` / `high`).
- Output: path PDF terkompresi + persentase pengurangan ukuran.
- Unit test minimal:
  1. ✅ PDF dengan gambar besar → ukuran output lebih kecil.
  2. ✅ PDF yang sudah terkompresi → tidak error (mungkin ukuran sama/sedikit berkurang).
  3. ✅ PDF tidak valid → error yang jelas.

### 3.3 Implementasi Tauri Command

```rust
#[tauri::command]
pub async fn compress_pdf(request: CompressPdfRequest) -> Result<CompressPdfResult, String>
```

Result harus mengembalikan `original_size`, `compressed_size`, dan `reduction_percent`.

### 3.4 Implementasi Frontend

1. Ubah `compress-pdf` → `isAvailable: true` di `tools.ts`.
2. Panel opsi:
   - Level kompresi: Rendah (kualitas tinggi) / Sedang / Tinggi (ukuran terkecil)
3. Tampilkan statistik kompresi setelah selesai: "Ukuran berkurang X% (dari Y MB → Z MB)".

### 3.5 Integrasi & Testing

**Acceptance Criteria Fase 3:**
- [x] Kompresi berhasil mengurangi ukuran PDF (`poc-converters/src/bin/poc_compress_pdf.rs`, `pdf_compress.rs`)
- [x] 3 unit test lulus (`test_compress_pdf_success`, `test_compress_pdf_levels`, `test_compress_pdf_invalid_inputs`)
- [x] UI menampilkan opsi tingkat kompresi dan statistik penghematan ukuran di ResultPanel
- [x] Semua fitur sebelumnya tetap berjalan (`cargo test` 24/24 test lulus)

**Git checkpoint:**
```powershell
git add .
git commit -m "feat: add Compress PDF tool (compress-pdf)"
```

---

# FASE 4 — Excel to PDF (excel-to-pdf)

**Tujuan:** Mengonversi spreadsheet Excel (.xlsx/.xls/.csv) menjadi dokumen PDF.

**Estimasi Kompleksitas:** 🟢 Rendah (reuse pola Word to PDF)

### 4.1 Implementasi Rust Converter

Buat file `converters/excel_to_pdf.rs`:
- **Pola yang sama** dengan `docx_to_pdf.rs`:
  - Adapter 1: **Excel COM Automation** (jika Microsoft Excel terpasang).
  - Adapter 2: **LibreOffice Headless** (`soffice --convert-to pdf`).
- Deteksi otomatis engine yang tersedia.
- Unit test minimal:
  1. ✅ Konversi XLSX valid → PDF berhasil.
  2. ✅ Konversi CSV valid → PDF berhasil.
  3. ✅ Input tidak valid → error yang jelas.

### 4.2 Implementasi Tauri Command & Frontend

- Tambahkan Tauri command `convert_excel_to_pdf`.
- Ubah `excel-to-pdf` → `isAvailable: true`.
- Panel opsi: reuse pola Word to PDF (pilih output directory, auto-open).
- Tampilkan engine yang terdeteksi (Excel / LibreOffice).

### 4.3 Integrasi & Testing

**Acceptance Criteria Fase 4:**
- [x] Konversi XLSX/CSV → PDF berhasil via COM atau LibreOffice (`excel_to_pdf.rs`, `poc_excel_to_pdf.rs`)
- [x] 3 unit test lulus (`test_excel_to_pdf_xlsx_success`, `test_excel_to_pdf_csv_success`, `test_excel_to_pdf_invalid_inputs`)
- [x] Deteksi engine berfungsi (`detect_excel_engine` mendeteksi Excel COM / LibreOffice)
- [x] Semua fitur sebelumnya tetap berjalan (`cargo test` 27/27 test lulus)

**Git checkpoint:**
```powershell
git add .
git commit -m "feat: add Excel to PDF converter (excel-to-pdf)"
```

---

# FASE 5 — PowerPoint to PDF (pptx-to-pdf)

**Tujuan:** Mengonversi presentasi PowerPoint (.pptx/.ppt) menjadi PDF.

**Estimasi Kompleksitas:** 🟢 Rendah (reuse pola Word/Excel to PDF)

### 5.1 Implementasi Rust Converter

Buat file `converters/pptx_to_pdf.rs`:
- Adapter 1: **PowerPoint COM Automation**.
- Adapter 2: **LibreOffice Headless**.
- Copy-paste pola dari `excel_to_pdf.rs`, ubah ProgID COM dan parameter.

### 5.2 Implementasi Tauri Command & Frontend

- Tambahkan Tauri command `convert_pptx_to_pdf`.
- Ubah `pptx-to-pdf` → `isAvailable: true`.
- Unit test: 3 skenario (PPTX valid, file rusak, engine tidak tersedia).

### 5.3 Integrasi & Testing

**Acceptance Criteria Fase 5:**
- [x] Konversi PPTX/PPT → PDF berhasil (`pptx_to_pdf.rs`, `poc_pptx_to_pdf.rs`)
- [x] 3 unit test lulus (`test_pptx_to_pdf_success`, `test_pptx_to_pdf_invalid_inputs`, `test_pptx_to_pdf_corrupted_empty`)
- [x] Semua fitur sebelumnya tetap berjalan (`cargo test` 30/30 test lulus)

**Git checkpoint:**
```powershell
git add .
git commit -m "feat: add PowerPoint to PDF converter (pptx-to-pdf)"
```

---

# FASE 6 — PDF to Excel (pdf-to-excel)

**Tujuan:** Mengekstrak tabel dari PDF menjadi spreadsheet XLSX yang dapat diedit.

**Estimasi Kompleksitas:** 🔴 Tinggi

### 6.1 Riset & Evaluasi

Pendekatan ekstraksi tabel dari PDF:
- **Opsi A:** Parse content stream `lopdf` → deteksi grid teks → generate XLSX via `rust_xlsxwriter`.
- **Opsi B:** LibreOffice CLI (`soffice --convert-to xlsx`).
- **Opsi C:** Hybrid — ekstrak teks terstruktur, heuristik deteksi kolom.

Buat PoC, dokumentasikan limitasi (PDF tanpa tabel, tabel kompleks, merged cells).

### 6.2 Implementasi Rust Converter

Buat file `converters/pdf_to_excel.rs`:
- Tambahkan dependency `rust_xlsxwriter` di `Cargo.toml` jika diperlukan.
- Unit test:
  1. ✅ PDF dengan tabel sederhana → XLSX dengan data benar.
  2. ✅ PDF tanpa tabel → XLSX kosong atau peringatan.
  3. ✅ PDF tidak valid → error yang jelas.

### 6.3 Implementasi Tauri Command & Frontend

- Tambahkan command `convert_pdf_to_excel`.
- Ubah `pdf-to-excel` → `isAvailable: true`.

**Acceptance Criteria Fase 6:**
- [x] Ekstraksi tabel dasar dari PDF → XLSX berfungsi (`pdf_to_excel.rs`, `poc_pdf_to_excel.rs`)
- [x] 3 unit test lulus (`test_pdf_to_excel_success`, `test_pdf_to_excel_invalid_inputs`, `test_pdf_to_excel_corrupted_empty`)
- [x] Limitasi didokumentasikan (tabel berbasis teks terstruktur/pemisah spasi ganda/tab/pipe diekstrak ke sel numerik/teks, PDF murni pindaian gambar memerlukan OCR)
- [x] Semua fitur sebelumnya tetap berjalan (`cargo test` 33/33 test lulus)

**Git checkpoint:**
```powershell
git add .
git commit -m "feat: add PDF to Excel converter (pdf-to-excel)"
```

---

# FASE 7 — Rotate PDF (rotate-pdf)

**Tujuan:** Memutar halaman PDF sebesar 90°, 180°, atau 270°.

**Estimasi Kompleksitas:** 🟢 Rendah

### 7.1 Implementasi Rust Converter

Buat file `converters/pdf_rotate.rs`:
- Gunakan `lopdf` untuk memodifikasi atribut `/Rotate` pada setiap halaman.
- Opsi: putar semua halaman atau halaman tertentu.
- Unit test:
  1. ✅ Rotate 90° → atribut `/Rotate` berubah.
  2. ✅ Rotate halaman spesifik → hanya halaman yang dipilih berubah.
  3. ✅ PDF tidak valid → error.

### 7.2 Implementasi Frontend

Panel opsi:
- Sudut rotasi: 90° CW, 180°, 90° CCW (270°)
- Scope: Semua halaman / Halaman tertentu (input rentang)

**Acceptance Criteria Fase 7:**
- [x] Rotasi halaman PDF berfungsi (`pdf_rotate.rs`, `poc_rotate_pdf.rs`)
- [x] 3 unit test lulus (`test_rotate_pdf_all_pages_90`, `test_rotate_pdf_specific_page`, `test_rotate_pdf_invalid_inputs`)
- [x] UI dengan opsi sudut (90° Kanan, 180° Balik, 90° Kiri/270°) & rentang halaman berfungsi
- [x] Semua fitur sebelumnya tetap berjalan (`cargo test` 36/36 test lulus)

**Git checkpoint:**
```powershell
git add .
git commit -m "feat: add Rotate PDF tool (rotate-pdf)"
```

---

# FASE 8 — Protect & Unlock PDF (protect-pdf, unlock-pdf)

**Tujuan:** Menambahkan dan menghapus proteksi password pada PDF.

**Estimasi Kompleksitas:** 🟡 Sedang

### 8.1 Riset Enkripsi PDF

Evaluasi dukungan `lopdf` untuk enkripsi:
- RC4 40-bit / 128-bit
- AES 128-bit / 256-bit
- User password vs Owner password

Jika `lopdf` tidak mendukung, evaluasi crate `pdf` atau `qpdf` CLI.

### 8.2 Implementasi — Protect PDF

Buat `converters/pdf_protect.rs`:
- Input: PDF + user password + owner password (opsional) + permissions.
- Output: PDF terenkripsi.
- Unit test: 3 skenario.

### 8.3 Implementasi — Unlock PDF

Buat `converters/pdf_unlock.rs`:
- Input: PDF terenkripsi + password.
- Output: PDF tanpa enkripsi.
- Unit test: 3 skenario (password benar, password salah, PDF tidak terenkripsi).

### 8.4 Frontend — Dua Tool

- **Protect PDF:** Input password, konfirmasi password, pilihan permissions.
- **Unlock PDF:** Input password, validasi.
- Ubah kedua tool → `isAvailable: true`.

**Acceptance Criteria Fase 8:**
- [ ] Protect PDF berhasil mengunci dengan password
- [ ] Unlock PDF berhasil membuka dengan password yang benar
- [ ] Password salah → error yang jelas
- [ ] 6 unit test total (3 per tool) lulus

**Git checkpoint:**
```powershell
git add .
git commit -m "feat: add Protect & Unlock PDF tools"
```

---

# FASE 9 — Watermark PDF (watermark-pdf)

**Tujuan:** Menambahkan watermark teks atau gambar pada setiap halaman PDF.

**Estimasi Kompleksitas:** 🟡 Sedang

### 9.1 Implementasi Rust Converter

Buat `converters/pdf_watermark.rs`:
- **Watermark Teks:** Overlay teks diagonal (misal: "CONFIDENTIAL", "DRAFT") pada content stream.
- **Watermark Gambar (v2.x):** Overlay gambar PNG transparan (opsional, bisa ditunda).
- Opsi: teks, ukuran font, warna, opacity, posisi (center/diagonal).
- Unit test:
  1. ✅ Watermark teks ditambahkan ke semua halaman.
  2. ✅ PDF multi-halaman → watermark di setiap halaman.
  3. ✅ PDF tidak valid → error.

### 9.2 Frontend

Panel opsi:
- Teks watermark (input text)
- Ukuran font: Small / Medium / Large
- Opacity: 10% / 25% / 50%
- Posisi: Center / Diagonal

**Acceptance Criteria Fase 9:**
- [ ] Watermark teks muncul di output PDF
- [ ] 3 unit test lulus

**Git checkpoint:**
```powershell
git add .
git commit -m "feat: add Watermark PDF tool (watermark-pdf)"
```

---

# FASE 10 — Image Tools: Compress, Convert, Resize

**Tujuan:** Menambahkan 3 tool image processing sekaligus (menggunakan engine `image` crate yang sama).

**Estimasi Kompleksitas:** 🟢 Rendah (engine `image` crate sudah ada di v1.0)

### 10.1 Implementasi Rust — Compress Image

Buat `converters/image_compress.rs`:
- Re-encode dengan quality tuning: JPEG quality (1-100), PNG optimization level.
- Input: path gambar + quality level (low/medium/high).
- Output: gambar terkompresi + statistik ukuran.

### 10.2 Implementasi Rust — Convert Image

Buat `converters/image_convert.rs`:
- Transcode antar format: JPG ↔ PNG ↔ WEBP ↔ BMP ↔ TIFF.
- Input: path gambar + target format.
- Output: gambar dalam format baru.

### 10.3 Implementasi Rust — Resize Image

Buat `converters/image_resize.rs`:
- Resize ke dimensi spesifik (width × height) atau persentase.
- Jaga aspect ratio (opsi: fit-inside / stretch / crop).
- Filter: Lanczos3 (kualitas tinggi) / CatmullRom (cepat).

### 10.4 Tauri Commands & Frontend

Tambahkan 3 Tauri commands dan 3 workspace UI:
- **Compress:** Slider quality + tampilan statistik kompresi.
- **Convert:** Dropdown format target.
- **Resize:** Input dimensi (px) atau persentase + opsi maintain aspect ratio.

### 10.5 Testing

Unit test: 3 per tool = 9 test total.

**Acceptance Criteria Fase 10:**
- [ ] Compress Image mengurangi ukuran file
- [ ] Convert Image menghasilkan format yang benar
- [ ] Resize Image menghasilkan dimensi yang tepat
- [ ] 9 unit test lulus
- [ ] Semua fitur sebelumnya tetap berjalan

**Git checkpoint:**
```powershell
git add .
git commit -m "feat: add Image tools (compress, convert, resize)"
```

---

# FASE 11 — HTML to PDF (html-to-pdf)

**Tujuan:** Mengonversi berkas HTML lokal menjadi PDF dengan CSS styling yang dipertahankan.

**Estimasi Kompleksitas:** 🟡 Sedang

### 11.1 Riset & Evaluasi Engine

- **Opsi A:** WebView2 `print-to-pdf` API (sudah tersedia karena Tauri menggunakan WebView2).
- **Opsi B:** `wkhtmltopdf` CLI (bundled/external).
- **Opsi C:** Headless Chromium print.

PoC di `poc-converters/`.

### 11.2 Implementasi

Buat `converters/html_to_pdf.rs`:
- Input: path HTML + opsi (page size: A4/Letter, margin, orientation).
- Output: path PDF.
- Unit test: 3 skenario.

### 11.3 Frontend

Panel opsi: ukuran kertas (A4/Letter), margin, orientasi (portrait/landscape).

**Acceptance Criteria Fase 11:**
- [ ] HTML dengan CSS → PDF yang rapi
- [ ] 3 unit test lulus

**Git checkpoint:**
```powershell
git add .
git commit -m "feat: add HTML to PDF converter (html-to-pdf)"
```

---

# FASE 12 — Markdown to PDF (markdown-to-pdf)

**Tujuan:** Merender berkas Markdown (.md) menjadi dokumen PDF yang diformat dengan cantik.

**Estimasi Kompleksitas:** 🟢 Rendah (pipeline: MD → HTML → PDF, reuse Fase 11)

### 12.1 Implementasi

Buat `converters/markdown_to_pdf.rs`:
- Tambahkan dependency `pulldown-cmark` di `Cargo.toml`.
- Pipeline: Parse MD → Generate HTML (dengan CSS styling) → Konversi ke PDF (reuse engine Fase 11).
- Unit test: 3 skenario.

### 12.2 Frontend

- Minimal opsi: tema styling (GitHub-style / minimal).
- Ubah `markdown-to-pdf` → `isAvailable: true`.

**Acceptance Criteria Fase 12:**
- [ ] Markdown dengan heading, list, code block → PDF yang rapi
- [ ] 3 unit test lulus

**Git checkpoint:**
```powershell
git add .
git commit -m "feat: add Markdown to PDF converter (markdown-to-pdf)"
```

---

# FASE 13 — Regression Testing & Stabilitas

**Tujuan:** Menjalankan pengujian menyeluruh seluruh 19 fitur dan memastikan stabilitas.

**Estimasi Kompleksitas:** 🟡 Sedang

### 13.1 Regression Test Suite

Jalankan `cargo test` dan pastikan **SEMUA** test (lama + baru) lulus:
- Test v1.0: 15 skenario asli
- Test v1.1: ~45 skenario baru (3 per fitur × 15 fitur)
- **Total target: ~60 unit test lulus**

### 13.2 Manual Testing Checklist

Test manual untuk setiap fitur:
- [ ] Merge PDF
- [ ] Split PDF
- [ ] Image to PDF
- [ ] Word to PDF
- [ ] PDF to Word
- [ ] PDF to Image
- [ ] Compress PDF
- [ ] Excel to PDF
- [ ] PowerPoint to PDF
- [ ] PDF to Excel
- [ ] Rotate PDF
- [ ] Protect PDF
- [ ] Unlock PDF
- [ ] Watermark PDF
- [ ] Compress Image
- [ ] Convert Image
- [ ] Resize Image
- [ ] HTML to PDF
- [ ] Markdown to PDF

### 13.3 Performance Benchmark

Ukur waktu konversi setiap tool dan dokumentasikan.

### 13.4 Buat Laporan

Buat `docs/v1.1-expansion/03-TEST_REPORT.md` dengan format tabel hasil pengujian.

**Acceptance Criteria Fase 13:**
- [ ] ~60 unit test lulus tanpa failure
- [ ] 19 fitur diuji manual dan berfungsi
- [ ] Laporan test tersusun

**Git checkpoint:**
```powershell
git add .
git commit -m "test: v1.1 comprehensive regression testing"
```

---

# FASE 14 — Build, Packaging & Release Notes

**Tujuan:** Membangun installer v1.1 dan menyusun dokumentasi rilis.

### 14.1 Update Versi

- `tauri.conf.json`: ubah `version` ke `"1.1.0"`.
- `package.json`: ubah `version` ke `"1.1.0"`.
- `Cargo.toml`: ubah `version` ke `"1.1.0"`.
- Sidebar footer: ubah ke `v1.1.0 • Expansion`.

### 14.2 Build Produksi

```powershell
cd D:\Konverter\converter-desktop
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
npm run tauri build
```

Verifikasi artefak:
- `File Converter Desktop_1.1.0_x64-setup.exe`
- `File Converter Desktop_1.1.0_x64_en-US.msi`
- `converter-desktop.exe`

### 14.3 Release Notes

Buat `docs/v1.1-expansion/04-RELEASE_NOTES.md` mencakup:
- Daftar 15 fitur baru
- Panduan instalasi / upgrade
- Known limitations
- Ukuran installer

### 14.4 Update README.md

Perbarui `README.md` di root project:
- Tambahkan fitur v1.1 ke daftar fitur
- Update tabel benchmark
- Update link dokumentasi ke folder `docs/`

**Acceptance Criteria Fase 14:**
- [ ] Installer v1.1.0 berhasil dibuild
- [ ] Installer dapat dipasang dan dijalankan
- [ ] Release notes lengkap
- [ ] README.md diperbarui

**Git checkpoint:**
```powershell
git add .
git commit -m "release: v1.1.0 — 15 new conversion tools"
git tag v1.1.0
```

---

# RINGKASAN FASE

| Fase | Fitur | Kompleksitas | Dependensi Fase |
|:---:|---|:---:|:---:|
| **1** | PDF to Word | 🟡 | — |
| **2** | PDF to Image | 🟡 | — |
| **3** | Compress PDF | 🟡 | — |
| **4** | Excel to PDF | 🟢 | — |
| **5** | PowerPoint to PDF | 🟢 | Fase 4 (reuse pattern) |
| **6** | PDF to Excel | 🔴 | — |
| **7** | Rotate PDF | 🟢 | — |
| **8** | Protect & Unlock PDF | 🟡 | — |
| **9** | Watermark PDF | 🟡 | — |
| **10** | Image Tools (3 fitur) | 🟢 | — |
| **11** | HTML to PDF | 🟡 | — |
| **12** | Markdown to PDF | 🟢 | Fase 11 (reuse engine) |
| **13** | Regression Testing | 🟡 | Fase 1–12 |
| **14** | Build & Release | 🟢 | Fase 13 |

> **Total: 14 fase → 15 fitur baru → ~60 unit test baru → Rilis v1.1.0**

