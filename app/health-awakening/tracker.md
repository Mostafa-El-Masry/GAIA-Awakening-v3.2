# Health Awakening · Tracker

Feature: Body Awakening · Health Core (v3.1) – Weeks 1–5

Route:
- `app/health-awakening/page.tsx` → main entry for Health Awakening

Client entry:
- `app/health-awakening/ClientPage.tsx`

Components:
- `app/health-awakening/components/TodayView.tsx`
- `app/health-awakening/components/DaySnapshotCard.tsx`
- `app/health-awakening/components/SleepCard.tsx`
- `app/health-awakening/components/WaterCard.tsx`
- `app/health-awakening/components/WalkingCard.tsx`
- `app/health-awakening/components/TrainingCard.tsx`
- `app/health-awakening/components/MoodCard.tsx`
- `app/health-awakening/components/HistoryList.tsx`

Lib:
- `app/health-awakening/lib/types.ts`
- `app/health-awakening/lib/clock.ts`
- `app/health-awakening/lib/mockData.ts`
- `app/health-awakening/lib/sleepStore.ts`
- `app/health-awakening/lib/waterStore.ts`
- `app/health-awakening/lib/walkStore.ts`
- `app/health-awakening/lib/trainingStore.ts`
- `app/health-awakening/lib/moodStore.ts`

Notes:
- Week 1: Health Day model, Today view, and vertical history timeline with mock data.
- Week 2: Sleep tracking is live using a Sleep / Wake button.
- Week 3: Water tracking is live with default & custom containers and per-day totals.
- Week 4: Walking tracking is live with Start / Stop sessions and an inactive streak indicator.
- Week 5: Training & Mood are live:
  - Training:
    - Per-day planned vs actual "volume" (aggregate units).
    - Stored as TrainingEntry records per day.
    - Daily Training completion % = actual / planned (capped between 0% and 200%).
  - Mood:
    - Daily 1–5 rating + short note.
    - Mood appears at the top of the Health day snapshot and in Recent days.
- Supabase + IndexedDB and full sync layer will be wired in Week 6.

- Week 6:
  - Persistence architecture:
    - Supabase (Postgres) as online source of truth.
    - Local cache via localStorage for Weeks 2–5 data structures.
  - Tables defined in `supabase-health-schema.sql`:
    - `health_sleep_sessions`
    - `health_water_entries`
    - `health_walk_sessions`
    - `health_training_entries`
    - `health_daily_mood`
  - Sync pattern:
    - On boot:
      - Build mock recent history, hydrate from local cache.
      - If Supabase is configured:
        - Fetch all Health tables.
        - Merge remote + local per id (or per day for Mood).
        - Save back into local cache.
        - Rebuild Health Day snapshots from merged data.
        - Push merged state back up to Supabase.
    - On change (Sleep, Water, Walking, Training, Mood):
      - Always write to local cache first.
      - If Supabase is configured:
        - Upsert the full Health payload for all categories.
  - Status indicator:
    - Small text under the Health clock:
      - `Local cache only`
      - `Syncing with Supabase…`
      - `Supabase + local cache`
      - `Local cache · Supabase unreachable`
