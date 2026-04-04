// ===== LANGUAGE TOGGLE =====
let currentLang = 'en';

function toggleLang() {
  currentLang = currentLang === 'en' ? 'fr' : 'en';
  const btn = document.getElementById('langBtn');
  btn.textContent = currentLang === 'en' ? '🌐 FR' : '🌐 EN';

  // Update all elements with data-en / data-fr
  document.querySelectorAll('[data-en]').forEach(el => {
    const text = el.getAttribute('data-' + currentLang);
    if (!text) return;
    // Use innerHTML for elements that may contain tags like <em> or <br>
    if (text.includes('<') || text.includes('&')) {
      el.innerHTML = text;
    } else {
      el.textContent = text;
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-en-placeholder]').forEach(el => {
    const ph = el.getAttribute('data-' + currentLang + '-placeholder');
    if (ph) el.placeholder = ph;
  });

  // Update select options
  document.querySelectorAll('select option[data-en]').forEach(opt => {
    const text = opt.getAttribute('data-' + currentLang);
    if (text) opt.textContent = text;
  });

  // Update html lang attribute
  document.documentElement.lang = currentLang;
}

// ===== CUSTOM CURSOR =====
const cursor = document.getElementById('cursor');
const trail = document.getElementById('cursor-trail');
let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top = mouseY + 'px';
  setTimeout(() => {
    trail.style.left = mouseX + 'px';
    trail.style.top = mouseY + 'px';
  }, 80);
});

document.querySelectorAll('a, button, .service-card, .package-card, input, select, textarea').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '14px';
    cursor.style.height = '14px';
    trail.style.width = '44px';
    trail.style.height = '44px';
    trail.style.borderColor = 'rgba(184,32,32,0.4)';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '7px';
    cursor.style.height = '7px';
    trail.style.width = '28px';
    trail.style.height = '28px';
    trail.style.borderColor = 'rgba(26,107,191,0.35)';
  });
});

// ===== NAV SCROLL =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 80);
}, { passive: true });

// ===== SCROLL REVEAL =====
const revealTargets = [
  '.service-card', '.package-card', '.stat-item',
  '.gear-item', '.strip-text', '.strip-stats',
  '.book-header', '.packages-header', '.services-header',
  '.gear-note', '.addons'
];
document.querySelectorAll(revealTargets.join(',')).forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Stagger grid children
document.querySelectorAll('.services-grid, .packages-grid, .gear-grid, .strip-stats').forEach(parent => {
  Array.from(parent.children).forEach((child, i) => {
    child.style.transitionDelay = (i * 0.07) + 's';
  });
});

// ===== SMOOTH ANCHOR SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ===== REVIEW CAROUSEL =====
function initReviews() {
  const track = document.getElementById('reviewsTrack');
  const dotsContainer = document.getElementById('reviewsDots');
  const prevBtn = document.querySelector('.reviews-prev');
  const nextBtn = document.querySelector('.reviews-next');
  const toggleBtn = document.getElementById('reviewToggle');
  const reviewForm = document.getElementById('reviewForm');
  if (!track || !window.ZXY_REVIEWS) return;

  const reviews = window.ZXY_REVIEWS;
  let current = 0;
  let timer;

  reviews.forEach(r => {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML =
      '<div class="review-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>' +
      '<p class="review-text">' + r.text + '</p>' +
      '<div class="review-meta">' +
        '<span class="review-name">' + r.name + '</span>' +
        '<span class="review-service">' + r.service + '</span>' +
      '</div>';
    track.appendChild(card);
  });

  reviews.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'reviews-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Review ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function goTo(index) {
    current = (index + reviews.length) % reviews.length;
    track.style.transform = 'translateX(-' + current * 100 + '%)';
    dotsContainer.querySelectorAll('.reviews-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
    resetTimer();
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 5500);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  const wrapper = track.parentElement;
  wrapper.addEventListener('mouseenter', () => clearInterval(timer));
  wrapper.addEventListener('mouseleave', resetTimer);

  let touchX = 0;
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
  });

  if (toggleBtn && reviewForm) {
    toggleBtn.addEventListener('click', () => {
      const open = reviewForm.classList.toggle('open');
      toggleBtn.textContent = open
        ? (currentLang === 'fr' ? 'Annuler' : 'Cancel')
        : (currentLang === 'fr' ? 'Laisser un avis' : 'Leave a Review');
    });
  }

  resetTimer();
}
initReviews();

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
    document.body.classList.toggle('nav-open');
  });
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.classList.remove('nav-open');
    });
  });
}

// ===== FOOTER AXIS ANIMATION =====
const footerAxis = document.getElementById('footerAxis');
if (footerAxis) {
  const axObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      footerAxis.classList.add('fa-animate');
      axObs.unobserve(footerAxis);
    }
  }, { threshold: 0.4 });
  axObs.observe(footerAxis);
}

// ===== FORM VALIDATION + SUBMIT FEEDBACK =====
const form = document.getElementById('bookingForm');
if (form) {
  form.addEventListener('submit', (e) => {
    const required = form.querySelectorAll('[required]');
    let firstError = null;

    required.forEach(field => {
      const group = field.closest('.form-group');
      if (!field.value.trim()) {
        field.classList.add('field-error');
        if (group) group.classList.add('field-error');
        if (!firstError) firstError = field;
      } else {
        field.classList.remove('field-error');
        if (group) group.classList.remove('field-error');
      }
    });

    if (firstError) {
      e.preventDefault();
      const top = firstError.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top, behavior: 'smooth' });
      setTimeout(() => firstError.focus(), 400);
      return;
    }

    const btn = form.querySelector('.btn-submit span');
    if (btn) btn.textContent = currentLang === 'fr' ? 'Envoi en cours...' : 'Sending...';
  });

  // Clear error state as user fills in fields
  form.querySelectorAll('[required]').forEach(field => {
    field.addEventListener('input', () => {
      field.classList.remove('field-error');
      const group = field.closest('.form-group');
      if (group) group.classList.remove('field-error');
    });
  });
}
