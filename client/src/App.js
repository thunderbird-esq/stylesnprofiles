import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import Desktop from './components/system6/Desktop';
import MenuBar from './components/system6/MenuBar';

/**
 * Main application component that renders the NASA System 6 desktop interface
 * @component
 * @returns {JSX.Element} The main application interface
 */
function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <div className="nasa-desktop">
          {/* System 6 Menu Bar */}
          <MenuBar />
          {/* Desktop Area */}
          <Desktop />
        </div>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
