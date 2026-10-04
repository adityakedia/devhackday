import { catalog } from "./catalog";
import { buildFeedback } from "./feedback";
import type { CatalogItem, Interpretation, JourneySession, Reading, RelationshipSummary } from "./types";

export function summarizeRelationships(session: JourneySession): RelationshipSummary {
  return {
    themes: buildFeedback(session).themes,
    groups: structuredClone(session.clusters),
    centralFragmentIds: session.fragments.filter((fragment) => fragment.pinned).map((fragment) => fragment.id),
    personalContext: session.fragments.filter((fragment) => fragment.note.trim())
      .map((fragment) => ({ fragmentId: fragment.id, note: fragment.note })),
  };
}

function explainChange(session: JourneySession): string {
  if (session.interpretation?.revision === session.revision) {
    return "The collection has not changed since its last interpretation.";
  }
  const event = session.events.at(-1);
  if (!event) return "Start by collecting an object that matters to you.";
  switch (event.action.type) {
    case "collect": return "Added an object to this collection; its metadata offers possible themes.";
    case "add_memory": return "Added your own memory as material for the story.";
    case "annotate": return "Updated the personal meaning attached to an artifact; your words take priority over its metadata.";
    case "remove": return "Removed an artifact from this composition; it no longer supports the current readings.";
    case "pin": return event.action.pinned ? "Marked an artifact as central to subsequent readings." : "Released an artifact from the central position.";
    case "group": return `Connected the selected artifacts in the group “${event.action.label}”.`;
    case "ungroup": return "Removed a grouping; its artifacts remain in the collection.";
    case "reorder": return "Changed the order of artifacts; this changes presentation, without asserting a new relationship.";
    case "choose_reading": return "Selected a reading as the preferred direction for this story.";
    case "save": return "Saved the current arrangement, reading, and narrative as a keepsake.";
    case "restore": return "Restored a saved arrangement and its preferred reading; interpretations will be refreshed.";
  }
}

function thematicExperience(session: JourneySession, reading: Reading): NonNullable<Reading["experience"]> {
  const included = new Set<string>();
  const steps: NonNullable<Reading["experience"]>["steps"] = [];
  const sorted = [...session.fragments].sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
  for (const group of [...session.clusters].sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id))) {
    const members = sorted.filter((fragment) => group.fragmentIds.includes(fragment.id) && !included.has(fragment.id));
    if (!members.length) continue;
    members.forEach((fragment) => included.add(fragment.id));
    steps.push({
      title: group.label || "Your connection",
      description: `Consider ${members.map((fragment) => `“${fragment.label}”`).join(" and ")} together through the relationship you named${group.label ? ` “${group.label}”` : ""}. ${members.filter((fragment) => fragment.note.trim()).map((fragment) => `Your note on “${fragment.label}”: “${fragment.note}”.`).join(" ")}`.trim(),
      fragmentIds: members.map((fragment) => fragment.id),
    });
  }
  for (const fragment of sorted.filter((entry) => !included.has(entry.id))) {
    steps.push({
      title: fragment.label,
      description: `${session.mode === "planning" ? "Explore what this artifact could mean for the journey ahead." : "Reflect on what this artifact brings back, without assuming an event or chronology."}${fragment.pinned ? " You chose to keep it central." : ""}${fragment.note.trim() ? ` Your note: “${fragment.note}”.` : ""}`,
      fragmentIds: [fragment.id],
    });
  }
  return {
    title: reading.title,
    summary: "Begin with the relationships you grouped, then consider the remaining artifacts by label. This is a thematic outline to develop in your own words, rather than a travel schedule or remembered chronology.",
    steps,
  };
}

export function interpretMetadata(session: JourneySession): Interpretation {
  const relationships = summarizeRelationships(session);
  const feedback = buildFeedback(session);
  const readings: Reading[] = [];
  const ids = session.fragments.map((fragment) => fragment.id);
  const context = relationships.personalContext;
  if (ids.length) {
    readings.push({
      id: "emerging-direction",
      ...feedback.emergingReading,
      connections: feedback.connections.slice(0, 3).map((connection) => ({
        fragmentIds: connection.fragmentIds, explanation: connection.explanation,
      })),
    });
    readings.push({
      id: "arrangement",
      title: context.length ? "The meaning in your words" : "Connections you are making",
      summary: context.length
        ? `Your words provide the starting point: ${context.map((entry) => `“${entry.note}”`).join("; ")}`
        : relationships.groups.length
        ? `Your arrangement connects ${relationships.groups.map((group) => `“${group.label}”`).join(" and ")}. These labels express the relationships you chose.`
        : "These artifacts share a collection. Group and name them to express a connection; their presence alone does not establish a shared experience.",
      supportingFragmentIds: context.length ? context.map((entry) => entry.fragmentId) : relationships.groups.length
        ? [...new Set(relationships.groups.flatMap((group) => group.fragmentIds))] : ids,
      connections: context.length
        ? context.map((entry) => ({ fragmentIds: [entry.fragmentId], explanation: `Your note: “${entry.note}”` }))
        : relationships.groups.map((group) => ({
        fragmentIds: [...group.fragmentIds], explanation: `You connected these artifacts under “${group.label}”.`,
      })),
    });
    if (relationships.centralFragmentIds.length) {
      const central = session.fragments.filter((fragment) => fragment.pinned);
      readings.push({
        id: "central-artifacts", title: "What you want to keep central",
        summary: `You placed ${central.map((fragment) => `“${fragment.label}”`).join(" and ")} at the center of this composition.`,
        supportingFragmentIds: relationships.centralFragmentIds,
        connections: central.map((fragment) => ({
          fragmentIds: [fragment.id], explanation: fragment.note ? `Your central artifact carries this note: “${fragment.note}”` : "You explicitly pinned this artifact as central.",
        })),
      });
    }
  }
  for (const reading of readings) reading.experience = thematicExperience(session, reading);
  return {
    revision: session.revision, mode: session.mode, engine: "metadata", readings,
    deltaExplanation: explainChange(session),
    suggestedMoves: feedback.suggestedMoves,
    nextPrompt: feedback.suggestedMoves[0]?.prompt ?? (session.mode === "planning"
      ? "What draws you to these objects, and which experiences would you like together?"
      : "What does one of these artifacts bring back, in your own words?"),
  };
}

export function suggestSurprise(session: JourneySession): { item: CatalogItem | null; explanation: string; prompt: string } {
  const move = buildFeedback(session).suggestedMoves.find((item) => item.kind === "contrast");
  const item = move?.objectId ? catalog.find((entry) => entry.id === move.objectId) ?? null : null;
  return {
    item: structuredClone(item),
    explanation: move?.explanation ?? "Explore the relationships already in your collection.",
    prompt: move?.prompt ?? "What would you like to explore next?",
  };
}
