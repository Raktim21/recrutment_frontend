document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.getElementById('heroCarousel');
  if (carousel) {
    const slides = carousel.querySelectorAll('.slide');
    const dots = carousel.querySelectorAll('.dot');
    let active = 0;

    const goTo = (index) => {
      slides[active].classList.replace('opacity-100', 'opacity-0');
      dots[active].classList.remove('dot-active');
      active = index;
      slides[active].classList.replace('opacity-0', 'opacity-100');
      dots[active].classList.add('dot-active');
    };

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => goTo(i));
      dot.style.cursor = 'pointer';
    });

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
