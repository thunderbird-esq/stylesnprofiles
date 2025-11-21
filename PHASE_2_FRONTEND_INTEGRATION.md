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

### 2. Authentication UI (Estimated: 6-8 hours) ✅ COMPLETE
- [x] **Login Window**: Created `client/src/components/system6/auth/LoginWindow.js`
  - System 6 styled form
  - Error handling
- [ ] **Register Window**: Create `client/src/components/system6/auth/RegisterWindow.js`
- [ ] **User Menu**: Update `MenuBar.js` to show User status/Logout

### 3. Favorites Integration (Estimated: 4-6 hours) - READY
- [x] **Favorites Service**: Create `client/src/services/favoritesService.js`
- [ ] **Save Button**: Create reusable `SaveButton` component
- [ ] **APOD Integration**: Add Save button to `ApodApp.js`
- [ ] **Favorites App**: Create `client/src/components/apps/FavoritesApp.js`
  - List view of saved items
  - Filtering/Sorting

### 4. Collections Integration (Estimated: 6-8 hours) - READY
- [x] **Collections Service**: Create `client/src/services/collectionsService.js`
- [ ] **Collections App**: Create `client/src/components/apps/CollectionsApp.js`
  - Create/Edit collections
  - Drag & Drop items (if possible)

## 🚀 Execution Strategy
1.  Start with **Auth Infrastructure** (Context + Service).
2.  Build **Login/Register UI** to verify auth flow.
3.  Implement **Favorites** to test protected API calls.
4.  Build **Collections** for advanced features.

## ⚠️ Dependencies
- Backend services must be running (`npm start` in server).
- Database must be initialized (see `PROJECT_STATUS.md`).
