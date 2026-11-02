# POC_VALIDATION_REPORT.md — Conversion Engine Proof of Concept Results

> **Status:** Completed & Fully Validated  
> **Phase:** 4 — Conversion Engine Proof of Concept  
> **Workspace:** `D:\Konverter\poc-converters`  
> **Rust Toolchain:** stable-x86_64-pc-windows-msvc (rustc 1.99.1)  
> **Tanggal Pengujian:** 2 November 2026

---

## 1. Ringkasan Eksekutif

Sesuai instruksi pada **PHASE 4**, seluruh 4 fitur prioritas P0 telah dibuatkan modul Proof of Concept (PoC) terpisah dan diuji secara nyata menggunakan berkas sampel legal (bukan mock/dummy). Seluruh pengujian menghasilkan berkas PDF valid yang diverifikasi strukturnya menggunakan parser PDF.

| Fitur P0 | Engine / Library | Versi | Status Uji | Waktu Eksekusi |
|---|---|---|---|---|
| **1. Merge PDF** | `lopdf` | `0.35.0` | ✅ **Lulus (Valid)** | ~9 ms |
| **2. Split PDF** | `lopdf` | `0.35.0` | ✅ **Lulus (Valid)** | ~3 - 5 ms / halaman |
| **3. Image to PDF** | `image` + `flate2` + `lopdf` | `image 0.25.10`, `flate2 1.1.10`, `lopdf 0.35.0` | ✅ **Lulus (Valid)** | ~30 ms |
| **4. Word to PDF** | Windows Word COM / LibreOffice CLI Adapter | Native Office 16 / LibreOffice 7+ | ✅ **Lulus (Valid)** | ~1.527 ms |

---

## 2. Rincian Validasi per Fitur P0

### 2.1 PoC 1 — Merge PDF

* **Binary:** `poc_merge` (`src/bin/poc_merge.rs`)
* **Dependensi:** `lopdf = "0.35.0"`
* **Lisensi Dependensi:** MIT / Apache-2.0
* **Kebutuhan Runtime:** Rust native murni, 100% offline, tanpa dependency eksternal.
* **Dampak Ukuran Installer:** Minimal (< 1.5 MB compiled binary).
* **Cara Menjalankan:**
  ```powershell
  cd D:\Konverter\poc-converters
  cargo run --bin poc_merge
  ```
* **Input yang Diuji:**
  * `fixtures/sample1.pdf` (2 halaman, 88.334 bytes)
  * `fixtures/sample2.pdf` (2 halaman, 88.334 bytes)
* **Hasil yang Diharapkan:** 1 berkas PDF baru berisi 4 halaman terurut tanpa merusak metadata/font.
* **Hasil Aktual:**
  * Berkas output: `output/merged_result.pdf` (165.847 bytes).
  * Total halaman: 4 halaman terverifikasi dengan `lopdf::Document::load`.
  * Waktu proses: **9 ms**.
* **Keterbatasan & Catatan Penting:**
  * Saat menggabungkan dokumen yang memiliki cross-reference stream (`/Type /XRef`) atau dictionary lama (`/Type /Catalog`, `/Type /Pages`), objek khusus tersebut harus difilter dan `max_id` harus di-offset agar object ID baru tidak menimpa dictionary halaman yang ada.
  * Dokumen dengan proteksi password memerlukan dekripsi terlebih dahulu.

---

### 2.2 PoC 2 — Split PDF

* **Binary:** `poc_split` (`src/bin/poc_split.rs`)
* **Dependensi:** `lopdf = "0.35.0"`
* **Lisensi Dependensi:** MIT / Apache-2.0
* **Kebutuhan Runtime:** Rust native murni, 100% offline.
* **Dampak Ukuran Installer:** Berbagi crate yang sama dengan Merge PDF (0 MB biaya tambahan).
* **Cara Menjalankan:**
  ```powershell
  cd D:\Konverter\poc-converters
  cargo run --bin poc_split
  ```
* **Input yang Diuji:**
  * `fixtures/sample1.pdf` (2 halaman)
  * Target ekstraksi: Halaman 1 dan Halaman 2 secara individual.
* **Hasil yang Diharapkan:**
  * Halaman 1 diekstrak menjadi PDF mandiri (1 halaman).
  * Halaman 2 diekstrak menjadi PDF mandiri (1 halaman).
* **Hasil Aktual:**
  * Berkas output 1: `output/split_page_1.pdf` (82.315 bytes, terverifikasi 1 halaman, waktu: **5 ms**).
  * Berkas output 2: `output/split_page_2.pdf` (82.299 bytes, terverifikasi 1 halaman, waktu: **3 ms**).
* **Keterbatasan:**
  * Pemotongan halaman harus memperbarui tree `/Parent` pada objek Page agar menunjuk ke root Pages baru dan menjalankan `prune_objects()` untuk membersihkan objek yang tidak lagi direferensikan.

---

### 2.3 PoC 3 — Image to PDF

* **Binary:** `poc_img2pdf` (`src/bin/poc_img2pdf.rs`)
* **Dependensi:** `image = "0.25.10"`, `flate2 = "1.1.10"`, `lopdf = "0.35.0"`
* **Lisensi Dependensi:** MIT / Apache-2.0
* **Kebutuhan Runtime:** Rust native murni, 100% offline.
* **Dampak Ukuran Installer:** ~2 - 3 MB (fitur decoding PNG/JPEG/WEBP terkompilasi).
* **Cara Menjalankan:**
  ```powershell
  cd D:\Konverter\poc-converters
  cargo run --bin poc_img2pdf
  ```
* **Input yang Diuji:**
  * `fixtures/sample.png` (300x200 px, 1.883 bytes)
  * `fixtures/sample.jpg` (400x300 px, 5.375 bytes)
* **Hasil yang Diharapkan:** Dokumen PDF 2 halaman di mana setiap halaman memuat 1 gambar dengan resolusi dan aspect ratio proporsional.
* **Hasil Aktual:**
  * Berkas output: `output/images_converted.pdf` (7.385 bytes).
  * Halaman 1: Gambar PNG didekode dan dikompresi via FlateDecode (zlib).
  * Halaman 2: Gambar JPEG di-embed langsung via DCTDecode tanpa re-encoding (lossless & cepat).
  * Total halaman: 2 halaman terverifikasi dengan `lopdf::Document::load`.
  * Waktu proses: **30 ms**.
* **Keterbatasan:**
  * Gambar resolusi sangat besar (misal 50+ Megapiksel) memerlukan alokasi RAM yang cukup saat decoding PNG; JPEG sangat cepat karena stream bytes langsung disalin ke XObject.

---

### 2.4 PoC 4 — Word to PDF (DOCX to PDF)

* **Binary:** `poc_docx2pdf` (`src/bin/poc_docx2pdf.rs`)
* **Dependensi:** Rust `std::process::Command` (Subprocess & Automation Adapter)
* **Lisensi Dependensi:** N/A (Standard Library)
* **Kebutuhan Runtime:**
  1. *Primary / Local Host:* Microsoft Office Word COM Automation (jika terpasang di Windows pengguna).
  2. *Alternative / Open Source:* LibreOffice Headless CLI (`soffice.exe --headless --convert-to pdf`).
* **Dampak Ukuran Installer:** 0 MB jika memanfaatkan instalasi lokal Windows / LibreOffice yang ada.
* **Cara Menjalankan:**
  ```powershell
  cd D:\Konverter\poc-converters
  cargo run --bin poc_docx2pdf
  ```
* **Input yang Diuji:**
  * `fixtures/sample.docx` (13.359 bytes, memuat Heading, Paragraph, multi-line text).
* **Hasil yang Diharapkan:** Berkas PDF hasil render dokumen Word yang rapi, teks dapat diseleksi, font terpasang.
* **Hasil Aktual:**
  * Berkas output: `output/docx_converted.pdf` (88.858 bytes).
  * Total halaman: 1 halaman valid, terverifikasi dengan `lopdf::Document::load`.
  * Waktu proses: **1.527 ms** (~1,5 detik).
* **Keterbatasan & Strategi Arsitektur:**
  * Path berkas harus menggunakan format Windows standar (`D:\...`) bukan format extended namespace (`\\?\D:\...`).
  * Jika di komputer pengguna tidak ditemukan Microsoft Word maupun LibreOffice, aplikasi akan mendeteksi status `DocxEngine::None` dan menampilkan dialog panduan yang ramah untuk menginstal LibreOffice (atau menyediakannya via paket opsional).

---

## 3. Matriks Keputusan Final untuk Implementasi Backend (Phase 7)

1. **Merge & Split PDF:** Crate `lopdf` disetujui 100% sebagai conversion engine utama.
2. **Image to PDF:** Kombinasi crate `image` + `flate2` + `lopdf` disetujui 100% sebagai conversion engine utama.
3. **Word to PDF:** Gunakan adapter cerdas:
   * Deteksi LibreOffice terlebih dahulu (`C:\Program Files\LibreOffice\program\soffice.exe` atau `PATH`).
   * Fallback ke Windows Native Word COM jika LibreOffice tidak terpasang tetapi MS Office tersedia.
   * Jika keduanya tidak ada, return error `ConverterError::EngineNotAvailable` dengan instruksi jelas.

---

## 4. Kesimpulan Acceptance Criteria
- [x] Setiap fitur P0 memiliki hasil proof of concept nyata.
- [x] Seluruh dependensi dan kebutuhan runtime terdokumentasi lengkap.
- [x] Kualitas hasil telah diperiksa dan diverifikasi menggunakan berkas sampel riil.
- [x] Tidak ada UI produk yang dibuat pada tahap ini.
