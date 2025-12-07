# Phase 2: Frontend Integration Plan

## 🎯 Objective
Connect the React frontend to the newly implemented backend services (Auth, Favorites, Collections).

## 📋 Task List

### 1. Authentication Infrastructure (Estimated: 4-6 hours) ✅ COMPLETE
- [x] **Auth Service**: Create `client/src/services/authService.js`
  - `login(email, password)`
  - `register(email, username, password)`
  - `logout()`
  - `refreshToken()`
- [x] **Auth Context**: Create `client/src/contexts/AuthContext.js`
  - Manage user state (user, token, loading, error)
  - Provide `login`, `register`, `logout` methods
- [x] **Axios Interceptor**: Configure global axios instance
  - Attach JWT token to requests
  - Handle 401 errors (auto-logout or refresh)

### 2. Authentication UI (Estimated: 6-8 hours) ✅ REFACTORED
- [x] **Simplified Authentication**: Removed server-based auth, using local-only mode
- [x] **Device ID System**: Automatic user identification without login
- [x] **Window Management**: Fixed close button and app launching
- [ ] **User Menu**: Update `MenuBar.js` to show User status (optional)

### 3. Favorites Integration (Estimated: 4-6 hours) - IN PROGRESS 🔄
- [x] **Favorites Service**: Created `client/src/services/favoritesService.js`
- [x] **Save Button**: Reusable `SaveButton` component integrated
- [x] **APOD Integration**: Save button added to `ApodApp.js`
- [x] **Favorites App**: Created `client/src/components/favorites/FavoritesApp.js`
- [ ] **Fix Favorites Loading**: Resolve "failed to fetch favorites" error
- [ ] **Verify Save Functionality**: Ensure APOD items save correctly

### 4. Collections Integration (Estimated: 6-8 hours) - IN PROGRESS 🔄
- [x] **Collections Service**: Created `client/src/services/collectionsService.js`
- [x] **Collections App**: Created `client/src/components/apps/CollectionsApp.js`
- [ ] **Fix Collection Creation**: Resolve error when creating collections
- [ ] **Styling Fixes**: Clean up UI styling issues

## 🚀 Execution Strategy
1.  Start with **Auth Infrastructure** (Context + Service).
2.  Build **Login/Register UI** to verify auth flow.
3.  Implement **Favorites** to test protected API calls.
4.  Build **Collections** for advanced features.

## ⚠️ Dependencies
- Backend services must be running (`npm start` in server).
- Database must be initialized (see `PROJECT_STATUS.md`).
