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
    const rBtn = e.target.closest('#btn-reset-filters, .btn-reset-filters');
    if (rBtn) {
      resetFilters();
      return;
    }
    const tag = e.target.closest('.badge-tag, .tag, .card-tag, [data-tag]');
    if (tag && !tag.closest('.filter-pills, [role="tablist"]')) {
      handleTagClick(tag);
    }
  });

  document.addEventListener('keydown', e => {
    const input = document.getElementById('search-input');
    if (e.key === '/' && document.activeElement !== input && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      if (input) { input.focus(); input.select(); }
    } else if (e.key === 'Escape' && document.activeElement === input) {
      if (input.value) { input.value = ''; state.searchQuery = ''; applyFilters(); }
      input.blur();
    }
  });

  fetch('/projects.json').then(r => r.ok ? r.json() : null).then(data => {
    if (Array.isArray(data)) { state.projects = data; window.__RIFF_PROJECTS__ = data; }
  }).catch(() => {});
}

window.openPreview = function(title, route) {
  console.log(`[riff] Quick View requested for: ${title} (${route})`);
};

window.riffApp = {
  state, applyFilters, matchProject, matchCategory, normalizeCategory, setCategory, handleTagClick, resetFilters, announceFilter,
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
