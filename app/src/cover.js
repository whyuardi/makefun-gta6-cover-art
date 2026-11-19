/* Cover drawing engine: multi-panel poster art, drawn entirely in code.
   A cover is a sky backdrop, a set of photo or drawn-art panels split by
   white gutters, and a caption band carrying a striped sun, a skyline and
   palm silhouettes. Nothing here loads a picture or a font from outside. */

export const GRADES = {
  sunset: {
    sky: ['#241543', '#7a2d6e', '#ff7a3d', '#ffb347'],
    sunCore: '#ffe9a8', sunRim: '#ff5e62', band: '#1c0b33',
    caption: '#fff6e0', accent: '#ff5e78', glow: '#ff8a3d',
    tint: 'rgba(255, 96, 50, 0.10)', artSky: ['#3a1c5c', '#ff7a3d', '#ffd76a'],
  },
  neon: {
    sky: ['#070418', '#2a0a54', '#a4136e', '#ff2e88'],
    sunCore: '#a5fbff', sunRim: '#ff2e88', band: '#0a0524',
    caption: '#eafcff', accent: '#37f5d3', glow: '#ff2e88',
    tint: 'rgba(90, 40, 255, 0.14)', artSky: ['#0b0620', '#5b1a8a', '#ff2e88'],
  },
  pastel: {
    sky: ['#8ec9ee', '#e8b7e0', '#ffc9a8', '#ffe9a8'],
    sunCore: '#fffbe0', sunRim: '#ff9ebb', band: '#274156',
    caption: '#ffffff', accent: '#ff7bac', glow: '#ffb347',
    tint: 'rgba(255, 170, 210, 0.10)', artSky: ['#aee7ff', '#ffd6ec', '#ffe9a8'],
  },
};

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  tall: { w: 1080, h: 1350, label: '1080 × 1350' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
};

/* Panel rectangles for each layout, as fractions of the poster area. */
export function layoutRects(layout, area) {
  const { x, y, w, h } = area;
  if (layout === 'grid') {
    return [
      { x, y, w: w / 2, h: h / 2 },
      { x: x + w / 2, y, w: w / 2, h: h / 2 },
      { x, y: y + h / 2, w: w / 2, h: h / 2 },
      { x: x + w / 2, y: y + h / 2, w: w / 2, h: h / 2 },
    ];
  }
  if (layout === 'cols3') {
    return [0, 1, 2].map((i) => ({ x: x + (w / 3) * i, y, w: w / 3, h }));
  }
  return [
    { x, y, w: w * 0.62, h },
    { x: x + w * 0.62, y, w: w * 0.38, h: h / 2 },
    { x: x + w * 0.62, y: y + h / 2, w: w * 0.38, h: h / 2 },
  ];
}

export function panelCount(layout) {
  return layout === 'grid' ? 4 : 3;
}

function seededRand(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function skyGradient(ctx, stops, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  return g;
}

/* A synthwave sun: a glowing disc cut by widening horizontal slits. */
export function drawStripedSun(ctx, cx, cy, r, core, rim, glow) {
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = r * 0.45;
  const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  g.addColorStop(0, core);
  g.addColorStop(0.75, rim);
  g.addColorStop(1, rim);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  let band = cy + r * 0.05;
  let thick = r * 0.045;
  ctx.globalCompositeOperation = 'destination-out';
  while (band < cy + r) {
    ctx.fillRect(cx - r, band, r * 2, thick);
    band += thick + r * 0.13;
    thick *= 1.55;
  }
  ctx.restore();
}

/* A jagged skyline with a few lit windows, silhouetted in one dark tone. */
export function drawSkyline(ctx, x, baseY, w, h, color, seed) {
  const rnd = seededRand(seed);
  ctx.fillStyle = color;
  let px = x;
  while (px < x + w) {
    const bw = w * (0.05 + rnd() * 0.09);
    const bh = h * (0.35 + rnd() * 0.65);
    ctx.fillRect(px, baseY - bh, bw, bh);
    if (rnd() > 0.55) {
      ctx.fillRect(px + bw * 0.3, baseY - bh - h * 0.16, bw * 0.4, h * 0.16);
    }
    ctx.fillStyle = 'rgba(255, 214, 106, 0.85)';
    const wins = Math.floor(rnd() * 4);
    for (let i = 0; i < wins; i++) {
      ctx.fillRect(px + bw * (0.15 + rnd() * 0.6), baseY - bh + h * 0.08 + rnd() * bh * 0.6, 2.5, 3.5);
    }
    ctx.fillStyle = color;
    px += bw + w * 0.012;
  }
}

/* One palm: a leaning trunk and seven drooping fronds. */
export function drawPalm(ctx, x, baseY, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + s * 0.12, baseY - s * 0.55, x + s * 0.3, baseY - s * 0.95);
  ctx.stroke();
  const topX = x + s * 0.3;
  const topY = baseY - s * 0.95;
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.08) - (i / 6) * Math.PI * 0.92;
    const len = s * (0.42 + (i % 3) * 0.07);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.6, topY + Math.sin(a) * len * 0.5 - s * 0.1,
      topX + Math.cos(a) * len, topY + Math.sin(a) * len + s * 0.22,
    );
    ctx.stroke();
  }
  ctx.restore();
}

/* A fully drawn sunset scene used when a panel holds no photo. */
export function drawSunsetArt(ctx, rect, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = skyGradient(ctx, grade.artSky, x, y, w, h);
  ctx.fillRect(x, y, w, h);
  const horizon = y + h * 0.66;
  ctx.fillStyle = 'rgba(20, 8, 40, 0.35)';
  ctx.fillRect(x, horizon, w, h - (horizon - y));
  drawStripedSun(ctx, x + w * 0.5, y + h * 0.42, Math.min(w, h) * 0.26, grade.sunCore, grade.sunRim, grade.glow);
  drawSkyline(ctx, x, horizon, w, h * 0.22, '#1c0b33', 7);
  drawPalm(ctx, x + w * 0.1, y + h * 0.98, h * 0.34, '#14082a');
  drawPalm(ctx, x + w * 0.88, y + h * 0.99, h * 0.28, '#14082a');
  ctx.restore();
}

function drawPhotoInto(ctx, img, rect, zoom, panX, panY) {
  const { x, y, w, h } = rect;
  const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const scale = base * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const overflowX = Math.max(0, pw - w);
  const overflowY = Math.max(0, ph - h);
  const dx = x + (w - pw) / 2 + panX * overflowX * 0.5;
  const dy = y + (h - ph) / 2 + panY * overflowY * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, pw, ph);
  ctx.restore();
}

function fitCaption(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px "Arial Black", "Segoe UI", system-ui, sans-serif`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `900 ${size}px "Arial Black", "Segoe UI", system-ui, sans-serif`;
  }
  return size;
}

/* The caption band: dark strip, striped sun, skyline, palms, big words. */
function drawCaptionBand(ctx, band, grade, caption, sub, opts) {
  const { x, y, w, h } = band;
  ctx.save();
  ctx.fillStyle = grade.band;
  ctx.globalAlpha = 0.94;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = grade.accent;
  ctx.fillRect(x, y, w, Math.max(3, h * 0.045));
  ctx.fillRect(x, y + h - Math.max(3, h * 0.045), w, Math.max(3, h * 0.045));

  const sunR = h * 0.36;
  const sunX = x + w * 0.075;
  const sunY = y + h * 0.52;
  drawStripedSun(ctx, sunX, sunY, sunR, grade.sunCore, grade.sunRim, grade.glow);
  drawPalm(ctx, x + w * 0.94, y + h * 0.96, h * 0.5, 'rgba(0,0,0,0.6)');
  drawPalm(ctx, x + w * 0.885, y + h * 0.97, h * 0.38, 'rgba(0,0,0,0.45)');

  const textX = x + w * 0.19;
  const textW = w * 0.74;
  const words = (caption || 'SUNSET HEIST').trim().toUpperCase() || 'SUNSET HEIST';
  const baseSize = h * 0.46 * (opts.captionScale || 1);
  const size = fitCaption(ctx, words, textW, baseSize);
  ctx.save();
  if (opts.slant) ctx.transform(1, 0, -0.12, 1, size * 0.12, 0);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${size}px "Arial Black", "Segoe UI", system-ui, sans-serif`;
  const ty = y + h * (sub ? 0.38 : 0.52);
  if (opts.neon) {
    ctx.strokeStyle = grade.accent;
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = size * 0.28;
    ctx.strokeText(words, textX, ty);
    ctx.shadowBlur = 0;
  } else {
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.05;
  }
  ctx.fillStyle = grade.caption;
  ctx.fillText(words, textX, ty);
  ctx.restore();

  if (sub) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const subSize = Math.max(12, h * 0.17);
    ctx.font = `600 ${subSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.fillText(sub, textX, y + h * 0.78);
    ctx.restore();
  }
  ctx.restore();
}

/* Which panel, if any, holds the point (px, py) in canvas pixels. */
export function panelAt(state, px, py, W, H) {
  const area = posterArea(W, H, state.bandTop);
  const rects = layoutRects(state.layout, area);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

export function posterArea(W, H, bandTop) {
  const bandH = H * 0.17;
  if (bandTop) return { x: 0, y: bandH, w: W, h: H - bandH };
  return { x: 0, y: 0, w: W, h: H - bandH };
}

/* Draws the whole cover for `state` onto ctx at size W x H. */
export function drawCover(ctx, state, W, H) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = skyGradient(ctx, grade.sky, 0, 0, W, H);
  ctx.fillRect(0, 0, W, H);

  const gap = Math.max(6, W * 0.012);
  const area = posterArea(W, H, state.bandTop);
  const rects = layoutRects(state.layout, area);
  const border = Math.max(4, W * 0.005);

  rects.forEach((r, i) => {
    const inset = {
      x: r.x + gap / 2, y: r.y + gap / 2,
      w: r.w - gap, h: r.h - gap,
    };
    const panel = state.panels[i] || { src: 'art', zoom: 1, panX: 0, panY: 0 };
    if (panel.src === 'art') {
      drawSunsetArt(ctx, inset, grade);
    } else {
      const photo = state.photos[panel.src];
      if (photo && photo.img) {
        drawPhotoInto(ctx, photo.img, inset, panel.zoom || 1, panel.panX || 0, panel.panY || 0);
        ctx.fillStyle = grade.tint;
        ctx.fillRect(inset.x, inset.y, inset.w, inset.h);
      } else {
        drawSunsetArt(ctx, inset, grade);
      }
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = border;
    ctx.strokeRect(inset.x, inset.y, inset.w, inset.h);
  });

  const bandH = H * 0.17;
  const band = state.bandTop
    ? { x: 0, y: 0, w: W, h: bandH }
    : { x: 0, y: H - bandH, w: W, h: bandH };
  drawCaptionBand(ctx, band, grade, state.caption, state.sub, {
    captionScale: state.captionScale || 1,
    neon: state.neon !== false,
    slant: state.slant !== false,
  });
}
