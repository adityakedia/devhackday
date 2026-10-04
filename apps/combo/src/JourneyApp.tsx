import { useState } from "react";
import { HomePage } from "./components/HomePage";
import { SavedPage, type SavedCollection } from "./components/SavedPage";
import { TabletopWorkspace } from "./components/TabletopWorkspace";
import type { TableObject } from "./components/Tabletop3D";
import { Icon } from "./components/Icon";
import type { CollectionItem } from "./narrative";
import type { JourneyAction, JourneyResponse, Mode, SavedState } from "../worker/journey/types";
import { journeyApi } from "../shared/journey-api";
import { useJourney } from "./useJourney";
import { tabletopSouvenirs, initialTablePosition, assignProximityGroups, type Placement } from "./tabletop-data";
import "./tabletop.css";

type Page = "home" | "table" | "saved";

function collectionItems(session: Pick<JourneyResponse, "fragments" | "clusters">): CollectionItem[] {
  return session.fragments.map((fragment) => ({
    id: fragment.id, label: fragment.label, note: fragment.note, locked: fragment.pinned,
    kind: tabletopSouvenirs.find((item) => item.id === fragment.objectId)?.kind ?? "book",
    group: session.clusters.find((cluster) => cluster.fragmentIds.includes(fragment.id))?.id ?? "",
    owner: fragment.owner,
  }));
}

function savedCollection(session: JourneyResponse, snapshot: SavedState): SavedCollection {
  return {
    id: snapshot.id, sessionId: session.id, mode: session.mode, title: snapshot.name,
    date: new Date(snapshot.createdAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    narrative: snapshot.narrative, items: collectionItems(snapshot), reading: snapshot.chosenReading?.title ?? "",
    groups: Object.fromEntries(snapshot.clusters.map((cluster) => [cluster.id, cluster.label])),
    readingIndex: 0,
    placements: Object.fromEntries(snapshot.fragments.filter((fragment) => fragment.placement).map((fragment) => [fragment.id, fragment.placement!])),
  };
}

async function syncGroups(session: JourneyResponse, write: (action: JourneyAction) => Promise<JourneyResponse>) {
  const positions = Object.fromEntries(session.fragments.map((fragment, index) => [fragment.id, fragment.placement ?? trayPosition(index)]));
  const grouped = assignProximityGroups(collectionItems(session), positions);
  for (const id of ["one", "two"]) {
    const fragmentIds = grouped.filter((fragment) => fragment.group === id).map((fragment) => fragment.id);
    const existing = session.clusters.find((cluster) => cluster.id === id);
    if (!fragmentIds.length) {
      if (existing) session = await write({ type: "ungroup", clusterId: id });
    } else if (!existing || [...existing.fragmentIds].sort().join() !== [...fragmentIds].sort().join()) {
      session = await write({ type: "group", clusterId: id, label: existing?.label ?? "Objects placed together", fragmentIds });
    }
  }
}

function trayPosition(index: number): Placement {
  return { x: -3.6 + (index % 4) * 2.4, z: 1.45 + (Math.floor(index / 4) % 2) * 1.15 };
}

export default function JourneyApp() {
  const [page, setPage] = useState<Page>("table");
  const [mode, setMode] = useState<Mode>("planning");
  const journey = useJourney(mode);
  const { session, busy, aiPending, error } = journey;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [itineraryOpen, setItineraryOpen] = useState(false);
  const [positions, setPositions] = useState<Record<Mode, Record<string, Placement>>>({ planning: {}, reflection: {} });
  const [drafts, setDrafts] = useState<Record<Mode, string>>({ planning: "", reflection: "" });
  const items = session ? collectionItems(session) : [];
  const saved = Object.values(journey.sessions).filter((state): state is JourneyResponse => Boolean(state)).flatMap((state) => state.savedStates.map((snapshot) => savedCollection(state, snapshot)));
  const selectedObjects = new Set(session?.fragments.map((fragment) => fragment.objectId));
  const objects: TableObject[] = tabletopSouvenirs.filter((item) => !selectedObjects.has(item.id)).map((item) => ({
    id: item.id, modelId: item.id, label: item.label,
    ...(positions[mode][item.id] ?? initialTablePosition(tabletopSouvenirs.findIndex((entry) => entry.id === item.id))),
    inCollection: false, group: "", locked: false,
  }));
  session?.fragments.forEach((fragment, index) => objects.push({
    id: fragment.id, modelId: fragment.objectId ?? "taiwan-postcards", label: fragment.label,
    ...(positions[mode][fragment.id] ?? fragment.placement ?? trayPosition(index)),
    inCollection: true, group: session.clusters.find((cluster) => cluster.fragmentIds.includes(fragment.id))?.id ?? "",
    locked: fragment.pinned, owner: fragment.owner,
  }));

  function start(nextMode: Mode) {
    setMode(nextMode);
    setPage("table");
    setSelectedId(null);
  }

  function move(id: string, x: number, z: number, inCollection: boolean) {
    const target = mode;
    setSelectedId(id);
    setPositions((old) => ({ ...old, [target]: { ...old[target], [id]: { x, z } } }));
    const knownFragment = session?.fragments.find((fragment) => fragment.id === id);
    if (!inCollection && !knownFragment) return;
    void journey.enqueue(async (base, write) => {
      const fragment = base.fragments.find((entry) => entry.id === id || entry.objectId === id);
      let next: JourneyResponse;
      if (!inCollection) {
        if (!fragment) return;
        next = await write({ type: "remove", fragmentId: fragment.id });
      } else if (fragment) {
        next = await write({ type: "place", fragmentId: fragment.id, placement: { x, z } });
      } else {
        next = await write({ type: "collect", objectId: id, placement: { x, z }, owner: "You" });
        const collected = next.fragments.find((entry) => !base.fragments.some((previous) => previous.id === entry.id));
        if (collected) setSelectedId((selected) => selected === id ? collected.id : selected);
      }
      await syncGroups(next, write);
    }).then(() => setPositions((old) => {
      if (old[target][id]?.x !== x || old[target][id]?.z !== z) return old;
      return { ...old, [target]: Object.fromEntries(Object.entries(old[target]).filter(([key]) => key !== id)) };
    }));
  }

  function keepNote(id: string, note: string) {
    void journey.enqueue(async (base, write) => {
      const fragment = base.fragments.find((entry) => entry.id === id || entry.objectId === id);
      const next = fragment
        ? await write({ type: "annotate", fragmentId: fragment.id, note })
        : await write({ type: "collect", objectId: id, note, placement: trayPosition(base.fragments.length), owner: "You" });
      await syncGroups(next, write);
    });
  }

  function addMemory(note: string) {
    void journey.enqueue(async (base, write) => {
      const next = await write({ type: "add_memory", label: note.slice(0, 42), note, placement: trayPosition(base.fragments.length), owner: "You" });
      await syncGroups(next, write);
    });
  }

  function createNarrative() {
    const target = mode;
    const originalDraft = drafts[target];
    void journey.enqueue(async (base) => {
      const narrative = await journeyApi.narrative(base.id, base.revision, "ai");
      if (journey.getCurrent(target)?.revision === base.revision) setDrafts((old) => old[target] === originalDraft ? { ...old, [target]: narrative.text } : old);
    });
  }

  function save(name: string) {
    const target = mode;
    void journey.enqueue(async (base) => {
      journey.accept(await journeyApi.save(base.id, base.revision, name, drafts[target]));
    });
  }

  function openCollection(collection: SavedCollection) {
    start(collection.mode);
    void journey.enqueue(async (base) => {
      const next = await journeyApi.restore(base.id, base.revision, collection.id);
      journey.accept(next);
      setPositions((old) => ({ ...old, [collection.mode]: {} }));
      setDrafts((old) => ({ ...old, [collection.mode]: collection.narrative }));
      setItineraryOpen(true);
    }, collection.mode);
  }

  return <div className={`app-shell ${page === "table" ? "table-view" : ""}`}>
    <header className="site-header">
      <button className="brand" onClick={() => setPage("home")} aria-label="Little Atlas home">
        <svg className="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path d="M5 22L9 33H31L35 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 26H31" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="15" r="4" stroke="currentColor" strokeWidth="2" />
          <path d="M23 8L29 11L26 17L20 14Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M31 18H35M33 16V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="brand-name">Little Atlas</span>
      </button>
      <span className="header-location">Taipei <span aria-hidden="true">●</span></span>
      <nav className="header-nav" aria-label="Main navigation">
        <button className={`nav-link ${page === "home" ? "is-active" : ""}`} onClick={() => setPage("home")}>The beginning</button>
        <button className={`nav-link ${page === "table" ? "is-active" : ""}`} onClick={() => setPage("table")}>Our table</button>
        <button className={`nav-link ${page === "saved" ? "is-active" : ""}`} onClick={() => setPage("saved")}>Keepsakes{saved.length > 0 && <span className="collection-count">{saved.length}</span>}</button>
      </nav>
      <div className="header-actions"><button className="itinerary-toggle" aria-expanded={page === "table" && itineraryOpen} aria-controls="itinerary-panel" onClick={() => { setPage("table"); setItineraryOpen(page !== "table" || !itineraryOpen); }}><Icon name="route" />{mode === "planning" ? "Your journey" : "Remembered journey"}{items.length > 0 && <span className="collection-count">{items.length}</span>}</button></div>
    </header>

    {page === "home" && <HomePage onStart={start} />}
    {page === "saved" && <SavedPage collections={saved} onOpen={openCollection} onStart={() => start("planning")} />}
    {page === "table" && <TabletopWorkspace
      mode={mode} session={session} busy={busy} aiPending={aiPending} error={error}
      objects={objects} selectedId={selectedId} onSelect={setSelectedId} onMove={move}
      itineraryOpen={itineraryOpen} onCloseItinerary={() => setItineraryOpen(false)}
      narrative={drafts[mode]} onNote={keepNote} onMemory={addMemory} onMode={start}
      onPin={(id, pinned) => { void journey.enqueue(async (_base, write) => { await write({ type: "pin", fragmentId: id, pinned }); }); }}
      onChooseReading={(id) => { void journey.enqueue(async (_base, write) => { await write({ type: "choose_reading", readingId: id }); }); }}
      onNarrative={createNarrative} onNarrativeEdit={(text) => setDrafts((old) => ({ ...old, [mode]: text }))} onSave={save}
    />}
    {page !== "table" && <footer className="page-footer"><span>Little objects. Shared journeys.</span><span>Made to be picked up <span aria-hidden="true">↗</span></span></footer>}
  </div>;
}
