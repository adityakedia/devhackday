import { useEffect, useRef, useState } from "react";
import { Tabletop3D, type TableObject } from "./Tabletop3D";
import { Icon } from "./Icon";
import { souvenirs } from "../souvenirs/catalog";
import { getSouvenirPlaces } from "../souvenir-places";
import { initialTablePosition } from "../tabletop-data";
import type { JourneyResponse, Mode } from "../../worker/journey/types";
import { SouvenirViewer } from "../souvenirs/SouvenirViewer";

type Props = {
  mode: Mode;
  session: JourneyResponse | null;
  busy: boolean;
  aiPending: boolean;
  error: string | null;
  narrative: string;
  narrativeStale: boolean;
  onNote: (id: string, note: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onChooseReading: (id: string) => void;
  onNarrative: () => void;
  onNarrativeEdit: (text: string) => void;
  onSave: (name: string) => void;
  onMemory: (text: string) => void;
  onMode: (mode: Mode) => void;
  objects: TableObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, z: number, inCollection: boolean) => void;
  itineraryOpen: boolean;
  onCloseItinerary: () => void;
};

const foodIds = new Set([
  "pineapple-cake", "bubble-tea", "dumpling-steamer", "beef-noodles", "mango-ice",
  "papaya-milk", "winter-melon-tea", "cold-oolong", "plum-juice", "gua-bao",
  "taro-bowl", "oyster-omelette", "scallion-pancake", "oolong-tin",
]);

export function TabletopWorkspace(props: Props) {
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [memory, setMemory] = useState("");
  const [memoryPrompt, setMemoryPrompt] = useState("");
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [saveName, setSaveName] = useState("");
  const closeButton = useRef<HTMLButtonElement>(null);
  const object = props.objects.find((entry) => entry.id === openedId) ?? props.objects.find((entry) => entry.modelId === openedId);
  const souvenir = souvenirs.find((entry) => entry.id === object?.modelId);
  const fragment = props.session?.fragments.find((entry) => entry.id === object?.id);
  const isMemory = fragment?.objectId === null;
  const places = souvenir && !isMemory ? getSouvenirPlaces(souvenir.id) : [];
  const feedback = props.session?.feedback;
  const currentInterpretation = props.session?.interpretation?.revision === props.session?.revision ? props.session?.interpretation : null;
  const reading = currentInterpretation?.readings.find((entry) => entry.id === props.session?.chosenReading?.id) ?? currentInterpretation?.readings[0];
  const emerging = reading ?? feedback?.emergingReading;
  const experience = reading?.experience;
  const connections = [...(feedback?.connections ?? []), ...(reading?.connections ?? []).map((connection) => ({ ...connection, kind: "reading", title: "In this reading" }))];
  const itemConnections = connections.filter((entry) => entry.fragmentIds.includes(object?.id ?? ""));
  const canGenerate = Boolean(currentInterpretation?.readings.some((entry) => entry.id === props.session?.chosenReading?.id));
  useEffect(() => { setNote(fragment?.note ?? ""); }, [object?.modelId, isMemory ? object?.id : null, fragment?.note ?? ""]);
  useEffect(() => { setOpenedId(null); setMemory(""); setMemoryPrompt(""); setSaveName(""); setEvidenceIds([]); }, [props.mode]);
  const itinerary = props.objects.filter((entry) => entry.inCollection);

  function closePanel() {
    setOpenedId(null);
    props.onCloseItinerary();
    document.querySelector<HTMLCanvasElement>(".tt-canvas canvas")?.focus({ preventScroll: true });
  }

  function inspect(id: string) {
    setEvidenceIds([]);
    props.onCloseItinerary();
    setOpenedId(id);
  }

  useEffect(() => {
    if (!openedId && !props.itineraryOpen) return;
    if (props.itineraryOpen) setOpenedId(null);
    closeButton.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openedId, props.itineraryOpen]);

  function selectEvidence(ids: string[]) {
    setEvidenceIds(ids);
    const match = ids.find((id) => props.objects.some((entry) => entry.id === id));
    if (match) props.onSelect(match);
  }

  return <main className="tabletop-workspace" aria-label="Interactive shared souvenir table">
    <Tabletop3D objects={props.objects} selectedId={props.selectedId} highlightedIds={evidenceIds} onMove={props.onMove} onSelect={(id) => { setEvidenceIds([]); props.onSelect(id); }} onInspect={inspect} />
    {/* Keep the table free of floating controls and status messages. */}
    {props.itineraryOpen && <aside id="itinerary-panel" className="souvenir-panel" aria-label={props.mode === "planning" ? "Your journey taking shape" : "Your remembered journey"}>
      <div className="souvenir-panel-top"><span className="eyebrow">YOUR JOURNEY</span><button ref={closeButton} className="icon-button" aria-label="Close itinerary" onClick={closePanel}><Icon name="close" /></button></div>
      <h2>{props.mode === "planning" ? "Your journey taking shape" : "Your remembered journey"}</h2>
      <div className="journey-mode-control" aria-label="Journey mode"><button className="journey-text-button" aria-pressed={props.mode === "planning"} onClick={() => props.onMode("planning")}>Imagine</button><button className="journey-text-button" aria-pressed={props.mode === "reflection"} onClick={() => props.onMode("reflection")}>Remember</button></div>
      {emerging && itinerary.length > 0 && <section className="journey-section">
        <h3>The emerging thread</h3><h4>{emerging.title}</h4><p>{emerging.summary}</p>
        {reading && props.session?.chosenReading?.id !== reading.id && <button className="journey-text-button" disabled={props.busy} onClick={() => props.onChooseReading(reading.id)}>This feels right</button>}
      </section>}
      {experience && <section className="journey-section">
        <h3>{props.mode === "planning" ? "A suggested experience" : "A sequence of remembered themes"}</h3>
        <h4>{experience.title}</h4><p>{experience.summary}</p>
        <ol className="itinerary-list">{experience.steps.map((step, index) => <li className="itinerary-item" key={index}>
          <span className="itinerary-number">{String(index + 1).padStart(2, "0")}</span>
          <div><button className="itinerary-item-title" onClick={() => selectEvidence(step.fragmentIds)}>{step.title}</button><p>{step.description}</p>
            {step.fragmentIds.map((id) => { const entry = itinerary.find((item) => item.id === id); return entry ? <button className="journey-text-button" key={id} onClick={() => inspect(id)}>{entry.label}</button> : null; })}
          </div>
        </li>)}</ol>
      </section>}
      {!experience && itinerary.length > 0 && <p className="journey-hint">Your choices are being woven into a curated experience.</p>}
      <p className="souvenir-panel-description">{itinerary.length ? "The objects behind your journey." : "Drag a souvenir into the tray, or choose Add to itinerary in its details, to start your journey."}</p>
      <details className="journey-section"><summary>Collected objects ({itinerary.length})</summary>
      <ul className="itinerary-list">
        {[...itinerary].sort((a, b) => a.label.localeCompare(b.label)).map((entry) => {
          const model = souvenirs.find((candidate) => candidate.id === entry.modelId);
          return <li className="itinerary-item" key={entry.id}>
            <span className="itinerary-number"><Icon name="bag" /></span>
            <div><button className="itinerary-item-title" onClick={() => inspect(entry.id)}>{entry.label}</button>{model && props.session?.fragments.find((fragment) => fragment.id === entry.id)?.objectId !== null && <p className="souvenir-panel-origin">{model.origin}</p>}</div>
            <button className="icon-button" aria-label={`Remove ${entry.label} from itinerary`} disabled={props.busy} onClick={() => { const position = initialTablePosition(souvenirs.findIndex((candidate) => candidate.id === entry.modelId)); props.onMove(entry.id, position.x, position.z, false); }}><Icon name="close" /></button>
          </li>;
        })}
      </ul></details>
      {connections.length > 0 && <section className="journey-section"><h3>Connections</h3>{connections.map((connection, index) => <button className="journey-connection" key={`${connection.kind}-${index}`} onClick={() => selectEvidence(connection.fragmentIds)}><strong>{connection.title}</strong><span>{connection.explanation}</span></button>)}</section>}
      {feedback?.suggestedMoves.length ? <section className="journey-section"><h3>Explore next</h3>{currentInterpretation?.nextPrompt && <p>{currentInterpretation.nextPrompt}</p>}{feedback.suggestedMoves.slice(0, 3).map((suggestion) => <button className="journey-connection" key={suggestion.id} onClick={() => {
        if (suggestion.objectId) {
          const match = props.objects.find((entry) => entry.modelId === suggestion.objectId);
          if (match) { props.onSelect(match.id); inspect(match.id); }
        } else setMemoryPrompt(suggestion.prompt);
      }}><strong>{suggestion.prompt}</strong><span>{suggestion.explanation}</span></button>)}</section> : null}
      {currentInterpretation && <details className="journey-section"><summary>Other possible readings</summary>{currentInterpretation.readings.map((alternative) => <button className="journey-connection" key={alternative.id} disabled={props.busy} aria-pressed={props.session?.chosenReading?.id === alternative.id} onClick={() => props.onChooseReading(alternative.id)}><strong>{alternative.title}</strong><span>{alternative.summary}</span><span>{props.session?.chosenReading?.id === alternative.id ? "Your chosen reading" : "This feels right"}</span></button>)}</details>}
      {props.mode === "reflection" && <section className="journey-section"><label htmlFor="journey-memory">A moment you remember</label>{memoryPrompt && <p>{memoryPrompt}</p>}<textarea id="journey-memory" value={memory} onChange={(event) => setMemory(event.target.value)} placeholder="A place, a person, a little moment…" /><button className="journey-text-button" disabled={props.busy || !memory.trim()} onClick={() => props.onMemory(memory.trim())}>Keep this memory</button></section>}
      {itinerary.length > 0 && <section className="journey-section"><h3>Your story</h3><button className="journey-text-button" disabled={props.busy || props.aiPending || !canGenerate} onClick={props.onNarrative}>{props.narrative ? "Compose again" : "Compose your story"}</button>{!canGenerate && <p className="journey-hint">Choose a current reading to compose your story.</p>}
        {props.narrative && <>{props.narrativeStale && <p className="journey-hint">Your choices changed. Compose again or edit your story to reflect them before saving.</p>}<label htmlFor="journey-story">Make the story yours</label><textarea id="journey-story" className="journey-story" value={props.narrative} onChange={(event) => props.onNarrativeEdit(event.target.value)} /><label htmlFor="journey-save-name">Collection name</label><input id="journey-save-name" value={saveName} onChange={(event) => setSaveName(event.target.value)} placeholder="Give this journey a name" /><button className="primary-button" disabled={props.busy || props.narrativeStale || !saveName.trim()} onClick={() => props.onSave(saveName.trim())}>Keep this collection</button></>}
      </section>}
    </aside>}
    {!props.itineraryOpen && object && <aside className="souvenir-panel" aria-label={`Details for ${object.label}`}>
      <div className="souvenir-panel-top"><span className="eyebrow">{isMemory ? "A MOMENT TO KEEP" : foodIds.has(souvenir?.id ?? "") ? "TASTE OF TAIWAN" : "A PIECE OF TAIWAN"}</span><button ref={closeButton} className="icon-button" aria-label="Close souvenir details" onClick={closePanel}><Icon name="close" /></button></div>
      <div className="souvenir-panel-intro">
      <h2>{object.label}</h2>
      {!isMemory && souvenir && <div className="souvenir-inspection"><SouvenirViewer souvenir={souvenir} showExport={false} /></div>}
        {!isMemory && souvenir && <p className="souvenir-panel-chinese" lang="zh-Hant">{souvenir.chineseName}</p>}
        {!isMemory && souvenir && <><p className="souvenir-panel-origin"><Icon name="pin" />{souvenir.origin}</p><p className="souvenir-panel-description">{souvenir.description}</p></>}
      </div>
      <button className="primary-button itinerary-add" disabled={props.busy || object.inCollection} onClick={() => { const index = itinerary.length; props.onMove(object!.id, -3.6 + (index % 4) * 2.4, 1.45 + (Math.floor(index / 4) % 2) * 1.15, true); }}><Icon name={object?.inCollection ? "check" : "plus"} />{object?.inCollection ? "Added to itinerary" : "Add to itinerary"}</button>
      <section className="journey-section"><label htmlFor="souvenir-note">{props.mode === "planning" ? "What draws you to this?" : "What does this bring back?"}</label><textarea id="souvenir-note" value={note} onChange={(event) => setNote(event.target.value)} /><button className="journey-text-button" disabled={props.busy || note === (fragment?.note ?? "")} onClick={() => props.onNote(object.id, note)}>Keep this note</button>
        {fragment && <button className="journey-text-button" disabled={props.busy} aria-pressed={fragment.pinned} onClick={() => props.onPin(fragment.id, !fragment.pinned)}>{fragment.pinned ? "Central to your journey · release" : "Keep this central"}</button>}
        {itemConnections.map((connection, index) => <button className="journey-connection" key={index} onClick={() => selectEvidence(connection.fragmentIds)}><strong>{connection.title}</strong><span>{connection.explanation}</span></button>)}
      </section>
      {!isMemory && souvenir && <><section className="souvenir-panel-details" aria-label="Object details"><h3>The little details</h3><ul>{souvenir.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></section>
      <section className="souvenir-panel-places" aria-label="Related places">
        <h3>{foodIds.has(souvenir.id) ? "Where to taste it" : "Places behind the object"}</h3>
        {places.map((place) => <article className="souvenir-place" key={place.name}>
          <div className="souvenir-place-area"><Icon name="pin" /><span>{place.area}</span></div>
          <h4>{place.name}</h4><p>{place.description}</p>
          <div className="souvenir-place-links"><a href={place.url} target="_blank" rel="noreferrer">Explore the place <Icon name="arrow" /></a><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.area}, Taiwan`)}`} target="_blank" rel="noreferrer">Map ↗</a></div>
        </article>)}
      </section></>}
    </aside>}
  </main>;
}
