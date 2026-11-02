# TAHAP 3 — TECHNICAL PLANNING
## File Converter Desktop

Dokumen ini digunakan setelah **Product Brief** dan **PRD** selesai. Tujuannya adalah menerjemahkan kebutuhan produk menjadi rancangan teknis yang siap dijadikan acuan saat project setup dan development.

> **Catatan:** Tahap ini fokus pada perencanaan. Jangan mulai membangun fitur aplikasi atau membuat implementasi besar sebelum hasil technical planning ditinjau dan disetujui.

---

# 1. Informasi Project

| Item | Keputusan |
|---|---|
| Nama project | File Converter Desktop |
| Target platform | Windows 10/11 64-bit |
| Arsitektur aplikasi | Desktop, local/offline-first |
| Frontend | React + TypeScript + Vite |
| Desktop framework | Tauri 2 |
| Backend lokal | Rust |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| State management | Zustand |
| HTTP client | Tidak diperlukan untuk MVP |
| Server / cloud | Tidak ada untuk MVP |
| Database | Tidak ada untuk MVP |

Gunakan PRD sebagai sumber kebutuhan utama. Jika ada informasi yang belum ditentukan, tuliskan sebagai asumsi atau keputusan yang perlu dikonfirmasi. Jangan mengarang kebutuhan baru.

---

# 2. Tujuan Technical Planning

Technical planning harus menghasilkan rancangan yang:

- Sesuai dengan kebutuhan MVP pada PRD.
- Sederhana dan realistis untuk dikerjakan solo developer.
- Memisahkan UI, application logic, dan proses file/conversion.
- Memanfaatkan kemampuan Tauri dan Rust secara tepat.
- Meminimalkan dependency yang tidak diperlukan.
- Dapat dikembangkan tanpa membuat arsitektur terlalu kompleks.
- Memperhatikan keamanan akses file, error handling, dan distribusi Windows.

---

# 3. Ruang Lingkup yang Harus Dianalisis

## 3.1 Arsitektur Aplikasi

Tentukan bagaimana bagian-bagian aplikasi berkomunikasi:

- React menangani UI dan interaksi pengguna.
- Zustand menyimpan state UI dan status pekerjaan yang diperlukan.
- Tauri command menjadi jembatan antara frontend dan Rust.
- Rust menangani akses file dan proses yang membutuhkan kemampuan native.
- Conversion engine/library menangani konversi format.

Buat diagram arsitektur sederhana dan jelaskan alur komunikasi frontend → Tauri command → Rust/service → conversion engine → output file.

Hindari menempatkan seluruh logic di satu file atau membuat layer abstraksi yang belum dibutuhkan.

## 3.2 Struktur Folder

Rancang struktur folder untuk frontend dan Rust yang mudah dipahami dan dirawat.

Pertimbangkan pemisahan berikut:

- `components/`: komponen UI reusable.
- `features/`: fitur berdasarkan domain aplikasi.
- `stores/`: Zustand stores.
- `lib/`: helper dan konfigurasi frontend.
- `types/`: tipe TypeScript bersama.
- `src-tauri/src/commands/`: Tauri commands.
- `src-tauri/src/services/`: logic aplikasi/backend.
- `src-tauri/src/converters/`: adapter atau implementasi conversion engine.
- `src-tauri/src/models/`: struktur data Rust.

Struktur di atas hanya usulan awal. Sesuaikan berdasarkan kebutuhan nyata dan hindari membuat folder kosong atau terlalu banyak layer.

## 3.3 Analisis Conversion Engine

Analisis kelayakan setiap fitur MVP dan pilihan engine/library yang mungkin digunakan.

| Fitur | Analisis yang diperlukan |
|---|---|
| Word → PDF | Evaluasi kebutuhan LibreOffice atau engine lain, dependensi runtime, kualitas hasil, dan distribusi |
| Image → PDF | Evaluasi library Rust yang sesuai, dukungan format gambar, orientasi, ukuran halaman, dan kualitas |
| Merge PDF | Evaluasi library PDF, preservasi halaman, metadata, dan batasan kompatibilitas |
| Split PDF | Evaluasi library PDF, pemilihan rentang halaman, dan validasi output |

Untuk setiap opsi, catat:

1. Nama library/tool dan sumber resminya.
2. Bahasa/runtime yang dibutuhkan.
3. Lisensi dan implikasi distribusi.
4. Apakah dapat berjalan offline.
5. Apakah membutuhkan instalasi tambahan.
6. Ukuran tambahan pada installer jika dapat diperkirakan.
7. Kualitas dan batasan hasil konversi.
8. Risiko teknis dan alternatif.

Jangan menyatakan sebuah library mendukung fitur tertentu sebelum memeriksa dokumentasi resminya. Jika belum dapat dipastikan, tandai sebagai **perlu PoC**.

### Prioritas kelayakan

- **P0:** Word → PDF, Image → PDF, Merge PDF, Split PDF.
- **P1:** PDF → Image dan PDF → Word. Jangan masukkan ke implementasi MVP sebelum kelayakan dan kualitasnya terbukti.
- Fitur lain tetap di luar scope sampai ada keputusan baru.

## 3.4 Desain Alur Konversi

Rancang alur umum yang dapat digunakan ulang:

1. Pengguna memilih tool.
2. Pengguna memilih file input.
3. Aplikasi memvalidasi file dan format.
4. Pengguna menentukan opsi dan lokasi output.
5. Frontend mengirim permintaan ke Tauri command.
6. Backend memvalidasi ulang input dan menjalankan proses.
7. Backend mengembalikan hasil atau error.
8. UI menampilkan status dan menyediakan aksi membuka file/folder.

Jelaskan bagaimana menangani:
- File tidak ditemukan atau tidak dapat dibaca.
- Format tidak didukung.
- File rusak atau terenkripsi.
- Output sudah ada.
- Izin akses ditolak.
- Proses gagal atau dibatalkan.
- File input dan output memiliki path yang sama.
- File berukuran besar.

## 3.5 Kontrak Frontend dan Backend

Rancang kontrak command Tauri sebelum implementasi.

Untuk setiap command, dokumentasikan:
- Nama command.
- Tujuan.
- Parameter input.
- Bentuk hasil sukses.
- Bentuk error.
- Validasi yang dilakukan.
- Apakah proses berpotensi berjalan lama.

Minimal analisis command untuk:
- Memilih atau memvalidasi file jika memang diperlukan oleh API Tauri.
- Word → PDF.
- Image → PDF.
- Merge PDF.
- Split PDF.
- Membuka file hasil.
- Membuka folder output.

Gunakan tipe data yang jelas. Hindari mengirim objek yang terlalu besar atau data file dalam bentuk base64 jika path file dapat digunakan dengan aman.

Tentukan apakah progress membutuhkan event Tauri. Jangan membuat sistem progress kompleks jika engine yang dipilih tidak menyediakan informasi progress yang akurat. Jika tidak tersedia, gunakan status sederhana seperti `queued`, `processing`, `completed`, dan `failed`.

## 3.6 State Management

Tentukan state mana yang perlu dikelola Zustand, misalnya:

- Tool yang sedang aktif.
- Daftar file input sementara.
- Pengaturan konversi.
- Status pekerjaan konversi.
- Hasil dan pesan error.

Pisahkan state UI dari proses backend. Jangan menyimpan isi file atau data besar di Zustand. Jelaskan kapan state dihapus/reset dan apakah state perlu bertahan setelah aplikasi ditutup. Untuk MVP, jangan menambahkan persistence tanpa kebutuhan jelas.

## 3.7 Keamanan dan Pengelolaan File

Tentukan aturan dasar:

- Proses file secara lokal.
- Jangan mengunggah file ke server.
- Validasi path dan tipe file di backend, bukan hanya frontend.
- Jangan menimpa file secara diam-diam.
- Hindari menghapus atau mengubah file sumber.
- Gunakan API dialog/filesystem Tauri sesuai permission/capability yang diperlukan.
- Batasi akses filesystem sesuai kebutuhan aplikasi.
- Jangan menjalankan command shell dari input pengguna.
- Jika menggunakan executable eksternal, tentukan cara memanggilnya dengan aman dan memvalidasi path-nya.

## 3.8 Error Handling dan Logging

Rancang format error yang konsisten untuk frontend dan backend.

Minimal kelompok error:
- `INVALID_INPUT`
- `UNSUPPORTED_FORMAT`
- `FILE_NOT_FOUND`
- `FILE_ACCESS_DENIED`
- `OUTPUT_ALREADY_EXISTS`
- `CONVERSION_FAILED`
- `DEPENDENCY_NOT_FOUND`
- `PROCESS_CANCELLED`
- `UNKNOWN_ERROR`

Tentukan pesan yang ramah untuk pengguna dan detail teknis yang aman untuk debugging. Jangan menampilkan stack trace atau informasi internal mentah kepada pengguna.

Untuk MVP, logging lokal sederhana sudah cukup. Jangan menambahkan telemetry atau layanan monitoring cloud.

## 3.9 Testing Strategy

Tentukan pengujian minimum:

- Unit test untuk validasi dan fungsi helper.
- Integration test untuk conversion service jika memungkinkan.
- Pengujian manual pada file contoh yang valid dan tidak valid.
- Pengujian file besar dan nama/path dengan spasi atau karakter non-ASCII.
- Pengujian output sudah ada dan izin folder ditolak.
- Pengujian aplikasi tetap berjalan setelah conversion error.
- Pengujian offline setelah aplikasi terpasang.

Buat daftar file uji yang diperlukan tanpa menyertakan dokumen pribadi atau data sensitif.

## 3.10 Packaging dan Distribusi

Analisis kebutuhan build Windows:

- Target installer Windows 10/11 64-bit.
- Dependensi runtime yang harus disertakan.
- Cara mendistribusikan LibreOffice atau executable eksternal jika dipilih.
- Ukuran installer dan dampaknya.
- Lokasi penyimpanan file sementara.
- Pembersihan file sementara.
- Penanganan upgrade dan uninstall.
- Lisensi semua dependency yang didistribusikan.

Jangan menganggap dependency yang tersedia di komputer developer otomatis tersedia di komputer pengguna.

---

# 4. Output yang Wajib Dihasilkan

Simpan hasil tahap ini ke folder `docs/technical/` (buat folder jika belum ada).

Buat dokumen berikut:

| File | Isi |
|---|---|
| `technical-plan.md` | Ringkasan keputusan teknis, arsitektur, dan alasan pemilihan |
| `architecture.md` | Diagram dan penjelasan komponen serta alur data |
| `folder-structure.md` | Struktur folder yang direkomendasikan dan tanggung jawab tiap folder |
| `conversion-engine-research.md` | Perbandingan engine/library, lisensi, runtime, risiko, dan rekomendasi |
| `tauri-contracts.md` | Daftar command, parameter, return type, error, dan event |
| `testing-strategy.md` | Strategi dan checklist pengujian |
| `technical-decisions.md` | Daftar keputusan, asumsi, alternatif, dan hal yang belum diputuskan |

Jika project belum dibuat, cukup siapkan rancangan struktur folder dalam dokumen. Jangan membuat project hanya demi menampung dokumen.

---

# 5. Acceptance Criteria

Tahap 3 dianggap selesai jika:

- [ ] Semua kebutuhan teknis ditelusuri kembali ke PRD.
- [ ] Arsitektur frontend, Tauri, Rust, dan conversion engine dijelaskan.
- [ ] Struktur folder sudah dirancang dan setiap bagian memiliki tanggung jawab.
- [ ] Engine untuk setiap fitur P0 sudah diteliti dan rekomendasinya disertai alasan.
- [ ] Risiko LibreOffice atau dependency eksternal dijelaskan.
- [ ] Kontrak command frontend-backend sudah dirancang.
- [ ] State management sudah ditentukan tanpa over-engineering.
- [ ] Strategi validasi file, keamanan, dan error handling tersedia.
- [ ] Testing dan packaging Windows sudah direncanakan.
- [ ] Semua asumsi dan hal yang perlu PoC ditandai dengan jelas.
- [ ] Tidak ada implementasi fitur besar yang dilakukan pada tahap ini.

---

# 6. PROMPT EKSEKUSI UNTUK AI CODING ASSISTANT

Salin prompt berikut ke AI coding assistant di root folder project atau workspace yang berisi dokumen Product Brief dan PRD.

---

## PROMPT — EXECUTE STAGE 3: TECHNICAL PLANNING

Saya ingin menjalankan **Tahap 3 — Technical Planning** untuk project File Converter Desktop.

Baca dan gunakan dokumen berikut sebagai sumber utama jika tersedia:

1. Product Brief.
2. PRD.
3. File `STAGE_3_TECHNICAL_PLANNING.md` ini.

### Konteks project

- Target: Windows 10/11 64-bit.
- Aplikasi desktop local/offline-first.
- Tauri 2.
- Rust untuk backend lokal.
- React + TypeScript + Vite untuk frontend.
- Tailwind CSS dan shadcn/ui.
- Zustand untuk state management.
- Tidak menggunakan server, cloud, authentication, database, AI, atau monetization pada MVP.
- Axios tidak diperlukan kecuali ditemukan kebutuhan HTTP yang benar-benar relevan.

### Instruksi kerja

1. **Periksa workspace terlebih dahulu.**
   - Tampilkan struktur folder dan file yang relevan.
   - Cari Product Brief dan PRD.
   - Jangan mengasumsikan nama atau lokasi file.
   - Jika dokumen sumber tidak ditemukan, berhenti dan minta saya menyediakan dokumen tersebut.

2. **Pelajari kebutuhan produk.**
   - Rangkum kebutuhan P0, P1, dan out of scope.
   - Catat kebutuhan yang berdampak pada keputusan teknis.
   - Jangan menambahkan fitur baru tanpa dasar dari PRD.

3. **Lakukan technical research.**
   - Periksa dokumentasi resmi Tauri 2, Rust, dan library/engine yang dipertimbangkan.
   - Utamakan dokumentasi resmi dan informasi lisensi dari sumber pemilik project.
   - Verifikasi dukungan fitur, status pemeliharaan, lisensi, kebutuhan runtime, dan batasan distribusi.
   - Jangan mengarang kemampuan library atau menyimpulkan dukungan hanya dari nama package.
   - Tandai informasi yang belum terverifikasi sebagai `NEEDS_VERIFICATION`.

4. **Rancang arsitektur.**
   - Buat arsitektur sederhana yang cocok untuk solo developer.
   - Jelaskan tanggung jawab React, Zustand, Tauri commands, Rust services, dan conversion engines.
   - Rancang alur data dan komunikasi frontend-backend.
   - Hindari microservices, plugin system, dependency injection framework, event bus, atau abstraksi kompleks yang belum diperlukan.

5. **Analisis conversion engine.**
   - Analisis Word → PDF, Image → PDF, Merge PDF, dan Split PDF.
   - Bandingkan opsi engine/library berdasarkan kualitas, lisensi, offline support, runtime, ukuran distribusi, dan kompleksitas.
   - Berikan satu rekomendasi utama dan alternatif untuk tiap fitur.
   - Jika perlu executable eksternal seperti LibreOffice, jelaskan cara packaging dan pemanggilan yang aman.
   - Jangan mulai implementasi conversion engine. Buat daftar PoC yang perlu dilakukan pada tahap berikutnya.

6. **Rancang kontrak backend.**
   - Tentukan nama command Tauri, parameter, return type, error code, dan kebutuhan event progress.
   - Gunakan struktur data yang konsisten dan mudah dipahami.
   - Jangan menggunakan base64 untuk memindahkan file jika path file dapat digunakan dengan aman.
   - Validasi file harus dilakukan di backend juga.

7. **Rancang state dan struktur folder.**
   - Tentukan state minimal yang dikelola Zustand.
   - Pisahkan UI, fitur, service, command, dan conversion logic secara proporsional.
   - Jangan membuat folder atau layer yang belum memiliki kebutuhan nyata.

8. **Rancang keamanan, error handling, testing, dan packaging.**
   - Pastikan file diproses lokal dan file sumber tidak diubah.
   - Tentukan strategi mencegah overwrite tanpa persetujuan.
   - Tentukan error yang ditampilkan kepada pengguna.
   - Rancang test case minimum dan kebutuhan installer Windows.

9. **Buat dokumen hasil.**
   - Simpan semua output ke `docs/technical/`.
   - Buat seluruh file yang tercantum pada bagian Output yang Wajib Dihasilkan.
   - Gunakan Markdown yang ringkas, jelas, dan konsisten.
   - Sertakan diagram Mermaid jika membantu menjelaskan arsitektur atau alur.
   - Sertakan sumber/referensi untuk keputusan yang membutuhkan verifikasi eksternal.

10. **Lakukan review konsistensi.**
    - Pastikan rancangan tidak bertentangan dengan PRD.
    - Tandai keputusan yang masih membutuhkan persetujuan saya.
    - Pisahkan keputusan final, rekomendasi, asumsi, dan pertanyaan terbuka.
    - Jangan lanjut ke project setup atau coding fitur.

### Aturan penting

- Kerjakan hanya Tahap 3.
- Jangan mengubah atau menghapus dokumen Product Brief dan PRD.
- Jangan menginisialisasi project baru.
- Jangan menginstal dependency.
- Jangan membuat implementasi frontend atau backend.
- Jangan melakukan perubahan source code yang tidak diperlukan.
- Jangan mengarang hasil pengujian.
- Jika ada keputusan penting yang belum jelas, tulis sebagai pertanyaan terbuka, jangan menebak.
- Prioritaskan MVP, kesederhanaan, maintainability, dan kebutuhan solo developer.

### Format laporan akhir

Setelah selesai, laporkan:

1. Dokumen yang berhasil dibuat.
2. Ringkasan arsitektur yang direkomendasikan.
3. Rekomendasi conversion engine per fitur P0.
4. Dependency dan runtime eksternal yang dibutuhkan.
5. Risiko teknis utama.
6. Keputusan yang masih membutuhkan persetujuan.
7. Daftar PoC yang harus dilakukan berikutnya.
8. Konfirmasi bahwa belum ada implementasi fitur atau instalasi dependency.

**Berhenti setelah Technical Planning selesai. Tunggu instruksi saya sebelum melanjutkan ke tahap berikutnya.**

---

# 7. Urutan Penggunaan

1. Pastikan Product Brief dan PRD sudah tersedia.
2. Simpan dokumen ini dengan nama `STAGE_3_TECHNICAL_PLANNING.md`.
3. Buka workspace project di AI coding assistant.
4. Tempel prompt pada bagian **Prompt Eksekusi**.
5. Periksa hasil riset dan keputusan teknis.
6. Minta revisi jika ada keputusan yang tidak sesuai.
7. Setelah disetujui, lanjutkan ke tahap UI/UX Design atau Project Bootstrap sesuai urutan kerja yang dipilih.

**Jangan langsung menjalankan coding hanya karena dokumen technical planning sudah dibuat.** Khusus pilihan conversion engine, lakukan PoC terlebih dahulu untuk membuktikan hasil konversi dan kebutuhan distribusinya.
