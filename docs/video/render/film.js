import { shots, duration } from './sequence.js';

const canvas = document.querySelector('#film');
const ctx = canvas.getContext('2d', { alpha: false });
const playButton = document.querySelector('#play');
const renderButton = document.querySelector('#render');
const progress = document.querySelector('#progress');
const timeLabel = document.querySelector('#time');
const status = document.querySelector('#status');
const finished = document.querySelector('#finished');
const download = document.querySelector('#download');
const W = canvas.width, H = canvas.height;
const palette = { ink: '#15241e', cream: '#f7efe2', accent: '#d9b987' };
const audio = new AudioContext({ sampleRate: 48000 });
const destination = audio.createMediaStreamDestination();
const master = audio.createGain();
master.connect(destination); master.connect(audio.destination);
let images, voices, active = [], playing = false, recording = false, offset = 0, anchor = 0, frame = 0, recorder;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = url;
  });
}
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => 1 - Math.pow(1 - clamp(x), 3);
const smooth = x => { const p = clamp(x); return p * p * (3 - 2 * p); };

function picture(shot, t, opacity = 1) {
  const image = images[shot.sheet];
  const col = shot.panel % 2, row = Math.floor(shot.panel / 2);
  const sw = image.width / 2 - 10, sh = image.height / 2 - 10;
  const sx = col * image.width / 2 + 5, sy = row * image.height / 2 + 5;
  const p = smooth((t - shot.start) / (shot.end - shot.start));
  const zoom = shot.zoom[0] + (shot.zoom[1] - shot.zoom[0]) * p;
  const scale = Math.max(W / sw, H / sh) * zoom;
  const dw = sw * scale, dh = sh * scale;
  const drift = (p - .5) * 12 * (shot.panel % 2 ? -1 : 1);
  ctx.globalAlpha = opacity;
  ctx.drawImage(image, sx, sy, sw, sh, (W - dw) / 2 + drift, (H - dh) / 2, dw, dh);
  ctx.globalAlpha = 1;
}

function title(shot, t) {
  const local = t - shot.start;
  const visibility = ease((local - .35) / .6) * smooth((shot.end - t) / .7);
  if (visibility <= 0) return;
  const gradient = ctx.createLinearGradient(0, H * .48, 0, H);
  gradient.addColorStop(0, 'rgba(21,36,30,0)');
  gradient.addColorStop(1, 'rgba(21,36,30,.78)');
  ctx.globalAlpha = visibility; ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, H);
  const closing = shot === shots.at(-1);
  const sizes = closing ? [94, 48] : [70, 70];
  const lines = shot.title;
  const y0 = H - 178;
  for (let line = 0; line < lines.length; line++) {
    ctx.font = `${sizes[line]}px Georgia, serif`;
    let x = 100;
    const words = lines[line].split(' ');
    words.forEach((word, wordIndex) => {
      const arrival = ease((local - .4 - line * .22 - wordIndex * .075) / .7);
      ctx.globalAlpha = visibility * arrival;
      ctx.fillStyle = palette.cream;
      ctx.fillText(word, x, y0 + line * 86 + (1 - arrival) * 34);
      x += ctx.measureText(word + ' ').width;
    });
  }
  ctx.globalAlpha = visibility;
  ctx.fillStyle = palette.accent;
  ctx.fillRect(100, H - 55, 115 * ease((local - .9) / .8), 3);
  ctx.globalAlpha = 1;
}

function draw(t) {
  const i = Math.max(0, shots.findIndex(s => t < s.end));
  const shot = t >= duration ? shots.at(-1) : shots[i];
  picture(shot, t);
  if (i > 0 && t - shot.start < .65) picture(shots[i - 1], shots[i - 1].end, 1 - smooth((t - shot.start) / .65));
  title(shot, t);
  const fade = t < .5 ? 1 - smooth(t / .5) : t > 59.4 ? smooth((t - 59.4) / .6) : 0;
  if (fade) { ctx.globalAlpha = fade; ctx.fillStyle = palette.ink; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  progress.value = t;
  timeLabel.value = `00:${String(Math.floor(Math.min(t, 59))).padStart(2, '0')} / 01:00`;
}

function stopAudio() { active.forEach(node => { try { node.stop(); } catch {} }); active = []; }
function scheduleAudio(from) {
  const now = audio.currentTime + .04;
  shots.forEach((shot, i) => {
    const start = shot.start + .8;
    const rate = Math.max(1, voices[i].duration / (shot.end - start - .5));
    const end = start + voices[i].duration / rate;
    if (end <= from) return;
    const source = audio.createBufferSource(); source.buffer = voices[i]; source.playbackRate.value = rate;
    const gain = audio.createGain(); gain.gain.value = .9; source.connect(gain).connect(master);
    source.start(now + Math.max(0, start - from), Math.max(0, from - start) * rate);
    active.push(source);
  });
  const notes = [130.81, 164.81, 196, 220, 164.81, 146.83, 196, 174.61];
  for (let beat = Math.ceil(from / 1.5); beat < 40; beat++) {
    const when = now + beat * 1.5 - from;
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = 'sine'; osc.frequency.value = notes[beat % notes.length] * (beat % 4 === 0 ? 1 : 2);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(.022, when + .035);
    gain.gain.exponentialRampToValueAtTime(.0001, when + 1.4);
    osc.connect(gain).connect(master); osc.start(when); osc.stop(when + 1.45); active.push(osc);
  }
}

function tick() {
  const t = Math.min(duration, offset + audio.currentTime - anchor);
  draw(t);
  if (recording) status.textContent = `Rendering in browser… ${Math.floor(t)} / 60 seconds`;
  if (t >= duration) {
    playing = false; stopAudio(); playButton.textContent = 'Play preview'; offset = 0;
    if (recording) recorder.stop();
    return;
  }
  frame = requestAnimationFrame(tick);
}

async function begin() {
  await audio.resume();
  canvas.hidden = false; finished.hidden = true;
  scheduleAudio(offset); anchor = audio.currentTime; playing = true; playButton.textContent = 'Pause';
  tick();
}

playButton.addEventListener('click', async () => {
  if (playing) { offset += audio.currentTime - anchor; playing = false; cancelAnimationFrame(frame); stopAudio(); playButton.textContent = 'Play preview'; }
  else await begin();
});
progress.addEventListener('input', () => {
  cancelAnimationFrame(frame); stopAudio(); playing = false; offset = Number(progress.value);
  draw(offset); playButton.textContent = 'Play preview';
});

renderButton.addEventListener('click', async () => {
  try {
    cancelAnimationFrame(frame); stopAudio(); offset = 0; playing = false;
    await audio.resume();
    const stream = canvas.captureStream(30);
    destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
    const mime = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus'].find(type => MediaRecorder.isTypeSupported(type));
    recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 9000000, audioBitsPerSecond: 192000 });
    const chunks = [];
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = async () => {
      recording = false; status.textContent = 'Saving the browser render…';
      const response = await fetch('/render', { method: 'POST', headers: { 'Content-Type': recorder.mimeType }, body: new Blob(chunks, { type: recorder.mimeType }) });
      if (!response.ok) throw new Error(await response.text());
      const result = await response.json();
      finished.src = result.url + '?v=' + Date.now(); finished.hidden = false; canvas.hidden = true;
      download.href = result.url; download.download = result.filename; download.hidden = false;
      download.textContent = result.filename.endsWith('.mp4') ? 'Download MP4' : 'Download WebM';
      status.textContent = 'Rendered: 60 seconds · 1920 × 1080 · 30 fps · narration + music';
      playButton.disabled = false; renderButton.disabled = false; progress.disabled = false;
      stream.getVideoTracks().forEach(track => track.stop());
    };
    playButton.disabled = true; renderButton.disabled = true; progress.disabled = true;
    recording = true; recorder.start(1000); await begin();
  } catch (error) { status.textContent = 'Render error: ' + error.message; }
});

try {
  images = await Promise.all(['/sheet-a.png', '/sheet-b.png'].map(loadImage));
  voices = await Promise.all(shots.map(async (_, i) => audio.decodeAudioData(await (await fetch(`/voice-${i + 1}.wav`)).arrayBuffer())));
  draw(0); playButton.disabled = false; renderButton.disabled = false;
  status.textContent = 'Ready: 8 scenes · 60 seconds · group and individual exploration · animated titles';
} catch (error) { status.textContent = 'Could not load film assets: ' + error.message; }
