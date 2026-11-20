// Fixed scenes for screenshots: ?shot=editor shows the page with a sample photo;
// ?shot=cover shows the cover alone. Query picks the sample (`photo`), the words
// (`caption`, `sub`), the look (`layout`, `grade`) and the cover size (`size`,
// like 1920x1080). window.__shotReady is set once painted.

/**
 * Runs one shot scene. `setup` receives the parsed scene and applies it to
 * the app (loading the photo, setting the layout and grade, sizing the canvas).
 */
export async function runShot(shot, query, setup) {
  const size = (query.get('size') ?? '1080x1080').split('x').map(Number);
  const scene = {
    shot,
    photo: query.get('photo') ?? 'pier',
    caption: query.get('caption') ?? 'Sunset Heist',
    sub: query.get('sub') ?? 'Leonida',
    layout: query.get('layout') ?? 'hero',
    grade: query.get('grade') ?? 'sunset',
    width: Number.isFinite(size[0]) ? size[0] : 1080,
    height: Number.isFinite(size[1]) ? size[1] : 1080,
  };
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await setup(scene);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
