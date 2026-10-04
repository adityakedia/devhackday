import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));
const files = new Map([
  ['/', ['index.html', 'text/html']],
  ['/watch', ['watch.html', 'text/html']],
  ['/film.js', ['film.js', 'text/javascript']],
  ['/sequence.js', ['sequence.js', 'text/javascript']],
  ['/sheet-a.png', ['../v5-01-individual-and-shared-discovery.png', 'image/png']],
  ['/sheet-b.png', ['../v5-02-group-exploration-and-experiences.png', 'image/png']],
  ['/combo-film.mp4', ['combo-film.mp4', 'video/mp4']],
  ['/combo-film.webm', ['combo-film.webm', 'video/webm']],
]);
for (let i = 1; i <= 8; i++) files.set(`/voice-${i}.wav`, [`assets/voice-${i}.wav`, 'audio/wav']);

createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (req.method === 'POST' && path === '/render') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const mp4 = req.headers['content-type']?.startsWith('video/mp4');
      const filename = `combo-film.${mp4 ? 'mp4' : 'webm'}`;
      await writeFile(root + filename, Buffer.concat(chunks));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ url: '/' + filename, filename }));
      console.log('Browser-rendered video saved: ' + root + filename);
      return;
    }
    const entry = files.get(path);
    if (!entry) { res.writeHead(404); res.end(); return; }
    const full = root + entry[0];
    if ((path.endsWith('.mp4') || path.endsWith('.webm')) && req.headers.range) {
      const size = (await stat(full)).size;
      const [startText, endText] = req.headers.range.replace('bytes=', '').split('-');
      const start = Number(startText);
      const end = endText ? Number(endText) : size - 1;
      res.writeHead(206, { 'Content-Type': entry[1], 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes' });
      createReadStream(full, { start, end }).pipe(res);
      return;
    }
    const bytes = await readFile(full);
    res.writeHead(200, { 'Content-Type': entry[1], 'Content-Length': bytes.length, 'Cache-Control': 'no-store' });
    res.end(bytes);
  } catch (error) {
    console.error(error.message);
    res.writeHead(500); res.end(error.message);
  }
}).listen(3187, '127.0.0.1', () => console.log('Video renderer: http://127.0.0.1:3187/'));
