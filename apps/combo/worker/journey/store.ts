import { createDb } from "@devhackday/db";
import type { JourneySession } from "./types";

export async function createJourney(
  databaseUrl: string,
  session: JourneySession,
): Promise<void> {
  const sql = createDb(databaseUrl);
  await sql`
    INSERT INTO combo_journeys (id, revision, state)
    VALUES (${session.id}, ${session.revision}, ${JSON.stringify(session)}::jsonb)
  `;
}

export async function getJourney(
  databaseUrl: string,
  id: string,
): Promise<JourneySession | null> {
  const sql = createDb(databaseUrl);
  const rows = await sql`SELECT state FROM combo_journeys WHERE id = ${id}`;
  return rows.length > 0 ? (rows[0].state as JourneySession) : null;
}

export async function updateJourney(
  databaseUrl: string,
  session: JourneySession,
  expectedRevision: number,
): Promise<boolean> {
  const sql = createDb(databaseUrl);
  const rows = await sql`
    UPDATE combo_journeys
    SET revision = ${session.revision},
        state = ${JSON.stringify(session)}::jsonb,
        updated_at = now()
    WHERE id = ${session.id} AND revision = ${expectedRevision}
    RETURNING id
  `;
  return rows.length > 0;
}
