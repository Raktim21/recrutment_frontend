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

  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.hidden = !mobileMenu.hidden;
    });
  }
});
