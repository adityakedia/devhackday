export type Mode = "planning" | "reflection";

export interface CatalogItem {
  id: string;
  label: string;
  description: string;
  kind: string;
  invitation: string;
  tags: string[];
}

export interface Fragment {
  id: string;
  objectId: string | null;
  label: string;
  note: string;
  tags: string[];
  pinned: boolean;
  placement?: { x: number; z: number };
  owner?: string;
}

export interface Cluster {
  id: string;
  label: string;
  fragmentIds: string[];
}

export type JourneyAction =
  | { type: "collect"; objectId: string; note?: string; placement?: { x: number; z: number }; owner?: string }
  | { type: "add_memory"; label: string; note: string; placement?: { x: number; z: number }; owner?: string }
  | { type: "place"; fragmentId: string; placement: { x: number; z: number } }
  | { type: "annotate"; fragmentId: string; note: string }
  | { type: "remove"; fragmentId: string }
  | { type: "pin"; fragmentId: string; pinned: boolean }
  | { type: "group"; clusterId?: string; label: string; fragmentIds: string[] }
  | { type: "ungroup"; clusterId: string }
  | { type: "reorder"; fragmentIds: string[] }
  | { type: "choose_reading"; readingId: string };

export interface Reading {
  id: string;
  title: string;
  summary: string;
  supportingFragmentIds: string[];
  connections: { fragmentIds: string[]; explanation: string }[];
}

export interface Interpretation {
  revision: number;
  mode: Mode;
  engine: "metadata" | "ai";
  readings: Reading[];
  deltaExplanation: string;
  nextPrompt: string;
  suggestedMoves?: SuggestedMove[];
  contextualThemes?: ContextualTheme[];
}

export interface JourneyEvent {
  revision: number;
  action: JourneyAction | { type: "save" | "restore"; savedStateId: string };
  timestamp: string;
}

export interface SavedState {
  id: string;
  name: string;
  createdAt: string;
  revision: number;
  fragments: Fragment[];
  clusters: Cluster[];
  interpretation: Interpretation | null;
  chosenReading: Reading | null;
  narrative: string;
  contextualThemes?: ContextualTheme[];
}

export interface JourneySession {
  id: string;
  mode: Mode;
  revision: number;
  fragments: Fragment[];
  clusters: Cluster[];
  chosenReading: Reading | null;
  interpretation: Interpretation | null;
  previousInterpretation: Interpretation | null;
  events: JourneyEvent[];
  savedStates: SavedState[];
  createdAt: string;
  updatedAt: string;
  contextualThemes?: ContextualTheme[];
}

export interface RelationshipSummary {
  themes: { tag: string; score: number; fragmentIds: string[] }[];
  groups: Cluster[];
  centralFragmentIds: string[];
  personalContext: { fragmentId: string; note: string }[];
}

export interface JourneyEnv {
  DATABASE_URL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}

export interface Narrative {
  revision: number;
  mode: Mode;
  title: string;
  centralFragmentIds: string[];
  sections: { title: string; fragmentIds: string[]; text: string }[];
  text: string;
}

export interface WeightedFragment {
  fragmentId: string;
  weight: number;
  reasons: string[];
}

export interface ContextualTheme {
  fragmentId: string;
  note: string;
  tags: string[];
}

export interface WeightedTheme {
  tag: string;
  score: number;
  fragmentIds: string[];
}

export interface MeaningConnection {
  kind: "group" | "combination" | "shared_theme" | "contrast";
  title: string;
  explanation: string;
  fragmentIds: string[];
  weight: number;
}

export interface SuggestedMove {
  id: string;
  kind: "deepen" | "bridge" | "contrast";
  objectId: string | null;
  prompt: string;
  explanation: string;
  supportingFragmentIds: string[];
}

export interface JourneyFeedback {
  revision: number;
  mode: Mode;
  emphasis: "aspiration" | "memory_significance";
  weightedFragments: WeightedFragment[];
  themes: WeightedTheme[];
  connections: MeaningConnection[];
  emergingReading: {
    title: string;
    summary: string;
    supportingFragmentIds: string[];
  };
  change: {
    explanation: string;
    affectedFragmentIds: string[];
    themeChanges: { tag: string; before: number; after: number }[];
  };
  suggestedMoves: SuggestedMove[];
  interpretationStatus: "pending" | "current";
}

export interface JourneyResponse extends JourneySession {
  feedback: JourneyFeedback;
}
