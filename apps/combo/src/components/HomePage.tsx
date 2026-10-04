import type { Mode } from '../data';
import { ObjectArt } from './ObjectArt';

type HomePageProps = {
  onStart: (mode: Mode) => void;
};

const featuredObjects = [
  { kind: 'tea', label: 'A little ritual', description: 'A cup of something slow.' },
  { kind: 'ticket', label: 'An open possibility', description: 'See where the tracks go.' },
  { kind: 'lantern', label: 'A different light', description: 'Stay out a little longer.' },
  { kind: 'camera', label: 'A moment to keep', description: 'Notice the ordinary magic.' },
];

export function HomePage({ onStart }: HomePageProps) {
  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-heading">
        <div className="home-hero-copy">
          <p className="eyebrow">TAIPEI, THROUGH YOUR EYES</p>
          <h1 id="home-heading">
            A journey begins<br />with a little<br /><em>curiosity.</em>
          </h1>
          <p className="home-intro">A tea cup. A train ticket. A moment in the rain. Collect what draws you in, and discover the story between the pieces.</p>
          <button className="button button-primary home-main-cta" onClick={() => onStart('planning')}>
            Find your first little thing <span aria-hidden="true">↗</span>
          </button>
          <p className="home-hero-footnote"><span aria-hidden="true">✳</span> No perfect plans. Just possibilities.</p>
        </div>
        <div className="home-hero-visual">
          <img className="home-hero-image" src="/images/journey-table.png" alt="A softly lit souvenir table arranged with a tea cup, train ticket, lantern, and little travel keepsakes" />
          <div className="home-image-caption">
            <span className="home-caption-rule" /><span>Small things. Infinite beginnings.</span>
          </div>
          <div className="home-floating-note" aria-hidden="true">
            <span className="home-note-eyebrow">A LITTLE INVITATION</span>
            <span>Follow what<br /><em>feels like you.</em></span>
            <span className="home-note-mark">↗</span>
          </div>
        </div>
      </section>

      <section className="home-modes" aria-labelledby="home-modes-heading">
        <div className="home-section-heading">
          <p className="eyebrow">TWO WAYS TO WANDER</p>
          <h2 id="home-modes-heading">Where are you in your journey?</h2>
          <p>There is a story before you go. And another when you return.</p>
        </div>
        <div className="home-mode-grid">
          <button className="home-mode-card home-mode-planning" onClick={() => onStart('planning')}>
            <div className="home-mode-art"><ObjectArt kind="ticket" /></div>
            <div className="home-mode-content">
              <span className="eyebrow">BEFORE YOU GO</span>
              <h3>Imagine a journey</h3>
              <p>Follow your curiosity. Gather little possibilities and shape the kind of journey you want to take.</p>
              <span className="home-mode-link">Explore possibilities <span aria-hidden="true">↗</span></span>
            </div>
          </button>
          <button className="home-mode-card home-mode-reflection" onClick={() => onStart('reflection')}>
            <div className="home-mode-art"><ObjectArt kind="camera" /></div>
            <div className="home-mode-content">
              <span className="eyebrow">AFTER YOU RETURN</span>
              <h3>Remember a journey</h3>
              <p>Bring back the small things. Connect your memories and make a keepsake of what stayed with you.</p>
              <span className="home-mode-link">Gather your memories <span aria-hidden="true">↗</span></span>
            </div>
          </button>
        </div>
      </section>

      <section className="home-how" aria-labelledby="home-how-heading">
        <div className="home-section-heading">
          <p className="eyebrow">A LITTLE PLAY, A LITTLE DISCOVERY</p>
          <h2 id="home-how-heading">Pick. Connect. Discover.</h2>
        </div>
        <ol className="home-steps">
          <li>
            <span className="home-step-number">01</span><h3>Pick what calls to you.</h3>
            <p>No right choices. Collect an object, a feeling, or a memory that catches your attention.</p>
          </li>
          <li>
            <span className="home-step-number">02</span><h3>Find the connections.</h3>
            <p>Bring pieces together. Keep something central. See what changes when you try something new.</p>
          </li>
          <li>
            <span className="home-step-number">03</span><h3>Make the story yours.</h3>
            <p>Discover a possible direction or a remembered thread. Save the reading that feels like you.</p>
          </li>
        </ol>
      </section>

      <section className="home-objects" aria-labelledby="home-objects-heading">
        <div className="home-objects-heading">
          <div><p className="eyebrow">START WITH SOMETHING SMALL</p><h2 id="home-objects-heading">What catches your eye?</h2></div>
          <button className="text-button" onClick={() => onStart('planning')}>Visit the table <span aria-hidden="true">↗</span></button>
        </div>
        <div className="home-object-grid">
          {featuredObjects.map((object) => (
            <button key={object.kind} className="home-object-card" onClick={() => onStart('planning')}>
              <div className="home-object-art"><ObjectArt kind={object.kind} /></div>
              <h3>{object.label}</h3><p>{object.description}</p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
