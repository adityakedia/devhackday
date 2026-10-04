import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { shots } from './sequence.js';

const run = promisify(execFile);
const root = fileURLToPath(new URL('./assets/', import.meta.url));
await mkdir(root, { recursive: true });
for (let i = 0; i < shots.length; i++) {
  const stem = `${root}voice-${i + 1}`;
  await writeFile(`${stem}.txt`, shots[i].narration);
  await run('/usr/bin/say', ['-v', 'Daniel', '-r', '157', '-f', `${stem}.txt`, '-o', `${stem}.aiff`]);
  await run('/usr/bin/afconvert', ['-f', 'WAVE', '-d', 'LEI16', `${stem}.aiff`, `${stem}.wav`]);
  console.log(`Narration ${i + 1}/8 ready`);
}
