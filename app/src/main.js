/* Sunset Strip Cover Studio: wires the editor. Photos stay local, the cover
   is drawn on canvas, and Export PNG renders the same drawing at full size
   on an offscreen canvas. Shot mode (?shot=) stages a fixed scene so a
   headless browser can capture it, then sets window.__shotReady. */

import { drawCover, layoutRects, panelAt, panelCount, posterArea, SIZES } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const pctx = preview.getContext('2d');

export const state = {
  layout: 'hero2',
  grade: 'sunset',
  size: 'square',
  caption: 'Sunset Heist',
  sub: 'One last job before the sun goes down',
  captionScale: 1,
  bandTop: false,
  neon: true,
  slant: true,
  photos: [],
  panels: [],
  selected: 0,
};

function ensurePanels() {
  const n = panelCount(state.layout);
  while (state.panels.length < n) {
    state.panels.push({ src: state.photos.length ? 0 : 'art', zoom: 1, panX: 0, panY: 0 });
  }
  state.panels.length = n;
  if (state.selected >= n) state.selected = 0;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = src;
  });
}

export function redraw() {
  ensurePanels();
  const size = SIZES[state.size];
  preview.width = size.w;
  preview.height = size.h;
  drawCover(pctx, state, size.w, size.h);
  if (!document.body.classList.contains('shot-cover')) {
    drawSelection();
  }
  $('sizeNote').textContent = size.label;
}

function drawSelection() {
  const size = SIZES[state.size];
  const rects = layoutRects(state.layout, posterArea(size.w, size.h, state.bandTop));
  const r = rects[state.selected];
  if (!r) return;
  pctx.save();
  pctx.strokeStyle = '#ffd76a';
  pctx.lineWidth = Math.max(6, size.w * 0.008);
  pctx.setLineDash([size.w * 0.02, size.w * 0.012]);
  pctx.strokeRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
  pctx.setLineDash([]);
  pctx.restore();
}

function renderThumbs() {
  const strip = $('thumbStrip');
  strip.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const img = document.createElement('img');
    img.src = photo.thumb;
    img.alt = photo.name;
    img.title = photo.name;
    const inUse = state.panels.some((p) => p.src === i);
    if (inUse) img.classList.add('assigned');
    img.addEventListener('click', () => {
      assignPhoto(i);
      strip.querySelectorAll('img').forEach((el) => el.classList.remove('picked'));
      img.classList.add('picked');
    });
    strip.appendChild(img);
  });
  renderPanelSelect();
}

function renderPanelSelect() {
  const sel = $('panelPhoto');
  const current = state.panels[state.selected];
  sel.innerHTML = '';
  const artOpt = document.createElement('option');
  artOpt.value = 'art';
  artOpt.textContent = 'Drawn sunset art';
  sel.appendChild(artOpt);
  state.photos.forEach((photo, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = photo.name;
    sel.appendChild(opt);
  });
  sel.value = current && current.src === 'art' ? 'art' : String(current ? current.src : 0);
  $('panelLabel').textContent =
    'Panel ' + (state.selected + 1) + ' of ' + state.panels.length + ' — click a panel in the preview to pick it.';
  syncPanelSliders();
}

function syncPanelSliders() {
  const p = state.panels[state.selected] || { zoom: 1, panX: 0, panY: 0 };
  $('zoom').value = Math.round((p.zoom || 1) * 100);
  $('zoomVal').textContent = Math.round((p.zoom || 1) * 100) + '%';
  $('panX').value = Math.round((p.panX || 0) * 100);
  $('panY').value = Math.round((p.panY || 0) * 100);
}

function assignPhoto(i) {
  ensurePanels();
  state.panels[state.selected].src = i;
  renderThumbs();
  redraw();
}

function addPhoto(name, src, thumb) {
  return loadImage(src).then((img) => {
    state.photos.push({ name, img, thumb: thumb || src });
    if (state.panels.length === 0) ensurePanels();
    state.panels.forEach((p) => {
      if (p.src === 'art' && state.photos.length === 1) p.src = 0;
    });
    renderThumbs();
    redraw();
  });
}

export function exportCoverPNG() {
  const size = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext('2d'), state, size.w, size.h);
  return off.toDataURL('image/png');
}

window.__exportCoverPNG = exportCoverPNG;

function bindControls() {
  $('photoInput').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      await addPhoto(file.name.replace(/\.[^.]+$/, '') || 'Photo', dataUrl);
    }
    $('status').textContent = files.length + ' photo(s) added — click a thumbnail to place one.';
    e.target.value = '';
  });

  document.querySelectorAll('#layoutSeg button').forEach((b) => {
    b.addEventListener('click', () => {
      state.layout = b.dataset.layout;
      document.querySelectorAll('#layoutSeg button').forEach((x) => x.classList.toggle('on', x === b));
      redraw();
    });
  });
  document.querySelectorAll('#gradeSeg button').forEach((b) => {
    b.addEventListener('click', () => {
      state.grade = b.dataset.grade;
      document.querySelectorAll('#gradeSeg button').forEach((x) => x.classList.toggle('on', x === b));
      redraw();
    });
  });
  document.querySelectorAll('#sizeSeg button').forEach((b) => {
    b.addEventListener('click', () => {
      state.size = b.dataset.size;
      document.querySelectorAll('#sizeSeg button').forEach((x) => x.classList.toggle('on', x === b));
      redraw();
    });
  });

  $('captionInput').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
  $('subInput').addEventListener('input', (e) => { state.sub = e.target.value; redraw(); });
  $('capSize').addEventListener('input', (e) => {
    state.captionScale = Number(e.target.value) / 100;
    $('capSizeVal').textContent = e.target.value + '%';
    redraw();
  });
  $('bandTop').addEventListener('change', (e) => { state.bandTop = e.target.checked; redraw(); });
  $('neonToggle').addEventListener('change', (e) => { state.neon = e.target.checked; redraw(); });
  $('slantToggle').addEventListener('change', (e) => { state.slant = e.target.checked; redraw(); });

  $('panelPhoto').addEventListener('change', (e) => {
    const v = e.target.value;
    state.panels[state.selected].src = v === 'art' ? 'art' : Number(v);
    renderThumbs();
    redraw();
  });
  $('zoom').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = Number(e.target.value) / 100;
    $('zoomVal').textContent = e.target.value + '%';
    redraw();
  });
  $('panX').addEventListener('input', (e) => {
    state.panels[state.selected].panX = Number(e.target.value) / 100;
    redraw();
  });
  $('panY').addEventListener('input', (e) => {
    state.panels[state.selected].panY = Number(e.target.value) / 100;
    redraw();
  });

  $('fillAllBtn').addEventListener('click', () => {
    if (!state.photos.length) return;
    const picked = state.panels[state.selected].src;
    const src = picked === 'art' ? 0 : picked;
    state.panels.forEach((p) => { p.src = src; });
    renderThumbs();
    redraw();
    $('status').textContent = 'Every panel now shows the same photo.';
  });
  $('artBtn').addEventListener('click', () => {
    state.panels[state.selected].src = 'art';
    renderThumbs();
    redraw();
  });

  preview.addEventListener('click', (e) => {
    const rect = preview.getBoundingClientRect();
    const size = SIZES[state.size];
    const px = ((e.clientX - rect.left) / rect.width) * size.w;
    const py = ((e.clientY - rect.top) / rect.height) * size.h;
    const hit = panelAt(state, px, py, size.w, size.h);
    if (hit >= 0) {
      state.selected = hit;
      renderPanelSelect();
      redraw();
    }
  });

  $('exportBtn').addEventListener('click', () => {
    const size = SIZES[state.size];
    const dataUrl = exportCoverPNG();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'sunset-strip-cover-' + size.w + 'x' + size.h + '.png';
    a.click();
    $('status').textContent = 'Saved a ' + size.label + ' PNG. Share it anywhere.';
  });
}

async function boot() {
  bindControls();
  ensurePanels();
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), {
      state, addPhoto, redraw, renderThumbs,
    });
  } else {
    await addPhoto('Pier', 'samples/pier.jpg');
    await addPhoto('Boulevard', 'samples/boulevard.jpg');
    state.panels[0].src = 0;
    state.panels[1].src = 1;
    state.panels[2].src = 'art';
    renderThumbs();
    redraw();
  }
}

boot();
