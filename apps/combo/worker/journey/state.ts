import { catalog } from "./catalog";
import type { JourneyAction, JourneySession, Mode } from "./types";

export function createSession(mode: Mode): JourneySession {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), mode, revision: 0, fragments: [], clusters: [],
    chosenReading: null, interpretation: null, previousInterpretation: null,
    events: [], savedStates: [], createdAt: now, updatedAt: now,
  };
}

function nextRevision(session: JourneySession): JourneySession {
  const next = structuredClone(session);
  next.revision += 1;
  next.updatedAt = new Date().toISOString();
  return next;
}

function invalidateInterpretation(session: JourneySession) {
  session.previousInterpretation = session.interpretation ?? session.previousInterpretation;
  session.interpretation = null;
}

export function applyAction(session: JourneySession, action: JourneyAction): JourneySession {
  const next = nextRevision(session);
  switch (action.type) {
    case "collect": {
      const item = catalog.find((entry) => entry.id === action.objectId)!;
      next.fragments.push({
        id: crypto.randomUUID(), objectId: item.id, label: item.label,
        note: action.note ?? "", tags: [...item.tags], pinned: false,
        placement: action.placement ? { ...action.placement } : undefined, owner: action.owner,
      });
      break;
    }
    case "add_memory":
      next.fragments.push({
        id: crypto.randomUUID(), objectId: null, label: action.label,
        note: action.note, tags: [], pinned: false,
        placement: action.placement ? { ...action.placement } : undefined, owner: action.owner,
      });
      break;
    case "place":
      next.fragments.find((fragment) => fragment.id === action.fragmentId)!.placement = { ...action.placement };
      if (next.interpretation) next.interpretation.revision = next.revision;
      break;
    case "annotate":
      next.fragments.find((fragment) => fragment.id === action.fragmentId)!.note = action.note;
      break;
    case "pin":
      next.fragments.find((fragment) => fragment.id === action.fragmentId)!.pinned = action.pinned;
      break;
    case "remove":
      next.fragments = next.fragments.filter((fragment) => fragment.id !== action.fragmentId);
      next.clusters = next.clusters.map((cluster) => ({
        ...cluster, fragmentIds: cluster.fragmentIds.filter((id) => id !== action.fragmentId),
      })).filter((cluster) => cluster.fragmentIds.length > 0);
      break;
    case "group": {
      const id = action.clusterId ?? crypto.randomUUID();
      next.clusters = next.clusters.filter((cluster) => cluster.id !== id).map((cluster) => ({
        ...cluster, fragmentIds: cluster.fragmentIds.filter((fragmentId) => !action.fragmentIds.includes(fragmentId)),
      })).filter((cluster) => cluster.fragmentIds.length > 0);
      next.clusters.push({ id, label: action.label, fragmentIds: [...action.fragmentIds] });
      break;
    }
    case "ungroup":
      next.clusters = next.clusters.filter((cluster) => cluster.id !== action.clusterId);
      break;
    case "reorder":
      next.fragments.sort((left, right) =>
        action.fragmentIds.indexOf(left.id) - action.fragmentIds.indexOf(right.id),
      );
      break;
    case "choose_reading":
      next.chosenReading = structuredClone(next.interpretation!.readings.find((reading) => reading.id === action.readingId)!);
      next.interpretation!.revision = next.revision;
      break;
  }
  if (action.type !== "choose_reading" && action.type !== "place") invalidateInterpretation(next);
  next.events.push({ revision: next.revision, action: structuredClone(action), timestamp: next.updatedAt });
  return next;
}

export function saveState(session: JourneySession, name: string, narrative: string): JourneySession {
  const next = nextRevision(session);
  if (next.interpretation) next.interpretation.revision = next.revision;
  const id = crypto.randomUUID();
  next.savedStates.push({
    id, name, narrative, createdAt: next.updatedAt, revision: next.revision,
    fragments: structuredClone(next.fragments), clusters: structuredClone(next.clusters),
    interpretation: structuredClone(next.interpretation), chosenReading: structuredClone(next.chosenReading),
    contextualThemes: structuredClone(next.contextualThemes),
  });
  next.events.push({ revision: next.revision, action: { type: "save", savedStateId: id }, timestamp: next.updatedAt });
  return next;
}

export function restoreState(session: JourneySession, savedStateId: string): JourneySession {
  const next = nextRevision(session);
  const saved = next.savedStates.find((state) => state.id === savedStateId)!;
  next.fragments = structuredClone(saved.fragments);
  next.clusters = structuredClone(saved.clusters);
  next.chosenReading = structuredClone(saved.chosenReading);
  next.contextualThemes = structuredClone(saved.contextualThemes);
  invalidateInterpretation(next);
  next.events.push({ revision: next.revision, action: { type: "restore", savedStateId }, timestamp: next.updatedAt });
  return next;
}
