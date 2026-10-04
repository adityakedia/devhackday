import type { Mode } from '../data';
import { ObjectArt } from './ObjectArt';

export type SavedCollection = {
  id: string;
  sessionId: string;
  title: string;
  mode: Mode;
  date: string;
  narrative: string;
  items: { id: string; kind: string; label: string; note: string; group: string; locked: boolean }[];
  reading: string;
  groups: Record<string, string>;
  readingIndex: number;
  placements: Record<string, { x: number; z: number }>;
};

type SavedPageProps = {
  collections: SavedCollection[];
  onOpen: (collection: SavedCollection) => void;
  onStart: () => void;
};

export function SavedPage({ collections, onOpen, onStart }: SavedPageProps) {
  return (
    <main className="saved-page">
      <header className="saved-heading">
        <div>
          <p className="eyebrow">YOUR LITTLE COLLECTION</p>
          <h1>Stories to <em>keep.</em></h1>
          <p>Possible journeys. Remembered moments. A little shelf of things that feel like you.</p>
        </div>
        <button className="button button-primary" onClick={onStart}>Start a collection <span aria-hidden="true">+</span></button>
      </header>
      {collections.length ? (
        <>
          <p className="saved-count">{collections.length} {collections.length === 1 ? 'keepsake' : 'keepsakes'} on your shelf</p>
          <div className="saved-grid">
            {collections.map((collection) => (
              <button className="saved-collection" key={collection.id} onClick={() => onOpen(collection)} aria-label={`Open ${collection.title}`}>
                <div className="saved-box">
                  <span className="saved-box-stamp">{collection.mode === 'planning' ? 'A JOURNEY TO COME' : 'A JOURNEY TO REMEMBER'}</span>
                  <div className="saved-box-objects">
                    {collection.items.slice(0, 4).map((item) => (
                      <div key={item.id} className="saved-box-object"><ObjectArt kind={item.kind} /></div>
                    ))}
                  </div>
                  <span className="saved-box-label">TAIPEI · PERSONAL COLLECTION</span>
                </div>
                <div className="saved-collection-meta">
                  <span className="eyebrow">{collection.mode === 'planning' ? 'IMAGINED' : 'REMEMBERED'} · {collection.date}</span>
                  <h2>{collection.title}<span aria-hidden="true">↗</span></h2>
                  <p>{collection.narrative}</p>
                  <span className="saved-item-count">{collection.items.length} little {collection.items.length === 1 ? 'thing' : 'things'}, connected</span>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <section className="saved-empty" aria-labelledby="saved-empty-heading">
          <div className="saved-empty-art"><ObjectArt kind="camera" /><ObjectArt kind="tea" /></div>
          <p className="eyebrow">EVERY COLLECTION STARTS WITH ONE LITTLE THING</p>
          <h2 id="saved-empty-heading">Make room for a story.</h2>
          <p>Save a collection from your table, and it will live here—ready to revisit whenever curiosity calls.</p>
          <button className="button button-primary" onClick={onStart}>Find your first keepsake <span aria-hidden="true">↗</span></button>
        </section>
      )}
      <p className="saved-footnote">Your keepsakes are saved with your journey. This browser remembers your journeys so you can reopen them.</p>
    </main>
  );
}
