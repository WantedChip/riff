/**
 * HALF-LIFE FRANCHISE WEBSITE - MAIN JAVASCRIPT ENGINE (js/main.js)
 * 
 * Features:
 * - DOMContentLoaded initialization
 * - Sticky header scroll handling
 * - Mobile nav drawer toggle, scroll locking & ARIA accessibility
 * - Multi-language dropdown interactive events integrated with HL_i18n
 * - Active route link highlighting with aria-current="page"
 * - Gameplay video modal dialog handling
 */

(function () {
  'use strict';

  // Global UI State
  const state = {
    isMobileNavOpen: false,
    isLangDropdownOpen: false,
    isHeaderSticky: false
  };

  /**
   * Main Initialization Procedure
   */
  function init() {
    initHeaderScroll();
    initMobileNav();
    initLanguageSelector();
    highlightActiveRoute();
    initMediaModals();
  }

  /**
   * Header Sticky & Scroll Indicator Behavior
   */
  function initHeaderScroll() {
    const header = document.querySelector('.site-header, .hl-header');
    if (!header) return;

    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      if (scrolled !== state.isHeaderSticky) {
        state.isHeaderSticky = scrolled;
        header.classList.toggle('is-scrolled', scrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check on load
  }

  /**
   * Mobile Navigation Drawer Toggle, Backdrop, & Accessibility
   */
  function initMobileNav() {
    const toggleBtn = document.querySelector('.mobile-nav-toggle, .hl-nav-toggle');
    const navDrawer = document.querySelector('.mobile-nav-drawer, .hl-nav-menu');
    const backdrop = document.querySelector('.nav-backdrop');

    if (!toggleBtn || !navDrawer) return;

    function openMobileNav() {
      state.isMobileNavOpen = true;
      toggleBtn.setAttribute('aria-expanded', 'true');
      toggleBtn.classList.add('is-active', 'open');
      navDrawer.classList.add('is-open', 'open');
      navDrawer.setAttribute('aria-hidden', 'false');
      if (backdrop) backdrop.classList.add('is-visible');
      if (document.body) document.body.style.overflow = 'hidden'; // Lock background scrolling
    }

    function closeMobileNav() {
      state.isMobileNavOpen = false;
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.classList.remove('is-active', 'open');
      navDrawer.classList.remove('is-open', 'open');
      navDrawer.setAttribute('aria-hidden', 'true');
      if (backdrop) backdrop.classList.remove('is-visible');
      if (document.body) document.body.style.overflow = ''; // Restore background scrolling
    }

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.isMobileNavOpen) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    if (backdrop) {
      backdrop.addEventListener('click', closeMobileNav);
    }

    // Auto-close menu drawer when clicking navigation links inside drawer
    const drawerLinks = navDrawer.querySelectorAll('a');
    drawerLinks.forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isMobileNavOpen) {
        closeMobileNav();
      }
    });
  }

  /**
   * Language Selector Dropdown Interaction & Event Listeners
   */
  function initLanguageSelector() {
    const langContainers = document.querySelectorAll('.lang-selector, .hl-lang-selector');

    langContainers.forEach(dropdown => {
      const toggleBtn = dropdown.querySelector('.lang-btn, .hl-lang-btn');
      const menu = dropdown.querySelector('.lang-menu, .lang-dropdown, .hl-lang-dropdown');
      const options = dropdown.querySelectorAll('.lang-option, .hl-lang-option');
      const currentLangLabel = dropdown.querySelector('.current-lang-label, .js-current-lang-code');

      if (!toggleBtn || !menu) return;

      function openDropdown() {
        // Close all other dropdowns
        document.querySelectorAll('.lang-menu.is-open, .lang-dropdown.open, .hl-lang-dropdown.open').forEach(m => {
          if (m !== menu) {
            m.classList.remove('is-open', 'open');
            m.setAttribute('aria-hidden', 'true');
          }
        });
        document.querySelectorAll('.lang-btn, .hl-lang-btn').forEach(btn => {
          if (btn !== toggleBtn) btn.setAttribute('aria-expanded', 'false');
        });

        state.isLangDropdownOpen = true;
        dropdown.classList.add('open');
        toggleBtn.setAttribute('aria-expanded', 'true');
        menu.classList.add('is-open', 'open');
        menu.setAttribute('aria-hidden', 'false');
      }

      function closeDropdown() {
        state.isLangDropdownOpen = false;
        dropdown.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open', 'open');
        menu.setAttribute('aria-hidden', 'true');
      }

      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true' || dropdown.classList.contains('open');
        if (isOpen) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });

      options.forEach(option => {
        option.addEventListener('click', (e) => {
          e.preventDefault();
          const langCode = option.getAttribute('data-lang');
          
          if (langCode && window.HL_i18n && typeof window.HL_i18n.setLanguage === 'function') {
            window.HL_i18n.setLanguage(langCode);
          }
          
          if (currentLangLabel && langCode) {
            currentLangLabel.textContent = langCode.toUpperCase();
          }

          options.forEach(opt => {
            opt.classList.remove('is-selected', 'is-active', 'active');
            opt.setAttribute('aria-selected', 'false');
          });
          option.classList.add('is-selected', 'is-active', 'active');
          option.setAttribute('aria-selected', 'true');

          closeDropdown();
        });
      });
    });

    // Close when clicking outside of any language selector container
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.lang-selector, .hl-lang-selector')) {
        document.querySelectorAll('.lang-menu, .lang-dropdown, .hl-lang-dropdown').forEach(menu => {
          menu.classList.remove('is-open', 'open');
          menu.setAttribute('aria-hidden', 'true');
        });
        document.querySelectorAll('.lang-selector, .hl-lang-selector').forEach(container => {
          container.classList.remove('open');
        });
        document.querySelectorAll('.lang-btn, .hl-lang-btn').forEach(btn => {
          btn.setAttribute('aria-expanded', 'false');
        });
        state.isLangDropdownOpen = false;
      }
    });

    // Close on Escape key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isLangDropdownOpen) {
        document.querySelectorAll('.lang-menu, .lang-dropdown, .hl-lang-dropdown').forEach(menu => {
          menu.classList.remove('is-open', 'open');
          menu.setAttribute('aria-hidden', 'true');
        });
        document.querySelectorAll('.lang-selector, .hl-lang-selector').forEach(container => {
          container.classList.remove('open');
        });
        document.querySelectorAll('.lang-btn, .hl-lang-btn').forEach(btn => {
          btn.setAttribute('aria-expanded', 'false');
        });
        state.isLangDropdownOpen = false;
      }
    });

    // React to global HL_i18n custom language change events
    const handleLangChange = (e) => {
      const lang = e.detail && e.detail.lang;
      if (!lang) return;

      document.querySelectorAll('.current-lang-label, .js-current-lang-code').forEach(label => {
        label.textContent = lang.toUpperCase();
      });

      document.querySelectorAll('.lang-option, .hl-lang-option').forEach(option => {
        const isMatch = option.getAttribute('data-lang') === lang;
        option.classList.toggle('is-selected', isMatch);
        option.classList.toggle('is-active', isMatch);
        option.classList.toggle('active', isMatch);
        option.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });
    };

    window.addEventListener('hl:langchange', handleLangChange);
    window.addEventListener('hl-language-changed', handleLangChange);
  }

  /**
   * Route Path Analysis and Active Link Highlighting
   */
  function highlightActiveRoute() {
    if (typeof window === 'undefined' || !window.location) return;
    const currentPath = window.location.pathname;
    let filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    if (!filename || filename === '') filename = 'index.html';

    const navLinks = document.querySelectorAll('.nav-link, .hl-nav-link, .mobile-nav-link, .footer-links a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      // Extract filename from href (e.g. "alyx.html" from "./alyx.html")
      const linkFilename = href.substring(href.lastIndexOf('/') + 1);
      
      if (linkFilename === filename) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Video Modal Lightbox Trigger Helper
   */
  function initMediaModals() {
    const videoTriggers = document.querySelectorAll('[data-video-id]');
    if (!videoTriggers.length) return;

    videoTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const videoId = trigger.getAttribute('data-video-id');
        if (videoId) {
          openVideoModal(videoId);
        }
      });
    });
  }

  function openVideoModal(videoId) {
    let modal = document.getElementById('video-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'video-modal';
      modal.className = 'video-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Gameplay Video Trailer');
      modal.innerHTML = `
        <div class="video-modal-backdrop"></div>
        <div class="video-modal-content">
          <button type="button" class="video-modal-close" aria-label="Close Video">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div class="video-responsive-frame">
            <iframe id="modal-iframe" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeBtn = modal.querySelector('.video-modal-close');
      const modalBackdrop = modal.querySelector('.video-modal-backdrop');

      const closeModal = () => {
        modal.classList.remove('is-open');
        const iframe = modal.querySelector('#modal-iframe');
        if (iframe) iframe.src = '';
        if (document.body) document.body.style.overflow = '';
      };

      closeBtn.addEventListener('click', closeModal);
      modalBackdrop.addEventListener('click', closeModal);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) {
          closeModal();
        }
      });
    }

    const iframe = modal.querySelector('#modal-iframe');
    if (iframe) {
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    modal.classList.add('is-open');
    if (document.body) document.body.style.overflow = 'hidden';
  }

  // Execute initialization when DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
