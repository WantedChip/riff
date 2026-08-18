/**
 * Riff Landing Portal — Client Application Engine
 * Tactile Dark Editorial | Zero External Dependencies
 */

const state = {
  projects: [],
  cards: [],
  activeCategory: 'all',
  searchQuery: '',
  totalCount: 0,
  visibleCount: 0
};

let lastFocusedElement = null;

const modalState = {
  isOpen: false,
  triggerElement: null,
  lastFocusedElement: null,
  activeRoute: '',
  activeTitle: '',
  viewportMode: 'desktop'
};

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), iframe';

const normalizeText = s => s ? String(s).toLowerCase().trim() : '';

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

function matchProject(card, rawQuery) {
  const q = normalizeText(rawQuery);
  if (!q) return true;
  const { title, description, category, tags, slug, rawText } = card;
  if (rawText.includes(q)) return true;
  const tokens = q.split(/[\s,]+/).filter(Boolean);
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
  announcer.textContent = count === 0
    ? 'No projects found matching current filter'
    : `Found ${count} matching project${count === 1 ? '' : 's'}`;
}

function updateEmptyState(visibleCount) {
  const grid = document.getElementById('project-grid');
  const empty = document.getElementById('empty-state');
  if (grid) grid.style.display = visibleCount === 0 ? 'none' : '';
  if (empty) empty.style.display = visibleCount === 0 ? 'flex' : 'none';
}

function applyFilters() {
  const { searchQuery, activeCategory } = state;
  let visible = 0;
  for (const card of state.cards) {
    const isVisible = matchProject(card, searchQuery) && matchCategory(card.category, activeCategory);
    card.element.classList.toggle('is-hidden', !isVisible);
    card.element.style.display = isVisible ? '' : 'none';
    if (isVisible) visible++;
  }
  state.visibleCount = visible;
  updateCounters(visible, state.totalCount);
  updateEmptyState(visible);
  announceFilter(visible);
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
  const tag = el?.dataset?.tag || el?.textContent?.trim();
  if (!tag) return;
  const input = document.getElementById('search-input');
  state.searchQuery = tag;
  if (input) {
    input.value = tag;
    input.focus();
    try { input.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
  }
  applyFilters();
}

function resetFilters() {
  state.searchQuery = '';
  const input = document.getElementById('search-input');
  if (input) { input.value = ''; input.focus(); }
  setCategory('all');
  if (input) input.focus();
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

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(el => {
    return !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true' && !el.hasAttribute('hidden') &&
           (el.offsetWidth > 0 || el.offsetHeight > 0 || el.id === 'modal-iframe' || el.tabIndex >= 0);
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
  const mode = ['desktop', 'tablet', 'mobile'].includes(viewport) ? viewport : 'desktop';
  modalState.viewportMode = mode;
  const container = document.getElementById('modal-viewport-container');
  if (container) {
    container.classList.remove('viewport-desktop', 'viewport-tablet', 'viewport-mobile');
    container.classList.add(`viewport-${mode}`);
    container.dataset.viewport = mode;
  }
  document.querySelectorAll('.btn-viewport, #viewport-switcher button, [data-viewport]').forEach(btn => {
    if (btn.dataset?.viewport) {
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
  if (btnReload) btnReload.classList.add('is-reloading');
  showIframeLoader();
  if (iframe) {
    const targetUrl = modalState.activeRoute || iframe.src;
    iframe.onload = () => {
      hideIframeLoader();
      if (btnReload) btnReload.classList.remove('is-reloading');
    };
    iframe.src = targetUrl;
  }
  setTimeout(() => { if (btnReload) btnReload.classList.remove('is-reloading'); }, 1200);
}

function openModal(title, route, triggerEl = null) {
  const modal = document.getElementById('preview-modal');
  if (!modal) return;
  let formattedRoute = route || '/';
  if (!formattedRoute.startsWith('/') && !formattedRoute.startsWith('http')) formattedRoute = '/' + formattedRoute;
  if (!formattedRoute.endsWith('/') && !formattedRoute.includes('.') && !formattedRoute.includes('?')) formattedRoute += '/';

  let targetTrigger = triggerEl || (document.activeElement && document.activeElement !== document.body ? document.activeElement : document.querySelector('.btn-quick-view'));

  lastFocusedElement = targetTrigger;
  modalState.triggerElement = targetTrigger;
  modalState.lastFocusedElement = targetTrigger;
  modalState.activeTitle = title || 'Project Preview';
  modalState.activeRoute = formattedRoute;
  modalState.isOpen = true;
  setPreviewViewport('desktop');

  const titleEl = document.getElementById('modal-project-title');
  if (titleEl) titleEl.textContent = modalState.activeTitle;
  const routeEl = document.getElementById('modal-project-route');
  if (routeEl) routeEl.textContent = modalState.activeRoute;
  const externalLink = document.getElementById('link-modal-external');
  if (externalLink) {
    externalLink.href = modalState.activeRoute;
    externalLink.setAttribute('aria-label', `Open ${modalState.activeTitle} in new tab`);
  }

  showIframeLoader();
  const iframe = document.getElementById('modal-iframe');
  if (iframe) {
    iframe.onload = () => hideIframeLoader();
    iframe.src = modalState.activeRoute;
    iframe.title = `${modalState.activeTitle} Live Preview`;
  }

  document.body.style.overflow = 'hidden';
  modal.removeAttribute('hidden');

  requestAnimationFrame(() => {
    modal.classList.add('is-open', 'active');
    modal.classList.remove('is-closing');
    const closeBtn = document.getElementById('btn-modal-close') || document.getElementById('modal-close-btn') || modal.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.focus();
    else {
      const focusables = getFocusableElements(modal);
      if (focusables.length > 0) focusables[0].focus();
    }
  });
}

function closeModal() {
  const modal = document.getElementById('preview-modal');
  if (!modal || !modalState.isOpen) return;
  modalState.isOpen = false;
  modal.classList.remove('is-open', 'active');
  modal.classList.add('is-closing');
  document.body.style.overflow = '';

  const iframe = document.getElementById('modal-iframe');
  if (iframe) {
    iframe.onload = null;
    iframe.src = 'about:blank';
  }
  hideIframeLoader();

  setTimeout(() => {
    if (!modalState.isOpen) {
      modal.setAttribute('hidden', '');
      modal.classList.remove('is-closing');
    }
  }, 200);

  const targetToFocus = lastFocusedElement || modalState.triggerElement || modalState.lastFocusedElement;
  if (targetToFocus && typeof targetToFocus.focus === 'function') {
    try {
      if (typeof targetToFocus.isConnected === 'boolean' && !targetToFocus.isConnected) {
        const fallback = document.querySelector('.btn-quick-view') || document.getElementById('search-input');
        if (fallback?.focus) fallback.focus();
      } else {
        targetToFocus.focus();
      }
    } catch (_) {
      const fallback = document.querySelector('.btn-quick-view') || document.getElementById('search-input');
      if (fallback?.focus) try { fallback.focus(); } catch (_) {}
    }
  } else {
    const fallback = document.querySelector('.btn-quick-view') || document.getElementById('search-input');
    if (fallback?.focus) try { fallback.focus(); } catch (_) {}
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
  if (!focusables.length) {
    if (e.preventDefault) e.preventDefault();
    return;
  }
  const firstEl = focusables[0];
  const lastEl = focusables[focusables.length - 1];
  // Handles Shift + Tab (Backwards) and Tab (Forwards) focus cycling
  if (e.shiftKey || e.key === 'Shift') {
    if (document.activeElement === firstEl || !modal.contains(document.activeElement)) {
      if (e.preventDefault) e.preventDefault();
      lastEl.focus();
    }
  } else {
    if (document.activeElement === lastEl || !modal.contains(document.activeElement)) {
      if (e.preventDefault) e.preventDefault();
      firstEl.focus();
    }
  }
}

const handleModalFocusTrap = handleModalKeydown;

function focusSearchInput(select = true) {
  const input = document.getElementById('search-input');
  if (!input) return false;
  input.focus();
  if (select && typeof input.select === 'function') input.select();
  try { input.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
  return true;
}

function handleGlobalKeydown(e) {
  const isEscapeKey = e.key === 'Escape' || e.key === 'Esc' || e.code === 'Escape';
  const modalEl = document.getElementById('preview-modal');
  const isModalActive = Boolean(
    (modalState && modalState.isOpen) ||
    (modalEl && !modalEl.hasAttribute('hidden') && !modalEl.classList.contains('is-closing'))
  );

  if (isEscapeKey && isModalActive) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    closeModal();
    return;
  }

  if (isModalActive || (modalState && modalState.isOpen)) {
    if (e.key === 'Tab') {
      handleModalFocusTrap(e);
      return;
    }
    if (e.key === '/' || e.code === 'Slash') return;
  }

  if (isEscapeKey) {
    const searchInput = document.getElementById('search-input');
    const isSearchFocused = Boolean(searchInput && document.activeElement === searchInput);
    const hasSearchVal = Boolean(searchInput && typeof searchInput.value === 'string' && searchInput.value.trim() !== '');
    const hasStateQuery = Boolean(state && typeof state.searchQuery === 'string' && state.searchQuery.trim() !== '');

    if (isSearchFocused || hasSearchVal || hasStateQuery) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      if (searchInput) {
        searchInput.value = '';
        if (isSearchFocused) {
          searchInput.blur();
        }
      }
      state.searchQuery = '';
      applyFilters();
      return;
    }
  }

  if (e.key === '/' || e.code === 'Slash') {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const active = document.activeElement;
    const tag = active ? active.tagName.toLowerCase() : '';
    const isInputActive = ['input', 'textarea', 'select'].includes(tag) || active?.isContentEditable;
    if (isInputActive) return;
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    focusSearchInput(true);
  }
}

function initApp() {
  document.querySelectorAll('.card').forEach(el => {
    const titleEl = el.querySelector('.card-title');
    const descEl = el.querySelector('.card-desc');
    const catBadge = el.querySelector('.card-category-badge') || el.querySelector('.badge-category');
    const tagElements = Array.from(el.querySelectorAll('.card-tag, .tag')).map(t => t.textContent.trim().toLowerCase());
    const datasetTags = el.dataset.tags ? el.dataset.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
    const tags = Array.from(new Set([...tagElements, ...datasetTags]));
    const slug = el.dataset.slug || el.id.replace(/^project-/, '');
    const title = titleEl ? titleEl.textContent.trim() : slug;
    const description = descEl ? descEl.textContent.trim() : '';
    const category = el.dataset.category || (catBadge ? catBadge.textContent.trim() : 'Lab');
    const route = el.dataset.route || `/${slug}/`;
    const rawText = `${title} ${description} ${category} ${tags.join(' ')} ${slug}`.toLowerCase();

    state.cards.push({
      element: el,
      title,
      slug,
      description,
      category,
      tags,
      route,
      rawText
    });
  });

  state.totalCount = state.cards.length;
  state.visibleCount = state.cards.length;
  updateCounters(state.visibleCount, state.totalCount);

  fetch('/projects.json')
    .then(r => r.ok ? r.json() : [])
    .then(data => {
      if (Array.isArray(data) && data.length) {
        state.projects = data;
      }
    })
    .catch(() => {});

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value;
      applyFilters();
    });
  }

  initCategoryTabs();

  document.addEventListener('click', e => {
    const quickViewBtn = e.target.closest('.btn-quick-view, .btn-preview, [data-preview]');
    if (quickViewBtn) {
      e.preventDefault();
      const card = quickViewBtn.closest('.card, article.card');
      const title = quickViewBtn.dataset.title || card?.querySelector('.card-title')?.textContent?.trim() || 'Project Preview';
      const route = quickViewBtn.dataset.route || card?.dataset?.route || quickViewBtn.getAttribute('href') || '/';
      openModal(title, route, quickViewBtn);
      return;
    }

    const tagEl = e.target.closest('.card-tag, .tag, [data-tag]');
    if (tagEl && !tagEl.closest('.modal-shell')) {
      e.preventDefault();
      handleTagClick(tagEl);
      return;
    }

    const resetBtn = e.target.closest('#btn-reset-filters, .btn-reset-filters');
    if (resetBtn) {
      e.preventDefault();
      resetFilters();
      return;
    }

    const viewportBtn = e.target.closest('.btn-viewport, #viewport-switcher button, [data-viewport]');
    if (viewportBtn && viewportBtn.closest('.modal-shell')) {
      e.preventDefault();
      setPreviewViewport(viewportBtn.dataset.viewport || 'desktop');
      return;
    }

    const reloadBtn = e.target.closest('#btn-modal-reload, .modal-btn-reload');
    if (reloadBtn) {
      e.preventDefault();
      reloadModalIframe();
      return;
    }

    const closeBtn = e.target.closest('#btn-modal-close, #modal-close-btn, .modal-close-btn');
    if (closeBtn) {
      e.preventDefault();
      closeModal();
      return;
    }

    const modalOverlay = document.getElementById('preview-modal');
    if (modalOverlay && e.target === modalOverlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', handleGlobalKeydown);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function getLastFocusedElement() {
  return lastFocusedElement || modalState.triggerElement || modalState.lastFocusedElement;
}

window.riffApp = {
  state,
  modalState,
  openModal,
  closeModal,
  reloadModalIframe,
  setPreviewViewport,
  applyFilters,
  setCategory,
  resetFilters,
  handleTagClick,
  focusSearchInput,
  focusSearch: focusSearchInput,
  handleGlobalKeydown,
  handleModalKeydown,
  handleModalFocusTrap,
  getLastFocusedElement,
  modal: {
    open: openModal,
    close: closeModal,
    reload: reloadModalIframe,
    setViewport: setPreviewViewport,
    getViewport: () => modalState.viewportMode,
    isOpen: () => modalState.isOpen
  }
};

window.focusSearch = focusSearchInput;
window.openPreview = openModal;
window.closePreview = closeModal;
window.reloadPreview = reloadModalIframe;
window.setPreviewViewport = setPreviewViewport;
