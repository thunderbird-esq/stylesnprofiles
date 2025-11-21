# Phase 2 Execution Plan: Frontend Integration + Lint Fixes

## 🎯 OBJECTIVES
1. Implement Frontend Authentication UI
2. Integrate Favorites functionality
3. Integrate Collections functionality
4. Resolve all lint errors

---

## 📋 TASK BREAKDOWN

### TRACK A: Lint Fixes (Immediate - High Priority)
**Estimated Time:** 30 minutes
**Blocking Issues:** IDE warnings, potential type safety issues

#### A1: Install TypeScript Type Definitions
- [ ] Install `@types/jest` for test files
- [ ] Install `@types/express` updates
- [ ] Install `@types/supertest` if needed

#### A2: Create Custom Type Definitions
- [ ] Create `server/types/express.d.ts` for req.user extension
- [ ] Create proper helmet/rate-limit imports

#### A3: Fix express-validator Type Issues
- [ ] Update error handling to use correct types
- [ ] Fix `err.path` → `err.param` or proper type

---

### TRACK B: Auth Infrastructure (Phase 2.1)
**Estimated Time:** 4-6 hours
**Dependencies:** None (can run parallel with Track A)

#### B1: Client-Side Auth Service
- [ ] Create `client/src/services/authService.js`
  - `login(email, password)` → POST /api/v1/auth/login
  - `register(email, username, password)` → POST /api/v1/auth/register
  - `logout()` → Clear local storage
  - `getCurrentUser()` → Get user from token
  - `getToken()` → Get JWT from localStorage
  - `setToken(token)` → Store JWT

#### B2: Auth Context
- [ ] Create `client/src/contexts/AuthContext.js`
  - State: `user`, `token`, `loading`, `error`
  - Methods: `login`, `register`, `logout`, `checkAuth`
  - Auto-check on mount (verify token validity)

#### B3: Axios Interceptor
- [ ] Update `client/src/services/nasaApi.js` or create new base
  - Add request interceptor to attach JWT token
  - Add response interceptor for 401 errors (auto-logout)
  - Create separate axios instance for auth vs NASA API

---

### TRACK C: Auth UI Components (Phase 2.2)
**Estimated Time:** 6-8 hours
**Dependencies:** Track B complete

#### C1: LoginWindow Component
- [ ] Create `client/src/components/system6/auth/LoginWindow.js`
  - Email input (System 6 styled)
  - Password input
  - Submit button
  - Error display
  - "Don't have an account?" link to register

#### C2: RegisterWindow Component
- [ ] Create `client/src/components/system6/auth/RegisterWindow.js`
  - Email input
  - Username input
  - Password input
  - Confirm password input
  - Submit button
  - Error display
  - "Already have an account?" link to login

#### C3: MenuBar Integration
- [ ] Update `client/src/components/system6/MenuBar.js`
  - Show "Login" when not authenticated
  - Show username + "Logout" when authenticated
  - Add user menu dropdown (optional)

#### C4: Desktop Integration
- [ ] Update `client/src/components/system6/Desktop.js`
  - Wrap with `AuthProvider`
  - Handle auth state changes

---

### TRACK D: Favorites Integration (Phase 2.3)
**Estimated Time:** 4-6 hours
**Dependencies:** Track C complete (needs auth)

#### D1: Favorites Service
- [ ] Create `client/src/services/favoritesService.js`
  - `getFavorites(page, limit, type)` → GET /api/v1/users/favorites
  - `addFavorite(itemData)` → POST /api/v1/users/favorites
  - `removeFavorite(itemId)` → DELETE /api/v1/users/favorites/:id
  - `getFavoriteById(itemId)` → GET /api/v1/users/favorites/:id

#### D2: SaveButton Component
- [ ] Create `client/src/components/common/SaveButton.js`
  - Heart icon (filled if saved, outline if not)
  - Click to save/unsave
  - Show loading state
  - Show error toast on failure
  - System 6 styled

#### D3: APOD Integration
- [ ] Update `client/src/components/apps/ApodApp.js`
  - Add SaveButton to each APOD
  - Check if current APOD is saved
  - Pass item data to SaveButton

#### D4: NeoWs Integration
- [ ] Update `client/src/components/apps/NeoWsApp.js`
  - Add SaveButton to each NEO
  - Same pattern as APOD

#### D5: FavoritesApp Component
- [ ] Create `client/src/components/apps/FavoritesApp.js`
  - List all saved favorites
  - Filter by type (APOD, NEO, MARS)
  - Pagination controls
  - Click to view details
  - Delete button for each item

#### D6: Desktop Integration
- [ ] Add FavoritesApp icon to Desktop
  - System 6 styled icon
  - Launch FavoritesApp window

---

### TRACK E: Collections Integration (Phase 2.4)
**Estimated Time:** 6-8 hours
**Dependencies:** Track D complete

#### E1: Collections Service
- [ ] Create `client/src/services/collectionsService.js`
  - `getCollections()` → GET /api/v1/users/collections
  - `createCollection(name, desc, isPublic)` → POST /api/v1/users/collections
  - `updateCollection(id, data)` → PATCH /api/v1/users/collections/:id
  - `deleteCollection(id)` → DELETE /api/v1/users/collections/:id
  - `getCollectionItems(id)` → GET /api/v1/users/collections/:id/items
  - `addItemToCollection(collectionId, itemId)` → POST
  - `removeItemFromCollection(collectionId, itemId)` → DELETE

#### E2: CollectionsApp Component
- [ ] Create `client/src/components/apps/CollectionsApp.js`
  - List all collections
  - "New Collection" button
  - Click collection to view items
  - Edit/Delete buttons

#### E3: CollectionDetailView
- [ ] Create sub-component for collection detail
  - Show collection name, description
  - List items in collection
  - "Add Item" dropdown (from favorites)
  - Remove item button
  - Drag & drop reordering (optional MVP)

#### E4: SaveButton Enhancement
- [ ] Update SaveButton component
  - Add "Add to Collection" dropdown
  - List user's collections
  - Quick-add to collection

---

## 🔄 EXECUTION STRATEGY

### Phase 1: Foundations (Parallel)
```
PARALLEL RUN:
├─ Track A (Lint Fixes)          [30 min]
└─ Track B (Auth Infrastructure) [4-6 hrs]
```

### Phase 2: Auth UI (Sequential)
```
SEQUENTIAL:
└─ Track C (Auth UI Components)  [6-8 hrs]
   - Depends on Track B
```

### Phase 3: Features (Sequential)
```
SEQUENTIAL:
├─ Track D (Favorites)           [4-6 hrs]
└─ Track E (Collections)         [6-8 hrs]
```

**Total Estimated Time:** 20-28 hours
**With Parallel Execution:** ~18-24 hours

---

## 🎯 SUCCESS CRITERIA

### Lint Fixes Complete When:
- [ ] Zero TypeScript errors in IDE
- [ ] All test files recognized by IDE
- [ ] No `Cannot find name 'jest'` errors

### Auth Complete When:
- [ ] User can register
- [ ] User can login
- [ ] JWT stored in localStorage
- [ ] MenuBar shows user status
- [ ] Protected routes redirect to login

### Favorites Complete When:
- [ ] User can save items from APOD/NEO apps
- [ ] SaveButton shows correct state
- [ ] FavoritesApp lists all saved items
- [ ] User can remove favorites

### Collections Complete When:
- [ ] User can create collections
- [ ] User can add favorites to collections
- [ ] CollectionsApp shows all collections
- [ ] User can view collection details

---

## 🚀 IMMEDIATE EXECUTION PLAN

1. **Start with Track A (Lint Fixes)** - Quick wins
2. **Parallel: Start Track B (Auth Infrastructure)** - Foundation
3. **Sequential: Track C → D → E** - Build features

---

*Created: 2025-11-21*
*Execution Mode: ULTRATHINK - Decisive & Parallel*
