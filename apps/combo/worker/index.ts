import { createDb } from "@devhackday/db";
import { handleJourneyRequest } from "./journey/routes";
import type { JourneyEnv } from "./journey/types";

interface Env extends JourneyEnv {
  DATABASE_URL: string;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      const response = await handleJourneyRequest(request, env);
      if (response) return response;
    } catch {
      return Response.json({ error: "The journey request could not be completed." }, { status: 500 });
    }

    if (url.pathname === "/api/health") {
      return Response.json({ app: "combo", ok: true });
    }

    if (url.pathname === "/api/db") {
      const sql = createDb(env.DATABASE_URL);
      await sql`SELECT 1`;
      return Response.json({ database: "neon", ok: true });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
