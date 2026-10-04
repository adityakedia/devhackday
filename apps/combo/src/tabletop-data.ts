import type { Souvenir } from "./data";
import type { CollectionItem } from "./narrative";
import { souvenirCatalog } from "../shared/souvenir-catalog";

export const tabletopSouvenirs: Souvenir[] = souvenirCatalog;

export type Placement = { x: number; z: number };

// Pick open spots across the table, keeping the scatter fixed for this visit.
const tablePositions: Placement[] = [];
for (let index = 0; index < tabletopSouvenirs.length; index++) {
  let position: Placement = { x: 0, z: 0 };
  let mostSpace = -1;
  for (let attempt = 0; attempt < 32; attempt++) {
    const candidate = { x: -5.05 + Math.random() * 10.1, z: -5.05 + Math.random() * 4.9 };
    const space = Math.min(...tablePositions.map((other) => Math.hypot(candidate.x - other.x, candidate.z - other.z)));
    if (space > mostSpace) {
      position = candidate;
      mostSpace = space;
    }
  }
  tablePositions.push(position);
}

export function initialTablePosition(index: number): Placement {
  return { ...tablePositions[index] };
}

export function assignProximityGroups(items: CollectionItem[], positions: Record<string, Placement>): CollectionItem[] {
  const visited = new Set<string>();
  const assignments = new Map<string, string>();
  let groupIndex = 0;

  for (const item of items) {
    if (visited.has(item.id)) continue;
    const component: CollectionItem[] = [];
    const queue = [item];
    visited.add(item.id);

    while (queue.length) {
      const current = queue.shift()!;
      component.push(current);
      const point = positions[current.id];
      if (!point) continue;
      for (const candidate of items) {
        const other = positions[candidate.id];
        if (!visited.has(candidate.id) && other && Math.hypot(point.x - other.x, point.z - other.z) <= 1.65) {
          visited.add(candidate.id);
          queue.push(candidate);
        }
      }
    }

    if (component.length > 1 && groupIndex < 2) {
      const group = ["one", "two"][groupIndex++];
      component.forEach((member) => assignments.set(member.id, group));
    }
  }

  return items.map((item) => ({ ...item, group: assignments.get(item.id) ?? "" }));
}
