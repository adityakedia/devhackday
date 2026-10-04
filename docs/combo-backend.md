# Combo journey backend

Backend implementation only. The frontend and 3D viewer are not connected to these endpoints.

## Setup

Set `DATABASE_URL` in the Worker's local `.dev.vars` or deployed secrets. Manually apply `docs/sql/combo-journeys.sql` to that Neon database before using journey endpoints. The implementation does not create tables automatically. Catalog reads do not need a database.

For AI requests, also configure `OPENAI_API_KEY` and `OPENAI_MODEL`. The selected model is `gpt-6-luna`, with `reasoning.effort: "low"` (the API equivalent of light reasoning), as supported by the [official model documentation](https://developers.openai.com/api/docs/models/gpt-6-luna). The local config and example set that model; requests require explicit model configuration, with no silent fallback from AI to metadata. No database changes, deployment, or live AI calls were performed during implementation.

## Responsibilities

- `worker/journey/types.ts`: session, actions, readings, narrative, and snapshot contracts.
- `shared/souvenir-catalog.ts`: the 43 current tabletop souvenirs, preserving model IDs, labels, descriptions, kinds, invitations and tags. The frontend tabletop and backend `catalog.ts` import this same plain metadata; no Three.js dependencies reach the Worker. Authored combination rules match kinds while suggestions retain specific souvenir IDs.
- `shared/journey-api.ts`: typed, headless API functions for frontend integration; it does not mount UI, schedule AI or store client state.
- `state.ts`: immutable collection actions, groups, pins, preferred reading, revisions, and snapshot save/restore.
- `meaning.ts`: relationship summaries, basic metadata readings, action explanations, and curated surprises.
- `feedback.ts`: current choice weights, combination relationships, immediate readings, change feedback, and ranked next moves.
- `ai.ts`: mode-specific interpretation and narrative composition through OpenAI's [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
- `store.ts`: one Neon row per session with JSONB state and conditional revision updates.
- `routes.ts`: Worker API operations.

The source of truth is the session, not AI output. Inspecting or rotating an object does not mutate it. User notes and group labels take priority over generic metadata. Metadata readings are templates describing supplied context and arrangement; nuanced emergent interpretation and narrative prose use the AI engine. Reflection prompts prohibit inventing experiences from objects alone, although generated prose still needs the user's review.

## Weighted feedback and staged interpretation

Create, fetch, and mutation responses retain the session fields and add a derived `feedback` object. Feedback is calculated from the current state, rather than stored as another source of truth:

- `revision`, `mode`, and `emphasis`: current revision and whether influence concerns aspirations or memory significance.
- `weightedFragments`: current influence and its reasons. Collected fragments start at 1; pinning adds 2; existing fragments supporting the chosen reading receive 1 more. Repeating an action does not accumulate bonuses.
- `themes`: sums of fragment influence for associated themes. These numbers represent emphasis, not probability, confidence, or a permanent personality profile.
- `connections`: explicit groups and tentative authored combinations, shared associations, and contrasts, with supporting fragment IDs. Explicit grouping adds 2 to the member influence for that connection, without inflating individual theme scores. Authored co-grouped combinations receive the same relationship bonus. Meaningful contrasts remain visible alongside dominant threads.
- `emergingReading`: a brief immediate direction grounded in notes, named groups, chosen reading, pins, or tentative object associations.
- `change`: a user-facing explanation, affected fragments, and before/after theme scores. Interpretation refreshes do not replay previous collection actions; semantic refinement reports its own changes.
- `suggestedMoves`: explained deepen, bridge, and contrast choices with supporting evidence. Planning ranks uncollected objects against the whole weighted collection and omits unsupported suggestion kinds. Reflection returns contextual recollection questions with `objectId: null`.
- `interpretationStatus`: `pending` after collection changes; `current` when the stored interpretation matches the current revision.

The AI interpretation now also returns `contextualThemes`, assigning catalog-vocabulary themes from each fragment's own note. These can replace the object's generic associations and rerank suggestions. For example, a cup described as a reminder of a loud market evening can contribute evening/energy themes instead of slow-morning themes. The server stamps each assignment with the source note; editing that note makes the old assignment inapplicable. Until AI refreshes, immediate hints use available catalog associations and remain provisional. Labels/groups guide relationships and narrative, while per-fragment semantic tags are grounded in the fragment's own note. This deliberately uses the small catalog vocabulary rather than a generalized semantic search system.

Client integration, when requested, should work in two stages:

1. Submit `/actions` and render its `feedback` immediately, without waiting for AI.
2. Once choices settle, request `/interpret` with `engine: "ai"` and the latest revision. Render its evidence-linked readings and newly ranked suggestions. If the collection changed while AI ran, the conditional commit returns `409`; use the newer collection and request a fresh interpretation when appropriate.

The backend does not automatically call AI on every action or run a background debounce timer. The client schedules that separate refresh. No streaming or WebSocket integration was added. Save/restore includes the contextual themes; stale-note matching still applies to restored data.

## API

All bodies and responses are JSON. API callers should use the shared TypeScript contracts. Runtime request-shape and reference validation has not been added while its approval is pending; this prototype currently expects well-formed requests from a trusted client. There is no account system or session listing endpoint. A session ID grants access to that journey; treat it as private.

| Method | Path | Body / result |
| --- | --- | --- |
| GET | `/api/catalog` | Returns `{ items: CatalogItem[] }` |
| POST | `/api/journeys` | `{ mode: "planning" \| "reflection" }`; returns a new session |
| GET | `/api/journeys/:id` | Returns the current session |
| POST | `/api/journeys/:id/actions` | `{ revision, action: JourneyAction }`; returns the updated session |
| POST | `/api/journeys/:id/interpret` | `{ revision, engine: "metadata" \| "ai" }`; persists and returns the updated session |
| POST | `/api/journeys/:id/surprise` | `{ revision }`; returns `{ revision, item, explanation, prompt }`, without mutating the session |
| POST | `/api/journeys/:id/narrative` | `{ revision, engine: "metadata" \| "ai" }`; returns an editable `Narrative`, without persisting it |
| POST | `/api/journeys/:id/save` | `{ revision, name, narrative: string }`; snapshots the collection and user-edited passage |
| POST | `/api/journeys/:id/restore` | `{ revision, savedStateId }`; restores the arrangement and preferred reading, then requires reinterpretation |

Every persisted write advances `revision`, including interpretation and save. Send the revision returned by the last response. A concurrent change returns `409`; fetch the latest session before deciding whether to retry. Interpretation commits also use this conditional write, so a slow AI result cannot overwrite a newer collection. Narrative responses carry a revision; the eventual frontend must discard them if its current revision has changed.

Missing database or AI configuration returns `503`. Unknown journeys return `404`. Narrative generation before a fresh interpretation and matching preferred reading returns `409`. Provider and unhandled request errors currently return a generic `500` without exposing notes, credentials, or provider response bodies.

## Actions

```json
{ "type": "collect", "objectId": "yingge-tea-cup", "note": "I want slower mornings.", "placement": { "x": -1, "z": 2 }, "owner": "You" }
```

The response assigns a fragment ID. Multiple fragments may reference the same catalog object, allowing distinct personal memories.

`objectId` is the Three.js model/catalog ID; `fragment.id` is the unique collected occurrence. Render a collected model through `fragment.objectId`, never through its UUID. Memories have `objectId: null`; choose their visual representation in the frontend. `placement` and `owner` are optional display metadata on objects and memories, retained in save/restore. Owner is a contributor label, not authenticated ownership or collaboration.

```json
{ "type": "add_memory", "label": "Rain at breakfast", "note": "We waited together under the awning." }
```

Other supported actions:

```json
{ "type": "annotate", "fragmentId": "fragment-id", "note": "My own meaning." }
{ "type": "place", "fragmentId": "fragment-id", "placement": { "x": 1, "z": 2 } }
{ "type": "pin", "fragmentId": "fragment-id", "pinned": true }
{ "type": "remove", "fragmentId": "fragment-id" }
{ "type": "group", "label": "Our best detour", "fragmentIds": ["fragment-a", "fragment-b"] }
{ "type": "group", "clusterId": "existing-cluster-id", "label": "Renamed connection", "fragmentIds": ["fragment-a", "fragment-b"] }
{ "type": "ungroup", "clusterId": "existing-cluster-id" }
{ "type": "reorder", "fragmentIds": ["fragment-b", "fragment-a"] }
{ "type": "choose_reading", "readingId": "reading-from-current-interpretation" }
```

Each fragment belongs to at most one group. Grouping moves selected fragments out of their previous groups. Removing a fragment removes its group membership, and empty groups disappear. Reorder should supply all current fragment IDs in the desired order; it changes presentation without establishing chronology or emotional meaning. Collection changes invalidate the current interpretation, retaining the previous interpretation and preferred reading as context.

`place` only updates coordinates: it advances the session and current interpretation revisions without invalidating meaning or changing weights. Proximity has no implicit backend meaning; send `group`/`ungroup` when the frontend detects a membership change. Stable cluster IDs let a group move without becoming a new relationship.

## Frontend input and feedback contract

Import `journeyApi` from `apps/combo/shared/journey-api.ts` and `JourneyResponse`/`JourneyAction` as TypeScript types. All session responses consistently contain `{ ...session, feedback }`. Meaning remains output data; this module imposes no presentation choices.

```ts
let session = await journeyApi.create("planning");
session = await journeyApi.action(session.id, session.revision, {
  type: "collect", objectId: "yingge-tea-cup",
  note: "I want slower mornings.", placement: { x: -1, z: 2 }, owner: "You",
});
// Consume session.feedback now; resolve visual assets from fragment.objectId.
// Once choices settle, refresh the interpretation using the latest revision.
session = await journeyApi.interpret(session.id, session.revision, "ai");
// Consume session.interpretation.readings and the refreshed session.feedback.
```

Keep one session per mode. Serialize action writes using each returned revision. Submit drops, committed notes and changed group membership, rather than drag frames or textarea keystrokes. After collection, take the returned fragment UUID for subsequent annotate/place/group/remove actions. Position and group changes are separate sequential actions; no batch endpoint is provided. Pin accepts multiple central fragments, so a single-central-object UI must explicitly unpin the old fragment.

AI refresh is separate so it need not block interactions. Match responses to their session/mode and revision; on `JourneyApiError` with status `409`, fetch the current session and reconcile before retrying. Every interpretation also advances revision. Choose a reading from the current interpretation by ID before requesting narrative; preserve user-edited narrative drafts locally and pass the final string to save. Reopen saved narrative from `savedStates`; restore returns the restored fragments/groups and feedback with interpretation pending. Save listings are per session, and the client retains known session IDs for reopening.

The client calls same-origin `/api` URLs. Database and OpenAI credentials stay in Worker configuration; the frontend does not call Neon or OpenAI directly.

## Meaning and story workflow

1. Create a planning or reflection session.
2. Collect objects or add memories, then annotate, group, and pin them.
3. Request interpretation. It returns 2–3 readings when there are fragments, supporting fragment IDs, connections, a change explanation, and a next prompt. Empty metadata collections return no readings.
4. Choose a reading using an action. The preferred reading remains context for future edits.
5. Request a narrative while the current interpretation is fresh and contains the preferred reading.
6. Edit the passage and save it by name. Each saved state includes fragments, groups, pins, interpretation, chosen reading, and the edited passage. Restore does not manufacture a new story; it reinstates the collection for reinterpretation.

Planning narratives organize intentions, central experiences, and contrasts using conditional language. Reflective narratives organize a central thread and supporting memories from user-supplied material. Narrative output has `revision`, `mode`, `title`, `centralFragmentIds`, `sections` (each with title, supporting fragment IDs, and text), and the complete `text` passage.

Planning surprise returns the collection-ranked contrast candidate, when one exists. Reflection offers the collection's contextual contrast prompt and returns `item: null`. Neither silently adds an object or memory.

## Current scope

The API is an MVP backend, not a deployed production service. It has no new dependencies, background jobs, graph database, accounts, or frontend wiring. Session history and saved versions live in the JSONB document; this suits short prototype sessions. Separating historical records into tables can be considered if actual session sizes require it.

## Backend workflow run — October 4, 2026

The user-approved basic end-to-end run passed against an isolated local Worker, the configured Neon database, and live GPT-6 Luna with low reasoning. Both planning and reflection covered collect, annotate, group, pin, reorder, surprise, AI interpretation, reading selection, AI narrative, save, remove, reinterpret, restore, and database reload. Metadata interpretation/narration was also exercised. Output fragment references matched the current collection; stale revision writes and stale narratives returned `409`.

The table already existed, so no schema changes were applied. Two named `Backend E2E` sessions remain in Neon. The temporary server was stopped; the frontend was not exercised. Type checks, malformed request handling, concurrent load, and production deployment were outside this basic run. Generated prose remains subject to user review; one planning change explanation used technical wording (“no new events were supplied”) that could be polished separately.

Weighted-update checks were initially approved and completed before the later instruction to stop further checks. The Worker TypeScript check and both live weighted API workflows passed: immediate feedback, nonaccumulating pins, grouped connections, note-derived themes overriding generic associations, semantic change reporting, ranked suggestions, chosen-reading influence, save/remove/restore, Neon reload, and stale revisions. Two additional named `Weighted feedback E2E` sessions remain in Neon. Report: `/tmp/combo-weighted-e2e-report.json`. The temporary server was stopped. No further checks were run after approval was withdrawn; a corrected temporary in-memory assertion about unordered evidence IDs was left unrerun.
