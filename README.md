# Rooms — Fokus, Karya, Tulisan

## Deploy (±10 menit)
1. Push folder ini ke GitHub, lalu Import di Vercel.
2. Vercel > Storage / Marketplace > tambah **Upstash Redis**, connect ke project (env DB terisi otomatis).
3. Vercel > Settings > Environment Variables, isi semua yang ada di `.env.example`:
   - `SESSION_SECRET` (string acak panjang), `OWNER_CODE` (kode rahasia lu)
   - `GUEST_CODE_WORKS`, `GUEST_CODE_WRITING` (kode untuk tamu)
   - `OWNER_EMAIL` + `RESEND_API_KEY` (notifikasi permintaan akses, resend.com gratis)
4. Redeploy.

## Cara pakai
- **Fokus**: buka /focus, masukkan OWNER_CODE.
- **Karya**: klik "Pemilik" > masukkan OWNER_CODE > "Tambah karya" > tempel link Vercel/GitHub. Pratinjau gambar otomatis.
- **Tulisan**: "Pemilik" > "Tulis baru" (opini / fiksi).
- Tamu: masukkan kode tamu, atau "Minta izin" > email masuk ke lu > klik Setujui > halaman tamu otomatis terbuka.

Ganti nama di `lib/config.js`. Warna ruang juga di situ.
