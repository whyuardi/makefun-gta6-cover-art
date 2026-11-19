/* Fixed scenes for screenshots: ?shot=editor shows the full editor with a
   sample photo loaded; ?shot=cover shows the cover alone, edge to edge.
   Query knobs: photo (sample name for the hero panel), photos (comma list
   of sample names, one per panel), caption, sub, layout (hero2, grid,
   cols3), grade (sunset, neon, pastel), size (square, tall, wide),
   band (top or bottom), neon (0 or 1), slant (0 or 1), zoom, panx, pany.
   window.__shotReady is set once the scene has painted. */

const SAMPLES = ['pier', 'boulevard'];

export async function runShot(shot, query, app) {
  const { state, addPhoto, redraw, renderThumbs } = app;
  if (shot === 'cover') document.body.classList.add('shot-cover');

  const layout = query.get('layout');
  if (layout === 'hero2' || layout === 'grid' || layout === 'cols3') {
    state.layout = layout;
    document.querySelectorAll('#layoutSeg button').forEach((b) => {
      b.classList.toggle('on', b.dataset.layout === layout);
    });
  }
  const grade = query.get('grade');
  if (grade === 'sunset' || grade === 'neon' || grade === 'pastel') {
    state.grade = grade;
    document.querySelectorAll('#gradeSeg button').forEach((b) => {
      b.classList.toggle('on', b.dataset.grade === grade);
    });
  }
  const size = query.get('size');
  if (size === 'square' || size === 'tall' || size === 'wide') {
    state.size = size;
    document.querySelectorAll('#sizeSeg button').forEach((b) => {
      b.classList.toggle('on', b.dataset.size === size);
    });
  }
  const caption = query.get('caption');
  if (caption !== null) {
    state.caption = caption;
    document.getElementById('captionInput').value = caption;
  }
  const sub = query.get('sub');
  if (sub !== null) {
    state.sub = sub;
    document.getElementById('subInput').value = sub;
  }
  const band = query.get('band');
  if (band === 'top' || band === 'bottom') {
    state.bandTop = band === 'top';
    document.getElementById('bandTop').checked = state.bandTop;
  }
  if (query.get('neon') !== null) {
    state.neon = query.get('neon') !== '0';
    document.getElementById('neonToggle').checked = state.neon;
  }
  if (query.get('slant') !== null) {
    state.slant = query.get('slant') !== '0';
    document.getElementById('slantToggle').checked = state.slant;
  }

  const names = (query.get('photos') || query.get('photo') || 'pier').split(',');
  for (const name of names) {
    if (name.trim() === 'art') continue;
    const clean = SAMPLES.includes(name.trim()) ? name.trim() : 'pier';
    await addPhoto(clean[0].toUpperCase() + clean.slice(1), 'samples/' + clean + '.jpg');
  }

  state.panels.forEach((panel, i) => {
    const pick = names[i] ? names[i].trim() : null;
    if (pick === 'art') {
      panel.src = 'art';
    } else if (pick && SAMPLES.includes(pick)) {
      panel.src = state.photos.findIndex((p) => p.name.toLowerCase() === pick);
    } else if (i < state.photos.length) {
      panel.src = i;
    }
    panel.zoom = Number(query.get('zoom') || '100') / 100;
    panel.panX = Number(query.get('panx') || '0') / 100;
    panel.panY = Number(query.get('pany') || '0') / 100;
  });
  state.selected = 0;

  renderThumbs();
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
