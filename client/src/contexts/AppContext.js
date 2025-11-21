import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import ApodApp from '../components/apps/ApodApp';
import NeoWsApp from '../components/apps/NeoWsApp';
import ResourceNavigatorApp from '../components/apps/ResourceNavigatorApp';
import ProfileApp from '../components/apps/ProfileApp';
import FavoritesApp from '../components/favorites/FavoritesApp';
import CollectionsApp from '../components/apps/CollectionsApp';

const AppContext = createContext();

// App definitions with System 6 window properties
const APPS = {
  apod: {
    id: 'apod',
    title: 'APOD Viewer',
    icon: '🖼️', // Will be replaced with proper System 6 icon
    component: props => <ApodApp {...props} />,
    defaultWidth: 500,
    defaultHeight: 400,
  },
  neo: {
    id: 'neo',
    title: 'NEO Tracker',
    icon: '☄️', // Will be replaced with proper System 6 icon
    component: props => <NeoWsApp {...props} />,
    defaultWidth: 500,
    defaultHeight: 400,
  },
  resources: {
    id: 'resources',
    title: 'Resource Navigator',
    icon: '📊', // Will be replaced with proper System 6 icon
    component: props => <ResourceNavigatorApp {...props} />,
    defaultWidth: 500,
    defaultHeight: 400,
  },
  profile: {
    id: 'profile',
    title: 'My Profile',
    icon: '👤', // Will be replaced with proper System 6 icon
    component: props => <ProfileApp {...props} />,
    defaultWidth: 400,
    defaultHeight: 300,
    requiresAuth: true,
  },
  favorites: {
    id: 'favorites',
    title: 'Favorites & Collections',
    icon: '⭐', // Will be replaced with proper System 6 icon
    component: props => <FavoritesApp {...props} />,
    defaultWidth: 800,
    defaultHeight: 600,
    requiresAuth: true,
  },
  collections: {
    id: 'collections',
    title: 'My Collections',
    icon: '📁', // Will be replaced with proper System 6 icon
    component: props => <CollectionsApp {...props} />,
    defaultWidth: 700,
    defaultHeight: 500,
    requiresAuth: true,
  },
};

export const AppProvider = ({ children }) => {
  const [windows, setWindows] = useState([]);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [activeWindow, setActiveWindow] = useState(null);
  const { isAuthenticated } = useAuth();

  const openApp = useCallback(
    appId => {
      const app = APPS[appId];
      if (!app) return;

      // Check if app requires authentication
      if (app.requiresAuth && !isAuthenticated()) {
        alert('Please log in to access this application.');
        return;
      }

      const newWindowId = `${appId}-${Date.now()}`;
      const newZIndex = nextZIndex + 1;

      const newWindow = {
        ...app,
        windowId: newWindowId,
        zIndex: newZIndex,
        x: 100 + Math.random() * 200,
        y: 50 + Math.random() * 100,
      };

      setWindows(prev => [...prev, newWindow]);
      setNextZIndex(newZIndex);
      setActiveWindow(newWindowId);
    },
    [nextZIndex, isAuthenticated],
  );

  const closeApp = useCallback(
    windowId => {
      setWindows(prev => prev.filter(w => w.windowId !== windowId));
      if (activeWindow === windowId) {
        setActiveWindow(null);
      }
    },
    [activeWindow],
  );

  const focusApp = useCallback(
    windowId => {
      if (activeWindow === windowId) return;

      const newZIndex = nextZIndex + 1;
      setNextZIndex(newZIndex);
      setWindows(prev =>
        prev.map(w => (w.windowId === windowId ? { ...w, zIndex: newZIndex } : w)),
      );
      setActiveWindow(windowId);
    },
    [activeWindow, nextZIndex],
  );

  const value = {
    windows,
    openApp,
    closeApp,
    focusApp,
    activeWindow,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useApps = () => {
  return useContext(AppContext);
};

export const useDesktop = () => {
  return { APPS };
};
