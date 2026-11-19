// Vice Cover Studio — wires the editor: photos in, caption in, PNG out.
// Photos are read on this machine only (file input or the built-in samples)
// and never uploaded anywhere. A `?shot=` query sets up a fixed scene for a
// screenshot instead (./shots.js).
import { drawCover, panelRects, photoAreaFor, GRADES, LAYOUTS, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const $ = (id) => document.getElementById(id);

/** The editor state: photos are Image objects, panels point at them (or -1 = art). */
const state = {
  layout: 'hero',
  grade: 'sunset',
  caption: 'Vice Heist',
  sub: 'Sunset Strip',
  captionSize: 1,
  captionPos: 'bottom',
  outline: true,
  italic: true,
  photos: [],
  photoNames: [],
  panels: [
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
    { photo: 1, zoom: 1, dx: 0, dy: 0 },
    { photo: -1, zoom: 1, dx: 0, dy: 0 },
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
  ],
};
let selectedPanel = 0;
let sizeKey = 'square';
let coverOnlyMode = false;

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Sizes the preview canvas to the chosen export aspect (capped for the screen). */
function sizePreview() {
  const size = SIZES[sizeKey];
  const scale = Math.min(1, 860 / Math.max(size.w, size.h));
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
}

/** Draws the live preview, then outlines the selected panel on top of it. */
function redraw() {
  drawCover(canvas, state);
  if (coverOnlyMode) return; // a bare cover shot carries no editor chrome
  const rects = panelRects(state.layout, photoAreaFor(canvas.width, canvas.height, state.captionPos));
  const r = rects[selectedPanel];
  if (r) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.lineWidth = Math.max(3, canvas.width * 0.006);
    ctx.strokeStyle = '#00e5ff';
    ctx.setLineDash([14, 8]);
    ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    ctx.setLineDash([]);
    ctx.restore();
  }
}

/** Renders the cover at full export size and resolves to a PNG data URL. */
export function exportCoverPNG() {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    }, 'image/png');
  });
}
window.__exportCover = exportCoverPNG;
window.__coverState = state;

/** Rebuilds the photo strip: one thumbnail per photo, click to put it in the panel. */
function renderPhotoStrip() {
  const strip = $('photostrip');
  strip.innerHTML = '';
  state.photos.forEach((img, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.title = `Put “${state.photoNames[i]}” in panel ${selectedPanel + 1}`;
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = state.photoNames[i];
    btn.appendChild(thumb);
    const label = document.createElement('span');
    label.textContent = state.photoNames[i];
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      state.panels[selectedPanel].photo = i;
      syncPanelControls();
      redraw();
    });
    strip.appendChild(btn);
  });
  const art = document.createElement('button');
  art.type = 'button';
  art.className = 'thumb art';
  art.title = 'Use the drawn sunset art in this panel';
  art.textContent = '☀ Sunset art';
  art.addEventListener('click', () => {
    state.panels[selectedPanel].photo = -1;
    syncPanelControls();
    redraw();
  });
  strip.appendChild(art);
}

/** Builds the layout and grade picker buttons from cover.js. */
function buildPickers() {
  const layouts = $('layouts');
  Object.entries(LAYOUTS).forEach(([key, layout]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = layout.name;
    btn.dataset.key = key;
    btn.addEventListener('click', () => {
      state.layout = key;
      selectedPanel = 0;
      syncPickers();
      syncPanelControls();
      redraw();
    });
    layouts.appendChild(btn);
  });
  const grades = $('grades');
  Object.entries(GRADES).forEach(([key, grade]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = grade.name;
    btn.dataset.key = key;
    btn.addEventListener('click', () => {
      state.grade = key;
      syncPickers();
      redraw();
    });
    grades.appendChild(btn);
  });
  const sizes = $('size');
  Object.entries(SIZES).forEach(([key, size]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = size.label;
    sizes.appendChild(opt);
  });
}

function syncPickers() {
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('on', b.dataset.key === state.layout));
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b.dataset.key === state.grade));
}

/** Syncs the selected-panel controls (photo select, zoom, pan) to the state. */
function syncPanelControls() {
  $('panelname').textContent = `Panel ${selectedPanel + 1} of ${panelRects(state.layout, { x: 0, y: 0, w: 1, h: 1 }).length}`;
  const panel = state.panels[selectedPanel];
  const select = $('panelphoto');
  select.innerHTML = '';
  state.photos.forEach((img, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Photo ${i + 1}: ${state.photoNames[i]}`;
    select.appendChild(opt);
  });
  const art = document.createElement('option');
  art.value = '-1';
  art.textContent = 'Drawn sunset art';
  select.appendChild(art);
  select.value = String(panel.photo);
  $('zoom').value = String(panel.zoom);
  $('zoomval').textContent = `${panel.zoom.toFixed(2)}×`;
  $('panx').value = String(panel.dx);
  $('pany').value = String(panel.dy);
  const hasPhoto = panel.photo >= 0;
  $('zoom').disabled = !hasPhoto;
  $('panx').disabled = !hasPhoto;
  $('pany').disabled = !hasPhoto;
}

/** Adds one uploaded file as a photo and puts it in the selected panel. */
async function addUpload(file) {
  const img = await loadImage(URL.createObjectURL(file));
  state.photos.push(img);
  state.photoNames.push(file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Upload');
  state.panels[selectedPanel].photo = state.photos.length - 1;
  renderPhotoStrip();
  syncPanelControls();
  redraw();
}

$('photo').addEventListener('change', async (e) => {
  for (const file of e.target.files) await addUpload(file);
  e.target.value = '';
});
$('sample-boulevard').addEventListener('click', async () => {
  state.photos.push(await loadImage('samples/boulevard.jpg'));
  state.photoNames.push('Boulevard');
  state.panels[selectedPanel].photo = state.photos.length - 1;
  renderPhotoStrip(); syncPanelControls(); redraw();
});
$('sample-pier').addEventListener('click', async () => {
  state.photos.push(await loadImage('samples/pier.jpg'));
  state.photoNames.push('Pier');
  state.panels[selectedPanel].photo = state.photos.length - 1;
  renderPhotoStrip(); syncPanelControls(); redraw();
});
$('fillall').addEventListener('click', () => {
  const first = state.panels[selectedPanel].photo;
  state.panels.forEach((p) => { p.photo = first; });
  syncPanelControls();
  redraw();
  status.textContent = 'Every panel now uses the selected photo.';
});
$('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
$('sub').addEventListener('input', (e) => { state.sub = e.target.value; redraw(); });
$('captionsize').addEventListener('input', (e) => {
  state.captionSize = Number(e.target.value);
  $('captionsizeval').textContent = `${Math.round(state.captionSize * 100)}%`;
  redraw();
});
$('captionpos').addEventListener('change', (e) => { state.captionPos = e.target.value; redraw(); });
$('outline').addEventListener('change', (e) => { state.outline = e.target.checked; redraw(); });
$('italic').addEventListener('change', (e) => { state.italic = e.target.checked; redraw(); });
$('panelphoto').addEventListener('change', (e) => {
  state.panels[selectedPanel].photo = Number(e.target.value);
  syncPanelControls();
  redraw();
});
$('zoom').addEventListener('input', (e) => {
  state.panels[selectedPanel].zoom = Number(e.target.value);
  $('zoomval').textContent = `${state.panels[selectedPanel].zoom.toFixed(2)}×`;
  redraw();
});
$('panx').addEventListener('input', (e) => { state.panels[selectedPanel].dx = Number(e.target.value); redraw(); });
$('pany').addEventListener('input', (e) => { state.panels[selectedPanel].dy = Number(e.target.value); redraw(); });
$('size').addEventListener('change', (e) => {
  sizeKey = e.target.value;
  sizePreview();
  redraw();
});
$('export').addEventListener('click', async () => {
  const size = SIZES[sizeKey];
  const dataUrl = await exportCoverPNG();
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `vice-cover-${size.w}x${size.h}.png`;
  a.click();
  status.textContent = `Saved vice-cover-${size.w}x${size.h}.png`;
});

/** Clicking the preview picks the panel under the pointer. */
canvas.addEventListener('click', (e) => {
  const box = canvas.getBoundingClientRect();
  const x = (e.clientX - box.left) * (canvas.width / box.width);
  const y = (e.clientY - box.top) * (canvas.height / box.height);
  const rects = panelRects(state.layout, photoAreaFor(canvas.width, canvas.height, state.captionPos));
  const hit = rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  if (hit >= 0) {
    selectedPanel = hit;
    syncPanelControls();
    redraw();
  }
});

/** Applies a ?shot= scene: samples in, caption/layout/grade/size set, then paint. */
async function applyShot(opts) {
  state.photos = [
    await loadImage(`samples/${opts.photo}.jpg`),
    await loadImage(`samples/${opts.photo2}.jpg`),
  ];
  state.photoNames = [opts.photo, opts.photo2];
  state.caption = opts.caption;
  state.sub = opts.sub;
  state.layout = LAYOUTS[opts.layout] ? opts.layout : 'hero';
  state.grade = GRADES[opts.grade] ? opts.grade : 'sunset';
  state.panels = [
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
    { photo: 1, zoom: 1, dx: 0, dy: 0 },
    { photo: -1, zoom: 1, dx: 0, dy: 0 },
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
  ];
  $('caption').value = state.caption;
  $('sub').value = state.sub;
  if (opts.size) {
    const [w, h] = opts.size.split('x').map(Number);
    if (w > 0 && h > 0) {
      const key = Object.keys(SIZES).find((k) => SIZES[k].w === w && SIZES[k].h === h);
      if (key) { sizeKey = key; $('size').value = key; }
    }
  }
  if (opts.coverOnly) {
    coverOnlyMode = true;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {
    sizePreview();
  }
  renderPhotoStrip();
  syncPickers();
  syncPanelControls();
  redraw();
}

buildPickers();
sizePreview();
syncPickers();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, applyShot);
} else {
  // First use works with no upload: the two built-in samples are already in.
  Promise.all([loadImage('samples/boulevard.jpg'), loadImage('samples/pier.jpg')]).then(([b, p]) => {
    state.photos = [b, p];
    state.photoNames = ['Boulevard', 'Pier'];
    renderPhotoStrip();
    syncPanelControls();
    redraw();
  });
  syncPanelControls();
  redraw();
}
