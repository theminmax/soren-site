/* ============================================
   SØREN — Premium Hair Renewal System
   JavaScript — Production Build
   Vanilla JS, no dependencies
   ============================================ */

(function () {
  'use strict';

  /* --- DOM Ready --- */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initScrollReveal();
    initStickyHeader();
    initSmoothScroll();
    initMobileNav();
    initFAQAccordion();
    initAnnouncementBarOffset();
    initCart();
  }

  /* ============================================
     SCROLL REVEAL — Intersection Observer
     ============================================ */
  function initScrollReveal() {
    var reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    // Fallback for older browsers
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) {
        el.classList.add('revealed');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ============================================
     STICKY HEADER — Scroll detection
     ============================================ */
  function initStickyHeader() {
    var header = document.getElementById('header');
    var announcementBar = document.getElementById('announcement-bar');
    if (!header) return;

    var scrollThreshold = 60;
    var ticking = false;
    var alwaysScrolled = header.classList.contains('scrolled');

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          var scrollY = window.pageYOffset || document.documentElement.scrollTop;

          if (alwaysScrolled || scrollY > scrollThreshold) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }

          // Hide announcement bar on scroll and move header up
          if (announcementBar) {
            if (scrollY > 10) {
              announcementBar.style.transform = 'translateY(-100%)';
              header.style.top = '0';
            } else {
              announcementBar.style.transform = 'translateY(0)';
              header.style.top = announcementBar.offsetHeight + 'px';
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Trigger once on load
    onScroll();
  }

  /* ============================================
     SMOOTH SCROLL — Anchor links
     ============================================ */
  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;

        var target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        // Close mobile nav if open
        closeMobileNav();

        var headerHeight = 72;
        var targetPosition =
          target.getBoundingClientRect().top +
          window.pageYOffset -
          headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      });
    });
  }

  /* ============================================
     MOBILE NAV — Toggle & overlay
     ============================================ */
  var navToggle, navLinks, navOverlay;

  function initMobileNav() {
    navToggle = document.getElementById('nav-toggle');
    navLinks = document.getElementById('nav-links');
    if (!navToggle || !navLinks) return;

    // Create overlay
    navOverlay = document.createElement('div');
    navOverlay.className = 'nav-overlay';
    document.body.appendChild(navOverlay);

    navToggle.addEventListener('click', toggleMobileNav);
    navOverlay.addEventListener('click', closeMobileNav);
  }

  function toggleMobileNav() {
    var isOpen = navLinks.classList.contains('open');
    if (isOpen) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  }

  function openMobileNav() {
    navLinks.classList.add('open');
    navToggle.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    if (navOverlay) navOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    if (!navLinks || !navToggle) return;
    navLinks.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    if (navOverlay) navOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ============================================
     FAQ ACCORDION
     ============================================ */
  function initFAQAccordion() {
    var faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach(function (item) {
      var button = item.querySelector('.faq-item__question');
      if (!button) return;

      button.addEventListener('click', function () {
        var isActive = item.classList.contains('active');

        // Close all others
        faqItems.forEach(function (otherItem) {
          otherItem.classList.remove('active');
          var otherBtn = otherItem.querySelector('.faq-item__question');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        });

        // Toggle current
        if (!isActive) {
          item.classList.add('active');
          button.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ============================================
     ANNOUNCEMENT BAR OFFSET
     ============================================ */
  function initAnnouncementBarOffset() {
    var bar = document.getElementById('announcement-bar');
    if (!bar) return;

    // Adjust hero padding to account for announcement bar height
    var hero = document.getElementById('hero');
    if (hero) {
      var barHeight = bar.offsetHeight;
      hero.style.paddingTop = 72 + barHeight + 'px';
    }
  }
  /* ============================================
     CART SYSTEM — localStorage-backed cart
     ============================================ */
  var cart = [];
  var CART_STORAGE_KEY = 'soren_cart';

  var PRODUCTS = {
    '1-month-supply': { variant: '1-month-supply', name: '1 Month Supply', price: 59.95, image: 'assets/images/optimized/boxes/4-renewal.jpg' },
    '2-month-supply': { variant: '2-month-supply', name: '2 Month Supply', price: 74.95, image: 'assets/images/optimized/boxes/8-renewal.jpg' },
    '3-month-supply': { variant: '3-month-supply', name: '3 Month Supply', price: 99.95, image: 'assets/images/optimized/boxes/12-renewal.jpg' }
  };

  function initCart() {
    loadCart();
    updateCartBadge();
    renderCart();
    attachCartListeners();

    // Auto-open cart if redirected from checkout with ?opencart=1
    if (window.location.search.indexOf('opencart=1') !== -1) {
      openCart();
      // Clean the URL parameter
      if (window.history.replaceState) {
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      }
    }
  }

  function loadCart() {
    try {
      var stored = localStorage.getItem(CART_STORAGE_KEY);
      cart = stored ? JSON.parse(stored) : [];
    } catch (e) {
      cart = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      // localStorage full or unavailable
    }
  }

  function addToCart(variant) {
    var product = PRODUCTS[variant];
    if (!product) return;

    var existing = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].variant === variant) {
        existing = cart[i];
        break;
      }
    }

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        variant: product.variant,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image
      });
    }

    saveCart();
    renderCart();
    updateCartBadge();
    openCart();
  }

  function removeFromCart(variant) {
    cart = cart.filter(function (item) { return item.variant !== variant; });
    saveCart();
    renderCart();
    updateCartBadge();
  }

  function updateQuantity(variant, newQty) {
    newQty = parseInt(newQty, 10);
    if (isNaN(newQty) || newQty < 1) {
      removeFromCart(variant);
      return;
    }
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].variant === variant) {
        cart[i].quantity = newQty;
        break;
      }
    }
    saveCart();
    renderCart();
    updateCartBadge();
  }

  function getCartTotal() {
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      total += cart[i].price * cart[i].quantity;
    }
    return total;
  }

  function getCartItemCount() {
    var count = 0;
    for (var i = 0; i < cart.length; i++) {
      count += cart[i].quantity;
    }
    return count;
  }

  function renderCart() {
    var body = document.getElementById('cart-drawer-body');
    var footer = document.getElementById('cart-drawer-footer');
    var emptyState = document.getElementById('cart-drawer-empty');
    var countEl = document.getElementById('cart-drawer-count');
    var subtotalEl = document.getElementById('cart-subtotal');

    if (!body) return; // Not on a page with the cart drawer

    var itemCount = getCartItemCount();

    if (countEl) {
      countEl.textContent = '(' + itemCount + ' item' + (itemCount !== 1 ? 's' : '') + ')';
    }

    if (cart.length === 0) {
      body.innerHTML = '';
      if (footer) footer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (footer) footer.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    var html = '';
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      var lineTotal = (item.price * item.quantity).toFixed(2);
      html += '<div class="cart-item" data-variant="' + item.variant + '">';
      html += '  <div class="cart-item__image"><img src="' + item.image + '" alt="' + item.name + '" width="80" height="80" loading="lazy"></div>';
      html += '  <div class="cart-item__details">';
      html += '    <div class="cart-item__top">';
      html += '      <h4 class="cart-item__name">' + item.name + '</h4>';
      html += '      <button class="cart-item__remove" data-remove="' + item.variant + '" aria-label="Remove ' + item.name + '">';
      html += '        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
      html += '      </button>';
      html += '    </div>';
      html += '    <p class="cart-item__price">$' + item.price.toFixed(2) + '</p>';
      html += '    <div class="cart-item__bottom">';
      html += '      <div class="cart-quantity">';
      html += '        <button class="cart-quantity__btn" data-qty-minus="' + item.variant + '" aria-label="Decrease quantity">−</button>';
      html += '        <span class="cart-quantity__value">' + item.quantity + '</span>';
      html += '        <button class="cart-quantity__btn" data-qty-plus="' + item.variant + '" aria-label="Increase quantity">+</button>';
      html += '      </div>';
      html += '      <span class="cart-item__line-total">$' + lineTotal + '</span>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    }

    body.innerHTML = html;

    if (subtotalEl) {
      subtotalEl.textContent = '$' + getCartTotal().toFixed(2);
    }

    // Attach event listeners to dynamically created elements
    var removeButtons = body.querySelectorAll('[data-remove]');
    removeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeFromCart(this.getAttribute('data-remove'));
      });
    });

    var minusButtons = body.querySelectorAll('[data-qty-minus]');
    minusButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = this.getAttribute('data-qty-minus');
        var item = cart.find(function (i) { return i.variant === v; });
        if (item) updateQuantity(v, item.quantity - 1);
      });
    });

    var plusButtons = body.querySelectorAll('[data-qty-plus]');
    plusButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = this.getAttribute('data-qty-plus');
        var item = cart.find(function (i) { return i.variant === v; });
        if (item) updateQuantity(v, item.quantity + 1);
      });
    });
  }

  function openCart() {
    var overlay = document.getElementById('cart-overlay');
    var drawer = document.getElementById('cart-drawer');
    if (overlay) overlay.classList.add('open');
    if (drawer) drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    var overlay = document.getElementById('cart-overlay');
    var drawer = document.getElementById('cart-drawer');
    if (overlay) overlay.classList.remove('open');
    if (drawer) drawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateCartBadge() {
    var badges = document.querySelectorAll('.cart-badge');
    var count = getCartItemCount();
    badges.forEach(function (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  function attachCartListeners() {
    // Cart icon button
    var cartBtn = document.getElementById('cart-icon-btn');
    if (cartBtn) {
      // Remove inline onclick for index.html (it doesn't have one but be safe)
      cartBtn.removeAttribute('onclick');
      cartBtn.addEventListener('click', function (e) {
        e.preventDefault();
        openCart();
      });
    }

    // Cart overlay close
    var overlay = document.getElementById('cart-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeCart);
    }

    // Cart drawer close button
    var closeBtn = document.getElementById('cart-drawer-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeCart);
    }

    // Continue shopping button
    var continueBtn = document.getElementById('cart-continue-shopping');
    if (continueBtn) {
      continueBtn.addEventListener('click', closeCart);
    }

    // Shop Now button inside empty cart
    var shopNowBtn = document.getElementById('cart-shop-now');
    if (shopNowBtn) {
      shopNowBtn.addEventListener('click', function () {
        closeCart();
      });
    }

    // Add to Cart buttons (only exist on index.html)
    var addBtns = document.querySelectorAll('[data-action="add-to-cart"]');
    addBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var variant = this.getAttribute('data-variant');
        addToCart(variant);

        // Visual feedback
        var originalText = this.textContent;
        this.textContent = 'Added ✓';
        this.classList.add('btn--added');
        var self = this;
        setTimeout(function () {
          self.textContent = originalText;
          self.classList.remove('btn--added');
        }, 1500);
      });
    });

    // Close cart on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeCart();
    });
  }
})();
