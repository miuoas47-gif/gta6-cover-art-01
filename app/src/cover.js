// Vice City Nights cover renderer: multi-panel poster art with a colour grade and
// bold caption lettering. Pure canvas drawing — no network, no libraries.
// A panel is { img, zoom, x, y }: zoom scales the cover-fit photo, x/y shift it
// within its frame (-1..1). State: { w, h, layout, grade, caption, subtitle,
// captionScale, captionPos, outline, panels[] }.

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

export const GRADES = {
  sunset: { top: 'rgba(255,122,61,0.28)', bottom: 'rgba(214,32,120,0.55)', band: 'rgba(30,8,40,0.55)', noir: false },
  neon: { top: 'rgba(0,229,255,0.22)', bottom: 'rgba(255,46,136,0.55)', band: 'rgba(8,8,38,0.6)', noir: false },
  noir: { top: 'rgba(0,0,0,0.35)', bottom: 'rgba(0,0,0,0.6)', band: 'rgba(0,0,0,0.65)', noir: true },
  vice: { top: 'rgba(255,46,136,0.25)', bottom: 'rgba(0,180,180,0.45)', band: 'rgba(24,4,36,0.55)', noir: false },
};

/** Panel rectangles (fractions of w/h) for each layout, with thin white gutters. */
export function panelRects(layout, w, h) {
  const g = Math.max(4, Math.round(w * 0.008)); // gutter in px
  const full = { x: 0, y: 0, w, h };
  if (layout === '1') return [full];
  if (layout === '2') {
    const half = (w - g) / 2;
    return [
      { x: 0, y: 0, w: half, h },
      { x: half + g, y: 0, w: half, h },
    ];
  }
  if (layout === '3') {
    const left = Math.round(w * 0.58);
    const right = w - left - g;
    const halfH = (h - g) / 2;
    return [
      { x: 0, y: 0, w: left, h },
      { x: left + g, y: 0, w: right, h: halfH },
      { x: left + g, y: halfH + g, w: right, h: halfH },
    ];
  }
  const halfW = (w - g) / 2;
  const halfH = (h - g) / 2;
  return [
    { x: 0, y: 0, w: halfW, h: halfH },
    { x: halfW + g, y: 0, w: halfW, h: halfH },
    { x: 0, y: halfH + g, w: halfW, h: halfH },
    { x: halfW + g, y: halfH + g, w: halfW, h: halfH },
  ];
}

/** Draws one photo cover-fit into a rect, honouring zoom and x/y offsets. */
export function drawPanelPhoto(ctx, img, rect, zoom, ox, oy) {
  if (!img) return;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * (zoom || 1);
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - pw) / 2 + (ox || 0) * (pw - rect.w) * 0.5;
  const dy = rect.y + (rect.h - ph) / 2 + (oy || 0) * (ph - rect.h) * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, pw, ph);
  ctx.restore();
}

/** Wraps text into lines that fit maxWidth at the given font. */
export function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

/** Bold display lettering for the caption, with optional black outline and glow. */
export function drawCaption(ctx, state, w, h) {
  const caption = (state.caption || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  if (!caption && !subtitle) return;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const scale = state.captionScale || 1;
  const bandH = h * (caption ? 0.26 : 0.14) * Math.min(scale, 1.2) + (subtitle ? h * 0.05 : 0);
  const top = state.captionPos === 'top';
  const bandY = top ? 0 : h - bandH;
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  if (top) {
    band.addColorStop(0, grade.band);
    band.addColorStop(1, 'rgba(0,0,0,0)');
  } else {
    band.addColorStop(0, 'rgba(0,0,0,0)');
    band.addColorStop(1, grade.band);
  }
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, bandH);

  const cx = w / 2;
  let size = h * 0.115 * scale;
  const font = (s) => `${s}px "Archivo Black", "Arial Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let lines = [];
  if (caption) {
    ctx.font = font(size);
    while (size > 14) {
      lines = wrapLines(ctx, caption, w * 0.92);
      if (lines.length <= 2) break;
      size -= 4;
      ctx.font = font(size);
    }
    lines = wrapLines(ctx, caption, w * 0.92);
  }
  const lineH = size * 1.05;
  const subSize = Math.max(14, h * 0.028 * scale);
  // Block: caption lines, then the subtitle tucked just under them. Anchor the
  // whole block inside the canvas so the subtitle can never slip past the edge.
  const totalH = lines.length * lineH + (subtitle ? subSize * 1.5 : 0);
  const blockTop = top ? bandY + h * 0.02 : h - h * 0.03 - totalH;
  let y = blockTop + lineH / 2;
  ctx.font = font(size);
  for (const line of lines) {
    ctx.save();
    ctx.shadowColor = 'rgba(255,46,136,0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.04;
    if (state.outline !== false) {
      ctx.lineWidth = Math.max(2, size * 0.14);
      ctx.strokeStyle = '#14091f';
      ctx.lineJoin = 'round';
      ctx.strokeText(line, cx, y);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, cx, y);
    ctx.restore();
    y += lineH;
  }
  if (subtitle) {
    ctx.font = `700 ${subSize}px system-ui, sans-serif`;
    ctx.fillStyle = '#ffd9a0';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = subSize * 0.3;
    // Centre the subtitle in the space reserved for it directly under the
    // last caption line (blockTop + all caption lines + half the subtitle).
    ctx.fillText(subtitle.toUpperCase(), cx, blockTop + lines.length * lineH + subSize * 0.75);
    ctx.shadowBlur = 0;
  }
}

/** Draws the whole cover onto canvas (resized to the state's size) and returns it. */
export function drawCover(canvas, state) {
  const w = state.w;
  const h = state.h;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#ffffff'; // gutters read as white poster seams
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout || '1', w, h);
  const panels = state.panels || [];
  rects.forEach((rect, i) => {
    const p = panels[i] || {};
    if (p.img) {
      drawPanelPhoto(ctx, p.img, rect, p.zoom, p.x, p.y);
      if (grade.noir) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.w, rect.h);
        ctx.clip();
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = '#808080';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.restore();
      }
    } else {
      // Empty panel: deep violet placeholder with a thin frame.
      ctx.fillStyle = '#2b1838';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = Math.max(2, w * 0.003);
      ctx.strokeRect(rect.x + ctx.lineWidth, rect.y + ctx.lineWidth, rect.w - 2 * ctx.lineWidth, rect.h - 2 * ctx.lineWidth);
    }
    const tint = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    tint.addColorStop(0, grade.top);
    tint.addColorStop(1, grade.bottom);
    ctx.fillStyle = tint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    // Vignette to pull the eye to the middle of each panel.
    const vig = ctx.createRadialGradient(
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(10,0,20,0.35)');
    ctx.fillStyle = vig;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  });
  drawCaption(ctx, state, w, h);
  return canvas;
}
