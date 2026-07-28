# Docs — FamilyRoots FE

Struktur folder memisahkan **dokumentasi referensi** dari **request spek** (FE ↔ BE).

```
docs/
├── guides/                 # Docs beneran (panduan FE / referensi API)
├── prompts/                # Prompt kerja FE (bukan spek BE)
├── requests/
│   ├── from-fe/            # Request spek dari FE → BE
│   │   ├── done/
│   │   └── pending/
│   ├── from-be/            # Spek / prompt dari BE → FE
│   │   ├── done/
│   │   └── pending/
│   └── to-be/              # Kontrak API target (belum diimplementasi BE)
├── seed/
└── templates/
```

---

## Guides

| File | Isi |
|------|-----|
| [`guides/FE-API-INTEGRATION.md`](./guides/FE-API-INTEGRATION.md) | Panduan integrasi API di FE |
| [`guides/PERSON-API-TREE.md`](./guides/PERSON-API-TREE.md) | Detail list/pagination & tree graph |
| [`guides/PERSONS-IMPORT-FE-PROMPT.md`](./guides/PERSONS-IMPORT-FE-PROMPT.md) | Prompt integrasi UI import persons |

## Prompts FE

| File | Isi |
|------|-----|
| [`prompts/admin-panel-spec.md`](./prompts/admin-panel-spec.md) | Spek UI Admin Panel (FE) |

---

## Requests to-be (kontrak target)

| File | Modul |
|------|--------|
| [`requests/to-be/MONEY-TRACK-API.md`](./requests/to-be/MONEY-TRACK-API.md) | Money Track API — siap dikerjakan BE |

## Requests from FE — done

| File | Modul |
|------|--------|
| [`requests/from-fe/done/BE-AUTH-API-PLAN.md`](./requests/from-fe/done/BE-AUTH-API-PLAN.md) | Auth + person schema |
| [`requests/from-fe/done/BE-MOCK-SEEDER.md`](./requests/from-fe/done/BE-MOCK-SEEDER.md) | Seeder dari mock FE |
| [`requests/from-fe/done/MAP-EVENTS-MEMORIAM-API.md`](./requests/from-fe/done/MAP-EVENTS-MEMORIAM-API.md) | Map, Events, In Memoriam |
| [`requests/from-fe/done/EVENTS-MEMORIAM-OWNER-CRUD-API.md`](./requests/from-fe/done/EVENTS-MEMORIAM-OWNER-CRUD-API.md) | Owner-only CRUD event & tribute |
| [`requests/from-fe/done/MEDIA-UPLOAD-API.md`](./requests/from-fe/done/MEDIA-UPLOAD-API.md) | Upload / delete / cleanup media |
| [`requests/from-fe/done/DASHBOARD-API.md`](./requests/from-fe/done/DASHBOARD-API.md) | Aggregat dashboard |
| [`requests/from-fe/done/PERSONS-IMPORT-API.md`](./requests/from-fe/done/PERSONS-IMPORT-API.md) | Bulk import persons |
| [`requests/from-fe/done/ADMIN-PANEL-API.md`](./requests/from-fe/done/ADMIN-PANEL-API.md) | Admin Panel API v1 |
| [`requests/from-fe/done/NOTIFICATIONS-INBOX-API.md`](./requests/from-fe/done/NOTIFICATIONS-INBOX-API.md) | Notifikasi inbox (modal + badge) |

## Requests from FE — pending

| File | Modul |
|------|--------|
| [`requests/from-fe/pending/PRD-Money-Track.md`](./requests/from-fe/pending/PRD-Money-Track.md) | PRD Money Track |
| [`requests/from-fe/pending/money-track-mockup.html`](./requests/from-fe/pending/money-track-mockup.html) | Mockup UI |
| [`requests/from-fe/pending/money-track-ux-flow.html`](./requests/from-fe/pending/money-track-ux-flow.html) | UX flow input uang |

## Requests from BE — done

| File | Modul |
|------|--------|
| [`requests/from-be/done/WEB-PUSH-FE-PROMPT.md`](./requests/from-be/done/WEB-PUSH-FE-PROMPT.md) | Web Push (VAPID) — FE wired |
| [`requests/from-be/done/SECONDARY-PASSWORD-FE-PROMPT.md`](./requests/from-be/done/SECONDARY-PASSWORD-FE-PROMPT.md) | Password kedua (Admin / Money / Household) |

## Requests from BE — pending

Belum ada. Taruh prompt dari BE di `requests/from-be/pending/`.

---

## Assets

| Path | Isi |
|------|-----|
| [`seed/mock-family-seed.json`](./seed/mock-family-seed.json) | Dump persons untuk seeder BE |
| [`templates/`](./templates/) | Template & contoh import persons |
