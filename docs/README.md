# Docs — FamilyRoots FE

Struktur folder memisahkan **dokumentasi referensi** dari **request spek ke Backend**, plus status selesai / belum.

```
docs/
├── guides/                 # Docs beneran (panduan FE / referensi API)
├── prompts/                # Prompt kerja FE (bukan spek BE)
├── be-requests/
│   ├── done/               # Request BE yang sudah diimplementasi
│   └── pending/            # Request BE yang masih terbuka
├── seed/                   # Artifact seed mock family
└── templates/              # Template import CSV/JSON
```

---

## Guides (docs beneran)

| File | Isi |
|------|-----|
| [`guides/FE-API-INTEGRATION.md`](./guides/FE-API-INTEGRATION.md) | Panduan integrasi API di FE (auth, persons, tree, types, checklist) |
| [`guides/PERSON-API-TREE.md`](./guides/PERSON-API-TREE.md) | Detail list/pagination & tree graph |

## Prompts FE

| File | Isi | Status FE |
|------|-----|-----------|
| [`prompts/PERSONS-IMPORT-FE-PROMPT.md`](./prompts/PERSONS-IMPORT-FE-PROMPT.md) | Prompt integrasi UI import persons | ✅ terintegrasi (`personApi` + modal import) |

---

## BE requests — done

Spek yang ditulis untuk BE dan sudah live (BE + dikonsumsi FE).

| File | Modul |
|------|--------|
| [`be-requests/done/BE-AUTH-API-PLAN.md`](./be-requests/done/BE-AUTH-API-PLAN.md) | Auth + person schema (rencana part) |
| [`be-requests/done/BE-MOCK-SEEDER.md`](./be-requests/done/BE-MOCK-SEEDER.md) | Seeder dari mock FE |
| [`be-requests/done/MAP-EVENTS-MEMORIAM-API.md`](./be-requests/done/MAP-EVENTS-MEMORIAM-API.md) | Map, Events, In Memoriam |
| [`be-requests/done/EVENTS-MEMORIAM-OWNER-CRUD-API.md`](./be-requests/done/EVENTS-MEMORIAM-OWNER-CRUD-API.md) | Owner-only update/delete event & tribute |
| [`be-requests/done/MEDIA-UPLOAD-API.md`](./be-requests/done/MEDIA-UPLOAD-API.md) | Upload / delete / cleanup media |
| [`be-requests/done/DASHBOARD-API.md`](./be-requests/done/DASHBOARD-API.md) | Aggregat dashboard |
| [`be-requests/done/PERSONS-IMPORT-API.md`](./be-requests/done/PERSONS-IMPORT-API.md) | Bulk import persons (job + progress) |

## BE requests — pending

Belum ada request terbuka. File spek baru untuk BE taruh di `be-requests/pending/`, lalu pindah ke `done/` setelah BE + FE selesai.

---

## Assets

| Path | Isi |
|------|-----|
| [`seed/mock-family-seed.json`](./seed/mock-family-seed.json) | Dump 95 persons untuk seeder BE |
| [`templates/`](./templates/) | Template & contoh import persons |
