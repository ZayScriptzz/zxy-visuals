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

// ===== FORM SUBMIT FEEDBACK =====
const form = document.getElementById('bookingForm');
if (form) {
  form.addEventListener('submit', () => {
    const btn = form.querySelector('.btn-submit span');
    if (btn) btn.textContent = currentLang === 'fr' ? 'Envoi en cours...' : 'Sending...';
  });
}
