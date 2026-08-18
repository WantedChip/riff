const state = {
  projects: [],
  cards: [],
  activeCategory: 'all',
  searchQuery: '',
  totalCount: 0,
  visibleCount: 0
};

function escapeHtml(s) {
  return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') : '';
}

function normalizeText(s) {
  return s ? String(s).toLowerCase().trim() : '';
}

function normalizeCategory(cat) {
  if (!cat) return 'all';
  const s = String(cat).toLowerCase().trim();
  if (['all', 'all riffs', 'all-riffs', '*'].includes(s)) return 'all';
  if (s.startsWith('clone')) return 'clone';
  if (s.startsWith('design')) return 'design riff';
  if (s.startsWith('anim')) return 'animation';
  if (s.includes('lab')) return 'lab';
  return s;
}

function matchCategory(cardCat, selectedCat) {
  const normSelected = normalizeCategory(selectedCat);
  if (!normSelected || normSelected === 'all') return true;
  const normCard = normalizeCategory(cardCat);
  return normCard === normSelected || normCard.includes(normSelected) || normSelected.includes(normCard);
}

function isSubsequence(needle, haystack) {
  const n = needle.toLowerCase(), h = haystack.toLowerCase();
  let i = 0;
  for (let j = 0; j < h.length && i < n.length; j++) if (h[j] === n[i]) i++;
  return i === n.length;
}

function matchProject(cardData, rawQuery) {
  const query = normalizeText(rawQuery);
  if (!query) return true;
  const { title, description, category, tags, slug, rawText } = cardData;
  if (rawText.includes(query)) return true;
  const tokens = query.split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) return true;
  return tokens.every(tok => {
    if (rawText.includes(tok)) return true;
    const ct = tok.replace(/[^\w]/g, ''), cr = rawText.replace(/[^\w\s]/g, '');
    if (ct && cr.includes(ct)) return true;
    if (tok.length >= 3) {
      if (isSubsequence(tok, title) || isSubsequence(tok, slug) || isSubsequence(tok, category)) return true;
      for (const tag of tags) if (isSubsequence(tok, tag)) return true;
      if (isSubsequence(tok, description)) return true;
    }
    return false;
  });
}

function updateCounters(visible, total) {
  const countEl = document.getElementById('search-count');
  if (countEl) countEl.textContent = String(visible);
  const totalEl = document.getElementById('total-count');
  if (totalEl) totalEl.textContent = String(total);
  const statusEl = document.getElementById('search-status');
  if (statusEl) {
    const label = total === 1 ? 'project' : 'projects';
    statusEl.innerHTML = `Showing <span id="search-count">${visible}</span> of <span id="total-count">${total}</span> ${label}`;
  }
  const telEl = document.getElementById('telemetry-count');
  if (telEl) telEl.textContent = String(total);
}

function announceFilter(count) {
  const announcer = document.getElementById('a11y-filter-announcer');
  if (!announcer) return;
  if (count === 0) {
    announcer.textContent = 'No projects found matching current filter';
  } else {
    announcer.textContent = `Found ${count} matching project${count === 1 ? '' : 's'}`;
  }
}

function updateEmptyState(visibleCount, query, category) {
  const grid = document.getElementById('project-grid');
  const emptyState = document.getElementById('empty-state');
  if (grid) {
    grid.style.display = visibleCount === 0 ? 'none' : '';
  }
  if (emptyState) {
    emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
  }
}

function applyFilters() {
  const query = state.searchQuery, cat = state.activeCategory;
  let visibleCount = 0;
  for (const card of state.cards) {
    const isVisible = matchProject(card, query) && matchCategory(card.category, cat);
    card.element.classList.toggle('is-hidden', !isVisible);
    card.element.style.display = isVisible ? '' : 'none';
    if (isVisible) visibleCount++;
  }
  state.visibleCount = visibleCount;
  updateCounters(visibleCount, state.totalCount);
  updateEmptyState(visibleCount, query, cat);
  announceFilter(visibleCount);
}

function setCategory(cat, focus = false) {
  state.activeCategory = cat || 'all';
  const norm = normalizeCategory(state.activeCategory);
  let matched = null;
  document.querySelectorAll('#category-filters .filter-pill').forEach(pill => {
    const isMatch = normalizeCategory(pill.dataset.category || pill.textContent) === norm;
    pill.classList.toggle('active', isMatch);
    pill.setAttribute('aria-selected', String(isMatch));
    pill.setAttribute('aria-pressed', String(isMatch));
    pill.setAttribute('tabindex', isMatch ? '0' : '-1');
    if (isMatch) matched = pill;
  });
  if (focus && matched) matched.focus();
  applyFilters();
}

function handleTagClick(el) {
  const tag = el.dataset.tag || el.textContent.trim();
  if (!tag) return;
  const input = document.getElementById('search-input');
  if (input) {
    input.value = tag;
    state.searchQuery = tag;
    applyFilters();
    input.focus();
    try {
      const r = input.getBoundingClientRect();
      if ((r.top < 0 || r.bottom > (window.innerHeight || document.documentElement.clientHeight)) && input.scrollIntoView) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (_) {}
  } else {
    state.searchQuery = tag;
    applyFilters();
  }
}

function resetFilters() {
  const input = document.getElementById('search-input');
  if (input) {
    input.value = '';
    input.focus();
  }
  state.searchQuery = '';
  setCategory('all');
  if (input) {
    input.focus();
  }
}

function initCategoryTabs() {
  const tablist = document.querySelector('#category-filters');
  if (!tablist) return;
  tablist.addEventListener('click', e => {
    const btn = e.target.closest('.filter-pill');
    if (btn) setCategory(btn.dataset.category || btn.textContent.trim());
  });
  tablist.addEventListener('keydown', e => {
    const tabs = Array.from(tablist.querySelectorAll('.filter-pill'));
    if (!tabs.length) return;
    const cur = tabs.findIndex(t => t === document.activeElement || t.classList.contains('active'));
    let next = -1;
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) next = (cur + 1) % tabs.length;
    else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) next = (cur - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else if (['Enter', ' '].includes(e.key) && document.activeElement && tabs.includes(document.activeElement)) {
      e.preventDefault();
      setCategory(document.activeElement.dataset.category || document.activeElement.textContent.trim(), true);
      return;
    } else return;
    e.preventDefault();
    if (next >= 0 && tabs[next]) setCategory(tabs[next].dataset.category || tabs[next].textContent.trim(), true);
  });
}

/* ==========================================================================
   Modal State Machine, Isolated Iframe Runner & Focus Trapping
   ========================================================================== */

let lastFocusedElement = null;

const modalState = {
  isOpen: false,
  triggerElement: null,
  lastFocusedElement: null,
  activeRoute: '',
  activeTitle: '',
  viewportMode: 'desktop'
};

const FOCUSABLE_ELEMENTS_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'iframe'
].join(', ');

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_ELEMENTS_SELECTOR)).filter(el => {
    return !el.hasAttribute('disabled') &&
           el.getAttribute('aria-hidden') !== 'true' &&
           !el.hasAttribute('hidden') &&
           (el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.getElementById('modal-iframe') || (typeof el.getClientRects === 'function' && el.getClientRects().length > 0) || el.tabIndex >= 0);
  });
}

function showIframeLoader() {
  const loader = document.getElementById('iframe-loader');
  if (loader) {
    loader.classList.remove('is-hidden');
    loader.removeAttribute('hidden');
    loader.style.opacity = '1';
    loader.style.visibility = 'visible';
  }
}

function hideIframeLoader() {
  const loader = document.getElementById('iframe-loader');
  if (loader) {
    loader.classList.add('is-hidden');
    loader.style.opacity = '0';
    loader.style.visibility = 'hidden';
  }
}

function setPreviewViewport(viewport) {
  const validModes = ['desktop', 'tablet', 'mobile'];
  const mode = validModes.includes(viewport) ? viewport : 'desktop';
  modalState.viewportMode = mode;

  const container = document.getElementById('modal-viewport-container');
  if (container) {
    container.classList.remove('viewport-desktop', 'viewport-tablet', 'viewport-mobile');
    container.classList.add(`viewport-${mode}`);
    container.dataset.viewport = mode;
  }

  const buttons = document.querySelectorAll('.btn-viewport, #viewport-switcher button, [data-viewport]');
  buttons.forEach(btn => {
    if (btn.dataset && btn.dataset.viewport) {
      const isMatch = btn.dataset.viewport === mode;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-pressed', String(isMatch));
    }
  });
}

function reloadModalIframe() {
  if (!modalState.isOpen) return;
  const iframe = document.getElementById('modal-iframe');
  const btnReload = document.getElementById('btn-modal-reload') || document.querySelector('.modal-btn-reload');

  if (btnReload) {
    btnReload.classList.add('is-reloading');
  }
  showIframeLoader();

  if (iframe) {
    const targetUrl = modalState.activeRoute || iframe.src;
    iframe.onload = () => {
      hideIframeLoader();
      if (btnReload) btnReload.classList.remove('is-reloading');
    };
    // Re-assign src to force reload sandbox without unmounting modal
    iframe.src = targetUrl;
  }
  setTimeout(() => {
    if (btnReload) btnReload.classList.remove('is-reloading');
  }, 1200);
}

function openModal(title, route, triggerEl = null) {
  const modal = document.getElementById('preview-modal');
  if (!modal) return;

  // Normalize route with trailing slash
  let formattedRoute = route || '/';
  if (!formattedRoute.startsWith('/') && !formattedRoute.startsWith('http')) {
    formattedRoute = '/' + formattedRoute;
  }
  if (!formattedRoute.endsWith('/') && !formattedRoute.includes('.') && !formattedRoute.includes('?')) {
    formattedRoute = formattedRoute + '/';
  }

  // Reliably capture lastFocusedElement for accessibility focus restoration
  let targetTrigger = triggerEl;
  if (!targetTrigger) {
    if (document.activeElement && document.activeElement !== document.body && document.activeElement !== document.documentElement) {
      targetTrigger = document.activeElement;
    } else {
      targetTrigger = document.querySelector(`.btn-quick-view[data-route="${formattedRoute}"]`) ||
                      document.querySelector(`.btn-quick-view[data-slug="${formattedRoute.replace(/\//g, '')}"]`) ||
                      document.querySelector(`.card[data-slug] .btn-quick-view`) || null;
    }
  }

  lastFocusedElement = targetTrigger;
  modalState.triggerElement = targetTrigger;
  modalState.lastFocusedElement = targetTrigger;
  modalState.activeTitle = title || 'Project Preview';
  modalState.activeRoute = formattedRoute;
  modalState.isOpen = true;

  // Reset viewport to desktop on new preview open
  setPreviewViewport('desktop');

  // Update modal title and route
  const titleEl = document.getElementById('modal-project-title');
  if (titleEl) titleEl.textContent = modalState.activeTitle;

  const routeEl = document.getElementById('modal-project-route');
  if (routeEl) routeEl.textContent = modalState.activeRoute;

  // Update External Launch Link
  const externalLink = document.getElementById('link-modal-external');
  if (externalLink) {
    externalLink.href = modalState.activeRoute;
    externalLink.setAttribute('aria-label', `Open ${modalState.activeTitle} in new tab`);
  }

  // Show loader and set iframe source
  showIframeLoader();
  const iframe = document.getElementById('modal-iframe');
  if (iframe) {
    iframe.onload = () => {
      hideIframeLoader();
    };
    iframe.src = modalState.activeRoute;
    iframe.title = `${modalState.activeTitle} Live Preview`;
  }

  // Lock background body scroll
  document.body.style.overflow = 'hidden';

  // Reveal modal overlay
  modal.removeAttribute('hidden');

  // Trigger slide-up spring animation
  requestAnimationFrame(() => {
    modal.classList.add('is-open', 'active');
    modal.classList.remove('is-closing');

    // Focus the close button or first focusable control inside modal
    const closeBtn = document.getElementById('btn-modal-close') || document.getElementById('modal-close-btn') || modal.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.focus();
    } else {
      const focusables = getFocusableElements(modal);
      if (focusables.length > 0) focusables[0].focus();
    }
  });
}

function closeModal() {
  const modal = document.getElementById('preview-modal');
  if (!modal || !modalState.isOpen) return;

  modalState.isOpen = false;

  // Start exit transition
  modal.classList.remove('is-open', 'active');
  modal.classList.add('is-closing');

  // Unlock background body scroll
  document.body.style.overflow = '';

  // Teardown iframe immediately to halt audio/animation loops
  const iframe = document.getElementById('modal-iframe');
  if (iframe) {
    iframe.onload = null;
    iframe.src = 'about:blank';
  }
  hideIframeLoader();

  // Hide modal element after exit transition (200ms)
  setTimeout(() => {
    if (!modalState.isOpen) {
      modal.setAttribute('hidden', '');
      modal.classList.remove('is-closing');
    }
  }, 200);

  // Restore keyboard focus context to originating element with robust fallbacks
  const targetToFocus = lastFocusedElement || modalState.triggerElement || modalState.lastFocusedElement;
  if (targetToFocus && typeof targetToFocus.focus === 'function') {
    try {
      if (typeof targetToFocus.isConnected === 'boolean' && !targetToFocus.isConnected) {
        const fallback = document.querySelector('.btn-quick-view') || document.getElementById('search-input');
        if (fallback && typeof fallback.focus === 'function') fallback.focus();
      } else {
        targetToFocus.focus();
      }
    } catch (_) {
      const fallback = document.querySelector('.btn-quick-view') || document.getElementById('search-input');
      if (fallback && typeof fallback.focus === 'function') {
        try { fallback.focus(); } catch (_) {}
      }
    }
  } else {
    const fallback = document.querySelector('.btn-quick-view') || document.getElementById('search-input');
    if (fallback && typeof fallback.focus === 'function') {
      try { fallback.focus(); } catch (_) {}
    }
  }

  lastFocusedElement = null;
  modalState.triggerElement = null;
  modalState.lastFocusedElement = null;
}

function handleModalKeydown(e) {
  if (!modalState.isOpen || e.key !== 'Tab') return;

  const modal = document.getElementById('preview-modal');
  if (!modal || modal.hasAttribute('hidden') || modal.classList.contains('is-closing')) return;

  const focusables = getFocusableElements(modal);
  if (focusables.length === 0) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    return;
  }

  const firstEl = focusables[0];
  const lastEl = focusables[focusables.length - 1];

  if (e.shiftKey) {
    // Shift + Tab (Backwards)
    if (document.activeElement === firstEl || !modal.contains(document.activeElement)) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      lastEl.focus();
    }
  } else {
    // Tab (Forwards)
    if (document.activeElement === lastEl || !modal.contains(document.activeElement)) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      firstEl.focus();
    }
  }
}

const handleModalFocusTrap = handleModalKeydown;

function focusSearchInput(select = true) {
  const input = document.getElementById('search-input');
  if (!input) return false;

  input.focus();
  if (select && typeof input.select === 'function') {
    input.select();
  }

  try {
    const rect = input.getBoundingClientRect();
    const isVisible = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
    if (!isVisible && typeof input.scrollIntoView === 'function') {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } catch (_) {}

  return true;
}

function handleGlobalKeydown(e) {
  const isEscapeKey = e.key === 'Escape' || e.key === 'Esc' || e.code === 'Escape';

  // Priority 1: If preview modal is open / active
  const modalEl = document.getElementById('preview-modal');
  const isModalActive = Boolean(
    (modalState && modalState.isOpen) ||
    (modalEl && !modalEl.hasAttribute('hidden') && !modalEl.classList.contains('is-closing'))
  );

  if (isEscapeKey && isModalActive) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    closeModal();
    return;
  }

  // Modal active non-Escape handling (Focus trap and shortcut suppression)
  if (isModalActive || (modalState && modalState.isOpen)) {
    if (e.key === 'Tab') {
      handleModalFocusTrap(e);
      return;
    }
    // Prevent global '/' shortcut from stealing focus when modal preview is open
    if (e.key === '/' || e.code === 'Slash') {
      return;
    }
  }

  // Priority 2: If Escape key is pressed and search input is focused or contains active query
  if (isEscapeKey) {
    const searchInput = document.getElementById('search-input');
    const isSearchFocused = Boolean(searchInput && document.activeElement === searchInput);
    const hasSearchVal = Boolean(searchInput && typeof searchInput.value === 'string' && searchInput.value.trim() !== '');
    const hasStateQuery = Boolean(state && typeof state.searchQuery === 'string' && state.searchQuery.trim() !== '');

    if (isSearchFocused || hasSearchVal || hasStateQuery) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (searchInput) {
        searchInput.value = '';
        if (typeof searchInput.blur === 'function') {
          searchInput.blur();
        }
      }
      state.searchQuery = '';
      applyFilters();
      return;
    }

    // Priority 3: When neither modal nor search has active state/focus, pressing Escape is a clean no-op
    return;
  }

  // Global '/' Shortcut to focus Search
  if ((e.key === '/' || e.code === 'Slash') && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const target = e.target;
    const activeEl = document.activeElement;

    // Guard condition: ensure target / activeElement is NOT an input, textarea, select, contenteditable, or inside an active modal dialog
    const isInputTarget = target && (
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
      target.isContentEditable ||
      (typeof target.closest === 'function' && target.closest('[contenteditable="true"]'))
    );
    const isInputActive = activeEl && (
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) ||
      activeEl.isContentEditable ||
      (typeof activeEl.closest === 'function' && activeEl.closest('[contenteditable="true"]'))
    );

    const isModalVisible = (modalState && modalState.isOpen) || (modalEl && !modalEl.hasAttribute('hidden'));
    const isInsideModal = isModalVisible ||
      (target && typeof target.closest === 'function' && target.closest('#preview-modal, [role="dialog"]')) ||
      (activeEl && typeof activeEl.closest === 'function' && activeEl.closest('#preview-modal, [role="dialog"]'));

    if (isInputTarget || isInputActive || isInsideModal) {
      return;
    }

    const input = document.getElementById('search-input');
    if (input) {
      e.preventDefault();
      focusSearchInput(true);
    }
    return;
  }
}

function initApp() {
  const cards = document.querySelectorAll('#project-grid .card, #project-grid article');
  state.cards = Array.from(cards).map(card => {
    const slug = card.dataset.slug || '';
    const category = card.dataset.category || card.querySelector('.card-category-badge')?.textContent.trim() || 'Clone';
    const rawTags = card.dataset.tags || '';
    const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : Array.from(card.querySelectorAll('.tag, .badge-tag, .card-tag')).map(t => t.textContent.trim());
    const title = card.querySelector('.card-title')?.textContent.trim() || '';
    const description = card.querySelector('.card-desc')?.textContent.trim() || '';
    const rawText = normalizeText(`${title} ${description} ${category} ${tags.join(' ')} ${slug}`);
    return { element: card, slug, category, tags, title, description, rawText };
  });

  state.totalCount = state.cards.length;
  state.visibleCount = state.cards.length;
  updateCounters(state.visibleCount, state.totalCount);
  updateEmptyState(state.visibleCount, state.searchQuery, state.activeCategory);
  announceFilter(state.visibleCount);

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    const onSearch = e => { state.searchQuery = e.target.value; applyFilters(); };
    searchInput.addEventListener('input', onSearch);
    searchInput.addEventListener('search', onSearch);
  }

  const resetBtn = document.getElementById('btn-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }

  initCategoryTabs();

  document.addEventListener('click', e => {
    // Viewport switcher button trigger
    const viewportBtn = e.target.closest('.btn-viewport, [data-viewport]');
    if (viewportBtn && viewportBtn.dataset && viewportBtn.dataset.viewport) {
      e.preventDefault();
      setPreviewViewport(viewportBtn.dataset.viewport);
      return;
    }

    // Reload button trigger
    const reloadBtn = e.target.closest('#btn-modal-reload, .modal-btn-reload, [data-action="reload-modal"], [data-action="reload-iframe"]');
    if (reloadBtn) {
      e.preventDefault();
      reloadModalIframe();
      return;
    }

    // Modal close button trigger
    const closeBtn = e.target.closest('#btn-modal-close, #modal-close-btn, .modal-close-btn, .modal-close, [data-action="close-modal"]');
    if (closeBtn) {
      e.preventDefault();
      closeModal();
      return;
    }

    // Modal backdrop click dismissal
    const modalOverlay = document.getElementById('preview-modal');
    if (modalState.isOpen && e.target === modalOverlay) {
      e.preventDefault();
      closeModal();
      return;
    }

    // Quick view button trigger
    const quickViewBtn = e.target.closest('.btn-quick-view, .btn-preview, [data-action="quick-view"]');
    if (quickViewBtn && !quickViewBtn.hasAttribute('onclick')) {
      e.preventDefault();
      const card = quickViewBtn.closest('.card, article');
      const title = quickViewBtn.dataset.title || card?.querySelector('.card-title')?.textContent.trim() || 'Project Preview';
      const route = quickViewBtn.dataset.route || card?.dataset.route || (card?.dataset.slug ? `/${card.dataset.slug}/` : '/');
      openModal(title, route, quickViewBtn);
      return;
    }

    // Reset filters trigger
    const rBtn = e.target.closest('#btn-reset-filters, .btn-reset-filters');
    if (rBtn) {
      resetFilters();
      return;
    }

    // Tag filter trigger
    const tag = e.target.closest('.badge-tag, .tag, .card-tag, [data-tag]');
    if (tag && !tag.closest('.filter-pills, [role="tablist"]')) {
      handleTagClick(tag);
    }
  });

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', handleGlobalKeydown);
  } else if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('keydown', handleGlobalKeydown);
  }

  fetch('/projects.json').then(r => r.ok ? r.json() : null).then(data => {
    if (Array.isArray(data)) { state.projects = data; window.__RIFF_PROJECTS__ = data; }
  }).catch(() => {});
}

window.focusSearch = function() {
  return focusSearchInput(true);
};

window.openPreview = function(title, route) {
  let trigger = document.activeElement;
  if (!trigger || trigger === document.body) {
    trigger = document.querySelector(`.btn-quick-view[data-route="${route}"]`) ||
              document.querySelector(`.card[data-slug] .btn-quick-view`);
  }
  openModal(title, route, trigger);
};

window.closePreview = function() {
  closeModal();
};

window.reloadPreview = function() {
  reloadModalIframe();
};

window.setPreviewViewport = function(viewport) {
  setPreviewViewport(viewport);
};

window.riffApp = {
  state,
  modalState,
  applyFilters,
  matchProject,
  matchCategory,
  normalizeCategory,
  setCategory,
  handleTagClick,
  resetFilters,
  announceFilter,
  focusSearch: focusSearchInput,
  openModal,
  closeModal,
  reloadModalIframe,
  setPreviewViewport,
  handleGlobalKeydown,
  handleModalKeydown,
  handleModalFocusTrap,
  getLastFocusedElement: () => lastFocusedElement || modalState.triggerElement || modalState.lastFocusedElement,
  modal: {
    open: openModal,
    close: closeModal,
    reload: reloadModalIframe,
    setViewport: setPreviewViewport,
    isOpen: () => modalState.isOpen,
    getViewport: () => modalState.viewportMode,
    getTriggerElement: () => lastFocusedElement || modalState.triggerElement || modalState.lastFocusedElement,
    getLastFocusedElement: () => lastFocusedElement || modalState.triggerElement || modalState.lastFocusedElement
  },
  setSearchQuery: q => {
    const input = document.getElementById('search-input');
    if (input) input.value = q;
    state.searchQuery = q;
    applyFilters();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

console.log('[riff] Landing portal initialized');

