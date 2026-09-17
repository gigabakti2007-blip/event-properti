'use strict';

/* ============================================================
   KONFIGURASI VENDOR — cukup edit bagian ini
   Nomor WhatsApp: format internasional TANPA "+", spasi, "-"
   Contoh: 6281385429670
============================================================ */
const VENDOR = {
  nama: 'Event Properti',
  whatsapp: '6281385429670',
};

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Render semua ikon <i data-lucide="..."> menjadi SVG */
if (window.lucide) window.lucide.createIcons();

/* Jika ada gambar gagal dimuat, sembunyikan agar latar gradient tetap rapi */
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('error', () => { img.style.display = 'none'; });
});

/* ============================================================
   1. LANGIT MALAM — bintang berkelip + meteor sesekali (canvas)
============================================================ */
const canvas = document.getElementById('starfield');
const starColors = ['255,255,255', '186,200,255', '168,190,255', '163,235,255'];
let stars = [], meteors = [], skyW = 0, skyH = 0, nextMeteorAt = 4000;

function buildStars() {
  const jumlah = Math.min(220, Math.floor(skyW * skyH / 9000));
  stars = Array.from({ length: jumlah }, () => ({
    x: Math.random() * skyW,
    y: Math.random() * skyH,
    r: 0.4 + Math.random() * 1.1,
    alpha: 0.25 + Math.random() * 0.55,
    speed: 0.4 + Math.random() * 1.6,
    phase: Math.random() * Math.PI * 2,
    color: starColors[Math.floor(Math.random() * starColors.length)]
  }));
}

function resizeSky() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  skyW = window.innerWidth;
  skyH = window.innerHeight;
  canvas.width = skyW * dpr;
  canvas.height = skyH * dpr;
  canvas.style.width = skyW + 'px';
  canvas.style.height = skyH + 'px';
  canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  buildStars();
}

function spawnMeteor() {
  meteors.push({
    x: Math.random() * skyW * 0.7 + skyW * 0.25,
    y: Math.random() * skyH * 0.3,
    vx: 6 + Math.random() * 4,
    vy: 2.5 + Math.random() * 1.8,
    life: 1,
    decay: 0.012 + Math.random() * 0.008
  });
}

function drawSky(t) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, skyW, skyH);
  const time = t / 1000;

  // Bintang berkelip
  for (const s of stars) {
    const kelip = REDUCED_MOTION ? 1 : 0.6 + 0.4 * Math.sin(time * s.speed + s.phase);
    ctx.globalAlpha = s.alpha * kelip;
    ctx.fillStyle = `rgb(${s.color})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Meteor melintas secara berkala
  if (!REDUCED_MOTION && t > nextMeteorAt) {
    spawnMeteor();
    nextMeteorAt = t + 5000 + Math.random() * 9000;
  }
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.x += m.vx; m.y += m.vy; m.life -= m.decay;
    if (m.life <= 0 || m.x > skyW + 100 || m.y > skyH + 100) { meteors.splice(i, 1); continue; }
    const ekorX = m.x - m.vx * 9, ekorY = m.y - m.vy * 9;
    const grad = ctx.createLinearGradient(m.x, m.y, ekorX, ekorY);
    grad.addColorStop(0, `rgba(205,228,255,${0.9 * m.life})`);
    grad.addColorStop(1, 'rgba(205,228,255,0)');
    ctx.globalAlpha = 1;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(ekorX, ekorY);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

resizeSky();
window.addEventListener('resize', resizeSky);
if (REDUCED_MOTION) {
  drawSky(0); // gambar statis satu kali
} else {
  (function loop(t) { drawSky(t); requestAnimationFrame(loop); })(0);
}

/* ============================================================
   2. NAVBAR — berubah jadi glassmorphism saat halaman di-scroll
============================================================ */
const header = document.getElementById('siteHeader');
function onScrollHeader() {
  header.classList.toggle('scrolled', window.scrollY > 40);
}
onScrollHeader();
window.addEventListener('scroll', onScrollHeader, { passive: true });

/* ============================================================
   3. MENU MOBILE (hamburger)
============================================================ */
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');

function setMobileMenu(open) {
  mobileMenu.classList.toggle('open', open);
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
}
navToggle.addEventListener('click', () => setMobileMenu(!mobileMenu.classList.contains('open')));
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMobileMenu(false)));
window.addEventListener('keydown', e => { if (e.key === 'Escape') setMobileMenu(false); });
window.addEventListener('resize', () => { if (window.innerWidth > 920) setMobileMenu(false); });

/* ============================================================
   4. SCROLLSPY — menandai link menu yang sedang aktif
============================================================ */
const allNavLinks = document.querySelectorAll('.nav-menu a, .mobile-menu a');
const spySections = [...new Set(
  [...allNavLinks]
    .map(a => a.getAttribute('href'))
    .filter(h => h && h.startsWith('#'))
    .map(h => document.querySelector(h))
)].filter(Boolean);

const spy = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    allNavLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
spySections.forEach(s => spy.observe(s));

/* ============================================================
   5. SCROLL REVEAL — elemen muncul halus saat masuk viewport
============================================================ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ============================================================
   6. COUNT-UP — angka statistik berjalan naik saat terlihat
============================================================ */
const countObserver = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    countObserver.unobserve(el);
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || '';
    if (REDUCED_MOTION) { el.textContent = target + suffix; return; }
    const durasi = 1600, mulai = performance.now();
    (function tick(now) {
      const p = Math.min((now - mulai) / durasi, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easing halus
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(mulai);
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

/* ============================================================
   7. FILTER GALERI
============================================================ */
const filterButtons = document.querySelectorAll('.gal-filter');
const galleryItems = document.querySelectorAll('.g-item');

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    galleryItems.forEach(item => {
      const cocok = f === 'all' || item.dataset.cat === f;
      item.classList.toggle('hide', !cocok);
      if (cocok) {
        item.classList.remove('pop');
        void item.offsetWidth; // paksa reflow agar animasi bisa diputar ulang
        item.classList.add('pop');
      }
    });
  });
});

/* ============================================================
   8. BACK TO TOP + ring progres scroll
============================================================ */
const backToTop = document.getElementById('backToTop');
const progressRing = document.getElementById('progressRing');
const RING_LENGTH = 2 * Math.PI * 24; // keliling lingkaran r=24

if (progressRing) {
  progressRing.style.strokeDasharray = RING_LENGTH;
  progressRing.style.strokeDashoffset = RING_LENGTH;
}
function onScrollProgress() {
  const tinggiDok = document.documentElement.scrollHeight - window.innerHeight;
  const progres = tinggiDok > 0 ? Math.min(window.scrollY / tinggiDok, 1) : 0;
  if (progressRing) progressRing.style.strokeDashoffset = RING_LENGTH * (1 - progres);
  backToTop.classList.toggle('show', window.scrollY > 480);
}
onScrollProgress();
window.addEventListener('scroll', onScrollProgress, { passive: true });
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ============================================================
   9. PARALLAX HERO — visual berging lembut mengikuti kursor
============================================================ */
const heroSection = document.getElementById('home');
const parallaxEls = document.querySelectorAll('[data-parallax]');
const finePointer = window.matchMedia('(pointer: fine)').matches;

if (heroSection && parallaxEls.length && finePointer && !REDUCED_MOTION) {
  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  heroSection.addEventListener('mousemove', e => {
    const rect = heroSection.getBoundingClientRect();
    targetX = (e.clientX - rect.left) / rect.width - 0.5;
    targetY = (e.clientY - rect.top) / rect.height - 0.5;
  });
  heroSection.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });
  (function gerakParallax() {
    curX += (targetX - curX) * 0.06; // lerp agar gerakan halus
    curY += (targetY - curY) * 0.06;
    parallaxEls.forEach(el => {
      const kedalaman = parseFloat(el.dataset.parallax) || 8;
      el.style.transform = `translate3d(${(curX * kedalaman).toFixed(2)}px, ${(curY * kedalaman).toFixed(2)}px, 0)`;
    });
    requestAnimationFrame(gerakParallax);
  })();
}

/* ============================================================
   10. TOAST — notifikasi ringan (pengganti alert)
============================================================ */
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
let toastTimer = null;

function showToast(pesan, tipe = 'success') {
  toastMsg.textContent = pesan;
  toast.classList.remove('success', 'error', 'show');
  void toast.offsetWidth;
  toast.classList.add(tipe, 'show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
}

/* ============================================================
   11. LINK WHATSAPP — dibangun dari konfigurasi VENDOR
============================================================ */
document.querySelectorAll('.js-wa').forEach(a => {
  const url = `https://wa.me/${VENDOR.whatsapp}`;
  a.href = a.dataset.message ? `${url}?text=${encodeURIComponent(a.dataset.message)}` : url;
  a.target = '_blank';
  a.rel = 'noopener';
});

/* ============================================================
   12. FORM KONTAK — validasi sederhana lalu kirim ke WhatsApp
============================================================ */
const form = document.getElementById('contactForm');

function setFieldError(namaField, pesan) {
  const input = document.getElementById('f-' + namaField);
  const wrap = input.closest('.form-field');
  wrap.classList.toggle('error', Boolean(pesan));
  wrap.querySelector('.form-error').textContent = pesan || '';
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const el = form.elements;
  const data = {
    nama: el['nama'].value.trim(),
    wa: el['wa'].value.trim(),
    event: el['event'].value,
    pesan: el['pesan'].value.trim()
  };

  // Validasi tiap field
  const cek = [
    ['nama', data.nama.length >= 3, 'Nama minimal 3 karakter.'],
    ['wa', /^(?:\+?62|0)8\d{7,12}$/.test(data.wa.replace(/[\s-]/g, '')), 'Masukkan nomor WhatsApp yang valid, contoh: 6281385429670.'],
    ['event', data.event !== '', 'Silakan pilih jenis event Anda.'],
    ['pesan', data.pesan.length >= 10, 'Ceritakan kebutuhan Anda (minimal 10 karakter).']
  ];

  let valid = true, firstInvalid = null;
  cek.forEach(([field, ok, pesan]) => {
    setFieldError(field, ok ? '' : pesan);
    if (!ok) { valid = false; firstInvalid = firstInvalid || document.getElementById('f-' + field); }
  });

  if (!valid) {
    if (firstInvalid) firstInvalid.focus();
    showToast('Mohon periksa kembali data yang Anda isi.', 'error');
    return;
  }

  // Normalisasi nomor: buang + / spasi / strip, awalan 0 menjadi 62
  const waNorm = data.wa.replace(/[\s-]/g, '').replace(/^\+/, '').replace(/^0/, '62');

  // Susun pesan dan arahkan ke WhatsApp vendor
  const teks =
    `Halo ${VENDOR.nama}! Saya ${data.nama}.\n\n` +
    `Saya ingin konsultasi penyewaan perlengkapan untuk event *${data.event}*.\n` +
    `${data.pesan}\n\nNomor WA saya: ${waNorm}`;

  window.open(`https://wa.me/${VENDOR.whatsapp}?text=${encodeURIComponent(teks)}`, '_blank');
  showToast('Terima kasih, ' + data.nama.split(' ')[0] + '! Membuka WhatsApp…');
  form.reset();
});

// Hapus tanda error begitu pengguna mulai mengetik ulang
form.querySelectorAll('input, select, textarea').forEach(el => {
  el.addEventListener('input', () => el.closest('.form-field').classList.remove('error'));
});

/* ============================================================
   13. TAHUN COPYRIGHT OTOMATIS
============================================================ */
document.getElementById('year').textContent = new Date().getFullYear();