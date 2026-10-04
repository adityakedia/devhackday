import { catalog } from "./catalog";
import type { Fragment, JourneyFeedback, JourneySession, MeaningConnection, SuggestedMove, WeightedFragment, WeightedTheme } from "./types";

function effectiveTags(session: JourneySession, fragment: Fragment): string[] {
  const context = session.contextualThemes?.find((entry) => entry.fragmentId === fragment.id && entry.note === fragment.note);
  return context?.tags ?? fragment.tags;
}

function weights(session: JourneySession): WeightedFragment[] {
  const preferred = new Set(session.chosenReading?.supportingFragmentIds ?? []);
  return session.fragments.map((fragment) => ({
    fragmentId: fragment.id,
    weight: 1 + (fragment.pinned ? 2 : 0) + (preferred.has(fragment.id) ? 1 : 0),
    reasons: ["Collected", ...(fragment.pinned ? ["Pinned as central"] : []), ...(preferred.has(fragment.id) ? ["Supports your chosen reading"] : [])],
  }));
}

function themes(session: JourneySession, weighted: WeightedFragment[]): WeightedTheme[] {
  const byId = new Map(weighted.map((entry) => [entry.fragmentId, entry.weight]));
  const result = new Map<string, WeightedTheme>();
  for (const fragment of session.fragments) {
    for (const tag of new Set(effectiveTags(session, fragment))) {
      const theme = result.get(tag) ?? { tag, score: 0, fragmentIds: [] };
      theme.score += byId.get(fragment.id)!;
      theme.fragmentIds.push(fragment.id);
      result.set(tag, theme);
    }
  }
  return [...result.values()].sort((a, b) => b.score - a.score || a.tag.localeCompare(b.tag));
}

const combinations = [
  { objects: ["tea", "ticket"], title: "Movement with pauses", possibility: "punctuating travel with small rituals" },
  { objects: ["tea", "umbrella"], title: "A sheltered ritual", possibility: "connecting a small ritual with the idea of shelter" },
  { objects: ["ticket", "mountain"], title: "Movement and landscape", possibility: "connecting movement with a landscape you want to keep close" },
  { objects: ["tea", "noodles"], title: "Ritual and appetite", possibility: "exploring both small rituals and discoveries through taste" },
  { objects: ["book", "noodles"], title: "Words and tastes", possibility: "connecting words you want to share with tastes you want to discover" },
  { objects: ["city", "mountain"], title: "City and landscape", possibility: "making room for both city discoveries and landscapes", contrast: true },
];

function connections(session: JourneySession, weighted: WeightedFragment[], currentThemes: WeightedTheme[]): MeaningConnection[] {
  const byId = new Map(weighted.map((entry) => [entry.fragmentId, entry.weight]));
  const score = (ids: string[]) => ids.reduce((sum, id) => sum + (byId.get(id) ?? 0), 0);
  const result: MeaningConnection[] = [];
  // Grouping adds two points to the current member weights; clicks never accumulate.
  for (const group of session.clusters) {
    const ids = group.fragmentIds.filter((id) => byId.has(id));
    if (!ids.length) continue;
    result.push({ kind: "group", title: group.label || "Your connection", fragmentIds: ids, weight: 2 + score(ids),
      explanation: group.label.trim()
        ? `You connected these artifacts under “${group.label}”. Your label supplies their meaning.`
        : "You placed these artifacts together. What relationship does this group express?" });
  }
  for (const rule of combinations) {
    // Notes supersede authored readings; retain combinations only as questions when notes exist.
    const members = rule.objects.map((kind) => session.fragments.filter((fragment) => catalog.find((item) => item.id === fragment.objectId)?.kind === kind));
    if (members.some((entries) => !entries.length)) continue;
    const ids = members.flat().map((fragment) => fragment.id);
    const grouped = session.clusters.some((group) => ids.every((id) => group.fragmentIds.includes(id)));
    result.push({ kind: rule.contrast ? "contrast" : "combination", title: rule.title, fragmentIds: ids,
      weight: score(ids) + (grouped ? 2 : 0),
      explanation: members.flat().some((fragment) => fragment.note.trim())
        ? `Could “${rule.title}” connect these artifacts? Your notes determine whether that fits; this catalog association does not override them.`
        : session.mode === "planning"
        ? `Together these objects could suggest ${rule.possibility}. Does that fit your intention?`
        : `These objects offer a possible theme of ${rule.possibility}. Do your memories connect this way? Their presence alone does not establish an experience.` });
  }
  for (const theme of currentThemes.filter((entry) => entry.fragmentIds.length > 1)) {
    const ids = theme.fragmentIds.filter((id) => {
      const fragment = session.fragments.find((entry) => entry.id === id)!;
      return !fragment.note.trim() || session.contextualThemes?.some((entry) => entry.fragmentId === id && entry.note === fragment.note);
    });
    if (ids.length < 2) continue;
    result.push({ kind: "shared_theme", title: theme.tag, fragmentIds: ids, weight: score(ids),
      explanation: `These fragments share the possible theme “${theme.tag}”. ${session.mode === "planning" ? "Is this something you want to explore?" : "Does this association fit your own memories?"}` });
  }
  result.sort((a, b) => b.weight - a.weight);
  const explicit = result.filter((entry) => entry.kind === "group");
  const inferred = result.filter((entry) => entry.kind !== "group");
  const strongest = inferred.slice(0, Math.max(0, 6 - explicit.length));
  const contrast = inferred.find((entry) => entry.kind === "contrast");
  if (contrast && !strongest.includes(contrast)) {
    if (strongest.length) strongest[strongest.length - 1] = contrast;
    else strongest.push(contrast);
  }
  return [...explicit, ...strongest];
}

function suggestions(session: JourneySession, currentThemes: WeightedTheme[], weighted: WeightedFragment[]): SuggestedMove[] {
  const central = [...session.fragments].sort((a, b) => {
    const aWeight = weighted.find((entry) => entry.fragmentId === a.id)!.weight;
    const bWeight = weighted.find((entry) => entry.fragmentId === b.id)!.weight;
    return bWeight - aWeight || a.id.localeCompare(b.id);
  });
  if (!central.length) return [{ id: "discover", kind: "deepen", objectId: null, supportingFragmentIds: [],
    prompt: session.mode === "planning" ? "Which object catches your curiosity for the journey ahead?" : "Which artifact brings back a moment you want to remember?",
    explanation: "Start with one fragment; meaning develops through your choices and personal context." }];
  const existing = new Set(session.fragments.map((fragment) => fragment.id));
  const groups = session.clusters.map((group) => ({ ...group, fragmentIds: group.fragmentIds.filter((id) => existing.has(id)) }))
    .filter((group) => group.fragmentIds.length);
  const focus = central[0];
  const notes = central.filter((fragment) => fragment.note.trim());
  if (session.mode === "reflection") {
    const focusGroup = groups.find((group) => group.fragmentIds.includes(focus.id));
    const deepenIds = focusGroup?.fragmentIds ?? [focus.id];
    const bridgeIds = groups.length > 1 ? [...new Set(groups.flatMap((group) => group.fragmentIds))] : central.slice(0, 3).map((fragment) => fragment.id);
    const quotedGroups = groups.slice(0, 2).map((group) => `“${group.label || "Untitled group"}”`).join(" and ");
    const contrastIds = notes.length ? notes.slice(0, 2).map((fragment) => fragment.id) : [focus.id];
    return [
      { id: "deepen-memory", kind: "deepen", objectId: null, supportingFragmentIds: deepenIds,
        prompt: focusGroup?.label ? `What detail would help you remember “${focusGroup.label}” more clearly?`
          : focus.note.trim() ? `What detail would you add to your note on “${focus.label}”?` : `What does “${focus.label}” bring back, in your own words?`,
        explanation: focus.pinned ? "You pinned this artifact; the prompt develops what you want to keep central." : "The prompt develops the current collection's most emphasized material." },
      { id: "bridge-memories", kind: "bridge", objectId: null, supportingFragmentIds: bridgeIds,
        prompt: groups.length > 1 ? `Is there a connection between ${quotedGroups}, or do you want to keep them separate?`
          : central.length > 1 ? `What, if anything, connects ${central.slice(0, 3).map((fragment) => `“${fragment.label}”`).join(" and ")}?`
            : `Does another artifact belong beside “${focus.label}”? What would connect them?`,
        explanation: "Your account establishes the relationship; sharing a collection does not establish a shared event." },
      { id: "contrast-memory", kind: "contrast", objectId: null, supportingFragmentIds: contrastIds,
        prompt: notes.length ? `Was there a moment that offers a different perspective from your note on “${notes[0].label}”?`
          : `Is there a different side of the journey you want to remember alongside “${focus.label}”?`,
        explanation: "This invites a counterpart to the material already present, without inventing a memory or emotion." },
    ];
  }

  const selectedObjects = new Set(session.fragments.map((fragment) => fragment.objectId));
  const available = catalog.filter((item) => !selectedObjects.has(item.id));
  const themeScores = new Map(currentThemes.map((theme) => [theme.tag, theme.score]));
  const taken = new Set<string>();
  const moves: SuggestedMove[] = [];
  const themeIds = (tags: string[]) => [...new Set(currentThemes.filter((theme) => tags.includes(theme.tag)).flatMap((theme) => theme.fragmentIds))];
  for (const kind of ["deepen", "bridge", "contrast"] as const) {
    const ranked = available.filter((item) => !taken.has(item.id)).map((item) => {
      const sharedScore = item.tags.reduce((sum, tag) => sum + (themeScores.get(tag) ?? 0), 0);
      const newTags = item.tags.filter((tag) => !themeScores.has(tag));
      const matchingGroups = groups.filter((group) => session.fragments.some((fragment) => group.fragmentIds.includes(fragment.id) && effectiveTags(session, fragment).some((tag) => item.tags.includes(tag))));
      const bridgedThemes = item.tags.filter((tag) => themeScores.has(tag)).length;
      // All candidates are compared against the weighted collection, not a first-object contrast table.
      const rank = kind === "deepen" ? sharedScore
        : kind === "bridge" ? (groups.length > 1 ? matchingGroups.length * 10 : bridgedThemes * 3) + sharedScore
          : newTags.length * 5 - sharedScore;
      return { item, rank, sharedScore, newTags, matchingGroups };
    }).filter((candidate) => kind === "deepen" ? candidate.sharedScore > 0
      : kind === "contrast" ? candidate.newTags.length > 0
        : groups.length > 1 ? candidate.matchingGroups.length > 1 : themeIds(candidate.item.tags).length > 1)
      .sort((a, b) => b.rank - a.rank || a.item.id.localeCompare(b.item.id));
    const candidate = ranked[0];
    if (!candidate) continue;
    taken.add(candidate.item.id);
    const matchedIds = themeIds(candidate.item.tags);
    const ids = kind === "bridge" && candidate.matchingGroups.length > 1
      ? [...new Set(candidate.matchingGroups.flatMap((group) => group.fragmentIds))]
      : kind === "contrast" || !matchedIds.length ? central.map((fragment) => fragment.id) : matchedIds;
    const sharedTags = candidate.item.tags.filter((tag) => themeScores.has(tag));
    const context = notes.length ? " Your notes and group labels remain the meaning to confirm." : " These are catalog possibilities for you to confirm.";
    const explanation = kind === "deepen"
      ? sharedTags.length ? `Shares ${sharedTags.join(", ")} with your collection.${context}` : `Offers an optional discovery alongside your current fragments; it does not yet share a theme with them.${context}`
      : kind === "bridge" ? candidate.matchingGroups.length > 1
        ? `Shares catalog associations with ${candidate.matchingGroups.map((group) => `“${group.label || "Untitled group"}”`).join(" and ")}; you can decide whether it links them.${context}`
        : sharedTags.length ? `Could connect ${sharedTags.join(" and ")} across your collection.${context}` : `Could introduce a connection to develop beside your current material.${context}`
        : `Introduces ${candidate.newTags.join(", ") || candidate.item.tags.join(", ")} ${candidate.newTags.length ? "not yet represented" : "less prominent"} in your collection; existing threads remain present.${context}`;
    moves.push({ id: `${kind}-${candidate.item.id}`, kind, objectId: candidate.item.id, supportingFragmentIds: ids,
      prompt: `Would “${candidate.item.label}” ${kind === "deepen" ? sharedTags.length ? "develop this direction" : "be something new to explore" : kind === "bridge" ? "connect parts of your journey" : "add a different perspective"}?`, explanation });
  }
  return moves;
}

function change(session: JourneySession, previous: JourneySession | undefined, currentThemes: WeightedTheme[]): JourneyFeedback["change"] {
  if (!previous) return { explanation: session.fragments.length ? "This is the current collection's emphasis; no new action is being reported." : "Collect a first fragment to begin shaping a direction.", affectedFragmentIds: [], themeChanges: [] };
  const oldThemes = themes(previous, weights(previous));
  const before = new Map(oldThemes.map((theme) => [theme.tag, theme.score]));
  const after = new Map(currentThemes.map((theme) => [theme.tag, theme.score]));
  const themeChanges = [...new Set([...before.keys(), ...after.keys()])].sort().map((tag) => ({ tag, before: before.get(tag) ?? 0, after: after.get(tag) ?? 0 }))
    .filter((entry) => entry.before !== entry.after);
  const latestEvent = session.events.at(-1);
  if (!latestEvent || latestEvent.revision <= previous.revision) {
    const affectedFragmentIds = session.fragments.filter((fragment) => {
      const old = previous.fragments.find((entry) => entry.id === fragment.id);
      return old && JSON.stringify([...effectiveTags(session, fragment)].sort()) !==
        JSON.stringify([...effectiveTags(previous, old)].sort());
    }).map((fragment) => fragment.id);
    return {
      explanation: affectedFragmentIds.length
        ? "Your notes refined the associations used in this reading and its suggestions."
        : "The interpretation has been refreshed for your current collection.",
      affectedFragmentIds, themeChanges,
    };
  }
  const oldIds = new Set(previous.fragments.map((fragment) => fragment.id));
  const currentIds = new Set(session.fragments.map((fragment) => fragment.id));
  const action = latestEvent.action;
  let affectedFragmentIds: string[] = [];
  let explanation = "The collection's current direction has been refreshed.";
  switch (action?.type) {
    case "collect": case "add_memory":
      affectedFragmentIds = session.fragments.filter((fragment) => !oldIds.has(fragment.id)).map((fragment) => fragment.id);
      explanation = action.type === "collect" ? "Added a fragment; its associations offer possibilities to explore." : "Added your own memory; your words provide its meaning.";
      break;
    case "annotate":
      affectedFragmentIds = [action.fragmentId];
      explanation = "Updated your personal meaning; your note guides how these objects relate.";
      if (previous.fragments.find((fragment) => fragment.id === action.fragmentId)?.note === action.note) {
        affectedFragmentIds = [];
        explanation = "Your note is unchanged; the collection keeps its current meaning.";
      }
      break;
    case "pin":
      affectedFragmentIds = [action.fragmentId];
      explanation = previous.fragments.find((fragment) => fragment.id === action.fragmentId)?.pinned === action.pinned
        ? "This fragment's place in the story is unchanged."
        : action.pinned ? "This fragment is now central to the story." : "This fragment is no longer kept central to the story.";
      if (previous.fragments.find((fragment) => fragment.id === action.fragmentId)?.pinned === action.pinned) affectedFragmentIds = [];
      break;
    case "remove":
      affectedFragmentIds = [action.fragmentId]; explanation = "Removed this fragment and its contributions from the current composition; this does not establish a dislike."; break;
    case "group":
      affectedFragmentIds = [...new Set([...action.fragmentIds, ...session.clusters.flatMap((group) => group.fragmentIds), ...previous.clusters.flatMap((group) => group.fragmentIds)].filter((id) => {
        if (action.fragmentIds.includes(id)) return true;
        return previous.clusters.find((group) => group.fragmentIds.includes(id))?.id !== session.clusters.find((group) => group.fragmentIds.includes(id))?.id;
      }))];
      explanation = `Connected fragments${action.label.trim() ? ` under “${action.label}”` : " in a group"}; your arrangement strengthens their relationship.`; break;
    case "ungroup":
      affectedFragmentIds = previous.clusters.find((group) => group.id === action.clusterId)?.fragmentIds ?? [];
      explanation = "Removed the explicit group connection; its members keep their individual emphasis."; break;
    case "reorder": affectedFragmentIds = action.fragmentIds; explanation = "Reordered the display; the story's meaning is unchanged."; break;
    case "place": affectedFragmentIds = [action.fragmentId]; explanation = "Updated the table position; the story's meaning is unchanged."; break;
    case "choose_reading":
      affectedFragmentIds = [...new Set([...(previous.chosenReading?.supportingFragmentIds ?? []), ...(session.chosenReading?.supportingFragmentIds ?? [])])].filter((id) => currentIds.has(id));
      explanation = "Made this reading the preferred direction; its supporting fragments now have more emphasis."; break;
    case "save": explanation = "Saved the current arrangement and reading; emphasis is unchanged."; break;
    case "restore":
      affectedFragmentIds = [...new Set([...previous.fragments.map((fragment) => fragment.id), ...session.fragments.map((fragment) => fragment.id)])];
      explanation = "Restored a saved composition and the relationships within it."; break;
  }
  return { explanation, affectedFragmentIds, themeChanges };
}

export function buildFeedback(session: JourneySession, previous?: JourneySession): JourneyFeedback {
  const weightedFragments = weights(session);
  const currentThemes = themes(session, weightedFragments);
  const currentConnections = connections(session, weightedFragments, currentThemes);
  const existing = new Set(session.fragments.map((fragment) => fragment.id));
  const preferredIds = session.chosenReading?.supportingFragmentIds.filter((id) => existing.has(id)) ?? [];
  const preferredIsIntact = preferredIds.length > 0 && preferredIds.length === session.chosenReading?.supportingFragmentIds.length;
  const namedGroup = currentConnections.find((entry) => entry.kind === "group" && session.clusters.some((group) => group.label.trim() && group.label === entry.title));
  const notes = session.fragments.filter((fragment) => fragment.note.trim());
  const central = session.fragments.filter((fragment) => fragment.pinned);
  const leading = currentConnections[0];
  const continuing = currentConnections.find((entry) => entry.kind === "contrast") ?? namedGroup ?? leading;
  const emergingReading = preferredIsIntact ? {
    title: session.chosenReading!.title,
    summary: `Your chosen direction remains “${session.chosenReading!.title}”. ${central.length ? `You keep ${central.map((fragment) => `“${fragment.label}”`).join(" and ")} central. ` : ""}${continuing ? continuing.explanation : "New choices may develop or challenge this reading."}`,
    supportingFragmentIds: [...new Set([...preferredIds, ...central.map((fragment) => fragment.id), ...(continuing?.fragmentIds ?? [])])],
  } : namedGroup ? {
    title: namedGroup.title, summary: namedGroup.explanation,
    supportingFragmentIds: namedGroup.fragmentIds,
  } : notes.length ? {
    title: session.mode === "planning" ? "The intention in your words" : "The memories in your words",
    summary: `${central.length ? `You keep ${central.map((fragment) => `“${fragment.label}”`).join(" and ")} central. ` : ""}Your notes on ${notes.map((fragment) => `“${fragment.label}”`).join(" and ")} provide the meaning. What thread connects them?`,
    supportingFragmentIds: [...new Set([...notes.map((fragment) => fragment.id), ...central.map((fragment) => fragment.id)])],
  } : leading ? {
    title: leading.title, summary: leading.explanation,
    supportingFragmentIds: leading.fragmentIds,
  } : {
    title: session.mode === "planning" ? "A journey taking shape" : "A memory taking shape",
    summary: central.length ? `You keep ${central.map((fragment) => `“${fragment.label}”`).join(" and ")} central. What makes ${central.length === 1 ? "it" : "them"} important to this ${session.mode === "planning" ? "journey" : "memory"}?`
      : session.fragments.length ? `Your collection includes ${session.fragments.map((fragment) => `“${fragment.label}”`).join(" and ")}. ${session.mode === "planning" ? "What draws you to these possibilities?" : "What does each artifact bring back?"}`
        : session.mode === "planning" ? "Collect a possibility to begin imagining your journey." : "Choose an artifact to begin remembering your journey.",
    supportingFragmentIds: (central.length ? central : session.fragments).map((fragment) => fragment.id),
  };
  return {
    revision: session.revision, mode: session.mode,
    emphasis: session.mode === "planning" ? "aspiration" : "memory_significance",
    weightedFragments, themes: currentThemes,
    connections: currentConnections, emergingReading,
    change: change(session, previous, currentThemes),
    suggestedMoves: suggestions(session, currentThemes, weightedFragments),
    interpretationStatus: session.interpretation?.revision === session.revision ? "current" : "pending",
  };
}
