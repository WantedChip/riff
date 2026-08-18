/**
 * Riff Landing Portal Application Module
 * Instant Client-Side Fuzzy Search Engine & Progressive State Management
 */

const state = {
  projects: [],
  cards: [],
  activeCategory: 'all',
  searchQuery: '',
  totalCount: 0,
  visibleCount: 0
};

function escapeHtml(str) {
  return str ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') : '';
}

function normalizeText(str) {
  return str ? String(str).toLowerCase().trim() : '';
}

function isSubsequence(needle, haystack) {
  const n = needle.toLowerCase(), h = haystack.toLowerCase();
  let i = 0;
  for (let j = 0; j < h.length && i < n.length; j++) {
    if (h[j] === n[i]) i++;
  }
  return i === n.length;
}

function matchProject(cardData, rawQuery) {
  const query = normalizeText(rawQuery);
  if (!query) return true;

  const { title, description, category, tags, slug, rawText } = cardData;
  if (rawText.includes(query)) return true;

  const tokens = query.split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) return true;

  return tokens.every(token => {
    if (rawText.includes(token)) return true;
    const cleanToken = token.replace(/[^\w]/g, '');
    const cleanRaw = rawText.replace(/[^\w\s]/g, '');
    if (cleanToken && cleanRaw.includes(cleanToken)) return true;
    if (token.length >= 3) {
      if (isSubsequence(token, title) || isSubsequence(token, slug) || isSubsequence(token, category)) return true;
      for (const tag of tags) {
        if (isSubsequence(token, tag)) return true;
      }
      if (isSubsequence(token, description)) return true;
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

function updateEmptyState(visibleCount, query) {
  const grid = document.getElementById('project-grid');
  if (!grid) return;

  let emptyState = document.getElementById('empty-state');
  if (visibleCount === 0) {
    if (!emptyState) {
      emptyState = document.createElement('div');
      emptyState.id = 'empty-state';
      emptyState.className = 'empty-state';
      emptyState.setAttribute('role', 'status');
      grid.appendChild(emptyState);
    }
    const clean = query ? escapeHtml(query.trim()) : '';
    const title = clean ? `No riffs match &ldquo;${clean}&rdquo;` : 'No riffs match the active filter';

    emptyState.innerHTML = `
      <div class="empty-icon" aria-hidden="true">🔍</div>
      <h3 class="empty-title">${title}</h3>
      <p class="empty-desc">Try searching for a different keyword or tech stack tag, or reset your filters.</p>
      <button type="button" class="btn btn-secondary btn-reset-filters" id="btn-reset-filters">Reset Filters</button>
    `;
    emptyState.style.display = 'flex';
  } else if (emptyState) {
    emptyState.style.display = 'none';
  }
}

function applyFilters() {
  const query = state.searchQuery;
  const cat = state.activeCategory;
  let visibleCount = 0;

  for (const card of state.cards) {
    const isVisible = matchProject(card, query) && (cat === 'all' || card.category.toLowerCase() === cat.toLowerCase());
    card.element.classList.toggle('is-hidden', !isVisible);
    card.element.style.display = isVisible ? '' : 'none';
    if (isVisible) visibleCount++;
  }

  state.visibleCount = visibleCount;
  updateCounters(visibleCount, state.totalCount);
  updateEmptyState(visibleCount, query);
}

function initApp() {
  const cards = document.querySelectorAll('#project-grid .card, #project-grid article');
  state.cards = Array.from(cards).map(card => {
    const slug = card.dataset.slug || '';
    const category = card.dataset.category || card.querySelector('.card-category-badge')?.textContent.trim() || 'Clone';
    const rawTags = card.dataset.tags || '';
    const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : Array.from(card.querySelectorAll('.tag')).map(t => t.textContent.trim());
    const title = card.querySelector('.card-title')?.textContent.trim() || '';
    const description = card.querySelector('.card-desc')?.textContent.trim() || '';
    const rawText = normalizeText(`${title} ${description} ${category} ${tags.join(' ')} ${slug}`);

    return { element: card, slug, category, tags, title, description, rawText };
  });

  state.totalCount = state.cards.length;
  state.visibleCount = state.cards.length;
  updateCounters(state.visibleCount, state.totalCount);

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    const onSearch = (e) => { state.searchQuery = e.target.value; applyFilters(); };
    searchInput.addEventListener('input', onSearch);
    searchInput.addEventListener('search', onSearch);
  }

  const categoryFilters = document.getElementById('category-filters');
  if (categoryFilters) {
    categoryFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-pill');
      if (!btn) return;
      state.activeCategory = btn.dataset.category || 'all';
      categoryFilters.querySelectorAll('.filter-pill').forEach(pill => {
        const active = pill === btn;
        pill.classList.toggle('active', active);
        pill.setAttribute('aria-pressed', String(active));
      });
      applyFilters();
    });
  }

  document.addEventListener('click', (e) => {
    const resetBtn = e.target.closest('#btn-reset-filters, .btn-reset-filters');
    if (resetBtn) {
      const input = document.getElementById('search-input');
      if (input) { input.value = ''; input.focus(); }
      state.searchQuery = '';
      state.activeCategory = 'all';
      const pills = document.querySelectorAll('#category-filters .filter-pill');
      pills.forEach(p => {
        const isAll = p.dataset.category === 'all';
        p.classList.toggle('active', isAll);
        p.setAttribute('aria-pressed', String(isAll));
      });
      applyFilters();
      return;
    }

    const tag = e.target.closest('.tag, .card-tag');
    if (tag) {
      const text = tag.dataset.tag || tag.textContent.trim();
      if (text) {
        const input = document.getElementById('search-input');
        if (input) { input.value = text; input.focus(); }
        state.searchQuery = text;
        applyFilters();
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    const input = document.getElementById('search-input');
    if (e.key === '/' && document.activeElement !== input && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      if (input) { input.focus(); input.select(); }
    } else if (e.key === 'Escape' && document.activeElement === input) {
      if (input.value) { input.value = ''; state.searchQuery = ''; applyFilters(); }
      input.blur();
    }
  });

  fetch('/projects.json')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (Array.isArray(data)) {
        state.projects = data;
        window.__RIFF_PROJECTS__ = data;
      }
    })
    .catch(() => {});
}

window.openPreview = function(title, route) {
  console.log(`[riff] Quick View requested for: ${title} (${route})`);
};

window.riffApp = {
  state,
  applyFilters,
  matchProject,
  setSearchQuery: (q) => {
    const input = document.getElementById('search-input');
    if (input) input.value = q;
    state.searchQuery = q;
    applyFilters();
  },
  setCategory: (cat) => {
    state.activeCategory = cat;
    applyFilters();
  },
  resetFilters: () => {
    const input = document.getElementById('search-input');
    if (input) input.value = '';
    state.searchQuery = '';
    state.activeCategory = 'all';
    applyFilters();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

console.log('[riff] Landing portal initialized');
