// Wires Vice Cover Studio: photos, layouts, grades, caption, per-panel crop
// (click a panel to pick it, drag to pan, wheel to zoom), export at three post
// sizes, and the ?shot= scenes for screenshots (./shots.js).
import { LAYOUTS, panelAt } from './layouts.js';
import { GRADES, renderPoster } from './cover.js';
import { EXPORT_SIZES, exportPoster } from './export.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('sub');
const status = document.getElementById('status');
const panelInfo = document.getElementById('panel-info');
const panelPhotoSelect = document.getElementById('panel-photo');
const zoomInput = document.getElementById('zoom');
const zoomValue = document.getElementById('zoom-value');

// The poster's state: three panels, each with its own photo, zoom and pan.
const state = {
  layout: 'hero',
  grade: 'sunset',
  caption: 'Sunset Heist',
  sub: 'Leonida',
  captionSize: 1,
  captionColor: '#ffffff',
  captionPos: 'bottom',
  exportSize: '1080x1080',
  photos: [], // { name, img } in load order
  panels: [
    { photo: 0, zoom: 1, ox: 0, oy: 0 },
    { photo: 1, zoom: 1, ox: 0, oy: 0 },
    { photo: 0, zoom: 1.15, ox: 0, oy: 0 },
  ],
  selected: 0,
  showSelection: true,
};

function redraw() {
  renderPoster(canvas, state);
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Loads a sample photo by name, reusing it when it is already loaded. */
async function loadSample(name) {
  const found = state.photos.findIndex((p) => p.name === name);
  if (found >= 0) return found;
  const img = await loadImage(`samples/${name}.jpg`);
  state.photos.push({ name, img });
  refreshPhotoControls();
  return state.photos.length - 1;
}

function refreshPhotoControls() {
  const options = state.photos.map((p, i) => `<option value="${i}">${p.name}</option>`).join('');
  panelPhotoSelect.innerHTML = options;
  panelPhotoSelect.value = String(state.panels[state.selected].photo);
  const panel = state.panels[state.selected];
  zoomInput.value = String(panel.zoom);
  zoomValue.textContent = `${panel.zoom.toFixed(2)}x`;
  panelInfo.textContent = `Panel ${state.selected + 1} of 3 — photo: ${state.photos[panel.photo]?.name ?? 'none'}`;
  document.querySelectorAll('[data-panel]').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.panel) === state.selected);
  });
}

/** Syncs every toggle button's active state with the current state. */
function syncButtons() {
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('[data-color]').forEach((b) => {
    b.classList.toggle('active', b.dataset.color === state.captionColor);
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.exportSize);
  });
}

function selectPanel(i) {
  if (i < 0 || i > 2) return;
  state.selected = i;
  refreshPhotoControls();
  redraw();
}

function applySize(size) {
  const [w, h] = size.split('x').map(Number);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return;
  canvas.width = w;
  canvas.height = h;
  state.exportSize = size;
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === size);
  });
  redraw();
}

// --- Photo controls -------------------------------------------------------
document.getElementById('photo').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const img = await loadImage(URL.createObjectURL(file));
  const name = file.name.replace(/\.[^.]+$/, '') || 'upload';
  state.photos.push({ name, img });
  state.panels[state.selected].photo = state.photos.length - 1;
  refreshPhotoControls();
  redraw();
  status.textContent = `Loaded ${file.name}`;
});

document.querySelectorAll('[data-sample]').forEach((b) => {
  b.addEventListener('click', async () => {
    const i = await loadSample(b.dataset.sample);
    state.panels[state.selected].photo = i;
    refreshPhotoControls();
    redraw();
  });
});

// --- Layout and grade -----------------------------------------------------
document.querySelectorAll('[data-layout]').forEach((b) => {
  b.addEventListener('click', () => {
    state.layout = b.dataset.layout;
    document.querySelectorAll('[data-layout]').forEach((x) => {
      x.classList.toggle('active', x === b);
    });
    redraw();
  });
});

document.querySelectorAll('[data-grade]').forEach((b) => {
  b.addEventListener('click', () => {
    state.grade = b.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach((x) => {
      x.classList.toggle('active', x === b);
    });
    redraw();
  });
});

// --- Caption --------------------------------------------------------------
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subInput.addEventListener('input', () => { state.sub = subInput.value; redraw(); });

document.getElementById('caption-size').addEventListener('input', (e) => {
  state.captionSize = Number(e.target.value);
  document.getElementById('caption-size-value').textContent = `${state.captionSize.toFixed(2)}x`;
  redraw();
});

document.querySelectorAll('[data-color]').forEach((b) => {
  b.addEventListener('click', () => {
    state.captionColor = b.dataset.color;
    document.querySelectorAll('[data-color]').forEach((x) => {
      x.classList.toggle('active', x === b);
    });
    redraw();
  });
});

document.getElementById('caption-pos').addEventListener('change', (e) => {
  state.captionPos = e.target.value;
  redraw();
});

// --- Preview size ---------------------------------------------------------
document.querySelectorAll('[data-size]').forEach((b) => {
  b.addEventListener('click', () => applySize(b.dataset.size));
});

// --- Panel crop -----------------------------------------------------------
document.querySelectorAll('[data-panel]').forEach((b) => {
  b.addEventListener('click', () => selectPanel(Number(b.dataset.panel)));
});

panelPhotoSelect.addEventListener('change', () => {
  state.panels[state.selected].photo = Number(panelPhotoSelect.value);
  redraw();
});

zoomInput.addEventListener('input', () => {
  state.panels[state.selected].zoom = Number(zoomInput.value);
  zoomValue.textContent = `${Number(zoomInput.value).toFixed(2)}x`;
  redraw();
});

document.getElementById('reset-crop').addEventListener('click', () => {
  state.panels[state.selected] = { ...state.panels[state.selected], zoom: 1, ox: 0, oy: 0 };
  refreshPhotoControls();
  redraw();
});

// Drag on the preview pans the selected panel; the wheel zooms it. A click
// with no drag picks the panel under the pointer instead.
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const hit = panelAt(state.layout, canvas.width, canvas.height, x, y);
  if (hit >= 0) selectPanel(hit);
  drag = { x: e.clientX, y: e.clientY, moved: false, panel: state.selected };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const dx = (e.clientX - drag.x) / rect.width;
  const dy = (e.clientY - drag.y) / rect.height;
  if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 3) drag.moved = true;
  if (drag.moved) {
    const panel = state.panels[drag.panel];
    panel.ox = Math.max(-0.5, Math.min(0.5, panel.ox + dx));
    panel.oy = Math.max(-0.5, Math.min(0.5, panel.oy + dy));
    drag.x = e.clientX;
    drag.y = e.clientY;
    redraw();
  }
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selected];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * (1 - e.deltaY * 0.001)));
  refreshPhotoControls();
  redraw();
}, { passive: false });

// --- Export ---------------------------------------------------------------
document.querySelectorAll('[data-export]').forEach((b) => {
  b.addEventListener('click', async () => {
    const size = EXPORT_SIZES.find((s) => `${s.width}x${s.height}` === b.dataset.export);
    if (!size) return;
    status.textContent = `Exporting ${size.label}…`;
    try {
      const blob = await exportPoster(state, size.width, size.height);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cover-${size.width}x${size.height}.png`;
      a.click();
      status.textContent = `Saved cover-${size.width}x${size.height}.png`;
    } catch (err) {
      status.textContent = `Export failed: ${err.message}`;
    }
  });
});

// --- Start ----------------------------------------------------------------
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, async (scene) => {
    state.showSelection = scene.shot !== 'cover';
    state.layout = LAYOUTS[scene.layout] ? scene.layout : 'hero';
    state.grade = GRADES[scene.grade] ? scene.grade : 'sunset';
    state.caption = scene.caption;
    state.sub = scene.sub;
    captionInput.value = scene.caption;
    subInput.value = scene.sub;
    applySize(`${scene.width}x${scene.height}`);
    const mainPhoto = await loadSample(scene.photo);
    const otherPhoto = await loadSample(scene.photo === 'pier' ? 'boulevard' : 'pier');
    // A wide landscape cover crops its hero panel hard top and bottom, so pan
    // the photos down to keep the faces in frame; square and portrait covers
    // need no shift.
    const widePan = scene.width / scene.height > 1.5 ? 0.25 : 0;
    state.panels = [
      { photo: mainPhoto, zoom: 1, ox: 0, oy: widePan },
      { photo: otherPhoto, zoom: 1, ox: 0, oy: 0 },
      { photo: mainPhoto, zoom: 1.2, ox: 0, oy: widePan * 0.8 },
    ];
    syncButtons();
    refreshPhotoControls();
    redraw();
  });
} else {
  applySize(state.exportSize);
  // Load the samples in order so the panel photo indices stay fixed.
  loadSample('pier')
    .then(() => loadSample('boulevard'))
    .then(() => {
      refreshPhotoControls();
      redraw();
    });
}
