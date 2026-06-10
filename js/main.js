/* sudosu.dev — main.js */

const wait = ms => new Promise(r => setTimeout(r, ms));

/* ── 1. TERMINAL BG ─────────────────────────────────── */
(function buildTermBg() {
  const c = document.getElementById('termBg');
  if (!c) return;
  const LINES = [
    {t:'d',v:'$ whoami'},{t:'g',v:'fullstack_engineer'},
    {t:'d',v:'$ git log --oneline -5'},
    {t:'g',v:'a3f8c12 feat: websocket real-time layer'},
    {t:'g',v:'b7d2e90 fix: multi-tenant schema isolation'},
    {t:'g',v:'c1a4f55 chore: upgrade to Next.js 14'},
    {t:'d',v:'$ npm run build'},
    {t:'g',v:'✓ Compiled successfully in 2.4s'},
    {t:'d',v:'$ ./deploy --env=production'},
    {t:'g',v:'✓ Deployed to ECS — zero downtime'},
    {t:'d',v:'$ sudo su - fullstack'},
    {t:'g',v:'✓ Access granted. Welcome.'},
    {t:'d',v:'$ ./launch sudosu.dev --mode=prod'},
    {t:'g',v:'✓ Running at https://sudosu.dev'},
    {t:'d',v:'$ ping sudosu.dev'},
    {t:'g',v:'64 bytes — time=1.2ms'},
    {t:'d',v:'$ uptime'},{t:'g',v:'99.98% — 247 days, 14:32:11'},
  ];
  [...LINES,...LINES,...LINES].forEach(({t,v}) => {
    const el = document.createElement('span');
    el.className = 'tbl ' + (t === 'g' ? 'g' : 'd');
    el.textContent = v;
    c.appendChild(el);
  });
})();


/* ── 2. CODE WINDOW TYPEWRITER ──────────────────────── */
const CODE_LINES = [
  {h:'<span class="cl-cm">// sudosu.dev / studio.ts</span>'},
  {h:''},
  {h:'<span class="cl-kw">const</span> <span class="cl-fn">studio</span> <span class="cl-pl">= {</span>'},
  {h:'  <span class="cl-pl">name:</span>    <span class="cl-str">"sudosu.dev"</span><span class="cl-pl">,</span>'},
  {h:'  <span class="cl-pl">type:</span>    <span class="cl-str">"fullstack"</span><span class="cl-pl">,</span>'},
  {h:'  <span class="cl-pl">stack:</span>   <span class="cl-pl">[</span><span class="cl-str">"ReactJS"</span><span class="cl-pl">,</span><span class="cl-str">"Flask"</span><span class="cl-pl">,</span><span class="cl-str">"TS"</span><span class="cl-pl">],</span>'},
  {h:'  <span class="cl-pl">mobile:</span>  <span class="cl-str">"React Native"</span><span class="cl-pl">,</span>'},
  {h:'  <span class="cl-pl">db:</span>      <span class="cl-str">"MongoDB"</span><span class="cl-pl">,</span>'},
  {h:'  <span class="cl-pl">bio:</span>     <span class="cl-str">"Nextflow / WDL"</span><span class="cl-pl">,</span>'},
  {h:'  <span class="cl-pl">available:</span> <span class="cl-num">true</span><span class="cl-pl">,</span>'},
  {h:'<span class="cl-pl">}</span>'},
  {h:''},
  {h:'<span class="cl-kw">export default</span> <span class="cl-fn">studio</span>'},
];

async function typeCodeWindow() {
  const body = document.getElementById('codeBody');
  if (!body) return;
  const ln = n => `<span class="cl-ln">${String(n).padStart(2,' ')}</span>`;
  for (let i = 0; i < CODE_LINES.length; i++) {
    await wait(i === 0 ? 200 : 85);
    const row = document.createElement('span');
    row.className = 'cl';
    row.innerHTML = ln(i + 1) + CODE_LINES[i].h;
    body.appendChild(row);
  }
  const cur = document.createElement('span');
  cur.className = 'cl';
  cur.innerHTML = '<span class="cl-cur"></span>';
  body.appendChild(cur);
}


/* ── 3. .DEV TYPEWRITER ─────────────────────────────── */
async function typeDevLine() {
  const el = document.getElementById('heroDev');
  if (!el) return;
  const TEXT = '.dev';
  let i = 0;
  el.innerHTML = '<span class="dev-cursor">_</span>';
  await wait(350);
  const iv = setInterval(() => {
    el.innerHTML = TEXT.slice(0, i) + '<span class="dev-cursor">_</span>';
    i++;
    if (i > TEXT.length) clearInterval(iv);
  }, 110);
}


/* ── 4. NAVBAR SCROLL ───────────────────────────────── */
function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}


/* ── 5. HAMBURGER ───────────────────────────────────── */
function initHamburger() {
  const btn    = document.getElementById('hamburger');
  const drawer = document.getElementById('mobileDrawer');
  const nav    = document.getElementById('navbar');
  if (!btn || !drawer) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = btn.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    drawer.classList.toggle('open', open);
  });

  drawer.querySelectorAll('.drawer-link').forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
      drawer.classList.remove('open');
    });
  });

  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && !drawer.contains(e.target)) {
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
      drawer.classList.remove('open');
    }
  });
}


/* ── 6. MODAL ───────────────────────────────────────── */
const MODAL_CONTENT = {
  bell: {
    icon: '🔔',
    title: 'You have 1 new notification',
    body: `Hey there 👋

Welcome to sudosu.dev!

I'd love to hear more about your project — an idea you want to explore, a product to launch, or an API to build.

You're in exactly the right place. Drop me a line and let's talk.`,
  },
  user: {
    icon: '👾',
    title: 'Restricted access — but the adventure is wide open.',
    body: `This area is reserved for the sudosu.dev team.

But if you'd like to be part of the adventure — as a client, a collaborator, or a partner — the door is wide open.

We build serious things, with the right people. If you're reading this, you might just be one of them. 🚀`,
  },
};

function initModal() {
  const backdrop = document.getElementById('modalBackdrop');
  const closeBtn = document.getElementById('modalClose');
  const iconEl   = document.getElementById('modalIcon');
  const titleEl  = document.getElementById('modalTitle');
  const bodyEl   = document.getElementById('modalBody');
  if (!backdrop) return;

  function openModal(type) {
    const d = MODAL_CONTENT[type];
    if (!d) return;
    iconEl.textContent  = d.icon;
    titleEl.textContent = d.title;
    bodyEl.textContent  = d.body;
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('bellBtn')?.addEventListener('click', () => openModal('bell'));
  document.getElementById('userBtn')?.addEventListener('click', () => openModal('user'));
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}


/* ── 7. SCROLL REVEAL ───────────────────────────────── */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}


/* ── 8. FAVICON (~/dev) ─────────────────────────────── */
function initFavicon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">`
    + `<rect width="64" height="64" rx="14" fill="#040912"/>`
    + `<rect x="1.5" y="1.5" width="61" height="61" rx="12.5" fill="none" stroke="#56cffc" stroke-opacity="0.22" stroke-width="1.5"/>`
    + `<text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" `
    + `font-family="'Courier New', monospace" font-size="17" font-weight="700" letter-spacing="-0.5">`
    + `<tspan fill="#2dd4a0">~/</tspan><tspan fill="#56cffc">dev</tspan></text></svg>`;
  const href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  document.querySelectorAll("link[rel~='icon']").forEach(l => l.remove());
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = href;
  document.head.appendChild(link);
}


/* ── 9. THEME ───────────────────────────────────────── */
function initTheme() {
  const html = document.documentElement;
  const btn  = document.getElementById('themeToggle');
  const icon = document.getElementById('themeIcon');
  if (!btn) return;

  const apply = t => {
    html.setAttribute('data-theme', t);
    icon.textContent = t === 'dark' ? '◐' : '◑';
    localStorage.setItem('sudosu-theme', t);
  };

  apply(localStorage.getItem('sudosu-theme') || 'dark');
  btn.addEventListener('click', () => {
    apply(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}


/* ── 10. VIDEO LIGHTBOX ──────────────────────────────── */
function toEmbedUrl(src) {
  let m = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0`;
  m = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}?autoplay=1`;
  return src; // assume already an embeddable URL
}

function initVideoLightbox() {
  const box      = document.getElementById('videoLightbox');
  const frame    = document.getElementById('vlFrame');
  const closeBtn = document.getElementById('vlClose');
  if (!box || !frame) return;

  function open(src) {
    if (!src) return;
    const isEmbed = /youtube|youtu\.be|vimeo|\/embed\//i.test(src);
    frame.innerHTML = isEmbed
      ? `<iframe src="${toEmbedUrl(src)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`
      : `<video src="${src}" controls autoplay playsinline></video>`;
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    box.classList.remove('open');
    document.body.style.overflow = '';
    frame.innerHTML = ''; // stops playback
  }

  document.querySelectorAll('.video-play-btn[data-video]').forEach(btn => {
    btn.addEventListener('click', () => open(btn.getAttribute('data-video')));
  });
  closeBtn?.addEventListener('click', close);
  box.addEventListener('click', e => { if (e.target === box) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}


/* ── BOOT ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initFavicon();
  initTheme();
  initNavbar();
  initHamburger();
  initModal();
  initVideoLightbox();
  initReveal();
  typeDevLine();
  typeCodeWindow();
});