import React from 'react';
import { useApps, useDesktop } from '../../contexts/AppContext';
import DesktopIcon from './DesktopIcon';
import Window from './Window';

/**
 * Desktop component that renders desktop icons and manages application windows
 * @component
 * @returns {JSX.Element} The desktop interface with icons and windows
 */
export default function Desktop() {
  const { windows, openApp } = useApps();
  const { APPS } = useDesktop();

  return (
    <main className="nasa-desktop">
      {/* Render Desktop Icons */}
      <div className="desktop-icons">
        <DesktopIcon
          label="APOD Viewer"
          icon={APPS['apod'].icon}
          onDoubleClick={() => openApp('apod')}
        />
        <DesktopIcon
          label="NEO Tracker"
          icon={APPS['neo'].icon}
          onDoubleClick={() => openApp('neo')}
        />
        <DesktopIcon
          label="Resource Nav"
          icon={APPS['resources'].icon}
          onDoubleClick={() => openApp('resources')}
        />
      </div>

      {/* Render Open Windows */}
      {windows.map(win => (
        <Window
          key={win.windowId}
          windowId={win.windowId}
          title={win.title}
          zIndex={win.zIndex}
          x={win.x}
          y={win.y}
          width={win.defaultWidth}
          height={win.defaultHeight}
        >
          {/* Render the component associated with this window */}
          {win.component({ windowId: win.windowId })}
        </Window>
      ))}
    </main>
  );
}
