# Combo motion storyboard

60-second, 1920 × 1080 JavaScript canvas animatic with eight storyboard scenes, gentle camera movement, crossfades, animated titles, draft synthesized narration and an original Web Audio instrumental bed. Uses the inclusive v5 group imagery. This is a motion storyboard, not footage with fully animated people.

`sequence.js` contains the timing, graphic text and narration. `film.js` draws and records the canvas in the browser. The local server saves the browser's MP4 or WebM output directly; there is no video generation service or app/backend integration.

On this Mac, prepare narration and start the renderer:

```sh
node docs/video/render/prepare.mjs
node docs/video/render/server.mjs
```

Open `http://127.0.0.1:3187/` in the in-app browser. Play the preview or click **Render video**. Rendering runs for one minute in real time and saves `combo-film.mp4` (or WebM if the browser chooses that format) beside these sources. Keep the renderer tab visible during recording. The film has graphic titles; player controls stay outside the recorded canvas.

Narration uses the macOS Daniel voice and `afconvert`; no new dependencies were installed. Replace the draft narration files with a professional recording for final production.
