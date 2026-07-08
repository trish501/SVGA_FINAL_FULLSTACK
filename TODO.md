# TODO: Convert SVGA Book Bank Admin Portal from Hardcoded Data to Live MongoDB

## Phase 0 — Repo audit + compatibility mapping
- [x] Identify all hardcoded/mock datasets in `src/app/pages/admin/AdminPortal.tsx` (Dashboard/Requests/Inventory/Students/Audit Logs/Notifications/Settings + navbar admin name + unread badge).
- [x] Verify existing admin REST endpoints: analytics, requests, return timeline, manual books.
- [x] Verify existing real challan endpoints + procurement workflow endpoints.
- [x] Inspect remaining backend middleware/auth shapes to correctly derive `admin name/role` for audit logging.

## Phase 1 — Add missing backend modules required by the requirement
- [x] Create MongoDB model: `AuditLog` (collection `audit_logs`) with server timestamps + admin linkage.
- [x] Create MongoDB model: `AdminSettings` (collection `settings`) for all Settings cards.
- [x] Create MongoDB model(s) needed for backups/restores (e.g., `BackupJob`).
- [x] Create admin notification unread endpoint (if admin notifications are not already supported): `GET /api/admin/notifications/unread-count` and `GET /api/admin/notifications`.
- [x] Add dashboard aggregation endpoints for charts/trends:
  - [x] Monthly request trends online vs manual
  - [x] Books added vs issued activity trends
  - [x] Books by category counts (categories derived dynamically)
  - [x] Dashboard KPI previous-period percent deltas

## Phase 2 — Add/extend backend endpoints for CRUD + cross-page consistency
- [x] Students admin CRUD + suspend/block + edit membershipStatus + search + pagination.
- [x] Audit-log insertion hooks on admin actions that already exist in the backend (request status, per-book decisions, return-date).

- [x] Inventory admin CRUD wired to real books + dynamic availability = total - currentlyIssued (based on Request/issued book tracking).
- [x] Export endpoints for Inventory and Audit Logs matching current filters.


## Phase 3 — Frontend refactor (remove all hardcoded values)
- [x] Replace `AdminPortal.tsx` mock state/constants with real data fetch hooks.
- [ ] Dashboard:yes
  - [ ] Replace KPI cards with live aggregates + percent deltas.
  - [ ] Replace recent approved list with query.
  - [ ] Replace due-for-return table with return timeline query + computed urgency.
  - [ ] Replace charts with live aggregation endpoints.
- [ ] Requests:
  - [ ] Replace request list + tabs counts + filters + search + pagination with API calls.
  - [ ] Replace challan generation view/final submit with real API calls.
  - [ ] Replace approve/reject + per-book decisions + procurement stage updates with backend calls.
- [ ] Inventory:
  - [ ] Replace inventory table with API-backed CRUD + search/filter/pagination.
  - [ ] Replace Add/Edit/Delete modals to call backend and invalidate queries.
  - [ ] Replace export/import to real export endpoints and implement import (CSV/XLSX as supported by backend).
- [ ] Students:
  - [ ] Replace student table with API-backed CRUD + filters + pagination.
  - [ ] Replace suspend/block/edit/delete actions with real calls + audit logging.
- [ ] Audit Logs:
  - [ ] Replace mock logs table with live query + search/filter + export.
- [ ] Settings:
  - [ ] Replace settings cards with load/save backed by DB.
  - [ ] Implement Configure flows + system health + backup listing.

## Phase 4 — Real-time sync / consistency
- [ ] Ensure query invalidation so Dashboard counts always match Requests tabs after updates.
- [ ] Option A: React Query invalidation strategy.
- [ ] Option B (if chosen): WebSockets/Socket.IO push updates.

## Phase 5 — README update
- [ ] Update `README.md` to reflect MongoDB (and correct architecture) after migration is complete.

