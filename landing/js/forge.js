/* ═══════════════════════════════════════════════════════════════════
   FORGE · instant site-preview demo — standalone (banners·forms·icons·photos)
   No dependencies. Load in <head> (defer) or before </body>.
   Delete <section id="forge">, css/forge.css and this file → nothing breaks.

   IMAGES — first that loads wins:
     1. your photo:  assets/forge/<key>.jpg   (download from Pexels → rename)
     2. LoremFlickr (topical, keyless CDN)
     3. Lorem Picsum (guaranteed, keyless CDN)
     4. gradient placeholder.
   Swap the CDN fallback in ONE place: the img() helper.
   ═══════════════════════════════════════════════════════════════════ */
   (function () {
    'use strict';
  
    var WHATSAPP      = '972527810255';
    var EMAIL         = 'sudosudev@outlook.com';
    var IMG_LOCAL_DIR = 'assets/forge/';
  
    var ICONS = {
      calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
      user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
      phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.09 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13 1 .37 1.94.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.87.35 1.81.59 2.81.72A2 2 0 0 1 22 16.92z"/>',
      pin:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
      truck:'<rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
      lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      refresh:'<path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3H21M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.7-3H3M3 21v-5h5"/>',
      chat:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      check:'<path d="M20 6 9 17l-5-5"/>',
      compass:'<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>',
      clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
      sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.3 2.3M15.7 15.7 18 18M18 6l-2.3 2.3M8.3 15.7 6 18"/>',
      instagram:'<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
      arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>'
    };
    function ic(name) { return '<svg class="fp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>'; }
  
    function init() {
      var forge = document.getElementById('forge');
      if (!forge || forge.dataset.forgeReady) return;
      forge.dataset.forgeReady = '1';
  
      var vp = forge.querySelector('#fgViewport'), urlE = forge.querySelector('#fgUrl'),
          nameI = forge.querySelector('#fgName'), go = forge.querySelector('#fgGo'),
          chips = forge.querySelectorAll('.fg-chip'), hook = forge.querySelector('#fgHook'),
          hookName = forge.querySelector('#fgHookName'), waA = forge.querySelector('#fgWa'),
          mailA = forge.querySelector('#fgMail');
  
      var current = 'resto';
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  
      var esc = function (s) { return (s || '').replace(/[&<>"]/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; }); };
      var slug = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'my-site'; };
  
      function img(key, kw, w, h, lock) {
        var local = IMG_LOCAL_DIR + key + '.jpg';
        var fb1 = 'https://loremflickr.com/' + w + '/' + h + '/' + encodeURIComponent(kw) + '?lock=' + lock;
        var fb2 = 'https://picsum.photos/seed/' + encodeURIComponent(key) + '/' + w + '/' + h;
        return '<img class="fp-img" loading="lazy" alt="" src="' + local + '" data-fb1="' + fb1 + '" data-fb2="' + fb2 + '">';
      }
      function onImgErr(e) {
        var im = e.currentTarget;
        if (im.dataset.fb1) { var u = im.dataset.fb1; im.removeAttribute('data-fb1'); im.src = u; }
        else if (im.dataset.fb2) { var v = im.dataset.fb2; im.removeAttribute('data-fb2'); im.src = v; }
        else { im.style.visibility = 'hidden'; im.removeEventListener('error', onImgErr); }
      }
  
      /* ── builders ── */
      function banner(icon, html) { return '<div class="fp-banner">' + ic(icon) + '<span>' + html + '</span></div>'; }
      function nav(n, links, cta) { return '<div class="fp-nav"><div class="fp-logo">' + n + '</div><div class="fp-nav-r"><div class="fp-menu">' + links.map(function (l) { return '<span>' + l + '</span>'; }).join('') + '</div><span class="fp-nav-cta">' + cta + '</span></div></div>'; }
      function lockBtn(label, ghost, icon) { return '<span class="fp-lock"><button class="fp-btn' + (ghost ? ' ghost' : '') + '">' + (icon ? ic(icon) : '') + label + '</button></span>'; }
      function blockBtn(label, icon) { return '<span class="fp-lock block"><button class="fp-btn block">' + (icon ? ic(icon) : '') + label + '</button></span>'; }
      function hero(key, kw, lock, rating, inner) {
        return '<div class="fp-hero has-img"><div class="fp-hero-media">' + img(key, kw, 900, 560, lock) + '</div><div class="fp-hero-scrim"></div>' +
          '<div class="fp-hero-rating"><b>★ ' + rating[0] + '</b> ' + rating[1] + '</div>' +
          '<div class="fp-hero-inner">' + inner + '</div></div>';
      }
      function heroBody(kicker, n, tag, primary, ghost, benefit) {
        return '<div class="fp-kicker">' + kicker + '</div><h1 class="fp-h1">' + n + '</h1><p class="fp-tag">' + tag + '</p>' +
          '<div class="fp-hero-actions">' + lockBtn(primary[0], false, primary[1]) + lockBtn(ghost, true) + '</div>' +
          '<div class="fp-trust">' + ic('check') + ' ' + benefit + '</div>';
      }
      function stats(items) { return '<div class="fp-stats">' + items.map(function (it) { return '<div class="fp-stat"><b>' + it[0] + '</b><span>' + it[1] + '</span></div>'; }).join('') + '</div>'; }
      function feat(icon, title, desc) { return '<div class="fp-feat"><div class="fp-badge">' + ic(icon) + '</div><p class="fp-cn">' + title + '</p><p class="fp-cd">' + desc + '</p></div>'; }
      function step(num, title, desc) { return '<div class="fp-feat"><div class="fp-badge">' + num + '</div><p class="fp-cn">' + title + '</p><p class="fp-cd">' + desc + '</p></div>'; }
      function quote(txt, initial, name, role) { return '<div class="fp-quote"><div class="fp-stars">★★★★★</div><div class="fp-quote-txt">“' + txt + '”</div><div class="fp-quote-who"><span class="fp-avatar">' + initial + '</span><div style="text-align:left"><div class="fp-who-n">' + name + '</div><div class="fp-who-r">' + role + '</div></div></div></div>'; }
      function ctaBand(title, sub, inner) { return '<div class="fp-cta-band"><h3 class="fp-st">' + title + '</h3><p class="fp-sub2">' + sub + '</p>' + inner + '</div>'; }
      function secHead(eyebrow, title, sub) { return '<div class="fp-sec-head">' + (eyebrow ? '<div class="fp-eyebrow">' + eyebrow + '</div>' : '') + '<h3 class="fp-st center">' + title + '</h3>' + (sub ? '<p class="fp-sub2">' + sub + '</p>' : '') + '</div>'; }
      function field(label, ctrl) { return '<div class="fp-field"><label>' + label + '</label>' + ctrl + '</div>'; }
      function inp(ph, type) { return '<input class="fp-input2" type="' + (type || 'text') + '" placeholder="' + (ph || '') + '" aria-label="' + (ph || 'field') + '">'; }
      function sel(opts) { return '<select class="fp-select" aria-label="select">' + opts.map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select>'; }
      function area(ph) { return '<textarea class="fp-area" placeholder="' + ph + '" aria-label="' + ph + '"></textarea>'; }
      function soc() { return '<div class="fp-soc"><span>' + ic('instagram') + '</span><span>' + ic('mail') + '</span><span>' + ic('phone') + '</span></div>'; }
      function footer(n, tagline, colA, colB) {
        function links(arr) { return arr.map(function (l) { return '<a>' + l + '</a>'; }).join(''); }
        return '<div class="fp-foot rich"><div class="fp-foot-cols">' +
          '<div class="fp-foot-col"><div class="fp-foot-brand">' + n + '</div><p>' + tagline + '</p>' + soc() + '</div>' +
          '<div class="fp-foot-col"><b>' + colA[0] + '</b>' + links(colA.slice(1)) + '</div>' +
          '<div class="fp-foot-col"><b>' + colB[0] + '</b>' + links(colB.slice(1)) + '</div>' +
          '</div><div class="fp-foot-bottom">© ' + n + ' — all rights reserved</div></div>';
      }
  
      var INDUSTRIES = {
        resto: {
          label: 'Restaurant', ex: 'The Cedar',
          render: function (n) {
            return '<div class="fp p-resto">' +
              banner('sparkle', 'New winter menu just dropped — <b>book your table</b>') +
              nav(n, ['Menu','Story','Gallery','Book'], 'Reserve') +
              hero('resto-hero','restaurant,food,gourmet,plating',21, ['4.9','320 reviews'], heroBody('Seasonal · homemade', 'Welcome to ' + n, 'A table with real character, fresh produce, and a room you won\'t want to leave.', ['Book a table','calendar'], 'View menu', 'Reserve in 30 seconds')) +
              '<div class="fp-sec alt"><div class="fp-eyebrow">Since 2015</div>' + stats([['4.9★','guest rating'],['60+','dishes'],['12k','happy guests']]) + '</div>' +
              '<div class="fp-sec">' + secHead('Our menu','Cooked fresh, every day','A short seasonal selection — the full menu changes with the market.') +
                '<div class="fp-row"><div><div class="l">Chef\'s mezze</div><div class="d">to share, homemade bread</div></div><div class="p">48₪</div></div>' +
                '<div class="fp-row"><div><div class="l">Grilled ribeye</div><div class="d">house fries, pepper sauce</div></div><div class="p">92₪</div></div>' +
                '<div class="fp-row"><div><div class="l">Catch of the day</div><div class="d">market fish, roasted veg</div></div><div class="p">78₪</div></div>' +
                '<div class="fp-row"><div><div class="l">Warm chocolate</div><div class="d">vanilla ice cream</div></div><div class="p">36₪</div></div>' +
              '</div>' +
              '<div class="fp-gallery">' + img('resto-1','restaurant,interior,cozy',360,300,22) + img('resto-2','wine,glass,dinner',360,300,23) + img('resto-3','pasta,dish,gourmet',360,300,24) + img('resto-4','dessert,plate,sweet',360,300,25) + '</div>' +
              '<div class="fp-sec alt">' + quote('Best table in town. The atmosphere, the food — everything felt made with care.','R','Rachel M.','regular guest') + '</div>' +
              '<div class="fp-sec">' + secHead('Reservations','Book your table','Pick a date and we\'ll confirm by email.') +
                '<div class="fp-form">' + field('Date', inp('', 'date')) +
                  '<div class="fp-form-row">' + field('Guests', sel(['1 guest','2 guests','3 guests','4+ guests'])) + field('Time', sel(['12:00','13:00','19:00','20:30'])) + '</div>' +
                  field('Your name', inp('Jane Doe')) + blockBtn('Book my table','calendar') + '</div>' +
              '</div>' +
              footer(n, 'A neighborhood table since 2015 — seasonal cooking, made with care.', ['Explore','Menu','Our story','Gallery','Reservations'], ['Visit','Downtown','Open 12–11pm','Get directions']) +
            '</div>';
          }
        },
        shop: {
          label: 'Shop', ex: 'Nomi & Co',
          render: function (n) {
            function pcard(key, kw, lock, name, desc, price, ribbon) { return '<div class="fp-card has-img">' + (ribbon ? '<span class="fp-ribbon">' + ribbon + '</span>' : '') + '<div class="fp-card-media">' + img(key, kw, 360, 300, lock) + '</div><div class="fp-card-b"><p class="fp-cn">' + name + '</p><p class="fp-cd">' + desc + '</p><div class="fp-price">' + price + '</div></div></div>'; }
            return '<div class="fp p-shop">' +
              banner('truck', 'Free delivery on orders over <b>200₪</b>') +
              nav(n, ['Shop','New in','About','Cart (0)'], 'Shop now') +
              hero('shop-hero','boutique,fashion,lifestyle,pastel',31, ['4.8','2,000+ orders'], heroBody('New collection', n, 'Carefully curated pieces, delivered to your door. Secure checkout — shekel or international.', ['Shop now','arrow'], 'New arrivals', 'Free returns within 14 days')) +
              '<div class="fp-sec"><div class="fp-features">' + feat('truck','Fast delivery','1–3 days across the country') + feat('lock','Secure checkout','shekel & international cards') + feat('refresh','Easy returns','14 days, no questions') + '</div></div>' +
              '<div class="fp-sec alt">' + secHead('Best sellers','Loved by our customers','') + '<div class="fp-grid">' +
                pcard('shop-1','cosmetics,skincare,product',32,'The Essential','our house favorite','129₪') +
                pcard('shop-2','candle,decor,product',33,'Limited edition','low stock','89₪') +
                pcard('shop-3','handbag,fashion,accessory',34,'Staff pick','pinned by ' + n,'159₪','Popular') +
                pcard('shop-4','giftbox,gift,wrap',35,'Gift box','ready to give','199₪') +
              '</div></div>' +
              '<div class="fp-sec">' + quote('Fast shipping and the packaging felt like a gift. Already back for more.','L','Lea B.','verified buyer') + '</div>' +
              ctaBand('Get 10% off your first order', 'Join the list for early drops & offers.', '<div class="fp-inline">' + inp('you@email.com','email') + '<span class="fp-lock"><button class="fp-btn">' + ic('mail') + 'Subscribe</button></span></div>') +
              footer(n, 'Curated pieces, delivered with care. Secure checkout, easy returns.', ['Shop','New in','Best sellers','Gift cards'], ['Help','Shipping','Returns','Contact us']) +
            '</div>';
          }
        },
        travel: {
          label: 'Travel', ex: 'Sahara Tours',
          render: function (n) {
            function tcard(key, kw, lock, name, desc) { return '<div class="fp-card has-img"><div class="fp-card-media">' + img(key, kw, 360, 300, lock) + '</div><div class="fp-card-b"><p class="fp-cn">' + name + '</p><p class="fp-cd">' + desc + '</p></div></div>'; }
            return '<div class="fp p-travel">' +
              banner('sparkle', 'Early-bird: <b>10% off</b> all summer tours') +
              nav(n, ['Tours','Reviews','About','Book'], 'Book now') +
              hero('travel-hero','desert,dunes,landscape,golden,sunset',41, ['4.9','2,400 travelers'],
                '<div class="fp-chips"><span class="fp-chip">EN</span><span class="fp-chip">HE</span><span class="fp-chip">FR</span></div>' +
                heroBody('Guided experiences', 'Travel with ' + n, 'Tailor-made itineraries, a local guide, zero hassle. Pick your dates — we handle the rest.', ['Request dates','compass'], 'See tours', 'Free cancellation up to 7 days')) +
              '<div class="fp-sec alt">' + stats([['2.4k','travelers'],['30+','itineraries'],['4.9★','average rating']]) + '</div>' +
              '<div class="fp-sec">' + secHead('Our tours','Journeys worth the miles','') + '<div class="fp-grid three">' +
                tcard('travel-1','desert,dunes,sahara,camel',42,'The Grand South','7 days · private') +
                tcard('travel-2','ancient,city,ruins,temple',43,'Cities & history','4 days · group') +
                tcard('travel-3','beach,coast,turquoise,sea',44,'Coast & chill','5 days · family') +
              '</div></div>' +
              '<div class="fp-sec alt">' + secHead('Why travel with us','','') + '<div class="fp-features">' + feat('pin','Local guides','people who know the hidden spots') + feat('calendar','Flexible dates','you choose, we adapt') + feat('chat','Always reachable','support before & during the trip') + '</div></div>' +
              '<div class="fp-sec">' + quote('Every detail was handled. We just showed up and fell in love with the place.','D','Daniel & Sarah','honeymoon trip') + '</div>' +
              '<div class="fp-sec alt">' + secHead('Plan your trip','Tell us your dates','We\'ll craft an itinerary and reply within 24h.') +
                '<div class="fp-form">' + field('Destination', sel(['The Grand South','Cities & history','Coast & chill','Not sure yet'])) +
                  '<div class="fp-form-row">' + field('From', inp('', 'date')) + field('To', inp('', 'date')) + '</div>' +
                  field('Email', inp('you@email.com','email')) + blockBtn('Request my dates','compass') + '</div>' +
              '</div>' +
              footer(n, 'Local guides, tailor-made itineraries, zero hassle — since day one.', ['Explore','Tours','Reviews','About us'], ['Plan','Request dates','FAQ','Contact']) +
            '</div>';
          }
        },
        pro: {
          label: 'Business', ex: 'Benizri Studio',
          render: function (n) {
            function scard(key, kw, lock, title, desc) { return '<div class="fp-scard"><div class="fp-scard-media">' + img(key, kw, 400, 300, lock) + '</div><div class="fp-scard-b"><p class="fp-cn">' + title + '</p><p class="fp-cd">' + desc + '</p><span class="fp-more">Learn more ' + ic('arrow') + '</span></div></div>'; }
            return '<div class="fp p-pro">' +
              banner('calendar', 'Now booking new projects for <b>Q3</b> — limited slots') +
              nav(n, ['Services','Work','About','Contact'], 'Get in touch') +
              hero('pro-hero','office,workspace,business,warm,modern',51, ['5.0','120+ clients'], heroBody('Trusted professional', n, 'A clear, reassuring online presence that turns visitors into clients.', ['Book a call','phone'], 'Our work', 'Reply within 24 hours')) +
              '<div class="fp-sec alt"><div class="fp-eyebrow">Who we are</div>' + stats([['120+','clients served'],['8','years experience'],['98%','recommend us']]) + '</div>' +
              '<div class="fp-sec">' + secHead('What we do','Services built around you','Real photos, real work — not stock icons.') + '<div class="fp-grid three">' +
                scard('pro-1','consulting,meeting,advice',52,'Advice','Tailored guidance to move you in the right direction.') +
                scard('pro-2','workspace,plan,strategy',53,'Follow-up','We stay with you at every step — no surprises.') +
                scard('pro-3','handshake,success,results',54,'Results','Clear, measurable outcomes you can see.') +
              '</div></div>' +
              '<div class="fp-sec alt">' + secHead('How we work','Three simple steps','') + '<div class="fp-features">' + step('01','Discover','we listen and map your needs') + step('02','Build','we do the work, you stay informed') + step('03','Grow','we measure and improve together') + '</div></div>' +
              '<div class="fp-sec">' + quote('Professional, responsive, and genuinely invested in our success. Rare to find.','A','Avi K.','managing director') + '</div>' +
              '<div class="fp-sec alt">' + secHead('Contact','Let\'s talk','Tell us about your project — no obligation.') +
                '<div class="fp-form">' + '<div class="fp-form-row">' + field('Name', inp('Your name')) + field('Email', inp('you@email.com','email')) + '</div>' +
                  field('Message', area('How can we help?')) + blockBtn('Send message','mail') + '</div>' +
              '</div>' +
              footer(n, 'A clear, reassuring presence that turns visitors into clients.', ['Company','Services','Our work','About'], ['Contact','Book a call','Email us','FAQ']) +
            '</div>';
          }
        }
      };
  
      function currentName() { var v = (nameI.value || '').trim(); return v || INDUSTRIES[current].ex; }
      function wireImages() { vp.querySelectorAll('.fp-img').forEach(function (im) { im.addEventListener('error', onImgErr); }); }
  
      function updateCtas(rawName) {
        var ind = INDUSTRIES[current].label;
        var waMsg = 'Hi David 👋 I tried the generator on sudosudev — I\'d like a ' + ind + ' site for “' + rawName + '”. Can we talk?';
        waA.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(waMsg);
        mailA.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(ind + ' website project — ' + rawName) +
          '&body=' + encodeURIComponent('Hi David,\n\nI tried the preview generator on sudosudev.\nI\'d like a ' + ind + ' site for “' + rawName + '”.\n\nThanks!');
        hookName.textContent = rawName;
      }
  
      function paintPreview(rawName) {
        vp.innerHTML = INDUSTRIES[current].render(esc(rawName));
        wireImages(); vp.scrollTop = 0;
        urlE.textContent = 'www.' + slug(rawName) + '.co.il';
        hook.style.display = 'flex';
        updateCtas(rawName);
      }
  
      function compileThenPaint(rawName) {
        hook.style.display = 'none';
        if (reduce) { paintPreview(rawName); return; }
        var s = slug(rawName);
        var page = current === 'resto' ? 'menu' : current === 'shop' ? 'shop' : current === 'travel' ? 'tours' : 'services';
        var lines = [
          '<span class="cy">~/</span> npm run build <span style="color:#4a6172">— ' + esc(rawName) + '</span>',
          '<span class="ok">✓</span> building industry: ' + INDUSTRIES[current].label.toLowerCase(),
          '<span class="ok">✓</span> pages · home · ' + page + ' · gallery · contact',
          '<span class="ok">✓</span> forms · booking · newsletter · lead capture',
          '<span class="ok">✓</span> languages · en · he · fr · responsive',
          '<span class="cy">→</span> deploying · www.' + s + '.co.il <span class="cur"></span>'
        ];
        vp.innerHTML = '<div class="fg-compile" id="fgLog"></div>';
        var log = vp.querySelector('#fgLog'), i = 0;
        (function run() { if (i >= lines.length) { setTimeout(function () { paintPreview(rawName); }, 340); return; } log.innerHTML += lines[i] + '<br>'; i++; setTimeout(run, 230); })();
      }
  
      /* mobile: show the preview in a full-screen modal (keeps panel compact) */
      var stage = forge.querySelector('.fg-stage');
      var modalClose = forge.querySelector('#fgModalClose');
      var mq = window.matchMedia('(max-width:820px)');
      function isMobile() { return mq.matches; }
      function openModal() { if (isMobile()) { forge.classList.add('fg-modal-open'); document.body.style.overflow = 'hidden'; } }
      function closeModal() { forge.classList.remove('fg-modal-open'); document.body.style.overflow = ''; }
      if (modalClose) modalClose.addEventListener('click', closeModal);
      if (stage) stage.addEventListener('click', function (e) { if (e.target === stage) closeModal(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
      if (mq.addEventListener) mq.addEventListener('change', function () { if (!isMobile()) closeModal(); });
      else if (mq.addListener) mq.addListener(function () { if (!isMobile()) closeModal(); });
      function runPreview() { openModal(); compileThenPaint(currentName()); }
  
      chips.forEach(function (c) {
        c.addEventListener('click', function () {
          chips.forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-checked','false'); });
          c.classList.add('is-active'); c.setAttribute('aria-checked','true');
          current = c.getAttribute('data-ind');
          nameI.setAttribute('placeholder', INDUSTRIES[current].ex);
          runPreview();
        });
      });
      go.addEventListener('click', runPreview);
      nameI.addEventListener('keydown', function (e) { if (e.key === 'Enter') { runPreview(); } });
  
      paintPreview(currentName());
    }
  
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
    else { init(); }
  })();