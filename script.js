// ===== LANGUAGE TOGGLE =====
let currentLang = 'en';

function applyLang(lang) {
  currentLang = lang;
  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = currentLang === 'en' ? '🌐 FR' : '🌐 EN';

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
  document.querySelectorAll('select optgroup[data-en-label]').forEach(grp => {
    const label = grp.getAttribute('data-' + currentLang + '-label');
    if (label) grp.label = label;
  });

  // Update html lang attribute
  document.documentElement.lang = currentLang;

  // Persist across pages
  try { localStorage.setItem('zxy-lang', currentLang); } catch (e) {}
}

function toggleLang() {
  applyLang(currentLang === 'en' ? 'fr' : 'en');
}

// Restore saved language choice
try {
  if (localStorage.getItem('zxy-lang') === 'fr') applyLang('fr');
} catch (e) {}

// ===== CUSTOM CURSOR =====
const cursor = document.getElementById('cursor');
const trail = document.getElementById('cursor-trail');
let mouseX = 0, mouseY = 0;

// Native cursor is only hidden (via CSS) once this class confirms JS is running
document.body.classList.add('has-custom-cursor');

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

// ===== HERO PARALLAX =====
(function() {
  const heroPhoto = document.querySelector('.hero-photo');
  if (!heroPhoto) return;
  if (!window.matchMedia('(hover: hover)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        heroPhoto.style.transform = 'translateY(' + (window.scrollY * -0.18) + 'px)';
        ticking = false;
      });
    }
  }, { passive: true });
})();

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

// ===== PORTFOLIO VIDEOS — PLAY ONLY WHEN VISIBLE =====
// Videos use preload="none" + poster, so nothing downloads until scrolled into view
document.querySelectorAll('video.portfolio-video').forEach(video => {
  const vidObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { rootMargin: '120px' });
  vidObs.observe(video);
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
      // After draw-in completes, start the loop
      setTimeout(() => {
        footerAxis.classList.add('fa-looping');
        let isTextState = false;
        const toggleAxisState = () => {
          isTextState = !isTextState;
          footerAxis.classList.toggle('fa-state-text', isTextState);
          setTimeout(toggleAxisState, 3500);
        };
        toggleAxisState();
      }, 3200);
    }
  }, { threshold: 0.1, rootMargin: '0px 0px 80px 0px' });
  axObs.observe(footerAxis);
}

// ===== ENHANCED LIGHTBOX =====
(function() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  let images = [];
  let currentIndex = 0;
  const isMobile = () => window.innerWidth <= 768;

  // Build lightbox inner HTML once
  lightbox.innerHTML =
    '<button class="lightbox-close" aria-label="Close">&times;</button>' +
    '<button class="lightbox-prev lightbox-nav-hidden" aria-label="Previous">&#8592;</button>' +
    '<button class="lightbox-next lightbox-nav-hidden" aria-label="Next">&#8594;</button>' +
    '<div class="lightbox-main"></div>' +
    '<div class="lightbox-thumbs lightbox-thumbs-hidden"></div>' +
    '<div class="lightbox-scroll"></div>';

  var closeBtn = lightbox.querySelector('.lightbox-close');
  var mainArea = lightbox.querySelector('.lightbox-main');
  var thumbStrip = lightbox.querySelector('.lightbox-thumbs');
  var prevBtn = lightbox.querySelector('.lightbox-prev');
  var nextBtn = lightbox.querySelector('.lightbox-next');
  var scrollArea = lightbox.querySelector('.lightbox-scroll');

  function openLightbox(items, startIndex, originEl) {
    images = items;
    currentIndex = startIndex || 0;
    var isMulti = images.length > 1;

    lightbox.classList.toggle('lb-multi', isMulti);

    if (isMulti && isMobile()) {
      buildMobileLightbox();
    } else {
      buildDesktopLightbox(originEl);
    }

    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    showLbCursor();
  }

  function buildDesktopLightbox(originEl) {
    scrollArea.innerHTML = '';
    mainArea.innerHTML = '';

    var item = images[currentIndex];
    if (item.type === 'video') {
      var video = document.createElement('video');
      video.src = item.src;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      mainArea.appendChild(video);
    } else {
      var img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt || '';

      // FLIP animation if origin element exists
      if (originEl && item.type !== 'video') {
        var rect = originEl.getBoundingClientRect();
        img.classList.add('lb-flip');
        img.style.position = 'fixed';
        img.style.top = rect.top + 'px';
        img.style.left = rect.left + 'px';
        img.style.width = rect.width + 'px';
        img.style.height = rect.height + 'px';
        img.style.maxWidth = 'none';
        img.style.maxHeight = 'none';
        img.style.objectFit = 'cover';
        mainArea.appendChild(img);

        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            var targetH = window.innerHeight * 0.85;
            var naturalRatio = rect.width / rect.height;
            var targetW = targetH * naturalRatio;
            if (targetW > window.innerWidth * 0.9) {
              targetW = window.innerWidth * 0.9;
              targetH = targetW / naturalRatio;
            }
            img.style.top = ((window.innerHeight - targetH) / 2) + 'px';
            img.style.left = ((window.innerWidth - targetW) / 2) + 'px';
            img.style.width = targetW + 'px';
            img.style.height = targetH + 'px';
            img.style.objectFit = 'contain';

            setTimeout(function() {
              img.classList.remove('lb-flip');
              img.style.cssText = '';
            }, 420);
          });
        });
      } else {
        mainArea.appendChild(img);
      }
    }

    // Arrows
    if (images.length > 1) {
      prevBtn.classList.remove('lightbox-nav-hidden');
      nextBtn.classList.remove('lightbox-nav-hidden');
    } else {
      prevBtn.classList.add('lightbox-nav-hidden');
      nextBtn.classList.add('lightbox-nav-hidden');
    }

    // Thumbnails
    if (images.length > 1) {
      thumbStrip.classList.remove('lightbox-thumbs-hidden');
      thumbStrip.innerHTML = '';
      images.forEach(function(item, i) {
        var btn = document.createElement('button');
        btn.className = 'lightbox-thumb' + (i === currentIndex ? ' active' : '');
        btn.setAttribute('aria-label', 'View image ' + (i + 1));
        var tImg = document.createElement('img');
        tImg.src = item.src;
        tImg.alt = '';
        btn.appendChild(tImg);
        btn.addEventListener('click', function() { goTo(i); });
        thumbStrip.appendChild(btn);
      });
    } else {
      thumbStrip.classList.add('lightbox-thumbs-hidden');
      thumbStrip.innerHTML = '';
    }
  }

  function buildMobileLightbox() {
    mainArea.innerHTML = '';
    thumbStrip.innerHTML = '';
    thumbStrip.classList.add('lightbox-thumbs-hidden');
    prevBtn.classList.add('lightbox-nav-hidden');
    nextBtn.classList.add('lightbox-nav-hidden');

    scrollArea.innerHTML = '';
    images.forEach(function(item, i) {
      var slide = document.createElement('div');
      slide.className = 'lightbox-slide';
      var img = document.createElement('img');
      img.alt = item.alt || '';
      // Lazy-load images 2+
      if (i === 0 || i === currentIndex) {
        img.src = item.src;
      } else {
        img.dataset.src = item.src;
        img.style.opacity = '0';
      }
      slide.appendChild(img);
      scrollArea.appendChild(slide);
    });

    // Scroll to the starting image
    if (currentIndex > 0) {
      setTimeout(function() {
        scrollArea.children[currentIndex].scrollIntoView();
      }, 50);
    }

    // Lazy-load observer
    var lazyObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var img = entry.target.querySelector('img[data-src]');
          if (img) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            img.style.opacity = '1';
          }
          lazyObs.unobserve(entry.target);
        }
      });
    }, { root: scrollArea, rootMargin: '200px' });

    Array.from(scrollArea.children).forEach(function(slide) {
      if (slide.querySelector('img[data-src]')) lazyObs.observe(slide);
    });

    // Swipe-down to dismiss
    var startY = 0;
    scrollArea.addEventListener('touchstart', function(e) {
      if (scrollArea.scrollTop <= 0) startY = e.touches[0].clientY;
    }, { passive: true });
    scrollArea.addEventListener('touchend', function(e) {
      var dy = e.changedTouches[0].clientY - startY;
      if (dy > 100 && scrollArea.scrollTop <= 0) closeLightbox();
    });
  }

  function goTo(index) {
    currentIndex = (index + images.length) % images.length;
    buildDesktopLightbox(null);
  }

  function closeLightbox() {
    stopLbCursorHide();
    lightbox.classList.remove('open', 'lb-multi');
    document.body.style.overflow = '';
    var video = mainArea.querySelector('video');
    if (video) video.pause();
    mainArea.innerHTML = '';
    scrollArea.innerHTML = '';
    thumbStrip.innerHTML = '';
  }

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox || e.target === mainArea) closeLightbox();
  });
  prevBtn.addEventListener('click', function() { goTo(currentIndex - 1); });
  nextBtn.addEventListener('click', function() { goTo(currentIndex + 1); });

  document.addEventListener('keydown', function(e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft' && images.length > 1) goTo(currentIndex - 1);
    if (e.key === 'ArrowRight' && images.length > 1) goTo(currentIndex + 1);
  });

  // ===== BIND TRIGGERS =====

  // Single-image triggers (creators.html, index.html portfolio items)
  document.querySelectorAll('.lightbox-trigger').forEach(function(el) {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.addEventListener('click', function() {
      var type = el.dataset.type || 'image';
      var src = el.dataset.src;
      openLightbox([{ src: src, type: type, alt: '' }], 0, el.querySelector('img') || el);
    });
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
  });

  // Stack triggers (portal page)
  document.querySelectorAll('.portal-stack').forEach(function(el) {
    el.addEventListener('click', function() {
      var items;
      try { items = JSON.parse(el.dataset.images); } catch(e) { return; }
      var originImg = el.querySelector('.stack-front img');
      openLightbox(items, 0, originImg);
    });
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
  });

  // ===== CURSOR AUTO-HIDE IN LIGHTBOX =====
  var cursorTimer = null;
  var onMedia = false;

  function showLbCursor() {
    lightbox.classList.remove('lb-cursor-hidden');
    document.body.classList.remove('lb-cursor-fading');
    document.body.classList.add('lb-cursor-visible');
    clearTimeout(cursorTimer);
    if (onMedia) {
      cursorTimer = setTimeout(hideLbCursor, 2000);
    }
  }

  function hideLbCursor() {
    document.body.classList.remove('lb-cursor-visible');
    document.body.classList.add('lb-cursor-fading');
    setTimeout(function() {
      if (document.body.classList.contains('lb-cursor-fading')) {
        lightbox.classList.add('lb-cursor-hidden');
      }
    }, 400);
  }

  function stopLbCursorHide() {
    clearTimeout(cursorTimer);
    onMedia = false;
    lightbox.classList.remove('lb-cursor-hidden');
    document.body.classList.remove('lb-cursor-fading', 'lb-cursor-visible');
  }

  // Track whether cursor is over the image/video
  mainArea.addEventListener('mouseenter', function() {
    onMedia = true;
    if (lightbox.classList.contains('open')) {
      clearTimeout(cursorTimer);
      cursorTimer = setTimeout(hideLbCursor, 2000);
    }
  });
  mainArea.addEventListener('mouseleave', function() {
    onMedia = false;
    clearTimeout(cursorTimer);
    showLbCursor();
  });
  mainArea.addEventListener('mousemove', function() {
    if (lightbox.classList.contains('open') && onMedia) showLbCursor();
  });

  // Expose for external use
  window.ZXY_LIGHTBOX = { open: openLightbox };
})();

// ===== STAR RATING =====
(function() {
  var container = document.getElementById('starRating');
  var hidden = document.getElementById('ratingValue');
  if (!container || !hidden) return;
  var stars = container.querySelectorAll('.star-btn');
  var selected = 0;

  function updateStars(count, className) {
    stars.forEach(function(s, i) {
      s.classList.toggle(className, i < count);
    });
  }

  stars.forEach(function(star) {
    star.addEventListener('click', function() {
      selected = parseInt(star.dataset.value);
      hidden.value = selected;
      updateStars(selected, 'active');
      container.classList.remove('star-error');
    });
    star.addEventListener('mouseenter', function() {
      var val = parseInt(star.dataset.value);
      updateStars(val, 'hover-preview');
    });
    star.addEventListener('mouseleave', function() {
      stars.forEach(function(s) { s.classList.remove('hover-preview'); });
    });
  });

  // Validation — intercept form submit
  var form = container.closest('form');
  if (form) {
    form.addEventListener('submit', function(e) {
      if (!hidden.value) {
        e.preventDefault();
        container.classList.add('star-error');
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(function() { container.classList.remove('star-error'); }, 600);
      }
    });
  }
})();

// ===== DATE PICKER — FUTURE DATES ONLY =====
const dateInput = document.getElementById('date');
if (dateInput) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  // Build the date string in local time — toISOString() is UTC and can be off by a day
  const pad = n => String(n).padStart(2, '0');
  dateInput.min = tomorrow.getFullYear() + '-' + pad(tomorrow.getMonth() + 1) + '-' + pad(tomorrow.getDate());
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
