# Clinic Stock Console

An internal stock console for a clinic supplies team: search the catalogue, filter and
sort it, open an item, and correct the stock count when a physical count disagrees with
the system.

**Live:** https://savannah-informatics-chi.vercel.app/

---

## Running locally

```bash
git clone https://github.com/frankndungu/savannah-informatics.git
cd savannah-informatics
npm install
npm run dev
```

No environment variables are needed. DummyJSON requires no key.

Sign in with `emilys` / `emilyspass`, or any user from https://dummyjson.com/users.

---

## Design

### Screens and layout

The app has two screens: a stock list and an item detail. Both sit inside a shell
containing a global header with the app title, the signed-in user and a log out button.

On wide screens the list is a two-column layout: a persistent filter sidebar on the
left, a paginated stock list on the right. At 360px the sidebar stacks above the list
and the row grid collapses to a single column.

The detail screen shows the item's record and the stock correction form. It does not
show the filter sidebar, because filters belong to the list screen rather than to a
single item. The back link carries the list's query string, so returning restores the
previous search, filter, sort and page.

### Components

**`StockListScreen`**
The whole list screen. Holds the debounced search input, the category filter and the
sort control, which write to the URL search parameters rather than to local state, so
any view can be reloaded or shared as a link. Also owns the list itself, its loading,
empty and error states, and pagination.

Search, filters, list and pagination are one component rather than four because they
share a single piece of state, the query, and splitting them would mean threading that
state and its setter through four files for no gain at this size.

**`ItemDetailScreen`**
Fetches a single item by id and lays out its record alongside the stock correction form.
Manages the submit lifecycle: idle, saving, failed. On success it writes the response
into the query cache rather than invalidating and refetching, because the API accepts
the PUT without storing it and a refetch would visibly revert the user's correction.

**`AppHeader`**
The signed-in user's name and a log out button. Logging out clears the tokens and the
user, and the route guard then sends them to the login screen.

**`RequireAuth`**
Guards the authenticated routes. When there is no signed-in user it redirects to the
login page with the current URL, query string included, saved as a `from` parameter so
the user returns to exactly where they were.

**`apiFetch`** (`src/lib/api.ts`)
Not a component, but the piece with the most logic in it. Attaches the access token to
every request. On a 401 it refreshes the token and retries the original request. If
several requests fail at once, only one refresh is sent and the rest wait on it.

---

### State

The test for any piece of state: if the user refreshed right now, should it survive?
Yes, it goes in the URL. No, it stays local. If it is a copy of something on the
server, it belongs in the cache.

**Server data** — the stock list, the category list, and individual items. Held in the
TanStack Query cache, keyed by the full query so that each combination of search,
category, sort and page is cached separately. Because the view is bound to a cache key
rather than to the most recent response, a slow response for a search the user has
already replaced lands in a different cache entry and cannot overwrite what is on
screen.

**URL state** — search term, category, sort and page, all held in the query string. A
reload or a link pasted into chat has to reproduce the same view, which the scenario
calls for directly. The URL is the source of truth; the cache key is derived from it.
The item detail route carries the same parameters, so the back link restores the exact
list the user came from. `page` is converted to the API's `skip` at the fetch boundary,
since `page=2` is more legible in a shared link than `skip=10`.

**Local UI state** — the raw keystrokes in the search box before the debounce fires, and
the unsubmitted value in the stock correction form. These stay in component state. The
search box has to feel instant on every keystroke, but only the settled value is a view
worth reproducing, so only that reaches the URL. URL updates use `router.replace` rather
than `push`, so refining a search does not fill the back stack with every prefix the
user typed.

**Auth state** — the access and refresh tokens are held in a module-level variable in
`src/lib/tokens.ts`, not in React state. The fetch wrapper has to read the current token
and replace it mid-request, and it is not a component, so both it and `AuthProvider`
read the same source. `AuthProvider` holds the signed-in user and exposes login and
logout.

Not cookies: `/auth/refresh` sets the `refreshToken` cookie with `Max-Age=60` while the
token it carries is valid for around 30 days. The cookie would be discarded a minute
after login, logging the user out every minute with no way to recover, and the cookies
are `HttpOnly` so the app cannot read them to work around it.

Not `localStorage`: anything running in the tab can read it, so a script injected by any
route could lift the tokens. Memory is harder to reach. The cost is that a hard reload
ends the session and the user signs in again, which I accepted as the safer trade. The
URL survives the reload and the login return path restores the view, so the user resumes
where they were rather than at page 1.

---

### Fetching, caching and invalidation

Data is fetched with TanStack Query. Each list query is keyed by the full set of URL
parameters, so every combination of search, category, sort and page is a separate cache
entry. The rendered view is bound to a key rather than to the most recent response. A
slow response for a search the user has already replaced lands in a different entry and
cannot appear on screen.

The search input is debounced by 400ms before it reaches the URL. This is partly a user
experience choice and partly a hard constraint. The API rate limits to 100 requests per
window, which unthrottled search as you type would exhaust.

While a new query loads, the previous results stay on screen dimmed rather than
collapsing to a loading state. On a slow connection the screen never goes blank between
keystrokes.

Nothing is invalidated after a stock correction. The response is written into the item's
cache entry instead, and item queries do not refetch within a session. The API does not
store writes, so a refetch could only discard the user's correction.

---

### Styling

Tailwind, with a small set of design tokens defined in `globals.css`: `paper`,
`surface`, `ink`, `muted`, `line` and `accent`. Components reference those names rather
than raw palette values, so the scheme is changed in one place.

No component library. The app needs a text input, a select, a button and a link, all of
which are native elements that are already keyboard accessible and announced correctly.
Pulling in a library would have added code I would have to explain for no behaviour I
was missing.

Type is IBM Plex Sans, chosen for its numerals. The main column of this app is stock
counts, and those are set in tabular figures so the digits line up down the column.

The app does not follow the device's dark mode. It is an internal tool used on shared
ward tablets, and the appearance should not change depending on whose device it is
running on.

---

### Accessibility

The app is built from semantic elements: real buttons, links, labels and lists. That
makes it reachable and announced without extra ARIA. Every input has an associated
label. Focus is never suppressed and is visible at every stop.

The result count sits in a live region, so a screen reader user hears the count change
after a search. Errors are announced with `role="alert"`. The list is marked `aria-busy`
while a new query loads.

Tested by completing a full task with the keyboard alone: search, filter, open an item,
save a correction. Also checked at 360px width.

---

## Decision log

**Search wins over the category filter, and the filter is disabled while a search is
active.**
The API cannot do both. `/products/search?q=` silently ignores a `category` parameter:
it returns the same total and results from other categories entirely, with no error. The
alternatives were filtering the search results in the browser, which breaks pagination
because `total` would then be wrong, or fetching a whole category and searching within it
client-side, which works only because categories here are small and would not survive a
real catalogue. I chose to let search take precedence and disable the category control
while a search is active, with a line in the UI saying why. The user loses the ability to
combine the two, but never sees results that silently contradict the controls.

**Tokens held in memory, not in cookies.**
The alternative was cookie-based auth, which DummyJSON supports. Rejected because
`/auth/refresh` sets the `refreshToken` cookie with `Max-Age=60` while the token inside
it is valid for about 30 days. The cookie would be discarded a minute after login, so a
user would be thrown back to the login screen every minute with no way to recover, which
is the exact failure the brief asks me to prevent. The cookies are also `HttpOnly`, so
the app cannot read them to work around it. Bearer tokens from the response body, held in
memory, are the only option that behaves correctly here.

**Cache write after a stock correction, not invalidate-and-refetch.**
The default after a successful write is to invalidate the query and refetch. Rejected
because `PUT /products/{id}` does not persist: it returns the updated object, but a `GET`
immediately after returns the original value. Refetching would visibly revert the user's
correction seconds after they saved it, which is worse than not showing it at all.
Writing the response into the item's cache entry keeps the detail view consistent for the
session. Two trade-offs: a full reload restores the original count, and the list still
holds the old count, so the two views can disagree until a reload. The UI says so next to
the form.

**No low-stock highlighting.**
The obvious move on a stock console is to flag items running low in red. Rejected because
the API has no reorder level and no availability field, so any threshold would be a
number I invented and presented to a supplies team as if it meant something. Sorting by
stock ascending surfaces the low items without inventing a rule. In a real system the
threshold would come per item from the catalogue.

**A back link instead of a breadcrumb.**
A breadcrumb such as Stock / Smartphones / iPhone 5s implies the category is a place you
can navigate back to. It isn't: the list state is a query, with search, category, sort
and page held together in the URL. Clicking "Smartphones" in a breadcrumb would drop the
user's search term and page position, breaking the requirement that they return to where
they were. A single back link carrying the whole query string restores the exact list
they came from.

**Scope cut to what I can defend.**
The brief says a smaller submission fully understood scores higher than a larger one that
cannot be defended. I dropped a component library, a mobile filter drawer, toast
notifications, an image gallery and skeleton loaders. Each would have added code to
explain without adding behaviour the brief asks for.

---

## Mock API limitations

**`PUT /products/{id}` does not persist.** The write returns the updated object but
stores nothing: a `GET` immediately after returns the original value. Corrections are
written into the query cache so the detail view stays consistent within a session, and
item queries do not refetch, since a refetch could only discard the correction. A full
reload restores the original count, and the list view still shows it. This is stated in
the UI next to the correction form.

**Category is ignored on search.** `/products/search?q=&category=` returns the same
results and the same total as the search alone, with no error. No endpoint accepts both a
search term and a category. The category control is disabled while a search is active,
with a line in the UI explaining why.

**The refresh cookie contradicts the token it carries.** `/auth/refresh` sets a
`refreshToken` cookie with `Max-Age=60` while the token inside it is valid for around 30
days. Cookie-based auth would therefore log the user out every minute with no recovery,
so the app uses Bearer tokens from the response body.

**Rate limited to 100 requests per window.** Responses carry `x-ratelimit-limit`,
`x-ratelimit-remaining` and `x-ratelimit-reset`. This is the second reason the search is
debounced: unthrottled search as you type would exhaust the budget during normal use.

**`/auth/me` returns the whole user record**, including fields a stock console has no
business holding. Only the few fields the header displays are read and kept.

---

## CI/CD

Deployed on Vercel at https://savannah-informatics-chi.vercel.app/. Production deploys
are triggered by merges to `main`.

On every pull request, GitHub Actions runs the formatter check, the linter, the test
suite, the production build, and a commit message check against Conventional Commits.
Any of these failing blocks the merge. `main` is protected by a ruleset requiring a pull
request and passing checks, so nothing reaches production without them.

The commit message check also runs locally through a husky `commit-msg` hook. A message
that does not conform fails before it becomes a commit.

---

## AI use and reflection

See [REFLECTION.md](./REFLECTION.md).
