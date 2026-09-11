// Scroll reveal + reading progress. Runs as soon as it's parsed (this script
// is the last thing in <body>) rather than on DOMContentLoaded, so content is
// tagged — and hidden — before it gets a chance to paint.
(() => {
  const STAGGER = 70;
  const MAX_DELAY = 420;

  const all = (selector, fn) => document.querySelectorAll(selector).forEach(fn);
  const tag = (el, variant) => {
    if (el.hasAttribute('data-reveal') || el.closest('header, .slide')) return;
    el.dataset.reveal = variant;
  };

  // Heading blocks: eyebrow, heading, intro and actions cascade together.
  // Grids and panel stacks are skipped; their children are tagged below.
  all('section :is(h1, h2)', (heading) => {
    [...heading.parentElement.children].forEach((child) => {
      if (!child.matches('.grid, .seg-stack, [data-faq]')) tag(child, 'up');
    });
  });
  all('section .grid > p, section .seg, footer .grid > *', (el) => tag(el, 'up'));
  all('.hero-stage', (el) => tag(el, 'stage'));
  all('section .grid > :is(.rounded-2xl, .cmp-card, article), .cmp-card, [data-faq] > .faq-item', (el) =>
    tag(el, 'card'),
  );

  // Table rows keep a fixed cascade behind their card instead of joining a batch.
  all('.cmp-table tbody', (body) => {
    [...body.rows].forEach((row, i) => {
      tag(row, 'card');
      row.style.setProperty('--reveal-delay', `${200 + i * 60}ms`);
    });
  });

  const targets = document.querySelectorAll('[data-reveal]');
  const reveal = (el) => el.classList.add('is-revealed');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    targets.forEach(reveal);
  } else {
    // Whatever enters together staggers in DOM order, so a card row sweeps
    // left to right and a wrapped mobile row cascades on its own. Only things
    // entering from below stagger: anything whose top is already past the
    // viewport (skipped by an anchor jump or a fast fling, often still tucked
    // under the sticky header) appears at once, so it can't eat the budget.
    const observer = new IntersectionObserver(
      (entries) => {
        let n = 0;
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => (a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
          .forEach(({ target: el, boundingClientRect }) => {
            if (!el.style.getPropertyValue('--reveal-delay')) {
              const delay = boundingClientRect.top < 0 ? 0 : Math.min(n++ * STAGGER, MAX_DELAY);
              el.style.setProperty('--reveal-delay', `${delay}ms`);
            }
            reveal(el);
            observer.unobserve(el);
          });
      },
      // The huge top margin counts anything already scrolled past as seen, so
      // anchor jumps and restored scroll positions never leave gaps above.
      { rootMargin: '10000px 0px -8% 0px', threshold: 0 },
    );
    targets.forEach((el) => observer.observe(el));
  }

  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);

  const header = document.querySelector('body > header');
  let ticking = false;

  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(window.scrollY / max, 1) : 0);
    header?.classList.toggle('is-scrolled', window.scrollY > 8);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

document.addEventListener('DOMContentLoaded', () => {
  const initCarousel = (root) => {
    const slides = root.querySelectorAll('.slide');
    if (!slides.length) return;

    let active = Number(root.dataset.start) || 0;
    let timer;

    // Optional: mirror the active slide's role into an element elsewhere on
    // the page, so the hero's search result tracks the photo on show.
    const syncTarget =
      root.dataset.syncTarget && document.querySelector(root.dataset.syncTarget);

    const sync = (slide) => {
      const label = slide.dataset.result;
      if (!syncTarget || !label || syncTarget.textContent === label) return;
      syncTarget.style.opacity = '0';
      setTimeout(() => {
        syncTarget.textContent = label;
        syncTarget.style.opacity = '';
      }, 250);
    };

    const goTo = (index) => {
      active = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle('opacity-100', i === active);
        slide.classList.toggle('opacity-0', i !== active);
      });
      sync(slides[active]);
    };

    const autoplay = () => {
      clearInterval(timer);
      timer = setInterval(() => goTo(active + 1), 4000);
    };

    const step = (delta) => () => {
      goTo(active + delta);
      autoplay();
    };

    root.querySelector('[data-prev]')?.addEventListener('click', step(-1));
    root.querySelector('[data-next]')?.addEventListener('click', step(1));

    goTo(active);
    autoplay();
  };

  document.querySelectorAll('[data-carousel]').forEach(initCarousel);

  const initSwitch = (root) => {
    const tabs = [...root.querySelectorAll('[data-mode]')];
    const panels = [...root.querySelectorAll('[data-panel]')];
    const thumb = root.querySelector('.seg-thumb');
    if (!tabs.length || !panels.length) return;

    const moveThumb = () => {
      const active = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');
      if (!thumb || !active) return;
      thumb.style.width = `${active.offsetWidth}px`;
      thumb.style.transform = `translateX(${active.offsetLeft}px)`;
    };

    const select = (mode) => {
      tabs.forEach((tab) => {
        const on = tab.dataset.mode === mode;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.classList.toggle('is-active', panel.dataset.panel === mode);
      });
      moveThumb();
      root.dispatchEvent(new CustomEvent('switch:change', { detail: { mode } }));
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab.dataset.mode));
      tab.addEventListener('keydown', (event) => {
        const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!delta) return;
        event.preventDefault();
        const next = tabs[(i + delta + tabs.length) % tabs.length];
        select(next.dataset.mode);
        next.focus();
      });
    });

    window.addEventListener('resize', moveThumb);
    if (document.fonts?.ready) document.fonts.ready.then(moveThumb);

    select(root.dataset.switch || tabs[tabs.length - 1].dataset.mode);
  };

  document.querySelectorAll('[data-switch]').forEach(initSwitch);

  const initFaq = (root) => {
    const items = [...root.querySelectorAll('.faq-item')];
    if (!items.length) return;

    const setOpen = (item, open) => {
      item.classList.toggle('is-open', open);
      item.querySelector('.faq-q')?.setAttribute('aria-expanded', String(open));
    };

    const reset = () => {
      items.forEach((item) => setOpen(item, false));
      setOpen(items[0], true);
    };

    items.forEach((item) => {
      item.querySelector('.faq-q')?.addEventListener('click', () => {
        const open = !item.classList.contains('is-open');
        items.forEach((other) => setOpen(other, false));
        setOpen(item, open);
      });
    });

    // Switching audience returns the hidden panel to its default so the stack keeps a stable height.
    root.closest('[data-switch]')?.addEventListener('switch:change', reset);

    reset();
  };

  document.querySelectorAll('[data-faq]').forEach(initFaq);

  const initContactForm = (form) => {
    const body = form.querySelector('[data-body]');
    const success = form.querySelector('[data-success]');
    const fields = [...form.querySelectorAll('[data-field]')];
    if (!body || !success || !fields.length) return;

    const rules = {
      name: (value) => (value ? '' : 'Please tell us your name.'),
      email: (value) =>
        !value
          ? 'Please enter your email.'
          : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ? ''
            : "That email doesn't look right.",
      message: (value) => (value ? '' : 'Please add a short message.'),
    };

    const errorFor = (field) => form.querySelector(`[data-error="${field.dataset.field}"]`);

    const setError = (field, message) => {
      const note = errorFor(field);
      field.classList.toggle('border-danger', Boolean(message));
      field.classList.toggle('border-border', !message);
      field.setAttribute('aria-invalid', String(Boolean(message)));
      if (!note) return;
      note.textContent = message;
      note.hidden = !message;
    };

    const check = (field) => {
      const message = rules[field.dataset.field]?.(field.value.trim()) ?? '';
      setError(field, message);
      return !message;
    };

    // Only nag once a field has already failed — never mid-first-attempt.
    fields.forEach((field) => {
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') check(field);
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const invalid = fields.filter((field) => !check(field));
      if (invalid.length) {
        invalid[0].focus();
        return;
      }

      // TODO: POST these values to a real endpoint once a backend exists.
      body.hidden = true;
      success.hidden = false;
      success.querySelector('[data-reset]')?.focus();
    });

    form.querySelector('[data-reset]')?.addEventListener('click', () => {
      form.reset();
      fields.forEach((field) => setError(field, ''));
      success.hidden = true;
      body.hidden = false;
      fields[0].focus();
    });
  };

  document.querySelectorAll('[data-contact-form]').forEach(initContactForm);

  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    const setMenu = (open) => {
      mobileMenu.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    menuBtn.addEventListener('click', () => setMenu(mobileMenu.hidden));

    // Close on navigation, or an anchor target scrolls in behind the open menu.
    mobileMenu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
  }
});
