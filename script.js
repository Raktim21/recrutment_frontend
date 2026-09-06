document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.getElementById('heroCarousel');
  if (carousel) {
    const slides = carousel.querySelectorAll('.slide');
    let active = 0;

    const goTo = (index) => {
      active = index;
      slides.forEach((slide, i) => {
        slide.classList.toggle('opacity-100', i === active);
        slide.classList.toggle('opacity-0', i !== active);
      });
    };

    setInterval(() => {
      goTo((active + 1) % slides.length);
    }, 4000);
  }

  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.hidden = !mobileMenu.hidden;
    });
  }
});
