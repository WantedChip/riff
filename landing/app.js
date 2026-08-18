/**
 * Riff Landing Portal Application Module
 */

/**
 * Initialize telemetry counters based on available projects
 */
function initTelemetry() {
  const telemetryCount = document.getElementById('telemetry-count');
  if (telemetryCount) {
    const cards = document.querySelectorAll('#project-grid .card, #project-grid article');
    if (cards.length > 0) {
      telemetryCount.textContent = cards.length;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTelemetry);
} else {
  initTelemetry();
}

console.log('[riff] Landing portal initialized');

