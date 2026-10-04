# Combinatronics Travel MVP
## Proof-of-concept specification

## 1. MVP objective

Build a minimal interactive prototype with **two modes**:

### Planning Mode
Before the trip.

The user explores a curated world of evocative travel fragments, collects items into a basket, changes the combination, and sees how the emerging “trip direction” changes.

### Reflection Mode
During or after the trip.

The user adds memories, objects, moments, places, photos or notes into the same kind of basket and sees AI interpret connections, patterns and possible narratives.

The two modes should feel different in purpose but clearly share the same underlying interaction system.

---

# 2. What the MVP is trying to prove

The prototype does **not** need to prove:

- itinerary booking
- route optimization
- live maps
- recommendation accuracy
- hotel/flight integration
- multi-city travel
- social features
- full journal functionality
- image recognition
- long-term personalization
- production-grade recommendation systems

It needs to prove four things.

### Hypothesis 1
Users can express travel interests more naturally by selecting evocative fragments than by filling in categories.

### Hypothesis 2
The **combination** of selected fragments produces useful meaning beyond each item independently.

### Hypothesis 3
Users understand and value the fact that changing one element changes the interpretation.

### Hypothesis 4
The same combinatorial mechanism works both:

**prospectively**
→ imagining a possible experience

and

**retrospectively**
→ interpreting an experienced journey.

---

# 3. Core interaction model

Both modes use the same loop.

```text
DISCOVER
   ↓
COLLECT
   ↓
COMBINE
   ↓
INTERPRET
   ↓
REARRANGE / REMOVE / ADD
   ↓
REINTERPRET
   ↓
SAVE A VERSION
```

This is the heart of the prototype.

Everything else is secondary.

---

# 4. Shared core primitives

The MVP only needs six user actions.

## 4.1 Collect

User adds an item to the working collection.

Example in Planning:

> tea cup

Example in Reflection:

> “rain outside the breakfast shop”

System meaning:

> weak positive relevance signal

The system should never interpret collection as:

> “this permanently defines you.”

---

## 4.2 Remove

User removes an item.

This should immediately trigger reinterpretation.

Example:

```text
lantern
tea
bookstore
rain
```

becomes:

```text
lantern
bookstore
rain
```

The system should communicate:

> “Removing tea shifts the collection away from ritual/slow pauses and more toward urban wandering.”

This delta response is critical.

---

## 4.3 Rearrange / group

Users can change relationships between items.

For the MVP, this can be extremely simple.

Allow users to:

- reorder items
- create 2–3 small clusters
- place two items together

Example:

```text
[tea + rain]

[train + mountain]
```

The system can interpret the clusters separately.

This is important because otherwise the “basket” is just a list.

---

## 4.4 Lock

A user can mark one item:

> Keep this central.

Lock means:

> interpret future changes around this item.

Example:

🔒 quiet bookstore

Then adding nightlife should not completely replace the current direction.

It should create something like:

> “quiet daytime exploration + one contrasting evening experience”

instead of changing the whole interpretation.

---

## 4.5 Surprise

One button:

> Add something unexpected.

The system introduces one new item that is not too similar to the current collection.

Planning example:

Current:

```text
tea
bookstore
rain
train
```

System offers:

> night baseball

Reflection example:

Current:

```text
rain
quiet café
old street
tea
```

System asks:

> “Was there an unexpectedly loud, crowded or energetic moment?”

The purpose is to test whether controlled disruption creates useful exploration.

---

## 4.6 Save state

The user can save a combination as a named state.

Examples:

### Planning
“Slow Taipei”

### Reflection
“The trip I remember most strongly”

This creates the beginning of a **possibility graph** without needing a complicated version-control system.

For MVP:

- current state
- previous state
- 3–5 saved states

is enough.

---

# 5. The shared underlying data model

The MVP should not represent the basket as only an array.

Each item should minimally contain:

```text
Item
- id
- label
- type
- description
- semantic tags
- source
- mode
```

Example:

```text
id: p_017
label: Tea cup
type: object

semantic tags:
- slow
- ritual
- local culture
- indoor
- pause
- sensory
- traditional
```

A Reflection item could be:

```text
id: r_041
label: Rain at breakfast shop
type: memory

semantic tags:
- rain
- food
- morning
- local
- ordinary moment
- sensory
- quiet
```

---

# 6. Relationships matter more than tags

The system should not simply count tags.

The interesting part is:

```text
meaning(A + B) ≠ meaning(A) + meaning(B)
```

Example:

### Tea
slow / ritual / culture

### Train
movement / transition / distance

Together:

> “A trip rhythm built around movement followed by intentional pauses.”

Add:

### Rain

Now:

> “A reflective journey where transit and shelter become part of the experience.”

The MVP needs to demonstrate this **emergent interpretation**.

It does not need a sophisticated graph algorithm.

An LLM can perform this interpretation from:

- selected items
- their tags
- their grouping
- locked items
- previous interpretation.

---

# 7. Shared state architecture

At minimum maintain:

```text
Session
- mode
- current_items
- clusters
- locked_items
- interpretation
- previous_interpretation
- saved_states
```

And an event history:

```text
Event
- action
- item
- timestamp/order
```

Example:

```text
ADD tea
ADD train
ADD rain
LOCK train
REMOVE tea
ADD bookstore
```

This event history allows the system to explain:

> what changed

rather than regenerating without context.

---

# 8. Shared AI responsibilities

The AI only needs five responsibilities in MVP.

## A. Interpret

Given the current collection:

> What possible experience or narrative does this combination suggest?

---

## B. Explain change

Given previous + current collection:

> What changed because the user added/removed/rearranged X?

This is possibly the most important AI function in the entire prototype.

---

## C. Suggest relationships

Example:

> “The train and rain both introduce transition; the bookstore acts as a pause.”

---

## D. Introduce one surprising prompt/item

Controlled divergence.

---

## E. Produce 2–3 interpretations

Never produce only:

> “This is what your choices mean.”

Instead:

> “Here are three possible readings.”

This keeps interpretation exploratory.

---

# 9. AI should NOT do these things in MVP

Do not ask the AI to:

- calculate actual travel times
- invent business opening hours
- optimize routes
- predict personality
- diagnose emotions
- determine “your true travel style”
- recommend hundreds of places
- generate a full production itinerary
- perform long-term profiling

Those distract from the mechanism being tested.

---

# 10. Planning Mode

## Purpose

Help the user answer:

> **What kind of experience do I want this trip to become?**

Not:

> Which attractions should I book?

---

# 11. Planning Mode content

Use **one destination only** for MVP.

Taipei is ideal because it fits the original concept.

Create perhaps:

### 60–100 curated fragments

Enough to produce variety.

Not hundreds.

Organize them loosely into hidden categories such as:

### Objects
- tea cup
- lantern
- train ticket
- umbrella
- old camera
- temple charm
- market stool
- vinyl record

### Experiences
- sunrise walk
- late-night noodles
- mountain train
- hot spring
- alley wandering
- night cycling
- tea tasting

### Atmospheres
- rain
- neon
- quiet morning
- crowded evening
- old streets
- mountain mist

### Behaviors
- wander
- photograph
- taste
- sit
- talk
- climb
- browse

### Contrasts
- busy
- quiet
- urban
- natural
- planned
- spontaneous

The user does not need to see those taxonomy labels.

---

# 12. Planning Mode flow

## Step 1 — Enter

Very little setup.

Ask only:

> “Build the Taipei trip you feel drawn toward.”

Optionally:

> Pick anything that catches your attention.

No questionnaire.

---

## Step 2 — Explore

Show 8–12 items at a time.

Important:

Do not show all 100 items in a grid.

The user should feel they are **encountering** possibilities.

Interaction:

```text
TAKE
SKIP
SHOW ME SOMETHING DIFFERENT
```

---

## Step 3 — Build basket

After perhaps 4 selections:

```text
tea
rain
train
bookstore
```

AI responds:

> “A possible direction is emerging: slow movement through the city, with indoor pauses and small discoveries rather than landmark collecting.”

Then continue exploring.

---

## Step 4 — Create alternative readings

After 6–8 selections, show:

### Interpretation A
Slow city wandering

### Interpretation B
Rainy literary Taipei

### Interpretation C
Rail + tea exploration

The user selects:

> “More like B.”

This is enough for MVP preference feedback.

---

## Step 5 — Manipulate

User:

- removes something
- locks something
- moves two things together
- asks for surprise.

Every action should create visible change.

---

## Step 6 — Save a trip direction

The output is **not yet a real itinerary**.

The output is:

### Trip Direction

Example:

**Rainy Literary Taipei**

Core qualities:

- unhurried
- urban
- atmospheric
- local
- quiet discoveries
- occasional movement by rail

Central elements:

- bookstore
- rain
- train

Optional elements:

- tea
- night market

Avoid:

- tightly scheduled landmark hopping

Then optionally:

### Example day sketch

Morning:
slow breakfast + old neighborhood

Afternoon:
bookstore / café / wandering

Evening:
small market + train ride

This remains illustrative rather than production planning.

---

# 13. Planning Mode proof point

The prototype succeeds if a user says something like:

> “I didn't know this was the kind of trip I wanted until I saw these combinations.”

That is more important than itinerary accuracy.

---

# 14. Reflection Mode

Reflection should use the exact same architecture.

But the question changes.

Planning asks:

> **What could this trip become?**

Reflection asks:

> **What did this trip become for me?**

---

# 15. Reflection Mode input

Instead of curated future-oriented fragments, users create or select **memory fragments**.

For MVP allow only:

### Text memory
> “We got lost near the temple.”

### Photo
Optional if easy.

### Object/token
> train ticket

### Place
> tea shop

### Feeling / atmosphere
> rain

### Moment
> late-night conversation

You do not need GPS, metadata extraction or automatic image analysis.

Manual input is enough.

---

# 16. Reflection Mode flow

## Step 1 — Add memories

Prompt:

> “Collect moments you don't want to lose.”

User adds:

```text
rain at breakfast
train window
night market smell
lost umbrella
quiet temple
friend laughing
```

---

## Step 2 — AI interprets relationships

Not:

> “Here is your trip summary.”

Instead:

> “Three possible threads seem to connect these memories.”

### Thread A
Movement and transition

### Thread B
Small disruptions becoming memorable

### Thread C
Ordinary moments becoming more important than landmarks

User chooses:

> “C feels right.”

That becomes a stronger signal.

---

# 17. Reflection Mode manipulation

Use the same primitives.

### Remove

> Does the story still feel true without this memory?

### Lock

> This moment is central.

### Group

```text
[train + friend laughing]

[rain + breakfast + umbrella]
```

### Rearrange

Chronological order versus emotional order.

### Surprise

Instead of introducing a new trip element, Reflection asks:

> “What's missing from this story?”

Possible prompts:

- a sound
- a person
- a frustration
- something ordinary
- something you expected to matter but didn't
- something you didn't photograph.

This is the reflection-mode equivalent of mutation.

---

# 18. Reflection Mode output

The goal is not a polished diary.

Output:

## Memory constellation

### Central thread
“Ordinary moments became the emotional center of the trip.”

### Supporting memories
- rain at breakfast
- train window
- friend laughing
- lost umbrella

### Contrast
“The famous places appear less strongly than unplanned transitions.”

Then optionally produce:

### Short narrative

One paragraph.

Or:

### Three journal prompts

This is enough.

---

# 19. The elegant symmetry between the modes

The proof-of-concept becomes much stronger if the architecture makes this symmetry explicit.

| Planning | Reflection |
|---|---|
| collect possibilities | collect memories |
| imagine relationships | discover relationships |
| construct desired experience | construct remembered meaning |
| explore alternatives | explore interpretations |
| lock desired elements | lock important memories |
| introduce surprise | recover forgotten dimensions |
| save trip direction | save memory narrative |
| “what could happen?” | “what mattered?” |

This is the conceptual center of the prototype.

---

# 20. Shared architecture

Keep the implementation simple.

```text
                        UI
                         │
        ┌────────────────┴───────────────┐
        │                                │
 PLANNING MODE                    REFLECTION MODE
 curated fragments                 user memories
        │                                │
        └────────────────┬───────────────┘
                         │
                COMBINATORICS CORE
                         │
              Collection / State
                         │
          Relationship / Cluster Graph
                         │
                 Event History
                         │
                  AI Interpreter
                         │
           Interpretation + Delta
                         │
                   Saved States
```

The only real difference between modes is:

```text
INPUT SOURCE
+
PROMPTING STRATEGY
+
OUTPUT FORMAT
```

The core system should remain identical.

---

# 21. Minimal technical components

## Front end

One simple application.

Screens:

### Screen 1
Mode selection

Planning / Reflection

### Screen 2
Exploration workspace

Main area:
items

Bottom/right:
basket

### Screen 3
Interpretation panel

Current reading

### Screen 4
Saved state / result

That's enough.

---

# 22. Backend

You only need:

## A. Static item store

JSON is enough.

```text
planning_items.json
```

Around 60–100 records.

---

## B. Session store

For PoC:

- browser state
- simple database
- or lightweight backend

No account system required.

---

## C. LLM service

Three prompt types:

```text
INTERPRET_COLLECTION

EXPLAIN_DELTA

INTRODUCE_SURPRISE
```

Reflection adds:

```text
INTERPRET_MEMORY_COLLECTION
```

But architecturally this can still call the same interpretation function with different mode instructions.

---

# 23. Suggested internal API

Something as simple as:

```text
interpretState(
    mode,
    items,
    clusters,
    locks,
    previousState
)
```

returns:

```text
{
  interpretations: [
    {
      title,
      description,
      supportingItems
    }
  ],

  dominantRelations: [],

  deltaExplanation: "",

  suggestedNextMove: ""
}
```

---

# 24. Data representation

Use one common object schema.

```text
{
  "id": "item_01",
  "mode": "planning",
  "type": "object",
  "label": "Tea cup",
  "description": "A small ceramic tea cup",
  "tags": [
    "slow",
    "ritual",
    "local",
    "sensory"
  ]
}
```

Reflection:

```text
{
  "id": "memory_01",
  "mode": "reflection",
  "type": "memory",
  "label": "Rain at breakfast",
  "description": "Sat outside a breakfast shop while it rained",
  "tags": []
}
```

For reflection, AI may suggest tags.

But they remain internal or editable.

---

# 25. Minimal relationship representation

Do not build a knowledge graph system yet.

Use:

```text
cluster_id
item_ids
optional user label
```

Example:

```text
{
  "cluster": "c1",
  "items": [
    "tea",
    "rain",
    "bookstore"
  ]
}
```

The LLM can infer relationships at runtime.

---

# 26. Planning content architecture

For each planning atom, maintain:

```text
surface meaning
semantic dimensions
possible contrasts
possible Taipei associations
```

Example:

### Lantern

```text
surface:
lantern

dimensions:
night
atmosphere
warmth
street life
tradition
visual texture

contrasts:
daylight
minimalism
nature
quiet
```

This helps the Surprise function choose a meaningful contrast.

---

# 27. Surprise logic

Do not let the LLM randomly invent anything.

For MVP:

1. summarize dominant tags
2. identify underrepresented dimension
3. retrieve a contrasting candidate
4. ask AI to frame why it may be interesting.

Example:

Current collection heavily contains:

```text
quiet
slow
indoor
nostalgic
```

System introduces:

> baseball game

because it adds:

```text
loud
social
outdoor
contemporary
```

This makes surprise purposeful.

---

# 28. Interpretation logic

The LLM prompt should explicitly ask it to reason about:

### items individually

### relationships between items

### tension/contradictions

### dominant clusters

### locked elements

### changes since previous state

And produce:

> possible reading

not:

> definitive profile.

---

# 29. Delta logic

This deserves its own function.

Input:

```text
previous state
current state
action
```

Example:

```text
action:
REMOVE tea
```

Output:

> “The collection now emphasizes movement and discovery more than ritual and pause.”

This helps the user learn the semantic consequences of manipulation.

Without this, the system becomes:

> rearrange cards → get random AI paragraph.

Delta legibility is essential.

---

# 30. What to fake in the PoC

You should deliberately fake or simplify:

### Real attraction recommendations
Use curated examples.

### Route optimization
Do not build it.

### Weather
Use scenario cards if needed.

### Maps
Static or absent.

### Long-term memory
Session only.

### User profile
None.

### semantic search
Basic tags + LLM.

### photos
Optional.

### multimodal AI
Not necessary.

### physical objects
Do not build hardware yet.

A touchscreen/card UI is sufficient.

---

# 31. One curated Taipei dataset

For planning, construct one tiny world:

### approximately 80 atoms

Suggested balance:

```text
20 objects
15 atmospheres
15 activities
10 places/types of places
10 behaviors
10 surprising/contrasting items
```

You do not need full actual POI coverage.

The items should represent **experience dimensions**, not a tourism database.

---

# 32. MVP interface metaphor

Keep it simple.

Planning:

### Market table

Objects appear like small trinkets/cards.

Basket is always visible.

Reflection:

### Memory table

Same layout.

But objects look more like collected memories/cards.

Do not build:

- animated 3D stalls
- game world
- avatars
- elaborate marketplace navigation

Those can be added later if the mechanism works.

---

# 33. Minimal interaction states

Every item only needs:

```text
available
selected
locked
clustered
removed
```

No more.

---

# 34. Suggested PoC session length

Planning:

### 8–12 minutes

Reflection:

### 8–12 minutes

Enough time to experience:

- selection
- interpretation
- mutation
- revision
- saving.

If the mechanism requires 30 minutes before becoming interesting, it is too heavy for the first proof.

---

# 35. Minimum Planning Mode success journey

A successful demo should show:

```text
User selects:
tea
train
rain
bookstore

↓

AI interpretation

↓

user locks train

↓

adds night market

↓

AI explains changed direction

↓

user removes tea

↓

AI explains delta

↓

user groups:
[train + rain]
[bookstore + night market]

↓

AI offers 3 possible Taipei directions

↓

user saves one
```

That one flow proves almost the whole mechanism.

---

# 36. Minimum Reflection Mode success journey

```text
User adds:
rain at breakfast
lost umbrella
train ride
friend laughing
night market smell

↓

AI identifies 3 possible themes

↓

user chooses:
"ordinary moments"

↓

locks:
friend laughing

↓

groups:
[rain + umbrella]
[train + friend]

↓

AI reinterprets

↓

system asks:
"What are you missing?"

↓

user adds:
quiet temple

↓

AI creates final memory constellation
```

Same architecture.

Different meaning.

---

# 37. Evaluation criteria for the PoC

You do not need large-scale research yet.

Test around:

### 5–8 users per mode initially.

Ask:

## Mechanism comprehension

> Did they understand that changing pieces changes meaning?

## Agency

> Did they feel they were shaping the result?

## Emergence

> Did combinations reveal something they did not get from individual cards?

## Preference discovery

Planning:

> Did they discover a trip direction they had not articulated beforehand?

## Reflection value

Reflection:

> Did grouping memories reveal a connection or theme they had not previously noticed?

## AI usefulness

> Was the AI adding connections rather than simply restating selections?

## Trust

> Did users distinguish between “possible interpretation” and “the system telling me who I am”?

---

# 38. The most important A/B test

I would run one tiny comparison.

### Condition A

User selects 6 items.

System gives one interpretation once.

### Condition B

User selects 6 items and can:

- remove
- lock
- regroup
- add surprise
- see deltas.

If Condition B feels significantly more engaging, understandable and personally owned, then the **iterative Combinatronics mechanism** is doing real work.

Otherwise the system may simply be a dressed-up prompt generator.

---

# 39. MVP requirements summary

## Must have

- Planning mode
- Reflection mode
- same basket/state architecture
- curated planning atoms
- user-created reflection memories
- add
- remove
- lock
- group
- surprise
- save
- AI interpretation
- delta explanation
- 2–3 alternate readings
- lightweight session history

## Nice to have

- photos in Reflection
- drag-and-drop
- richer visual cards
- chronology toggle
- example Taipei locations
- simple export/share image

## Do not build yet

- actual itinerary engine
- real-time maps
- bookings
- social collaboration
- accounts
- personalization across trips
- physical smart objects
- full journaling
- recommendation ranking
- voice
- complex knowledge graph
- production analytics

---

# 40. Minimal architecture in one sentence

> **A shared stateful combinatorial workspace where travel-related fragments can be collected and rearranged, an AI interprets relationships and deltas between states, and mode-specific adapters turn the same mechanism into prospective trip exploration or retrospective memory reflection.**

That is the PoC.

Everything else can wait.