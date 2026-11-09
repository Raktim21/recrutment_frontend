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
      if (!child.matches('.grid, .seg-stack, [data-faq], [data-library]')) tag(child, 'up');
    });
  });
  all('section .grid > p, section .seg, footer .grid > *', (el) => tag(el, 'up'));
  all('.hero-stage', (el) => tag(el, 'stage'));
  // The library reveals as one block: its cards get re-hidden by paging, so
  // they must never depend on an observer that has already fired.
  all('section .grid > :is(.rounded-2xl, .cmp-card, article), .cmp-card, [data-faq], [data-library]', (el) =>
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

  // Hero headline: cycles through its versions in a loop. Pauses while the
  // tab is hidden or the visitor is hovering/focused in the hero copy, and
  // stays on the first headline when reduced motion is requested.
  const initHeadlineRotator = (root) => {
    const items = [...root.querySelectorAll('.headline-item')];
    if (items.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let active = 0;
    let timer;
    let paused = false;

    const next = () => {
      const prev = items[active];
      active = (active + 1) % items.length;
      const curr = items[active];

      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      prev.setAttribute('aria-hidden', 'true');

      curr.classList.remove('is-leaving');
      curr.classList.add('is-active');
      curr.removeAttribute('aria-hidden');

      // Once the exit finishes, drop the class so the item re-enters from below next time.
      setTimeout(() => prev.classList.remove('is-leaving'), 650);
    };

    const start = () => {
      clearInterval(timer);
      if (!paused && !document.hidden) timer = setInterval(next, 4500);
    };
    const stop = () => clearInterval(timer);

    const copy = root.closest('h1')?.parentElement || root;
    copy.addEventListener('mouseenter', () => { paused = true; stop(); });
    copy.addEventListener('mouseleave', () => { paused = false; start(); });
    copy.addEventListener('focusin', () => { paused = true; stop(); });
    copy.addEventListener('focusout', () => { paused = false; start(); });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    start();
  };

  document.querySelectorAll('[data-headline-rotator]').forEach(initHeadlineRotator);

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

  // Searchable, filterable, paginated card grid (assessments.html, resources.html).
  const initLibrary = (root) => {
    const cards = [...root.querySelectorAll('[data-card]')];
    const chips = [...root.querySelectorAll('[data-filter]')];
    const search = root.querySelector('[data-search]');
    const pager = root.querySelector('[data-pager]');
    const empty = root.querySelector('[data-empty]');
    const status = root.querySelector('[data-status]');
    if (!cards.length) return;

    const perPage = Number(root.dataset.perPage) || 12;
    const text = new Map(cards.map((card) => [card, card.textContent.toLowerCase().replace(/\s+/g, ' ')]));
    const state = { query: '', filter: 'all', page: 1 };

    const chevron = (d) =>
      `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="${d}"/></svg>`;

    const pageButton = (label, page, { current = false, disabled = false, aria } = {}) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lib-page';
      btn.innerHTML = label;
      btn.dataset.page = page;
      btn.disabled = disabled;
      if (aria) btn.setAttribute('aria-label', aria);
      if (current) btn.setAttribute('aria-current', 'page');
      return btn;
    };

    const renderPager = (pages) => {
      if (!pager) return;
      pager.replaceChildren();
      pager.style.display = pages > 1 ? '' : 'none';
      if (pages <= 1) return;
      pager.append(
        pageButton(chevron('m15 18-6-6 6-6'), state.page - 1, { disabled: state.page === 1, aria: 'Previous page' }),
        ...Array.from({ length: pages }, (_, i) =>
          pageButton(String(i + 1), i + 1, { current: i + 1 === state.page, aria: `Page ${i + 1}` }),
        ),
        pageButton(chevron('m9 18 6-6-6-6'), state.page + 1, { disabled: state.page === pages, aria: 'Next page' }),
      );
    };

    const apply = () => {
      const matches = cards.filter(
        (card) =>
          (state.filter === 'all' || card.dataset.category === state.filter) &&
          (!state.query || text.get(card).includes(state.query)),
      );
      const pages = Math.max(1, Math.ceil(matches.length / perPage));
      state.page = Math.min(Math.max(state.page, 1), pages);
      const shown = new Set(matches.slice((state.page - 1) * perPage, state.page * perPage));

      cards.forEach((card) => {
        card.hidden = !shown.has(card);
      });
      if (empty) empty.hidden = matches.length > 0;
      if (status) {
        status.textContent = matches.length
          ? `${matches.length} result${matches.length === 1 ? '' : 's'}, page ${state.page} of ${pages}`
          : 'No results';
      }
      renderPager(pages);
    };

    const setFilter = (filter) => {
      if (!chips.some((chip) => chip.dataset.filter === filter)) filter = 'all';
      state.filter = filter;
      state.page = 1;
      chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.filter === filter)));
      apply();
    };

    chips.forEach((chip) => chip.addEventListener('click', () => setFilter(chip.dataset.filter)));

    let debounce;
    search?.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        state.query = search.value.trim().toLowerCase().replace(/\s+/g, ' ');
        state.page = 1;
        apply();
      }, 150);
    });

    pager?.addEventListener('click', (event) => {
      const btn = event.target.closest('.lib-page');
      if (!btn || btn.disabled) return;
      state.page = Number(btn.dataset.page);
      apply();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      // Keep keyboard focus in the pager after it's rebuilt.
      pager.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
    });

    // Deep link: resources.html?category=career-growth preselects a chip.
    setFilter(new URLSearchParams(window.location.search).get('category') || 'all');
  };

  document.querySelectorAll('[data-library]').forEach(initLibrary);

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
