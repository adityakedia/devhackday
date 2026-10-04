import { createDb } from "@devhackday/db";

interface Env {
  DATABASE_URL: string;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
