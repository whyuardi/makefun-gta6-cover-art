// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo loaded; ?shot=cover shows the cover alone, full-bleed.
// Query params: photo, photo2 (sample names), caption, sub, layout, grade,
// size (WxH, e.g. 1920x1080). window.__shotReady is set once painted.
export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await apply({
    photo: query.get('photo') ?? 'boulevard',
    photo2: query.get('photo2') ?? 'pier',
    caption: query.get('caption') ?? 'Vice Heist',
    sub: query.get('sub') ?? 'Sunset Strip',
    layout: query.get('layout') ?? 'hero',
    grade: query.get('grade') ?? 'sunset',
    size: query.get('size') ?? '',
    coverOnly: shot === 'cover',
  });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
