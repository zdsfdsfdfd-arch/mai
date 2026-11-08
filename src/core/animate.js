// Small motion helpers that CSS alone can't do: counting numbers.

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/** Format with a thin no-break space as the thousands separator (Russian style). */
export function formatNumber(value, decimals = 0) {
  const fixed = value.toFixed(decimals);
  const [int, frac] = fixed.split('.');
  const grouped = int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : int;
  return frac ? `${grouped},${frac}` : grouped;
}

const running = new WeakMap();

/**
 * Elements with data-count="2685" count up from data-from (default 0)
 * when their slide becomes active. data-decimals sets precision.
 */
export function runCounters(scope) {
  scope.querySelectorAll('[data-count]').forEach((el) => {
    const to = parseFloat(el.dataset.count);
    const from = parseFloat(el.dataset.from ?? '0');
    const decimals = parseInt(el.dataset.decimals ?? '0', 10);
    const duration = parseInt(el.dataset.duration ?? '1600', 10);
    const delay = parseInt(el.dataset.delay ?? '350', 10);

    cancelAnimationFrame(running.get(el));
    if (reduceMotion()) {
      el.textContent = formatNumber(to, decimals);
      return;
    }
    el.textContent = formatNumber(from, decimals);
    const start = performance.now() + delay;
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      el.textContent = formatNumber(from + (to - from) * easeOutCubic(t), decimals);
      if (t < 1) running.set(el, requestAnimationFrame(tick));
    };
    running.set(el, requestAnimationFrame(tick));
  });
}

/** Put counters back to their final value (used for inactive slides / thumbnails). */
export function settleCounters(scope) {
  scope.querySelectorAll('[data-count]').forEach((el) => {
    cancelAnimationFrame(running.get(el));
    el.textContent = formatNumber(parseFloat(el.dataset.count), parseInt(el.dataset.decimals ?? '0', 10));
  });
}
