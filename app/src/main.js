// Vice City Nights editor wiring: layout, per-panel photos with crop controls,
// caption and grade, live preview, PNG export. ?shot= scenes live in shots.js.
import { drawCover, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const $ = (id) => document.getElementById(id);
const captionEl = $('caption');
const subtitleEl = $('subtitle');
const statusEl = $('status');

const state = {
  w: 1080,
  h: 1080,
  layout: '1',
  grade: 'sunset',
  caption: captionEl.value,
  subtitle: subtitleEl.value,
  captionScale: 1,
  captionPos: 'bottom',
  outline: true,
  panels: [{ img: null, zoom: 1, x: 0, y: 0 }],
};
let activePanel = 0;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + url));
    img.src = url;
  });
}

function panelCount() {
  return state.layout === '1' ? 1 : Number(state.layout);
}

function ensurePanels() {
  while (state.panels.length < panelCount()) state.panels.push({ img: null, zoom: 1, x: 0, y: 0 });
  state.panels.length = panelCount();
  if (activePanel >= panelCount()) activePanel = 0;
}

function redraw() {
  drawCover(canvas, state);
}

function syncPanelTabs() {
  const tabs = $('panelTabs');
  tabs.textContent = '';
  state.panels.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'Panel ' + (i + 1);
    b.setAttribute('aria-pressed', String(i === activePanel));
    b.addEventListener('click', () => {
      activePanel = i;
      syncPanelControls();
      syncPanelTabs();
    });
    tabs.appendChild(b);
  });
  $('panelLabel').textContent = String(activePanel + 1);
}

function syncPanelControls() {
  const p = state.panels[activePanel];
  $('zoom').value = p.zoom;
  $('posx').value = p.x;
  $('posy').value = p.y;
}

function syncLayoutButtons() {
  document.querySelectorAll('#layoutSeg button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.layout === state.layout));
  });
}

function setLayout(layout) {
  state.layout = layout;
  ensurePanels();
  syncLayoutButtons();
  syncPanelTabs();
  syncPanelControls();
  redraw();
}

function setSize(key) {
  const [w, h] = SIZES[key] || SIZES['1080x1080'];
  state.w = w;
  state.h = h;
  redraw();
}

document.querySelectorAll('#layoutSeg button').forEach((b) => {
  b.addEventListener('click', () => setLayout(b.dataset.layout));
});
$('size').addEventListener('change', (e) => setSize(e.target.value));
$('grade').addEventListener('change', (e) => { state.grade = e.target.value; redraw(); });
$('capPos').addEventListener('change', (e) => { state.captionPos = e.target.value; redraw(); });
$('outline').addEventListener('change', (e) => { state.outline = e.target.checked; redraw(); });
$('capSize').addEventListener('input', (e) => { state.captionScale = Number(e.target.value); redraw(); });
captionEl.addEventListener('input', () => { state.caption = captionEl.value; redraw(); });
subtitleEl.addEventListener('input', () => { state.subtitle = subtitleEl.value; redraw(); });

$('photo').addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  try {
    state.panels[activePanel].img = await loadImage(URL.createObjectURL(file));
    statusEl.textContent = 'Photo loaded into panel ' + (activePanel + 1) + '.';
    redraw();
  } catch {
    statusEl.textContent = 'That file could not be read as an image.';
  }
  e.target.value = '';
});

document.querySelectorAll('.sample').forEach((b) => {
  b.addEventListener('click', async () => {
    try {
      state.panels[activePanel].img = await loadImage('samples/' + b.dataset.sample + '.jpg');
      statusEl.textContent = 'Sample photo loaded into panel ' + (activePanel + 1) + '.';
      redraw();
    } catch {
      statusEl.textContent = 'Sample photo failed to load.';
    }
  });
});

$('fillAll').addEventListener('click', () => {
  const src = state.panels[activePanel];
  if (!src.img) { statusEl.textContent = 'Load a photo into this panel first.'; return; }
  state.panels.forEach((p) => { p.img = src.img; });
  statusEl.textContent = 'Same photo in every panel — crop each one differently.';
  redraw();
});

$('zoom').addEventListener('input', (e) => { state.panels[activePanel].zoom = Number(e.target.value); redraw(); });
$('posx').addEventListener('input', (e) => { state.panels[activePanel].x = Number(e.target.value); redraw(); });
$('posy').addEventListener('input', (e) => { state.panels[activePanel].y = Number(e.target.value); redraw(); });

$('export').addEventListener('click', () => {
  redraw();
  canvas.toBlob((blob) => {
    if (!blob) { statusEl.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vice-city-nights-' + state.w + 'x' + state.h + '.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusEl.textContent = 'Saved ' + a.download + '.';
  }, 'image/png');
});

// Applies a shot scene's state onto the editor (used by shots.js).
export function applyShotScene(scene) {
  if (scene.layout) setLayout(scene.layout);
  if (scene.size) { $('size').value = scene.size; setSize(scene.size); }
  if (scene.grade) { $('grade').value = scene.grade; state.grade = scene.grade; }
  if (scene.caption !== undefined) { captionEl.value = scene.caption; state.caption = scene.caption; }
  if (scene.subtitle !== undefined) { subtitleEl.value = scene.subtitle; state.subtitle = scene.subtitle; }
  if (scene.captionPos) { $('capPos').value = scene.captionPos; state.captionPos = scene.captionPos; }
  if (scene.photos) {
    scene.photos.forEach((img, i) => {
      if (state.panels[i]) { state.panels[i].img = img; state.panels[i].zoom = 1.15; }
    });
  }
  redraw();
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, { loadImage, applyShotScene, state });
} else {
  ensurePanels();
  syncLayoutButtons();
  syncPanelTabs();
  syncPanelControls();
  redraw();
}
