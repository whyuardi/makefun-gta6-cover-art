// Vice Cover Studio — the cover renderer. Draws a multi-panel GTA-style poster
// (photo collage + sunset/neon sky + big condensed caption) onto any canvas at
// any size. Every decorative shape (sun, palms, skyline) is drawn here in code;
// no Rockstar logo, wordmark, artwork, character or font is used anywhere.

/** Colour grades: sky stops, sun colours, caption ink and accent. */
export const GRADES = {
  sunset: {
    name: 'Sunset',
    sky: ['#2a1052', '#a4136b', '#ff2e88', '#ff7a3d', '#ffc53d'],
    sun: ['#fff3b0', '#ffd23f', '#ff7a3d'],
    caption: '#ffffff',
    outline: '#ff2e88',
    band: 'rgba(26, 5, 40, 0.74)',
    accent: '#00e5ff',
    palm: '#200a33',
    skyline: '#1c0730',
  },
  neon: {
    name: 'Neon Night',
    sky: ['#05081f', '#1b0f4a', '#6d1fae', '#ff2ea6', '#00e5ff'],
    sun: ['#ffe9fb', '#ff7ad9', '#ff2ea6'],
    caption: '#ffffff',
    outline: '#00e5ff',
    band: 'rgba(4, 6, 28, 0.78)',
    accent: '#ffea00',
    palm: '#04081f',
    skyline: '#070b2a',
  },
  pastel: {
    name: 'Vice Pastel',
    sky: ['#7b5cff', '#ff8fd1', '#ffb347', '#ffe9a8'],
    sun: ['#ffffff', '#ffd6e8', '#ff9ecf'],
    caption: '#2b1055',
    outline: '#ffffff',
    band: 'rgba(255, 255, 255, 0.55)',
    accent: '#ff2e88',
    palm: '#3d2b63',
    skyline: '#4a2a6e',
  },
};

/** Panel layouts. Each panel is a fraction of the photo area (x, y, w, h). */
export const LAYOUTS = {
  hero: {
    name: 'Hero + 2',
    panels: [
      { x: 0, y: 0, w: 0.612, h: 1 },
      { x: 0.632, y: 0, w: 0.368, h: 0.49 },
      { x: 0.632, y: 0.51, w: 0.368, h: 0.49 },
    ],
  },
  grid: {
    name: '2 x 2 Grid',
    panels: [
      { x: 0, y: 0, w: 0.49, h: 0.49 },
      { x: 0.51, y: 0, w: 0.49, h: 0.49 },
      { x: 0, y: 0.51, w: 0.49, h: 0.49 },
      { x: 0.51, y: 0.51, w: 0.49, h: 0.49 },
    ],
  },
  trio: {
    name: '3 Columns',
    panels: [
      { x: 0, y: 0, w: 0.32, h: 1 },
      { x: 0.34, y: 0, w: 0.32, h: 1 },
      { x: 0.68, y: 0, w: 0.32, h: 1 },
    ],
  },
};

/** Export sizes offered by the editor: label and pixel dimensions. */
export const SIZES = {
  square: { label: '1080 x 1080 (square post)', w: 1080, h: 1080 },
  portrait: { label: '1080 x 1350 (portrait post)', w: 1080, h: 1350 },
  wide: { label: '1920 x 1080 (wide post)', w: 1920, h: 1080 },
};

/** Draws a synthwave sun: a gradient disc cut by horizontal slats near its base. */
export function drawSun(ctx, cx, cy, r, colors) {
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, colors[0]);
  g.addColorStop(0.55, colors[1]);
  g.addColorStop(1, colors[2] ?? colors[1]);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Slats: erase widening horizontal bands across the lower half.
  ctx.globalCompositeOperation = 'destination-out';
  let y = cy + r * 0.05;
  let thick = r * 0.03;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, thick);
    y += thick + r * 0.14;
    thick *= 1.6;
  }
  ctx.restore();
}

/** Draws a palm silhouette: a curved trunk with drooping fronds. */
export function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.12, y - s * 0.55, x + s * 0.3, y - s * 0.95);
  ctx.stroke();
  const tx = x + s * 0.3;
  const ty = y - s * 0.95;
  for (let i = 0; i < 7; i++) {
    const a = (-160 + i * 32) * Math.PI / 180;
    const len = s * (0.42 - Math.abs(i - 3) * 0.03);
    ctx.lineWidth = Math.max(1.5, s * 0.035);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(
      tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.6 - s * 0.1,
      tx + Math.cos(a) * len, ty + Math.sin(a) * len + s * 0.22,
    );
    ctx.stroke();
  }
  ctx.restore();
}

/** Draws a city skyline silhouette: deterministic buildings from a seed. */
export function drawSkyline(ctx, x, y, w, h, color, seed) {
  ctx.save();
  ctx.fillStyle = color;
  let bx = x;
  let n = 0;
  while (bx < x + w) {
    const rnd = Math.abs(Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453) % 1;
    const bw = w * (0.05 + rnd * 0.06);
    const bh = h * (0.35 + rnd * 0.6);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    if (rnd > 0.72) ctx.fillRect(bx + bw * 0.32, y + h - bh - h * 0.18, bw * 0.36, h * 0.18);
    bx += bw + w * 0.012;
    n++;
  }
  ctx.restore();
}

/** Draws the mini sunset scene used by an "art" panel (no photo): sky, sun, skyline, palms. */
export function drawArtPanel(ctx, px, py, pw, ph, grade) {
  const g = ctx.createLinearGradient(0, py, 0, py + ph);
  grade.sky.forEach((c, i) => g.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(px, py, pw, ph);
  drawSun(ctx, px + pw * 0.5, py + ph * 0.42, Math.min(pw, ph) * 0.3, grade.sun);
  drawSkyline(ctx, px, py + ph * 0.62, pw, ph * 0.38, grade.skyline, 7);
  drawPalm(ctx, px + pw * 0.1, py + ph * 0.98, Math.min(pw, ph) * 0.42, grade.palm);
  drawPalm(ctx, px + pw * 0.92, py + ph * 0.98, Math.min(pw, ph) * 0.34, grade.palm);
}

/** Cover-fits `img` into a panel rect, with a zoom factor and a pan offset. */
export function drawPhotoPanel(ctx, img, px, py, pw, ph, zoom, panX, panY) {
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * (zoom || 1);
  const dw = img.naturalWidth * base;
  const dh = img.naturalHeight * base;
  ctx.drawImage(img, px + (pw - dw) / 2 + panX * pw, py + (ph - dh) / 2 + panY * ph, dw, dh);
}

/** Returns the panel rectangles (pixels) for a layout inside the photo area. */
export function panelRects(layout, area) {
  return LAYOUTS[layout].panels.map((p) => ({
    x: area.x + p.x * area.w,
    y: area.y + p.y * area.h,
    w: p.w * area.w,
    h: p.h * area.h,
  }));
}

/** Returns the photo area (pixels) for a caption position, given the canvas size. */
export function photoAreaFor(w, h, captionPos) {
  const bandH = h * (captionPos === 'top' ? 0 : 0.235);
  const area = { x: w * 0.022, y: h * 0.022, w: w * 0.956, h: h - bandH - h * 0.044 };
  if (captionPos === 'top') area.y = bandH + h * 0.022;
  return area;
}

/**
 * Draws the whole cover onto `canvas` at the canvas's own size.
 * state: { photos, panels, layout, grade, caption, sub, captionSize,
 *   captionPos ('top'|'bottom'), outline, italic }
 * A panel is { photo, zoom, dx, dy }; photo -1 means the drawn sunset art,
 * otherwise an index into state.photos.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const u = Math.min(w, h) / 1080; // scale unit for strokes and type

  // Sky backdrop for the whole poster.
  const sky = ctx.createLinearGradient(0, 0, w * 0.25, h);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const bandH = h * (state.captionPos === 'top' ? 0 : 0.235);
  const photoArea = photoAreaFor(w, h, state.captionPos);

  // Photo panels with thick white poster borders.
  const rects = panelRects(state.layout, photoArea);
  rects.forEach((r, i) => {
    const panel = state.panels[i] ?? { photo: -1, zoom: 1, dx: 0, dy: 0 };
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    const img = panel.photo >= 0 ? state.photos[panel.photo] : null;
    if (img) {
      drawPhotoPanel(ctx, img, r.x, r.y, r.w, r.h, panel.zoom, panel.dx, panel.dy);
    } else {
      drawArtPanel(ctx, r.x, r.y, r.w, r.h, grade);
    }
    // Warm grade wash over photos so panels sit in the same sunset.
    const wash = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    wash.addColorStop(0, 'rgba(255, 122, 61, 0)');
    wash.addColorStop(1, 'rgba(255, 46, 136, 0.22)');
    ctx.fillStyle = wash;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.restore();
    ctx.lineWidth = Math.max(4, 7 * u);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.lineWidth = Math.max(1, 1.5 * u);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  });

  // Caption band: sun, skyline and palms behind the lettering.
  const bandY = state.captionPos === 'top' ? 0 : h - bandH;
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, bandY, w, bandH);
  const bandTop = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  bandTop.addColorStop(0, 'rgba(255,255,255,0.10)');
  bandTop.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = bandTop;
  ctx.fillRect(0, bandY, w, bandH);
  drawSun(ctx, w * 0.86, bandY + bandH * 0.52, bandH * 0.46, grade.sun);
  drawSkyline(ctx, 0, bandY + bandH * 0.55, w, bandH * 0.45, grade.skyline, 3);
  drawPalm(ctx, w * 0.045, bandY + bandH * 1.02, bandH * 0.62, grade.palm);
  drawPalm(ctx, w * 0.955, bandY + bandH * 1.02, bandH * 0.55, grade.palm);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, bandY, w, Math.max(3, 5 * u));

  // Big condensed caption, fitted to the band width.
  const text = (state.caption || '').trim().toUpperCase();
  const sub = (state.sub || '').trim().toUpperCase();
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (state.italic) ctx.transform(1, 0, -0.07, 1, w * 0.035, 0);
  const cx = w * 0.5;
  if (text) {
    let size = bandH * 0.52 * (state.captionSize || 1);
    const setFont = (s) => {
      ctx.font = `900 ${s}px 'Arial Narrow', 'Helvetica Neue', Impact, 'Franklin Gothic Medium', sans-serif`;
      try { ctx.letterSpacing = `${Math.max(1, s * 0.02)}px`; } catch { /* older canvas */ }
    };
    setFont(size);
    while (ctx.measureText(text).width > w * 0.88 && size > 14) {
      size -= 2;
      setFont(size);
    }
    const ty = bandY + bandH * (sub ? 0.42 : 0.52);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.05;
    if (state.outline) {
      ctx.lineWidth = Math.max(2, size * 0.14);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = grade.outline;
      ctx.strokeText(text, cx, ty);
    }
    ctx.fillStyle = grade.caption;
    ctx.fillText(text, cx, ty);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  if (sub) {
    const subSize = Math.max(12, bandH * 0.13);
    ctx.font = `700 ${subSize}px 'Arial Narrow', 'Helvetica Neue', Impact, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, subSize * 0.28)}px`; } catch { /* older canvas */ }
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub, cx, bandY + bandH * 0.82);
  }
  ctx.restore();

  // Corner tag so the poster reads as a finished cover.
  ctx.save();
  ctx.font = `700 ${Math.max(11, 15 * u)}px 'Arial Narrow', sans-serif`;
  try { ctx.letterSpacing = '3px'; } catch { /* older canvas */ }
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText('★ VICE COVER STUDIO', w * 0.03, h * 0.022 + Math.max(11, 15 * u));
  ctx.restore();
}
