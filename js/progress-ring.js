/* =========================================================
   progress-ring.js
   A tiny reusable SVG circular progress ring, built by hand
   (no charting library) using the stroke-dasharray trick:
   a circle's stroke can be "cut" to show only a fraction of its
   circumference, which is exactly what a progress ring needs.

   Concepts demonstrated: SVG generated from a template string
   (same DOM-building approach as everywhere else, applied to a
   different tag namespace), basic geometry (circumference = 2πr),
   a pure function that returns markup rather than touching the
   DOM directly - so it composes cleanly inside any other render().
   ========================================================= */

/**
 * ringSVG(percent, size, opts)
 * percent: 0-100
 * size: pixel width/height of the square SVG
 */
function ringSVG(percent, size = 72, opts = {}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const stroke = opts.stroke || 6;
  const radius = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const color = clamped >= 100 ? "var(--success)" : clamped >= 80 ? "var(--warning)" : "var(--accent)";

  return `
    <svg class="progress-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle
        cx="${size / 2}" cy="${size / 2}" r="${radius}"
        fill="none" stroke="var(--border)" stroke-width="${stroke}"
      />
      <circle
        cx="${size / 2}" cy="${size / 2}" r="${radius}"
        fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        transform="rotate(-90 ${size / 2} ${size / 2})"
        class="progress-ring__fill"
      />
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" class="progress-ring__label">
        ${Math.round(clamped)}%
      </text>
    </svg>`;
}

export { ringSVG };
