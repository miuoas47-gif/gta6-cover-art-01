// Fixed scenes for screenshots: ?shot=cover shows the cover alone, ?shot=editor
// shows the editor with a sample photo loaded. Query params: layout (1/2/3/4),
// size (1080x1080, 1080x1350, 1920x1080), grade, caption, subtitle, captionPos,
// photo (sample for panel 1), photo2 (sample for panel 2, and so on).
// window.__shotReady is set once the scene has painted.
export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const names = ['photo', 'photo2', 'photo3', 'photo4']
    .map((k) => query.get(k))
    .filter(Boolean);
  const samples = names.length ? names : [query.get('photo') ?? 'pier'];
  const photos = [];
  for (const name of samples) {
    photos.push(await api.loadImage('samples/' + name + '.jpg'));
  }
  // Wait for the display font so the caption lettering is final before the shot.
  if (document.fonts && document.fonts.ready) {
    try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]); } catch { /* keep going */ }
  }
  api.applyShotScene({
    layout: query.get('layout') ?? '1',
    size: query.get('size') ?? '1080x1080',
    grade: query.get('grade') ?? 'sunset',
    caption: query.get('caption') ?? 'VICE CITY NIGHTS',
    subtitle: query.get('subtitle') ?? 'Sunset heist · Leonida',
    captionPos: query.get('captionPos') ?? 'bottom',
    photos,
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
