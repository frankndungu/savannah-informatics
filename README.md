# Clinic Stock Console

An internal stock console for a clinic supplies team: search the catalogue, filter and
sort it, open an item, and correct the stock count when a physical count disagrees with
the system.

**Live:** _[deployed URL]_

---

## Running locally

_[install, env, dev command]_

---

## Design

### Screens and layout

- The app has two screens: a stock list and an item detail. Both sit inside a shell containing a global header with the app title, signed-in user and a log out button.

- On wide screens the list is a two-column layout:
- A persisten filter sidebar on the left and paginated stock list on the right.
- At 360px the sidebar stacks above the list and the table becomes stacked cards.

- The detail screen shows the item's full metadata, gallery and correction form.
- The back link carries the list's query string, so returning restores the previous search, filter, sort and page.

### Components

**`FilterPanel`**

- Holds the debounced search input, category dropdown and sort control.
- It writes to the URL search params rather than local state.
- Any view can be reloaded or shared as a link.

**`StockList`**

- Renders the items as a table on wide screens and stacked cards on 360px width.
- Owns the loading state, empty state and error state with retry state.

**`Pagination`**

- Renders page control 'showing x to y of z' text.
- It reads and writes the page in the url.

**`ItemDetail`**

- Renders a single item by ID and lays out all the metadata, gallery and correction form.

**`StockCorrectionForm`**

- Manages the submit lifecycle.
- Idle, saving, failed, on success it writes the response into the query cache rather than invalidating and refetching.
- The API accepts PUT without storing it and refetch would visibly revert the user's correction.

**`UserMenu`**

- Header ui, name, role, logout. Logout clears the tokens and sends the user to the login screen.

**`AuthProvider`**

- Holds the tokens and guards authenticated routes.
- On a 401 refresh, it retries the original request.
- If the request fails the user is redirected to login with the current url saved.

---

### State

if the user refreshed right now, should this survive? Yes → URL. No → local. Is it a copy of something on the server? → cache.

**Server data** — the stock list, the category list, and individual items. Held in the
TanStack Query cache, keyed by the full query so that each combination of search,
category, sort and page is cached separately. Because the view is bound to a cache key
rather than to the most recent response, a slow response for a search the user has
already replaced lands in a different cache entry and cannot overwrite what is on screen.

After a stock correction, the response is written into the cache rather than invalidating
and refetching. The API accepts the PUT without storing it, so a refetch would show the
user's correction reverting seconds after they saved it.

**URL state** — search term, category, sort and page, all held in the query string. A
reload or a link pasted into chat has to reproduce the same view, which the scenario
calls for directly. The URL is the source of truth; the cache key is derived from it. The
item detail route carries the same parameters, so the back link restores the exact list
the user came from. `page` is converted to the API's `skip` at the fetch boundary, since
`page=2` is more legible in a shared link than `skip=10`.

**Local UI state** — the raw keystrokes in the search box before the debounce fires, the
open state of the mobile filter drawer, the active thumbnail on the detail page, and the
unsubmitted value in the stock correction form. These stay in component state. Writing
every keystroke to the URL would fill the browser history with every prefix the user
typed and break the back button, and UI-only toggles like the drawer have no meaning to
share through a link.

**Auth state** — the access and refresh tokens, held in memory in a React context
(`AuthProvider`).

Not cookies: `/auth/refresh` sets the `refreshToken` cookie with `Max-Age=60` while the
token it carries is valid for around 30 days. The cookie would be discarded a minute
after login, logging the user out every minute with no way to recover, and the cookies
are `HttpOnly` so the app cannot read them to work around it.

Not `localStorage`: anything running in the tab can read it, so a script injected by any
route could lift the tokens. Memory is harder to reach. The cost is that a hard reload
ends the session and the user signs in again, which I accepted as the safer trade.

---
