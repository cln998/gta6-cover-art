// Draws the poster: three photo panels in the chosen layout, a sunset or neon
// colour grade over the whole cover, and bold outlined caption lettering.
// Nothing here is Rockstar artwork or a Rockstar font: the lettering is drawn
// with a heavy system sans-serif, outlined and shadowed on the canvas.

import { panelRects } from './layouts.js';

// Colour grades: a canvas filter for the photos plus a vertical tint and a
// vignette strength, all applied over the finished panels.
export const GRADES = {
  sunset: {
    name: 'Sunset',
    filter: 'saturate(1.3) contrast(1.06)',
    tintTop: 'rgba(255, 140, 60, 0.12)',
    tintBottom: 'rgba(214, 48, 140, 0.38)',
    vignette: 0.35,
  },
  neon: {
    name: 'Neon',
    filter: 'saturate(1.5) contrast(1.12)',
    tintTop: 'rgba(0, 229, 255, 0.12)',
    tintBottom: 'rgba(255, 0, 153, 0.40)',
    vignette: 0.4,
  },
  vice: {
    name: 'Vice',
    filter: 'saturate(1.35) contrast(1.05)',
    tintTop: 'rgba(255, 0, 128, 0.14)',
    tintBottom: 'rgba(0, 180, 180, 0.30)',
    vignette: 0.35,
  },
  noir: {
    name: 'Noir',
    filter: 'saturate(0.55) contrast(1.15) brightness(0.95)',
    tintTop: 'rgba(20, 20, 40, 0.05)',
    tintBottom: 'rgba(0, 0, 0, 0.45)',
    vignette: 0.55,
  },
};

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and pan. */
function drawPanelPhoto(ctx, img, rect, panel, filter) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!img) {
    // Empty panel: a dark plum placeholder with a diagonal sheen.
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, '#3a1c4d');
    g.addColorStop(1, '#160a24');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    return;
  }
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * panel.zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - pw) / 2 + panel.ox * rect.w;
  const dy = rect.y + (rect.h - ph) / 2 + panel.oy * rect.h;
  if (filter) ctx.filter = filter;
  ctx.drawImage(img, dx, dy, pw, ph);
  ctx.filter = 'none';
  ctx.restore();
}

/** Draws the caption in heavy outlined capitals, shrunk to fit the cover width. */
function drawCaption(ctx, w, h, state) {
  const text = state.caption.trim().toUpperCase();
  if (!text) return;
  const maxWidth = w * 0.92;
  let size = h * 0.11 * state.captionSize;
  ctx.font = `900 ${size}px 'Arial Narrow', 'Helvetica Neue', sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 14) {
    size -= 2;
    ctx.font = `900 ${size}px 'Arial Narrow', 'Helvetica Neue', sans-serif`;
  }
  const baseline = state.captionPos === 'top' ? h * 0.06 + size : h - h * 0.06;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.14);
  ctx.strokeStyle = '#12041f';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = size * 0.18;
  ctx.shadowOffsetY = size * 0.04;
  ctx.strokeText(text, w / 2, baseline);
  ctx.fillStyle = state.captionColor;
  ctx.fillText(text, w / 2, baseline);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

/** Draws the small kicker line (the place name) in spaced capitals. */
function drawKicker(ctx, w, h, state) {
  const text = state.sub.trim().toUpperCase();
  if (!text) return;
  const size = Math.max(14, h * 0.028);
  ctx.font = `800 ${size}px 'Arial Narrow', 'Helvetica Neue', sans-serif`;
  try { ctx.letterSpacing = `${Math.round(size * 0.35)}px`; } catch { /* older canvas */ }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = Math.max(2, size * 0.16);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(18, 4, 31, 0.9)';
  ctx.fillStyle = '#ffe9a8';
  const x = w * 0.035;
  const y = state.captionPos === 'top' ? h - h * 0.045 : h * 0.045 + size * 0.4;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
}

/**
 * Renders the whole poster onto the canvas's 2D context at the canvas's own
 * size. `state` carries layout, grade, caption, photos and the per-panel crop.
 * When `state.showSelection` is set, the selected panel gets a pink outline
 * (editor preview only, never on an exported cover).
 */
export function renderPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const rects = panelRects(state.layout, w, h);

  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < rects.length; i += 1) {
    const panel = state.panels[i] ?? { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = state.photos[panel.photo]?.img ?? null;
    drawPanelPhoto(ctx, img, rects[i], panel, grade.filter);
  }

  // Grade tint: a warm or neon wash over the whole cover.
  const tint = ctx.createLinearGradient(0, 0, 0, h);
  tint.addColorStop(0, grade.tintTop);
  tint.addColorStop(1, grade.tintBottom);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);

  // Vignette: darken the corners so the caption pops.
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.35,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, `rgba(0, 0, 0, ${grade.vignette})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Scrim behind the caption so white lettering reads on any photo.
  const scrim = ctx.createLinearGradient(0, h * 0.62, 0, h);
  if (state.captionPos === 'top') {
    scrim.addColorStop(0, 'rgba(10, 2, 20, 0.72)');
    scrim.addColorStop(1, 'rgba(10, 2, 20, 0)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, w, h * 0.38);
  } else {
    scrim.addColorStop(0, 'rgba(10, 2, 20, 0)');
    scrim.addColorStop(1, 'rgba(10, 2, 20, 0.72)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
  }

  drawKicker(ctx, w, h, state);
  drawCaption(ctx, w, h, state);

  if (state.showSelection) {
    const sel = rects[state.selected];
    if (sel) {
      ctx.save();
      ctx.strokeStyle = '#ff2e88';
      ctx.lineWidth = Math.max(3, w * 0.004);
      ctx.setLineDash([Math.max(8, w * 0.012), Math.max(6, w * 0.008)]);
      ctx.strokeRect(sel.x + 2, sel.y + 2, sel.w - 4, sel.h - 4);
      ctx.restore();
    }
  }

  // Thin frame around the whole poster.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}
