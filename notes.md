## API Findings

### 1. Login — POST /auth/login

- Body: { username, password, expiresInMins }
- Returns both accessToken and refreshToken in the JSON body, plus user profile fields (id, username, email, firstName, lastName, image)
- Access token exp = 60s with expiresInMins: 1. Refresh token exp = -30 days.

Implications:

- auth state holds two tokens with very different lifetimes.
- The access token will expire mid-session, so the app needs a refresh-and-retry path rather than treating expiry as an error.

### 2. Token expiry — GET /auth/me

- Valid token: 200 + full user object
- Expired token: 401 with body {"message":"Token Expired!"}
- 401 response also clears accessToken/refreshToken cookies (Set-Cookie, 1970 expiry) DummyJSON supports cookie auth as well as Bearer headers. Using Bearer, deliberately, one mechanism only.
- Rate limit headers present: x-ratelimit-limit 100, remaining, reset (unix timestamp)

Implications:

- Interceptor keys off status 401. Message is a hint for expired vs invalid, not something to depend on.
- Rate limit gives debouncing a second justification beyond UX: unthrottled search-as-you-type could exhaust the budget.
- /auth/me returns far more of the user record than this console needs. Read only the fields used.

### 3. Token refresh — POST /auth/refresh

- Takes { refreshToken, expiresInMins } in body. Does NOT need the (dead) access token.
- Returns 200 with BOTH a new accessToken and a new refreshToken → rotation. Must store both on refresh, not just the access token.
- New access token honours expiresInMins (60s). New refresh token -30 days.
- Sets cookies too, but: refreshToken cookie has Max-Age=60 while the token inside it is valid ~30 days. Cookie lifetime and token lifetime disagree.
- Cookies are HttpOnly so JS cannot read them either.

Decision:

- Bearer tokens from the response body, held in memory, not cookies.
- The cookie path is unusable here — a 60s cookie carrying a 30-day token would log the user out every minute with no recovery.

### 4. Sorting

- sortBy/order work on /products AND /products/search
- Numeric fields sort numerically (stock: 100, 99, 98...)
- Case-insensitive on strings
- Strings sort lexically: "iPhone 6" > "iPhone 13". Expected, not a defect.

### 5. Category endpoint

- /products/category/{slug} — category is in the PATH, not a query param
- total: 16 for smartphones. select works.
- Totals vary by endpoint: 194 all / 23 search "phone" / 16 smartphones → read total from each response, never hardcode

### 6. Search + category — NOT COMBINABLE

- ?category= on /products/search is silently ignored. Same total (23), results from other categories entirely. No error.
- No endpoint accepts both a search term and a category.

DECISION NEEDED — see decision log.
Options: client-side filter (breaks total/pagination) / mutually exclusive
controls / disable filter during search / fetch category and search within it.

### 7. PUT /products/{id} - DOES NOT PERSIST

- PUT returns the updated object "stock: 42"
- Hit get immediately after it returns "stock": 99
- Mock API echoes the write but stores nothing

Implication:

- update the cache with the response instead of refreshing, values stay consistent everywhere in the session
- it will be lost on reload and we will document this as limitation

Tradeoff: a real backend

- The PUT returns the new value but stores nothing, so refetching after a save would visibly revert the user's change. I write the response into the cache instead, which keeps the app consistent for the session.
- A reload loses it, which I'd fix with a real backend, but that's outside this brief.

### 8. GET /products/categories

- Returns objects: { slug, name, url }. 24 categories, ~8 items each.
- Display name, query by slug.
- Small categories make "fetch category, filter client-side" viable for the search+category problem.
