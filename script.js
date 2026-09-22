/* =========================================================
   M. RAJA SIYO — PORTOFOLIO
   1. Parallax banyak lapisan (tiap gambar punya kedalaman)
   2. Timeline letusan yang diikat ke scroll
   3. Partikel bara api
   4. Bet nama: ditarik lalu memantul seperti karet
   ========================================================= */

/* =========================================================
   LOADING SCREEN
   ========================================================= */
const loadingScreen = document.getElementById('loadingScreen');
const loadingProgress = document.getElementById('loadingProgress');

function initLoadingScreen() {
  // Simulasi progress bar
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 30;
    if (progress > 90) progress = 90;
    loadingProgress.style.width = progress + '%';
  }, 300);

  // Hilangkan loading screen setelah 3 detik
  setTimeout(() => {
    clearInterval(progressInterval);
    loadingProgress.style.width = '100%';
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 200);
  }, 3000);
}

// Jalankan loading screen saat page load
window.addEventListener('load', initLoadingScreen);
// Juga jalankan jika content sudah ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoadingScreen);
} else {
  initLoadingScreen();
}

const space     = document.querySelector('.scroll-space');
const layers    = [...document.querySelectorAll('.layer')];
const smoke     = document.querySelector('.smoke');
const lava      = document.querySelector('.lava');
const birds     = document.querySelector('.birds');
const mist      = document.querySelector('.mist');
const cone      = document.querySelector('.cone');
const flash     = document.getElementById('flash');
const heroCopy  = document.getElementById('heroCopy');
const introPhoto = document.getElementById('introPhoto');
const badge     = document.getElementById('badge');
const badgeCard = document.getElementById('badgeCard');
const badgeTip  = document.getElementById('badgeTip');
const lanyard   = document.getElementById('lanyard');
const strapText = document.querySelector('.strap-print');
const clip      = document.querySelector('.clip');
const cue       = document.getElementById('cue');
const nav       = document.getElementById('nav');
const railItems = [...document.querySelectorAll('.rail li')];
const embersCv  = document.getElementById('embers');
const foto      = document.getElementById('foto');
const modeBtn   = document.getElementById('modeBtn');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp  = (a, b, t) => a + (b - a) * t;

function ramp(v, start, end) {
  const t = clamp((v - start) / (end - start));
  return t * t * (3 - 2 * t);
}

/* Kalau img/foto.jpg belum ada, monogram RS yang tampil. */
if (foto) foto.addEventListener('error', () => foto.classList.add('gagal'));

/* =========================================================
   1. TIMELINE
   ========================================================= */

const T = { eruptStart: .22, eruptPeak: .42, settle: .62, badgeDrop: .66, badgeLand: .82 };

let progress = 0;
let target = 0;

function readScroll() {
  const range = space.offsetHeight - window.innerHeight;
  target = range > 0 ? clamp((window.scrollY - space.offsetTop) / range) : 0;
  nav.classList.toggle('tucked', window.scrollY > 40);
}

window.addEventListener('scroll', readScroll, { passive: true });

/* =========================================================
   2. GERAK MOUSE
   ========================================================= */

let mx = 0, my = 0, mxT = 0, myT = 0;

if (!reduced) {
  window.addEventListener('pointermove', e => {
    if (dragging) return;
    mxT = (e.clientX / window.innerWidth  - .5) * 2;
    myT = (e.clientY / window.innerHeight - .5) * 2;
  }, { passive: true });
}

/* =========================================================
   3. BARA API
   ========================================================= */

const ctx = embersCv.getContext('2d');
let sparks = [];
let dpr = 1;

function sizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  embersCv.width  = embersCv.clientWidth  * dpr;
  embersCv.height = embersCv.clientHeight * dpr;
}

function spawn(w, h) {
  return {
    x: w * (.5 + (Math.random() - .5) * .05),
    y: h * (.42 + Math.random() * .04),
    vx: (Math.random() - .5) * 1.3,
    vy: -(1.1 + Math.random() * 2.8),
    r: .7 + Math.random() * 1.8,
    life: 1
  };
}

function drawEmbers(power) {
  const w = embersCv.width, h = embersCv.height;
  ctx.clearRect(0, 0, w, h);
  if (power <= .02) { sparks.length = 0; return; }

  const want = Math.round(power * 90);
  while (sparks.length < want) sparks.push(spawn(w, h));

  ctx.globalCompositeOperation = 'lighter';
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.x += s.vx * dpr;
    s.y += s.vy * dpr;
    s.vy += .032 * dpr;
    s.vx *= .995;
    s.life -= .006 + Math.random() * .004;

    if (s.life <= 0 || s.y < -30) {
      if (sparks.length > want) { sparks.splice(i, 1); continue; }
      sparks[i] = spawn(w, h);
      continue;
    }

    const a = s.life * power;
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 6 * dpr);
    g.addColorStop(0,  `rgba(255,236,180,${a})`);
    g.addColorStop(.4, `rgba(255,150,50,${a * .55})`);
    g.addColorStop(1,  'rgba(255,90,31,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 6 * dpr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

/* =========================================================
   4. BET NAMA
   Kartunya bisa ditarik ke bawah dan ke samping. Talinya
   ikut melar dan miring, lalu memantul balik seperti karet.
   ========================================================= */

let ropeLen = 470;
let restTop = 0;
let hiddenTop = -1600;

function layoutBadge() {
  const css = getComputedStyle(document.documentElement);
  ropeLen = parseFloat(css.getPropertyValue('--rope'));
  const cardH = parseFloat(css.getPropertyValue('--card-h'));
  restTop = Math.round(window.innerHeight * .56 - (ropeLen + cardH / 2));
  hiddenTop = -(ropeLen + cardH + 320);
}

let offX = 0, offY = 0;   // pergeseran kartu dari posisi diam
let velX = 0, velY = 0;
let dragging = false;
let grabbed = false;
let startX = 0, startY = 0, baseX = 0, baseY = 0;
let lastX = 0, lastY = 0;

const STIFF = .085;   // makin besar, makin cepat balik
const DAMP  = .86;    // makin kecil, makin cepat berhenti memantul

badge.addEventListener('pointerdown', e => {
  if (progress < T.badgeDrop + .04) return;
  dragging = true;
  grabbed = true;
  badge.classList.add('dragging');
  badge.setPointerCapture(e.pointerId);
  startX = lastX = e.clientX;
  startY = lastY = e.clientY;
  baseX = offX;
  baseY = offY;
  velX = velY = 0;
  e.preventDefault();
});

badge.addEventListener('pointermove', e => {
  if (!dragging) return;
  offX = clamp(baseX + (e.clientX - startX), -460, 460);
  offY = clamp(baseY + (e.clientY - startY), -90, 460);
  velX = e.clientX - lastX;
  velY = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
});

function letGo(e) {
  if (!dragging) return;
  dragging = false;
  badge.classList.remove('dragging');
  if (e && e.pointerId != null && badge.hasPointerCapture?.(e.pointerId)) {
    badge.releasePointerCapture(e.pointerId);
  }
}

badge.addEventListener('pointerup', letGo);
badge.addEventListener('pointercancel', letGo);

/* Bisa digoyang lewat keyboard juga. */
badge.tabIndex = 0;
badge.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  { velX -= 26; grabbed = true; }
  if (e.key === 'ArrowRight') { velX += 26; grabbed = true; }
  if (e.key === 'ArrowDown')  { velY += 26; grabbed = true; }
});

/* =========================================================
   5. LOOP
   ========================================================= */

let clock = 0;

function frame() {
  clock += .016;
  progress = lerp(progress, target, .09);
  const p = progress;

  const rise  = ramp(p, T.eruptStart, T.eruptPeak);
  const calm  = ramp(p, T.eruptPeak, T.settle);
  const power = clamp(rise * (1 - calm * .94));

  mx = lerp(mx, mxT, .06);
  my = lerp(my, myT, .06);

  const shake = power > .15 && !reduced ? Math.sin(clock * 26) * 3 * power : 0;

  /* --- lapisan: makin dekat, makin jauh bergesernya --- */
  layers.forEach(el => {
    const d = Number(el.dataset.depth || 0);
    const near = d + 1;                       // 0 = paling jauh, 2 = paling dekat
    const ty = -p * (24 + near * 130);
    const tx = mx * near * 14 + shake;
    const my2 = my * near * 8;
    const sc = 1 + near * .035 * p;
    el._pose = `translate3d(${(tx).toFixed(1)}px, ${(ty + my2).toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
    el.style.transform = el._pose;
  });

  /* --- asap, lava, bara --- */
  smoke.style.opacity = power * .95;
  smoke.style.transform = `${smoke._pose} translateY(${(-power * 90 - calm * 70).toFixed(1)}px) scale(${1 + power * .35 + calm * .3})`;

  lava.style.opacity = power;
  lava.style.transform = `${lava._pose} translateY(${(-power * 18).toFixed(1)}px) scale(${1 + power * .14})`;

  cone.style.filter = power > .02 ? `brightness(${1 + power * .2}) saturate(${1 + power * .28})` : 'none';
  mist.style.opacity = .45 - p * .25 + calm * .2;

  const burst = ramp(p, T.eruptStart, T.eruptStart + .035) * (1 - ramp(p, T.eruptStart + .035, T.eruptStart + .1));
  flash.style.opacity = burst * .7;

  const flee = ramp(p, T.eruptStart - .04, T.eruptStart + .16);
  birds.style.opacity = (.7 - flee * .7).toFixed(3);
  birds.style.transform = `${birds._pose} translate(${flee * 380}px, ${-flee * 140 + Math.sin(clock * 1.4) * 7}px)`;

  embersCv.style.opacity = power;
  if (!reduced) drawEmbers(power);

  /* --- foto 3D di intro: ikut miring lembut mengikuti mouse --- */
  if (introPhoto) {
    const tiltX = clamp(-my * 6, -8, 8);
    const tiltY = clamp(mx * 9, -11, 11);
    const bob   = !reduced ? Math.sin(clock * .6) * 3 : 0;
    introPhoto.style.transform =
      `translateY(${bob.toFixed(2)}px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
  }

  /* --- teks hero: hilang begitu meletus mulai --- */
  const gone = ramp(p, .14, .28);
  heroCopy.style.opacity = 1 - gone;
  heroCopy.style.transform = `translate(-50%, ${-gone * 60}px)`;
  cue.style.opacity = 1 - ramp(p, .02, .1);

  /* --- bet nama turun --- */
  if (p < T.badgeDrop) {
    badge.style.opacity = '0';
    badge.style.top = `${hiddenTop}px`;
    offX = offY = velX = velY = 0;
    grabbed = false;
    badgeTip.style.opacity = '0';
  } else {
    badge.style.opacity = '1';
    const drop = ramp(p, T.badgeDrop, T.badgeLand);
    badge.style.top = `${lerp(hiddenTop, restTop, drop)}px`;

    /* pantulan kecil saat baru mendarat */
    if (drop < 1 && !grabbed) {
      offX = Math.sin(drop * Math.PI * 2.4) * 26 * (1 - drop);
      offY = Math.abs(Math.sin(drop * Math.PI * 3.2)) * 20 * (1 - drop);
    }
    badgeTip.style.opacity = drop > .96 ? '1' : '0';
  }

  /* --- pegas: memantul balik ke posisi diam --- */
  if (!dragging && grabbed) {
    velX = (velX - offX * STIFF) * DAMP;
    velY = (velY - offY * STIFF) * DAMP;
    offX += velX;
    offY += velY;
    if (Math.abs(offX) < .05 && Math.abs(offY) < .05 && Math.abs(velX) < .05 && Math.abs(velY) < .05) {
      offX = offY = velX = velY = 0;
    }
  }

  /* --- geometri tali: panjang & sudutnya mengikuti kartu --- */
  const reach = ropeLen + offY;
  const dist  = Math.hypot(offX, reach);
  const angle = Math.atan2(offX, reach) * 180 / Math.PI;
  const stretch = clamp(dist / ropeLen, .7, 2.4);

  const ropePose = `rotate(${angle.toFixed(2)}deg) scaleY(${stretch.toFixed(3)})`;
  lanyard.style.transform = ropePose;
  strapText.style.transform = ropePose;

  const hang = (dist - ropeLen).toFixed(1);
  clip.style.transform = `rotate(${angle.toFixed(2)}deg) translateY(${hang}px)`;

  const spin = clamp(velX * 2.6 + offX * .09, -42, 42);
  badgeCard.style.transform =
    `rotate(${angle.toFixed(2)}deg) translateY(${hang}px) rotateY(${spin.toFixed(2)}deg)`;

  railItems.forEach((li, i) => li.classList.toggle('on', p >= [0, T.eruptStart, T.eruptPeak, T.badgeDrop][i]));

  requestAnimationFrame(frame);
}

/* =========================================================
   6. NAVIGASI
   ========================================================= */

const sections = ['#home', '#about', '#project', '#contact']
  .map(id => document.querySelector(id))
  .filter(Boolean);

const spy = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.toggle('is-here', a.getAttribute('href') === '#' + entry.target.id);
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });

sections.forEach(s => spy.observe(s));

document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', e => {
    const el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    window.scrollTo({ top: el.offsetTop, behavior: reduced ? 'auto' : 'smooth' });
  });
});


/* =========================================================
   TOMBOL PENCAHAYAAN — malam / pagi
   Pilihannya diingat lewat localStorage, jadi kalau halaman
   di-refresh, modenya tetap sama.
   ========================================================= */

const modeLabel = modeBtn.querySelector('.mode-label');

function setMode(mode) {
  document.body.dataset.mode = mode;
  modeBtn.setAttribute('aria-pressed', String(mode === 'night'));
  modeLabel.textContent = mode === 'night' ? 'Malam' : 'Pagi';
  modeBtn.title = mode === 'night' ? 'Ganti ke pagi' : 'Ganti ke malam';
  try { localStorage.setItem('raja-mode', mode); } catch (err) { /* tidak apa-apa */ }
}

let savedMode = 'night';
try { savedMode = localStorage.getItem('raja-mode') || 'night'; } catch (err) { /* tidak apa-apa */ }
setMode(savedMode);

modeBtn.addEventListener('click', () => {
  setMode(document.body.dataset.mode === 'night' ? 'day' : 'night');
});

/* =========================================================
   MULAI
   ========================================================= */

window.addEventListener('resize', () => { sizeCanvas(); layoutBadge(); readScroll(); }, { passive: true });

sizeCanvas();
layoutBadge();
readScroll();
progress = target;
requestAnimationFrame(frame);
/* =========================================================
   ABOUT ME — EFEK KOCOK KARTU
   3 FOTO → 2 → 1 → 0 → MUNCUL LAGI
   ========================================================= */

const aboutPhotoArea = document.querySelector('#aboutPhotos');
const aboutCards = Array.from(
  document.querySelectorAll('.about-photo-card')
);

let photoIndex = 0;
let isShuffling = false;

aboutCards.forEach((card, index) => {
  card.style.zIndex = aboutCards.length - index;

  card.addEventListener('click', () => {

    if (isShuffling) return;

    isShuffling = true;

    /*
      Foto yang sedang di depan
      dilempar keluar seperti kartu dikocok.
    */
    const currentCard = aboutCards[photoIndex];

    currentCard.classList.add('is-shuffling');

    setTimeout(() => {

      currentCard.classList.add('is-hidden');

      photoIndex++;

      /*
        Kalau sudah 3 foto habis,
        mulai lagi dari foto pertama.
      */
      if (photoIndex >= aboutCards.length) {

        setTimeout(() => {

          aboutCards.forEach((card, index) => {

            card.classList.remove(
              'is-hidden',
              'is-shuffling'
            );

            card.style.zIndex =
              aboutCards.length - index;

          });

          photoIndex = 0;

          isShuffling = false;

        }, 500);

      } else {

        /*
          Foto berikutnya menjadi
          kartu paling depan.
        */
        aboutCards.forEach((card, index) => {

          if (!card.classList.contains('is-hidden')) {

            card.style.zIndex =
              aboutCards.length - index;

          }

        });

        setTimeout(() => {
          isShuffling = false;
        }, 450);

      }

    }, 450);

  });

});