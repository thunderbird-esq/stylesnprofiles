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
          label="EPIC Earth"
          icon={APPS['epic'].icon}
          onDoubleClick={() => openApp('epic')}
        />
        <DesktopIcon
          label="NASA Library"
          icon={APPS['library'].icon}
          onDoubleClick={() => openApp('library')}
        />
        <DesktopIcon
          label="Space Weather"
          icon={APPS['spaceweather'].icon}
          onDoubleClick={() => openApp('spaceweather')}
        />
        <DesktopIcon
          label="Earth Events"
          icon={APPS['earthevents'].icon}
          onDoubleClick={() => openApp('earthevents')}
        />
        <DesktopIcon
          label="Exoplanets"
          icon={APPS['exoplanets'].icon}
          onDoubleClick={() => openApp('exoplanets')}
        />
        <DesktopIcon
          label="Earth Viewer"
          icon={APPS['earthviewer'].icon}
          onDoubleClick={() => openApp('earthviewer')}
        />
        <DesktopIcon
          label="Bookmarks"
          icon={APPS['bookmarks'].icon}
          onDoubleClick={() => openApp('bookmarks')}
        />
      </div>

      {/* REHAB Folder - Apps needing API repair */}
      <div className="desktop-folder" style={{
        position: 'absolute',
        right: '20px',
        top: '40px',
        padding: '8px',
        border: '2px solid var(--secondary)',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '4px',
      }}>
        <div style={{
          fontSize: 'var(--font-size-caption)',
          color: 'var(--secondary)',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 'bold',
        }}>
          📁 REHAB
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <DesktopIcon
            label="Mars Rovers"
            icon={APPS['mars'].icon}
            onDoubleClick={() => openApp('mars')}
          />
          <DesktopIcon
            label="Techport"
            icon={APPS['techport'].icon}
            onDoubleClick={() => openApp('techport')}
          />
        </div>
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
