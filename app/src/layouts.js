// Panel geometry for the poster's layouts. Every layout fills the unit square
// [0, 1] x [0, 1] with three panels and a dark gutter between them, in the
// style of a multi-panel game poster: one big moment and two supporting shots.

export const LAYOUTS = {
  hero: {
    name: 'Hero',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.62 },
      { x: 0, y: 0.64, w: 0.49, h: 0.36 },
      { x: 0.51, y: 0.64, w: 0.49, h: 0.36 },
    ],
  },
  strips: {
    name: 'Strips',
    panels: [
      { x: 0, y: 0, w: 0.33, h: 1 },
      { x: 0.34, y: 0, w: 0.32, h: 1 },
      { x: 0.67, y: 0, w: 0.33, h: 1 },
    ],
  },
  split: {
    name: 'Split',
    panels: [
      { x: 0, y: 0, w: 0.56, h: 1 },
      { x: 0.58, y: 0, w: 0.42, h: 0.49 },
      { x: 0.58, y: 0.51, w: 0.42, h: 0.49 },
    ],
  },
};

/** Returns the three panel rectangles of a layout, scaled to a canvas of width w and height h. */
export function panelRects(layout, w, h) {
  const def = LAYOUTS[layout] ?? LAYOUTS.hero;
  return def.panels.map((p) => ({ x: p.x * w, y: p.y * h, w: p.w * w, h: p.h * h }));
}

/** Finds which panel of a layout contains the point (x, y) on a canvas of width w and height h. */
export function panelAt(layout, w, h, x, y) {
  const rects = panelRects(layout, w, h);
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}
