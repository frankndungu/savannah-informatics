# AI use and reflection

## 1. What I used AI for, per section

**Section 1 (Design).** I sketched the screens on paper first and decided the layout,
the components and where state lives. AI turned my sketch into an HTML mockup I could
tinker with, and pushed back on my reasoning. The first mockup had skeleton loaders,
animation and toast notifications. I cut all three and went minimal, because a smaller
app is one I can defend. AI also tightened the wording of my design write-up after I
had drafted it.

**Section 2 (Build).** Project configuration (husky, .gitattributes, Prettier, ESLint,
Vitest), the API client, the React components and the hooks. I directed the structure
and the decisions; AI wrote a lot of the code inside that structure.

**Section 3 (Deployment & CI/CD).** The GitHub Actions workflow and the husky hook
setup commands. I set up Vercel and the branch protection ruleset myself.

**Section 4.** None.

## 2. Tools and workflow

Claude in a chat. No spec-driven or agent framework. I structured the work myself:
probe the API in Postman first, then design, then get the tooling and pipeline green
on an empty app, then build features. Where I did not know a concept I asked for it to
be explained before I took any code, and I wrote my own notes on each one as I went.

## 3. Where AI improved the work

I asked what a race condition actually is and why debouncing was not enough. The answer
changed how I built search. I had assumed a debounce solved the problem. It does not:
it reduces the number of racing requests but two is still enough for a stale response
to land last. What actually fixes it is the cache key. Because the view is bound to a
key, a response for a query the user already replaced lands in a different cache entry
and cannot reach the screen. I would have shipped the debounce and called it done.

## 4. Where AI was wrong, and how I caught it

- Code that ran fine in dev and failed the production build on `useSearchParams`
  needing a Suspense boundary. Caught by running `npm run build` locally. I then added
  the build to CI so it cannot reach the deploy again.
- Unused imports in `auth-context.tsx`, caught by the ESLint rule I had chosen.
- I was told to write the commit-msg hook without fixing the pre-commit hook first, so
  my first hook test failed at the wrong step and proved nothing.

## 5. Two decisions I made without AI

Dropping the component library. I counted what I actually needed and it was an input,
a select and a button. Native elements are keyboard accessible already and there is
less code I have to answer for.

Removing the low-stock badges. Flagging low stock in red is the obvious move on a stock
console, but the API has no reorder level and no availability field, so any threshold
would be a number I invented and presented to a supplies team as if it meant something.
Sorting by stock ascending surfaces the low items without inventing a rule.

## 6. What I would struggle to defend

The single-flight refresh guard in `api.ts`. I understand what it does: if several
requests fail with a 401 at once, the first one starts the refresh and the rest wait on
the same promise instead of firing their own. I have not hit the failure it prevents,
so I am reasoning from an explanation rather than from experience.

Also the list cache after a stock correction. I write the response into the item's
cache entry, but the list still holds the old count, so the two can disagree until a
reload. I knew about it and chose not to fix it under time pressure rather than not
noticing.

## Time spent

Roughly 18 hours across five days.

- **Thursday** (~4h) — Read the brief, worked through concepts I did not know
  (race conditions, debouncing, token refresh), probed the auth endpoints and
  confirmed the expiry and refresh behaviour.
- **Friday** (~4h) — Finished the API probe in Postman: sorting, categories,
  search and category combination, the PUT. Paper sketch, then an HTML mockup
  covering every screen state.
- **Saturday** (~3h) — Wrote Section 1: screens, components, state ownership,
  and the decision log.
- **Sunday** (~5h) — Scaffolded the app, set up the full tooling chain
  (Prettier, ESLint, commitlint, husky, Vitest), got CI green and blocking,
  added branch protection, deployed to Vercel, built auth and login.
- **Monday** (~4h) — Route guard, stock list, item detail and stock correction,
  a second test file, the slow and error path checks, and the remaining README
  sections.

Not rounded down. The design and API probe were a large share of it and I have
counted them.
