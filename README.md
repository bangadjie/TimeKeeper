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
- Peringatan waktu bertingkat: checkpoint 5 mnt, 3 mnt, 1 mnt, 30 dtk plus baris
  "Waktu habis" (alarm 0 detik). Tiap checkpoint punya toggle aktif, tombol hapus,
  dan bisa ditambah sendiri; daftar tersimpan di `localStorage`.
- Suara kustom per checkpoint: unggah MP3/WAV/OGG/M4A, disimpan sebagai Blob di
  IndexedDB (bukan `localStorage`), plus tombol Test Sound dan Reset ke Default.
  Tanpa file kustom, chime WAV dibuat di memori sebagai `Blob`.
- Pengaturan Audio Output: pilih perangkat lewat `setSinkId` (headset USB/Bluetooth
  saja, tanpa speaker ruangan), tombol Deteksi Perangkat Audio (izin mikrofon
  diminta lalu track langsung dihentikan), volume, dan mute. `sinkId`, volume, dan
  mute tersimpan di `localStorage`; browser tanpa `setSinkId` tetap berbunyi di
  output default.
- Semua suara diputar lewat `HTMLAudioElement` supaya bisa dirutekan per perangkat;
  audio di-unlock saat tombol Mulai diklik agar lolos kebijakan autoplay.

## Shortcut

| Tombol | Aksi |
| --- | --- |
| `Spasi` | Mulai / Jeda |
| `R` | Reset |
| `F` | Masuk / keluar fullscreen |

Shortcut diabaikan saat fokus berada di `<input>`, `<textarea>`, atau `<select>`
(termasuk input checkpoint dan dropdown perangkat audio).

## Peringatan bertingkat

Setiap checkpoint berbunyi sekali per sesi. Bunyi hanya dipicu saat sisa waktu
benar-benar melewati ambang dari atas, jadi timer yang dimulai di 2 menit tidak
membunyikan checkpoint 5 dan 3 menit. Reset atau tombol +1/+5 Menit mengembalikan
sisa waktu ke atas sebuah ambang, dan ambang itu aktif kembali untuk penurunan
berikutnya.

## Struktur

```
app/                     layout, halaman, tema Tailwind (globals.css)
components/
  TimeKeeperWorkspace   komposisi klien: state, shortcut, layout
  CountdownDisplay      angka hitung mundur + indikator status
  TimerControls         mulai/jeda/reset/tambah waktu/fullscreen
  PresetSelector        chip preset, tambah & hapus
  DurationInput         form jam/menit/detik
  AlertCheckpointsPanel daftar checkpoint, unggah suara, test, reset
  AudioOutputPanel      pilih perangkat output, volume, mute
  ThemeToggle           tombol tema di header
hooks/
  useTimer              sumber waktu berbasis selisih Date.now()
  usePresets            persistensi preset di localStorage
  useTheme              baca/tukar tema via data-theme pada <html>
  useFullscreen         Fullscreen API pada elemen panggung
  useAlertCheckpoints   daftar checkpoint di localStorage
  useThresholdAlerts    mesin ambang: anti double-trigger + arm ulang
  useAlertPlayback      pemutaran suara per checkpoint (cache Blob)
  useAudioOutput        perangkat output, volume, mute, izin mikrofon
  useKeyboardShortcuts  Spasi / R / F dengan guard input
lib/
  time.ts               format & normalisasi durasi
  audio.ts              chime WAV di memori + pemutaran via HTMLAudioElement
  audioStorage.ts       simpan/baca/hapus Blob suara di IndexedDB
  alerts.ts             model checkpoint + validasi & persistensi
  theme.ts              konstanta tema + skrip pra-hidrasi anti-kedip
```

Waktu dihitung dari `endAt - Date.now()` pada setiap tick, sehingga tetap akurat
saat tab di-throttle browser. `localStorage` hanya dibaca dan ditulis di dalam
`useEffect` agar tidak terjadi hydration mismatch.

Kunci penyimpanan sengaja tetap `chronostage.presets.v1`: awalan nama memberi
isolasi terhadap origin lain, dan mengubahnya akan membuat preset pengguna lama
tidak terbaca.
