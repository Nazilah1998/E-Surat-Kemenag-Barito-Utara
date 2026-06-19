# PRD: E-Surat Kemenag

## 1. Ringkasan Proyek

| Item | Detail |
|------|--------|
| **Nama** | E-Surat Kemenag |
| **Tujuan** | Website mandiri untuk manajemen surat masuk & surat keluar, terpisah dari PTSP |
| **Target User** | Admin internal Kemenag Barito Utara |
| **Akses** | Full private — semua halaman wajib login |

## 2. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Bahasa** | TypeScript |
| **Database** | Supabase PostgreSQL (instance SAMA dengan PTSP) |
| **ORM** | Drizzle ORM + node-postgres |
| **Auth** | Supabase Auth (email/password) |
| **Storage** | Supabase Storage (bucket surat-lampiran) |
| **UI** | Tailwind CSS v4, lucide-react, framer-motion, sonner |
| **Sync** | Google Sheets API (ke sheet yang sama) |

## 3. Database

- Connect ke Supabase instance yang SAMA dengan PTSP
- Tabel `ptsp_surat_masuk` & `ptsp_surat_keluar` di schema `kemenag_ptsp`
- Tabel `auth.users` & `ptsp_profiles` untuk auth
- Storage bucket `surat-lampiran` untuk upload file

## 4. Auth & Role

| Role | Akses |
|------|-------|
| admin | Full CRUD |
| user | View-only (read) |

- Login page `/login`
- Middleware proteksi semua route admin
- Session via Supabase SSR

## 5. Fitur

### Surat Masuk
- [x] List tabel + search + filter tanggal
- [x] Create / Edit / Detail / Soft delete
- [x] Upload lampiran (PDF/jpg/png, max 5MB)
- [x] CSV Export
- [x] Google Sheets sync

### Surat Keluar
- [x] List tabel + search + filter tanggal
- [x] Create / Edit / Detail / Soft delete
- [x] Upload lampiran
- [x] CSV Export
- [x] Google Sheets sync

### Dashboard
- [x] Ringkasan jumlah surat masuk/keluar

### Audit Log
- [x] Catat semua aktivitas (create/update/delete)

## 6. Milestones

| Phase | Isi |
|-------|-----|
| 1 | Setup project + Auth + Middleware |
| 2 | Surat Masuk (CRUD + upload + filter + export) |
| 3 | Surat Keluar (CRUD + upload + filter + export) |
| 4 | Dashboard + Sheets sync + Audit Log |
| 5 | Deployment VPS |
