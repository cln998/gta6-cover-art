// Exports the poster as a PNG file at an exact post size: renders the current
// state onto a fresh offscreen canvas and hands back the PNG blob.

import { renderPoster } from './cover.js';

/** The three post sizes the app exports: square, portrait and landscape. */
export const EXPORT_SIZES = [
  { label: '1080 x 1080', width: 1080, height: 1080 },
  { label: '1080 x 1350', width: 1080, height: 1350 },
  { label: '1920 x 1080', width: 1920, height: 1080 },
];

/**
 * Renders `state` at `width` x `height` with no selection outline and
 * resolves to the PNG blob. The export never shows the editor chrome.
 */
export function exportPoster(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const clean = { ...state, showSelection: false };
  renderPoster(canvas, clean);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('the cover did not export'));
    }, 'image/png');
  });
}
