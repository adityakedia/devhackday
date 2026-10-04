import { composeNarrative, interpretAi } from "./ai";
import { catalog } from "./catalog";
import { buildFeedback } from "./feedback";
import { interpretMetadata, suggestSurprise, summarizeRelationships } from "./meaning";
import { applyAction, createSession, restoreState, saveState } from "./state";
import { createJourney, getJourney, updateJourney } from "./store";
import type { JourneyAction, JourneyEnv, JourneyResponse, JourneySession, Mode } from "./types";

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function sessionResponse(session: JourneySession, previous?: JourneySession, status = 200) {
  const body: JourneyResponse = { ...session, feedback: buildFeedback(session, previous) };
  return Response.json(body, { status });
}

export async function handleJourneyRequest(
  request: Request,
  env: JourneyEnv,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (path === "/api/catalog" && request.method === "GET") {
    return Response.json({ items: catalog });
  }
  if (!path.startsWith("/api/journeys")) return null;
  if (!env.DATABASE_URL) return error("DATABASE_URL is not configured.", 503);

  if (path === "/api/journeys" && request.method === "POST") {
    const body = (await request.json()) as { mode: Mode };
    const session = createSession(body.mode);
    await createJourney(env.DATABASE_URL, session);
    return sessionResponse(session, undefined, 201);
  }

  const parts = path.split("/");
  if (parts.length < 4 || parts.length > 5) return error("Not found", 404);
  const session = await getJourney(env.DATABASE_URL, parts[3]);
  if (!session) return error("Journey not found.", 404);
  const operation = parts[4];
  if (!operation && request.method === "GET") {
    return sessionResponse(session);
  }
  if (request.method !== "POST" || !operation) return error("Not found", 404);

  const body = (await request.json()) as {
    revision: number;
    action: JourneyAction;
    engine: "metadata" | "ai";
    name: string;
    narrative: string;
    savedStateId: string;
  };
  if (body.revision !== session.revision) {
    return error("Journey changed. Fetch the latest state before retrying.", 409);
  }

  let next: JourneySession;
  switch (operation) {
    case "actions":
      next = applyAction(session, body.action);
      break;
    case "interpret": {
      if (body.engine === "ai" && (!env.OPENAI_API_KEY || !env.OPENAI_MODEL)) {
        return error("OPENAI_API_KEY and OPENAI_MODEL are required for AI interpretation.", 503);
      }
      if (body.engine === "ai" && session.fragments.length === 0) {
        return error("Collect a fragment before requesting AI interpretation.", 409);
      }
      const interpretation = body.engine === "ai"
        ? await interpretAi(session, summarizeRelationships(session), env)
        : interpretMetadata(session);
      next = {
        ...session,
        revision: session.revision + 1,
        previousInterpretation: session.interpretation ?? session.previousInterpretation,
        interpretation: { ...interpretation, revision: session.revision + 1 },
        contextualThemes: interpretation.contextualThemes ?? session.contextualThemes,
        updatedAt: new Date().toISOString(),
      };
      break;
    }
    case "surprise":
      return Response.json({ revision: session.revision, ...suggestSurprise(session) });
    case "narrative": {
      const reading = session.interpretation?.readings.find(
        (item) => item.id === session.chosenReading?.id,
      );
      if (!reading || session.interpretation?.revision !== session.revision) {
        return error("Interpret the current collection and choose a reading first.", 409);
      }
      if (body.engine === "ai") {
        if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL) {
          return error("OPENAI_API_KEY and OPENAI_MODEL are required for AI narration.", 503);
        }
        return Response.json(await composeNarrative({ ...session, chosenReading: reading }, env));
      }
      return Response.json({
        revision: session.revision,
        mode: session.mode,
        title: reading.title,
        centralFragmentIds: session.fragments.filter((item) => item.pinned).map((item) => item.id),
        sections: reading.connections.map((connection) => ({
          title: "Connection",
          fragmentIds: connection.fragmentIds,
          text: connection.explanation,
        })),
        text: reading.summary,
      });
    }
    case "save":
      next = saveState(session, body.name, body.narrative ?? "");
      break;
    case "restore":
      next = restoreState(session, body.savedStateId);
      break;
    default:
      return error("Not found", 404);
  }

  if (!(await updateJourney(env.DATABASE_URL, next, session.revision))) {
    return error("Journey changed. Fetch the latest state before retrying.", 409);
  }
  return sessionResponse(next, session);
}
