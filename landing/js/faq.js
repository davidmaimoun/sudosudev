/* ═══════════════════════════════════════════════════════════════════
   FAQ — mobile dropdown toggle
   On desktop the category grids are always visible (this does nothing).
   On mobile (≤768px) tapping a category header expands/collapses it.
   Safe to load in <head> (with defer) or before </body>, or paste the
   IIFE body into your main.js.
   ═══════════════════════════════════════════════════════════════════ */
   (function () {
    'use strict';
  
    function init() {
      var faq = document.getElementById('faq');
      if (!faq || faq.dataset.faqReady) return;
      faq.dataset.faqReady = '1';
  
      var mq = window.matchMedia('(max-width:768px)');
  
      faq.querySelectorAll('.faq-cat-head').forEach(function (head) {
        head.addEventListener('click', function () {
          if (!mq.matches) return;                 // desktop: grid always shown
          var cat = head.parentNode;
          var open = cat.classList.toggle('is-open');
          head.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
      });
  
      // collapse everything if the viewport grows back to desktop
      (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function () {
        if (!mq.matches) {
          faq.querySelectorAll('.faq-cat.is-open').forEach(function (c) {
            c.classList.remove('is-open');
            var h = c.querySelector('.faq-cat-head');
            if (h) h.setAttribute('aria-expanded', 'false');
          });
        }
      });
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();