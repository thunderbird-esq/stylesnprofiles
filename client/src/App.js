import React from 'react';
import Desktop from './components/system6/Desktop';
import MenuBar from './components/system6/MenuBar';

/**
 * Main application component that renders the NASA System 6 desktop interface
 * @component
 * @returns {JSX.Element} The main application interface
 */
function App() {
  return (
    <div className="nasa-desktop">
      <MenuBar />
      <Desktop />
    </div>
  );
}

export default App;
