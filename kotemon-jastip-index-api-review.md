### Summary
Reviewed the consolidated landing page API implementation across backend routes/db utilities, shared types, and frontend API consumption for the new `/api/public/index` endpoint.

### Strengths
- Consolidated endpoint fetches settings, items, and quota in parallel to reduce latency (apps/api/src/routes/public.ts:251-255).
- Clear item grouping logic for latest/featured/popular/all in one place (apps/api/src/db/client.ts:319-340).
- Added a shared helper to convert Item → PublicItem with badge calculation (apps/api/src/routes/public.ts:19-55).
- Frontend now uses a single API call for landing page data, simplifying load flow (apps/web/src/App.tsx:149-151).

### Issues

#### Critical (Must Fix Before Merge)
- None found.

#### Important (Should Fix)
- **Response/usage mismatch:** Frontend expects `indexData.config.jastipCloseDate` but the `/api/public/index` response and typings don’t include it. This is a type/runtime mismatch and can break build or leave `closeDate` undefined in UI (apps/web/src/App.tsx:190-198; apps/web/src/api/client.ts:109-127; apps/api/src/types.ts:83-110). Add `jastipCloseDate` to the response (and types) or remove the usage.
- **Incomplete “all” dataset risk:** `getItemsForIndex()` hard-limits items to 1000, but the “all” list is used for search/filter. If items exceed 1000, users won’t see all items (apps/api/src/db/client.ts:319-341). Consider pagination or removing the hard cap for “all” (with safeguards).
- **Performance/scale:** Popular/featured sections are derived by filtering and sorting the full item list in memory. This is fine for small datasets but will grow expensive; consider DB-level `ORDER BY view_count DESC LIMIT 8` and a separate query for featured (apps/api/src/db/client.ts:326-334).
- **Testing coverage:** No tests added for the new endpoint, grouping logic, or response shape. Add at least route-level tests or schema validation to protect against regressions.

#### Minor (Nice to Have)
- **DRY conversion logic:** Badge/item transformation is duplicated in `/items` and `/items/:id`. Consider reusing `toPublicItem()` for those routes to reduce drift (apps/api/src/routes/public.ts:19-55, 109-145, 164-195).
- **Type reuse:** Frontend client defines the index response inline instead of reusing shared `IndexPageResponse`, which can cause drift (apps/web/src/api/client.ts:109-127). Consider importing the shared type.

### Recommendations
- Align `IndexPageResponse` and frontend usage by adding `jastipCloseDate` to the API response (or remove the UI dependency).
- Decide on a scalable strategy for “all” items (pagination or server-side search) rather than a hard-coded 1000 limit.
- Push “popular/featured” sorting into SQL for better scalability.
- Add route tests or a response schema contract to lock the endpoint shape and grouping counts.

### Assessment
**Ready to merge:** With fixes
**Reasoning:** Functionality is solid but there’s a response/type mismatch and scaling concerns around item limits and in-memory sorting that should be addressed before shipping.