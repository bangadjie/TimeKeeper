# Time Keeper

Time keeper hitung mundur untuk acara, presentasi, perlombaan, dan sesi fokus.
Tanpa login — buka halaman utama dan timer langsung siap dipakai.

## Menjalankan

```bash
npm run dev    # pengembangan
npm run build  # build produksi
npm start      # menjalankan hasil build
```

Buka [http://localhost:3000](http://localhost:3000).

## Fitur

- Hitung mundur besar dengan angka monospace `tabular-nums` agar digit tidak bergeser.
- Preset cepat 5/10/15/30 menit, dapat ditambah dan dihapus; tersimpan otomatis di `localStorage`.
- Input durasi kustom Jam/Menit/Detik (maksimum 99 jam).
- Kontrol Mulai, Jeda/Lanjut, Reset, serta +1 Menit dan +5 Menit saat berjalan maupun dijeda.
- Mode gelap/terang lewat tombol di header; pilihan tersimpan di `localStorage`
  dan tanpa pilihan mengikuti `prefers-color-scheme` sistem.
- Status warna: Ink Black pada normal, Soft Pink saat sisa < 1 menit dan saat waktu habis.
- Mode fullscreen (Fullscreen API) yang menyembunyikan panel pengaturan.
- Alarm Web Audio API, di-unlock saat tombol Mulai diklik agar lolos kebijakan autoplay.

## Shortcut

| Tombol | Aksi |
| --- | --- |
| `Spasi` | Mulai / Jeda |
| `R` | Reset |
| `F` | Masuk / keluar fullscreen |

Shortcut diabaikan saat fokus berada di `<input>` atau `<textarea>`.

## Struktur

```
app/                     layout, halaman, tema Tailwind (globals.css)
components/
  TimeKeeperWorkspace   komposisi klien: state, shortcut, layout
  CountdownDisplay      angka hitung mundur + indikator status
  TimerControls         mulai/jeda/reset/tambah waktu/fullscreen
  PresetSelector        chip preset, tambah & hapus
  DurationInput         form jam/menit/detik
  ThemeToggle           tombol tema di header
hooks/
  useTimer              sumber waktu berbasis selisih Date.now()
  usePresets            persistensi preset di localStorage
  useTheme              baca/tukar tema via data-theme pada <html>
  useFullscreen         Fullscreen API pada elemen panggung
  useKeyboardShortcuts  Spasi / R / F dengan guard input
lib/
  time.ts               format & normalisasi durasi
  audio.ts              AudioContext tunggal + alarm
  theme.ts              konstanta tema + skrip pra-hidrasi anti-kedip
```

Waktu dihitung dari `endAt - Date.now()` pada setiap tick, sehingga tetap akurat
saat tab di-throttle browser. `localStorage` hanya dibaca dan ditulis di dalam
`useEffect` agar tidak terjadi hydration mismatch.

Kunci penyimpanan sengaja tetap `chronostage.presets.v1`: awalan nama memberi
isolasi terhadap origin lain, dan mengubahnya akan membuat preset pengguna lama
tidak terbaca.
