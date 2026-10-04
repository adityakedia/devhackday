import { useState } from "react";
import { souvenirs } from "./souvenirs/catalog";
import { SouvenirViewer } from "./souvenirs/SouvenirViewer";

export default function App() {
  const [selected, setSelected] = useState(0);
  const souvenir = souvenirs[selected];
  return <main className="atelier">
    <header className="atelier-header"><a href="/" className="wordmark">Combo<span>收藏</span></a><span className="edition">Taiwan collection / Series 01–04</span><span className="header-note">Forty-three little reasons to wander</span></header>
    <section className="collection-intro"><p className="eyebrow">The souvenir atelier</p><h1>Small objects.<br /><em>Places to begin.</em></h1><p>A little collection of Taiwan. Pick something up, turn it over, and follow your curiosity.</p></section>
    <section className="object-workspace" aria-label="Souvenir collection">
      <SouvenirViewer souvenir={souvenir} />
      <aside className="object-story"><p className="eyebrow">Object {String(selected + 1).padStart(2, "0")} / {souvenirs.length}</p><span className="chinese-name" lang="zh-Hant">{souvenir.chineseName}</span><h2>{souvenir.name}</h2><p className="object-origin">{souvenir.origin}</p><p className="object-description">{souvenir.description}</p><div className="craft-details"><p className="eyebrow">Look a little closer</p><ul>{souvenir.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></div><div className="object-pagination"><button aria-label="Previous object" onClick={() => setSelected((selected + souvenirs.length - 1) % souvenirs.length)}>←</button><span>Something else might catch your eye.</span><button aria-label="Next object" onClick={() => setSelected((selected + 1) % souvenirs.length)}>→</button></div></aside>
    </section>
    <nav className="collection-shelf" aria-label="Choose a souvenir">{souvenirs.map((item, index) => <button key={item.id} aria-pressed={index === selected} onClick={() => setSelected(index)}><span className="shelf-number">{String(index + 1).padStart(2, "0")}</span><span lang="zh-Hant">{item.chineseName}</span><span className="shelf-name">{item.name}</span></button>)}</nav>
    <footer className="atelier-footer"><span>Original 3D studies · Made to be explored</span><span>Inspired by Taiwan’s crafts, journeys, and everyday rituals.</span></footer>
  </main>;
}
