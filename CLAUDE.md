# Chef — Project Memory

## Problem & Solution

Home cooks cannot interact with screens mid-cook (dirty/wet hands). Chef is a hands-free voice assistant that:
1. Parses text recipes into a strict JSON step list (done once, server-side)
2. Pre-generates TTS audio for every step (cached on disk after first parse)
3. Handles navigation ("Next", "Back", step N) locally with zero latency
4. Uses LLM only for open-ended ad-hoc questions during cooking

## Architecture

```
pnpm monorepo (Turborepo)
├── apps/backend   — Express + Prisma + PostgreSQL + LLM service layer
├── apps/mobile    — Expo (React Native) + Expo Router + Zustand + TanStack Query + expo-audio
└── packages/shared — Zod schemas +  inferred TypeScript types (compiled via tsup)
```

### LLM Strategy: Ollama-first with OpenAI fallback

- **Primary**: Ollama running natively on dev Mac (`http://localhost:11434`, model: `llama3.1`)
- **Fallback**: OpenAI `gpt-4o-mini` — triggered on timeout or Ollama unavailability.
- **Timeout Policy**: 
  - Recipe Parsing (Heavy JSON generation): **15 seconds** timeout before fallback.
  - Ad-hoc Cooking Chat (Fast responses): **5 seconds** timeout before fallback.
- **Use cases for LLM**: (1) parse raw recipe text → `ParsedRecipe` JSON, (2) answer ad-hoc cooking questions in context.

### TTS Strategy (to be finalized in Step 2)

- Provider interface is abstract (`TTSService`) — concrete provider TBD.
- Audio files are generated once per recipe step and cached to `apps/backend/audio/`.
- **Mobile Sync**: Mobile client pre-downloads and caches all step audio files locally upon starting a cooking session to guarantee zero-latency voice feedback during playback.

### State management split (mobile)

| Concern | Tool | Reason |
|---|---|---|
| Cooking session (step index, active recipe) | Zustand | Local, instant, no network |
| Voice recognition state | Zustand | Same — needs sub-100ms update |
| Server data (recipes list, recipe details) | TanStack Query | Cache + loading/error states |

## Tech Stack & Versions

**Policy**: prefer stable releases ≥3 months old. Verify against npm before installing. No `@latest` installs.

| Layer | Tech | Notes |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | `.npmrc` hoisting is critical for Metro |
| Backend runtime | Node.js 20 LTS | |
| Backend framework | Express 4.x | Not v5 (newer) |
| ORM | Prisma 7.x | PostgreSQL 16 |
| Validation | Zod 3.x | Shared between backend and mobile |
| Mobile | Expo SDK 52, React Native 0.76 | New Architecture enabled |
| Mobile routing | Expo Router 4 | File-based, lives in `src/app/` |
| Mobile audio | expo-audio | expo-av is deprecated |
| Mobile state | Zustand 5 (local), TanStack Query 5 (server) | |
| Shared types | packages/shared (built with tsup) | |
| Build orchestration | Turborepo 2 | |

## Workspace Structure

```
chef/
├── .npmrc                   ← pnpm hoisting config (NEVER remove)
├── pnpm-workspace.yaml
├── package.json             ← private:true, root scripts
├── turbo.json               ← build pipeline
├── tsconfig.base.json       ← strict TS base, extended by all packages
├── docker-compose.yml       ← PostgreSQL only (Ollama runs native)
│
├── apps/backend/
│   ├── prisma/schema.prisma ← source of truth for DB schema
│   ├── src/
│   │   ├── index.ts         ← Express entry
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── llm/         ← OllamaService + OpenAIFallbackService
│   │   │   └── tts/         ← TTSService (provider-agnostic interface)
│   │   └── middleware/
│   └── .env.example
│
├── apps/mobile/
│   ├── metro.config.js      ← watches monorepoRoot, resolves workspace packages
│   ├── src/
│   │   ├── app/             ← Expo Router file-based screens
│   │   │   ├── _layout.tsx  ← root layout (QueryClientProvider)
│   │   │   └── (tabs)/
│   │   ├── components/
│   │   ├── stores/          ← Zustand stores
│   │   └── hooks/           ← TanStack Query hooks
│   └── .env.example
│
└── packages/shared/
    └── src/
        ├── schemas/recipe.ts  ← RecipeStepSchema, RecipeSchema, ParsedRecipeSchema
        ├── schemas/chat.ts    ← ChatMessageSchema, LLMRequestSchema
        └── index.ts           ← barrel + inferred type exports
```

## Core Constraints

1. **Never remove `.npmrc` hoisting rules** — Metro will break with cryptic errors
2. **`packages/shared` must be built before backend/mobile** — Turborepo handles this via `"dependsOn": ["^build"]`
3. **No `@latest` package installs** — always pin to a specific stable version
4. **No phantom dependencies** — every import must be listed in the package's own `package.json`
5. **All API request/response shapes go through Zod schemas in `packages/shared`** — no ad-hoc types
6. **TTS audio files are generated server-side and cached** — mobile never calls TTS directly
7. **LLM calls are proxied through backend** — API keys never reach the mobile client

## Development Workflow

```bash
# Start infrastructure
docker compose up -d          # postgres
ollama serve                  # in a separate terminal (native)
ollama pull llama3.1          # first time only

# Install dependencies (from repo root)
pnpm install

# Build shared package (required before backend/mobile dev)
pnpm --filter @chef/shared build

# Generate Prisma client
pnpm db:generate

# Run migrations (first time)
pnpm db:migrate

# Dev servers (separate terminals)
pnpm dev:backend              # tsx watch on port 3001
pnpm dev:mobile               # expo start
```
-==-=-=-=-
## Environment Files

- `apps/backend/.env` — copied from `.env.example`, contains DB URL + LLM keys
- `apps/mobile/.env` — copied from `.env.example`, contains `EXPO_PUBLIC_API_URL`

**Never commit `.env` files.** `.env.example` files are safe to commit (no real secrets).

## Key Architectural Decisions (Log)

| Date | Decision | Reason |
|---|---|---|
| 2026-06-09 | expo-audio over expo-av | expo-av deprecated in SDK 51+ |
| 2026-06-09 | Expo Router over React Navigation | File-based routing, Expo's current default |
| 2026-06-09 | Turborepo included | Enforces shared→app build order automatically |
| 2026-06-09 | Ollama native (not Docker) | Uses Apple Metal GPU for faster inference |
| 2026-06-09 | TTS provider TBD | Abstract TTSService interface, wire provider in Step 2 |

## Prisma v7 Configuration (CRITICAL)
- **Version**: Strictly using Prisma v7+ (Architecture without Rust engine).
- **Schema Constraint**: The `apps/backend/prisma/schema.prisma` file **MUST NOT** contain a `url` property inside the `datasource` block.
- **CLI Migrations**: All connection URLs for migrations, introspection, and CLI commands are managed strictly via `apps/backend/prisma.config.ts`.
- **Client Initialization**: `PrismaClient` does not automatically infer the database URL. When creating an instance, you **MUST** explicitly pass the connection URL into the constructor from environment variables:
  ```typescript
  const prisma = new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL }
    }
  });
  ```
- **Error Mitigation**: If you experience context confusion regarding the `url` property in `schema.prisma`, remember that this is the breaking change introduced in Prisma v7. Never attempt to add `url = env(...)` back into the schema file.


## Database & Data Flow Rules
- **ID Strategy**: Strictly use **UUIDv4** (`uuid()`) for all models to ensure offline-first compatibility and seamless mobile-backend synchronization. Never use `cuid`.
- **Cascade Deletion**: All relations (`Recipe -> RecipeStep`, `Recipe -> CookingSession`) must use `on_delete: Cascade`. Deleting a recipe must automatically clean up steps and active sessions.
- **Navigation Efficiency**: `RecipeStep` uses a composite unique constraint `@@unique([recipeId, order])`. When querying or mutating steps during voice navigation ("Next"/"Back"), always query using this composite key to leverage database indexing.

## **Core Language Pipeline**
- For heavy recipe parsing (`raw text -> JSON`), the backend pipelines text through English internally to maximize Ollama's JSON consistency and output quality.
- The structural fields in `RecipeStep` (instruction) are translated back to the User's target language before generating TTS audio and storing to the Database. Ad-hoc kitchen chat requests bypass this pipeline and answer directly in the User's language for sub-second latency.
