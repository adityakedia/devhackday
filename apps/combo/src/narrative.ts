import type { Mode } from "./data";

export type CollectionItem = {
  id: string;
  kind: string;
  label: string;
  note: string;
  group: string;
  locked: boolean;
  owner?: string;
};

function meaning(items: CollectionItem[]) {
  const has = (kind: string) => items.some((item) => item.kind === kind);
  const movement = has("ticket") || has("bicycle") || has("walk");
  if (has("tea") && movement) return { title: "Small rituals, open roads", relation: "movement balanced with the pause of a small ritual" };
  if (has("lantern") && has("noodles")) return { title: "Warm light, a shared table", relation: "evening light meeting the warmth of food and a shared table" };
  if (has("tea") && has("umbrella")) return { title: "A little shelter, a little pause", relation: "shelter and a tea ritual offering two ways to pause" };
  if (has("tea") && has("book")) return { title: "A ritual and a few words", relation: "a slow ritual alongside words you might want to keep or send home" };
  if (has("tea") && has("mountain")) return { title: "A landscape in a little ritual", relation: "a landscape finding its way into an everyday ritual" };
  if (has("camera") && has("book")) return { title: "Look closely, send a little story", relation: "noticing a detail and finding words to share it" };
  if (has("charm") && has("tea")) return { title: "Things to carry close", relation: "small rituals and personal keepsakes giving ordinary objects a little significance" };
  if (movement && has("mountain")) return { title: "Following the landscape", relation: "movement connecting with a landscape beyond the everyday" };
  if (has("record")) return { title: "A journey with its own sound", relation: "sound offering another way to connect the things you notice" };
  if (has("noodles")) return { title: "Follow a little appetite", relation: "taste and comfort becoming a way into a place" };
  if (has("lantern")) return { title: "Follow the warm light", relation: "light and curiosity giving the collection an evening atmosphere" };
  if (movement) return { title: "The pleasure of going somewhere", relation: "movement and the possibility of finding something along the way" };
  if (has("tea")) return { title: "A little time to linger", relation: "a small ritual making room for attention and a pause" };
  if (has("charm")) return { title: "Something to carry close", relation: "personal keepsakes becoming a way to hold onto what matters" };
  return { title: "Following a little curiosity", relation: "the details you chose finding a place beside each other" };
}

function connections(items: CollectionItem[], groups: Record<string, string>) {
  return ["one", "two"].map((id) => ({
    name: groups[id],
    items: items.filter((item) => item.group === id),
  })).filter((cluster) => cluster.items.length > 1);
}

function relationshipText(mode: Mode, items: CollectionItem[], groups: Record<string, string>) {
  return connections(items, groups).map((cluster) => {
    const objects = cluster.items.map((item) => item.label).join(" + ");
    const relationship = meaning(cluster.items).relation;
    return mode === "reflection"
      ? `In “${cluster.name}”, ${objects} could suggest ${relationship}. Your memories give this connection its personal meaning.`
      : `For “${cluster.name}”, ${objects} suggests ${relationship}.`;
  }).join(" ");
}

export function getReadings(mode: Mode, items: CollectionItem[], groups: Record<string, string>) {
  const clusters = connections(items, groups);
  const theme = meaning(items);
  const anchor = items.find((item) => item.locked);
  const notes = items.filter((item) => item.note.trim());
  const relationships = relationshipText(mode, items, groups);
  const personal = notes.length
    ? `${notes.length} ${notes.length === 1 ? "personal note gives" : "personal notes give"} these objects a meaning beyond their appearance.`
    : "Give an object a few words of your own, and let that context lead the story.";

  return [
    {
      title: clusters.length ? `Connections: ${clusters.map((cluster) => cluster.name).join(" / ")}` : theme.title,
      description: relationships || (mode === "reflection" ? `These objects could suggest ${theme.relation}. Does that resonate with your journey?` : `Imagine ${theme.relation}.`),
    },
    {
      title: anchor ? `At the heart: ${anchor.label}` : mode === "planning" ? "Find your own rhythm" : "The objects I chose to keep",
      description: anchor
        ? `${anchor.label} stays central. Read the other objects and connections in relation to this choice.${anchor.note.trim() ? ` Your words: “${anchor.note}”` : ""}`
        : mode === "planning" ? `Let ${theme.relation} set the rhythm, with room to rearrange the pieces.` : "Look at the collection as a set of things you deliberately kept, without asking it to tell the whole journey.",
    },
    {
      title: mode === "planning" ? "A journey in our own words" : "The details we want to carry forward",
      description: personal,
    },
  ];
}

export function getNarrative(mode: Mode, items: CollectionItem[], groups: Record<string, string>, reading: string) {
  const readings = getReadings(mode, items, groups);
  const perspective = readings.findIndex((option) => option.title === reading);
  const anchor = items.find((item) => item.locked);
  const names = items.map((item) => item.label).join(", ");
  const relationship = relationshipText(mode, items, groups);
  const notes = items.filter((item) => item.note.trim()).map((item) => (
    `${item.owner ? `${item.owner} · ` : ""}${item.label}\n${item.note}`
  )).join("\n\n");
  const theme = meaning(items).relation;

  if (mode === "reflection") {
    const framing = perspective === 1
      ? anchor ? `I’m looking back through ${anchor.label}, the object I chose to keep central.` : "I’m looking back through the objects I chose to keep. Each can hold a different part of the journey."
      : perspective === 2 ? "These are the details we want to carry forward, in our own words." : "I’m looking for a thread between these fragments. Their meaning comes from the memories we attach to them.";
    return [framing, notes || `The objects we chose: ${names}. Add a memory to give them personal context.`, relationship, anchor && perspective !== 1 ? `${anchor.label} is the central object in this collection.` : ""].filter(Boolean).join("\n\n");
  }

  const framing = perspective === 1
    ? anchor ? `I want to build this journey around ${anchor.label}, leaving room for the other discoveries to connect with it.` : `I want to find a rhythm through ${theme}, with room to change direction.`
    : perspective === 2 ? "I want our own interests and intentions to shape this journey. These are the things we are drawn to, and why." : `I’m imagining ${theme}. I’m drawn to ${names}.`;
  return [framing, relationship, anchor && perspective !== 1 ? `${anchor.label} is something I want to keep at the heart of the journey.` : "", notes ? `What draws us in:\n\n${notes}` : ""].filter(Boolean).join("\n\n");
}
