/**
 * ==============================================================================
 * RIFF HARDWARE LAB — CLIENT APPLICATION ENGINE
 * Tactile Web Audio Synthesizer, Live Telemetry HUD, Modal Test Chamber
 * Zero External Dependencies | Pure Vanilla ES6
 * ==============================================================================
 */

// 1. Web Audio Synthesizer Engine
class HardwareSoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('riff_sfx_enabled') !== 'false';
  }

  initContext() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick(freq = 600, duration = 0.02, type = 'sine') {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (_) {}
  }

  playSwitch() {
    this.playClick(850, 0.025, 'triangle');
  }

  playEngage() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (_) {}
  }

  playChamberOpen() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (_) {}
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('riff_sfx_enabled', String(this.enabled));
    if (this.enabled) {
      this.playClick(1000, 0.03, 'sine');
    }
    return this.enabled;
  }
}

const sfx = new HardwareSoundEngine();

// 2. Application State
const state = {
  projects: [],
  cards: [],
  activeCategory: 'all',
  searchQuery: '',
  totalCount: 0,
  visibleCount: 0
};

const modalState = {
  isOpen: false,
  triggerElement: null,
  activeRoute: '',
  activeTitle: '',
  viewportMode: 'desktop'
};

const normalizeText = s => s ? String(s).toLowerCase().trim() : '';

function normalizeCategory(cat) {
  if (!cat) return 'all';
  const s = String(cat).toLowerCase().trim();
  if (['all', 'all units', 'all_units', 'all riffs', '*'].includes(s)) return 'all';
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

function matchProject(card, rawQuery) {
  const q = normalizeText(rawQuery);
  if (!q) return true;
  const { title, description, category, tags, slug, rawText } = card;
  if (rawText.includes(q)) return true;
  const tokens = q.split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) return true;
  return tokens.every(tok => {
    if (rawText.includes(tok)) return true;
    if (title.toLowerCase().includes(tok)) return true;
    if (slug.toLowerCase().includes(tok)) return true;
    if (category.toLowerCase().includes(tok)) return true;
    for (const tag of tags) if (tag.includes(tok)) return true;
    return false;
  });
}

function updateCounters(visible, total) {
  const countEl = document.getElementById('search-count');
  if (countEl) countEl.textContent = String(visible);
  const totalEl = document.getElementById('total-count');
  if (totalEl) totalEl.textContent = String(total);
  const telEl = document.getElementById('telemetry-count');
  if (telEl) telEl.textContent = String(total);
}

function announceFilter(count) {
  const announcer = document.getElementById('a11y-filter-announcer');
  if (!announcer) return;
  announcer.textContent = count === 0
    ? 'No matching hardware modules found'
    : `Found ${count} matching module${count === 1 ? '' : 's'}`;
}

function updateEmptyState(visibleCount) {
  const grid = document.getElementById('project-grid');
  const empty = document.getElementById('empty-state');
  if (grid) grid.style.display = visibleCount === 0 ? 'none' : '';
  if (empty) empty.style.display = visibleCount === 0 ? 'flex' : 'none';
}

function applyFilters() {
  let visible = 0;
  state.cards.forEach(card => {
    const isCatMatch = matchCategory(card.category, state.activeCategory);
    const isQueryMatch = matchProject(card, state.searchQuery);
    const shouldShow = isCatMatch && isQueryMatch;

    card.element.style.display = shouldShow ? '' : 'none';
    card.element.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    if (shouldShow) visible++;
  });

  state.visibleCount = visible;
  updateCounters(visible, state.totalCount);
  updateEmptyState(visible);
  announceFilter(visible);
}

function resetAllFilters() {
  sfx.playSwitch();
  state.searchQuery = '';
  state.activeCategory = 'all';

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  document.querySelectorAll('.rocker-btn').forEach(btn => {
    const isAll = (btn.dataset.category || '').toLowerCase() === 'all';
    btn.classList.toggle('active', isAll);
    btn.setAttribute('aria-selected', isAll ? 'true' : 'false');
    btn.setAttribute('aria-pressed', isAll ? 'true' : 'false');
  });

  applyFilters();
  if (searchInput) searchInput.focus();
}

// 3. Live Hardware Telemetry Clock & FPS Monitor
function initTelemetryHUD() {
  const clockEl = document.getElementById('telemetry-clock');
  const fpsEl = document.getElementById('telemetry-fps');

  // Clock updater with milliseconds
  function updateClock() {
    if (clockEl) {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      clockEl.textContent = `${h}:${m}:${s}.${ms}`;
    }
    requestAnimationFrame(updateClock);
  }
  requestAnimationFrame(updateClock);

  // Dynamic FPS Counter
  let frameCount = 0;
  let lastTime = performance.now();
  function measureFPS() {
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      const fps = ((frameCount * 1000) / (now - lastTime)).toFixed(1);
      if (fpsEl) fpsEl.textContent = `${fps} FPS`;
      frameCount = 0;
      lastTime = now;
    }
    requestAnimationFrame(measureFPS);
  }
  requestAnimationFrame(measureFPS);
}

// 4. CRT Scanlines Controller
function initCRTController() {
  const btn = document.getElementById('btn-toggle-crt');
  const root = document.documentElement;

  const savedCRT = localStorage.getItem('riff_crt_enabled');
  const isEnabled = savedCRT !== 'false';
  root.setAttribute('data-crt', String(isEnabled));
  if (btn) {
    btn.classList.toggle('active', isEnabled);
    btn.setAttribute('aria-pressed', String(isEnabled));
  }

  function toggleCRT() {
    sfx.playSwitch();
    const current = root.getAttribute('data-crt') === 'true';
    const next = !current;
    root.setAttribute('data-crt', String(next));
    localStorage.setItem('riff_crt_enabled', String(next));
    if (btn) {
      btn.classList.toggle('active', next);
      btn.setAttribute('aria-pressed', String(next));
    }
  }

  if (btn) {
    btn.addEventListener('click', toggleCRT);
  }

  return toggleCRT;
}

// 5. Sound FX Controller
function initSFXController() {
  const btn = document.getElementById('btn-toggle-sfx');
  const isEnabled = sfx.enabled;
  document.documentElement.setAttribute('data-sound', String(isEnabled));
  if (btn) {
    btn.classList.toggle('active', isEnabled);
    btn.setAttribute('aria-pressed', String(isEnabled));
  }

  function toggleSFX() {
    const next = sfx.toggle();
    document.documentElement.setAttribute('data-sound', String(next));
    if (btn) {
      btn.classList.toggle('active', next);
      btn.setAttribute('aria-pressed', String(next));
    }
  }

  if (btn) {
    btn.addEventListener('click', toggleSFX);
  }

  return toggleSFX;
}

// 6. View Density Controller (Rack vs Compact)
function initDensityController() {
  const btnRack = document.getElementById('btn-density-rack');
  const btnCompact = document.getElementById('btn-density-compact');
  const root = document.documentElement;

  const savedMode = localStorage.getItem('riff_density_mode') || 'rack';
  root.setAttribute('data-density', savedMode);

  function setDensity(mode) {
    sfx.playSwitch();
    root.setAttribute('data-density', mode);
    localStorage.setItem('riff_density_mode', mode);
    if (btnRack) {
      btnRack.classList.toggle('active', mode === 'rack');
      btnRack.setAttribute('aria-pressed', String(mode === 'rack'));
    }
    if (btnCompact) {
      btnCompact.classList.toggle('active', mode === 'compact');
      btnCompact.setAttribute('aria-pressed', String(mode === 'compact'));
    }
  }

  if (btnRack) btnRack.addEventListener('click', () => setDensity('rack'));
  if (btnCompact) btnCompact.addEventListener('click', () => setDensity('compact'));

  if (savedMode === 'compact' && btnCompact) {
    btnRack?.classList.remove('active');
    btnCompact.classList.add('active');
  }
}

// 7. Modal Test Rig Controller
function setPreviewViewport(mode) {
  modalState.viewportMode = mode;
  const container = document.getElementById('modal-viewport-container');
  if (container) {
    container.classList.remove('viewport-desktop', 'viewport-tablet', 'viewport-mobile');
    container.classList.add(`viewport-${mode}`);
  }
  document.querySelectorAll('.btn-vp').forEach(btn => {
    const isActive = btn.dataset.viewport === mode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

function showIframeLoader() {
  const loader = document.getElementById('iframe-loader');
  if (loader) loader.classList.remove('is-hidden');
}

function hideIframeLoader() {
  const loader = document.getElementById('iframe-loader');
  if (loader) loader.classList.add('is-hidden');
}

function openModal(title, route, triggerEl = null) {
  const modal = document.getElementById('preview-modal');
  if (!modal) return;
  sfx.playChamberOpen();

  let formattedRoute = route || '/';
  if (!formattedRoute.startsWith('/') && !formattedRoute.startsWith('http')) formattedRoute = '/' + formattedRoute;
  if (!formattedRoute.endsWith('/') && !formattedRoute.includes('.') && !formattedRoute.includes('?')) formattedRoute += '/';

  modalState.triggerElement = triggerEl || document.activeElement;
  modalState.activeTitle = title || 'MODULE_PREVIEW';
  modalState.activeRoute = formattedRoute;
  modalState.isOpen = true;
  setPreviewViewport('desktop');

  const titleEl = document.getElementById('modal-project-title');
  if (titleEl) titleEl.textContent = modalState.activeTitle;
  const routeEl = document.getElementById('modal-project-route');
  if (routeEl) routeEl.textContent = modalState.activeRoute;
  const externalLink = document.getElementById('link-modal-external');
  if (externalLink) externalLink.href = modalState.activeRoute;

  showIframeLoader();
  const iframe = document.getElementById('modal-iframe');
  if (iframe) {
    iframe.onload = () => hideIframeLoader();
    iframe.src = modalState.activeRoute;
    iframe.title = `${modalState.activeTitle} Live Preview`;
  }

  document.body.style.overflow = 'hidden';
  modal.removeAttribute('hidden');
  modal.classList.add('is-open', 'active');

  const closeBtn = document.getElementById('btn-modal-close');
  if (closeBtn) closeBtn.focus();
}

function closeModal() {
  const modal = document.getElementById('preview-modal');
  if (!modal || !modalState.isOpen) return;
  sfx.playClick(400, 0.03, 'sine');
  modalState.isOpen = false;
  modal.classList.remove('is-open', 'active');
  document.body.style.overflow = '';

  const iframe = document.getElementById('modal-iframe');
  if (iframe) {
    iframe.onload = null;
    iframe.src = 'about:blank';
  }
  hideIframeLoader();

  setTimeout(() => {
    if (!modalState.isOpen) modal.setAttribute('hidden', '');
  }, 180);

  if (modalState.triggerElement?.focus) {
    modalState.triggerElement.focus();
  }
}

function reloadModalIframe() {
  sfx.playEngage();
  const iframe = document.getElementById('modal-iframe');
  if (iframe && modalState.activeRoute) {
    showIframeLoader();
    iframe.src = modalState.activeRoute;
  }
}

function openPreview(title, route) {
  openModal(title, route);
}

// 8. Global Keyboard & Input Handlers
function initKeyHandlers(toggleCRT, toggleSFX) {
  document.addEventListener('keydown', e => {
    const isEscape = e.key === 'Escape' || e.key === 'Esc';
    const isInput = ['input', 'textarea', 'select'].includes(document.activeElement?.tagName?.toLowerCase());

    if (isEscape && modalState.isOpen) {
      e.preventDefault();
      closeModal();
      return;
    }

    if (isEscape && !modalState.isOpen) {
      const searchInput = document.getElementById('search-input');
      if (searchInput && document.activeElement === searchInput) {
        searchInput.value = '';
        state.searchQuery = '';
        applyFilters();
        searchInput.blur();
      }
      return;
    }

    if (!isInput && !modalState.isOpen) {
      if (e.key === '/' || e.code === 'Slash') {
        e.preventDefault();
        sfx.playClick(700, 0.015);
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if (e.key === 'c' || e.key === 'C') {
        toggleCRT();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleSFX();
      }
    }
  });
}

// 9. Main Application Initialization
function initApp() {
  // Index all cards in DOM
  document.querySelectorAll('.card, article.card').forEach((el, index) => {
    const titleEl = el.querySelector('.card-title');
    const descEl = el.querySelector('.card-desc');
    const catBadge = el.querySelector('.card-category-badge') || el.querySelector('.badge-category') || el.querySelector('.screen-overlay-badge');
    const tagElements = Array.from(el.querySelectorAll('.card-tag, .tag')).map(t => t.textContent.trim().toLowerCase());
    const datasetTags = el.dataset.tags ? el.dataset.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
    const tags = Array.from(new Set([...tagElements, ...datasetTags]));
    const slug = el.dataset.slug || el.id.replace(/^project-/, '');
    const title = titleEl ? titleEl.textContent.trim() : slug;
    const description = descEl ? descEl.textContent.trim() : '';
    const category = el.dataset.category || (catBadge ? catBadge.textContent.trim() : 'Clone');
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

  // Search input handler
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value;
      applyFilters();
    });
  }

  // Category filter rockers
  document.querySelectorAll('.rocker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.playSwitch();
      document.querySelectorAll('.rocker-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      btn.setAttribute('aria-pressed', 'true');
      state.activeCategory = btn.dataset.category || 'all';
      applyFilters();
    });
  });

  // Reset button
  const btnReset = document.getElementById('btn-reset-filters');
  if (btnReset) btnReset.addEventListener('click', resetAllFilters);

  // Modal controls
  const btnModalClose = document.getElementById('btn-modal-close');
  if (btnModalClose) btnModalClose.addEventListener('click', closeModal);

  const btnModalReload = document.getElementById('btn-modal-reload');
  if (btnModalReload) btnModalReload.addEventListener('click', reloadModalIframe);

  const modalOverlay = document.getElementById('preview-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.querySelectorAll('.btn-vp').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.playClick(650, 0.02);
      setPreviewViewport(btn.dataset.viewport || 'desktop');
    });
  });

  // Tag click search filter
  document.querySelectorAll('.card-tag, .tag').forEach(tag => {
    tag.addEventListener('click', e => {
      e.stopPropagation();
      sfx.playClick(800, 0.02);
      const val = tag.dataset.tag || tag.textContent.trim();
      if (searchInput) {
        searchInput.value = val;
        state.searchQuery = val;
        applyFilters();
        searchInput.focus();
      }
    });
  });

  // Telemetry HUD & Controllers
  initTelemetryHUD();
  const toggleCRT = initCRTController();
  const toggleSFX = initSFXController();
  initDensityController();
  initKeyHandlers(toggleCRT, toggleSFX);
}

// Attach global API for inline handlers
window.openPreview = openPreview;
window.openModal = openModal;
window.closeModal = closeModal;
window.setPreviewViewport = setPreviewViewport;
window.reloadModalIframe = reloadModalIframe;
window.resetAllFilters = resetAllFilters;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

export {
  state,
  modalState,
  openModal,
  closeModal,
  applyFilters,
  resetAllFilters,
  setPreviewViewport
};
