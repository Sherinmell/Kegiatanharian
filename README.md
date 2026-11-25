# HarianKu

Aplikasi web gaya hidup & kebutuhan rumah tangga harian berbasis **Nuxt 4**, **TypeScript**, **Pinia**, **Tailwind CSS**, **@vueuse/core**, dan **TiDB Cloud**.

## Fitur Utama

1. **Generator Menu Makan Harian ("Masak Apa?")**
   - Input bahan sisa di kulkas (tag input + pilihan cepat), batas waktu masak, dan preferensi bujet.
   - Rekomendasi otomatis **Sarapan, Makan Siang, dan Makan Malam** dari 54+ resep rumahan Indonesia lengkap dengan bahan, takaran belanja praktis, dan langkah cara memasak.
   - **Mode Tanpa Tambahan Bahan Lain** untuk masakan yang bisa langsung dibuat hanya dari bahan kulkas.
   - **Mode Masak Fokus** dengan timer masak, checklist langkah, dan pilih slot waktu bebas.
   - **Paket 3x Makan Sesuai Uang Bulanan** yang sinkron otomatis dengan Jajan Tracker.
   - Tambah resep kustom sendiri.

2. **Pengingat Tugas Berkala Rumah Tangga (Micro-Chores Tracker)**
   - Indikator visual dinamis (**Hijau > 50%**, **Kuning 20–50%**, **Merah < 20% / terlewat**).
   - Aksi 1-klik **"Selesai Hari Ini"** untuk reset timer otomatis, plus tambah tugas kustom dengan interval hari bebas.

3. **Daily Expense "Jajan" Tracker (1-Klik & Smart Parser)**
   - Smart Text Parser natural (`25rb kopi`, `15000 parkir`, `12.5k gorengan`, `50rb makan siang`).
   - Kalkulator otomatis **"Jatah Jajan Aman Hari Ini"** dari sisa uang bulanan dibagi sisa hari bulan berjalan.

4. **Sinkronisasi Database TiDB Cloud**
   - Penyimpanan otomatis ke TiDB Cloud via Nuxt Server API (`/api/*`) dengan cache lokal `localStorage`.

## Setup Lokal

1. Salin konfigurasi environment:
   ```bash
   cp .env.example .env
   ```
   Isi kredensial TiDB Cloud pada file `.env`.

2. Install dependensi:
   ```bash
   npm install
   ```

3. Setup tabel & data awal di TiDB Cloud:
   ```bash
   npm run db:setup
   ```

4. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
