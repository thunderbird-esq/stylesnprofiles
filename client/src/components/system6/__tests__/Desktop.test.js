// Mock the AppContext before imports
const mockOpenApp = jest.fn();
const mockWindows = [];

jest.mock('../../../contexts/AppContext', () => ({
  useApps: () => ({
    windows: mockWindows,
    openApp: mockOpenApp,
  }),
  useDesktop: () => ({
    APPS: {
      apod: {
        icon: 'apod-icon.png',
        title: 'APOD Viewer',
        component: jest.fn(() => <div>APOD Component</div>),
      },
      neo: {
        icon: 'neo-icon.png',
        title: 'NEO Tracker',
        component: jest.fn(() => <div>NEO Component</div>),
      },
      resources: {
        icon: 'resources-icon.png',
        title: 'Resource Nav',
        component: jest.fn(() => <div>Resources Component</div>),
      },
    },
  }),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Desktop from '../Desktop';

// Mock DesktopIcon component
jest.mock('../DesktopIcon', () => {
  return function MockDesktopIcon({ label, icon, onDoubleClick }) {
    return (
      <div
        data-testid={`desktop-icon-${label.toLowerCase().replace(/\s+/g, '-')}`}
        onDoubleClick={onDoubleClick}
      >
        <img src={icon} alt={label} />
        <span>{label}</span>
      </div>
    );
  };
});

// Mock Window component
jest.mock('../Window', () => {
  return function MockWindow({ children, windowId, title }) {
    return (
      <div data-testid={`window-${windowId}`}>
        <div className="window-title">{title}</div>
        {children}
      </div>
    );
  };
});

describe('Desktop Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders desktop with correct structure', () => {
    render(<Desktop />);

    const desktop = screen.getByRole('main');
    expect(desktop).toHaveClass('nasa-desktop');

    const iconsContainer = desktop.querySelector('.desktop-icons');
    expect(iconsContainer).toBeInTheDocument();
  });

  test('renders all three desktop icons', () => {
    render(<Desktop />);

    expect(screen.getByTestId('desktop-icon-apod-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-icon-neo-tracker')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-icon-resource-nav')).toBeInTheDocument();
  });

  test('desktop icons have correct labels', () => {
    render(<Desktop />);

    expect(screen.getByText('APOD Viewer')).toBeInTheDocument();
    expect(screen.getByText('NEO Tracker')).toBeInTheDocument();
    expect(screen.getByText('Resource Nav')).toBeInTheDocument();
  });

  test('calls openApp with correct app ID when APOD icon is double-clicked', () => {
    render(<Desktop />);

    const apodIcon = screen.getByTestId('desktop-icon-apod-viewer');
    fireEvent.doubleClick(apodIcon);

    expect(mockOpenApp).toHaveBeenCalledTimes(1);
    expect(mockOpenApp).toHaveBeenCalledWith('apod');
  });

  test('calls openApp with correct app ID when NEO icon is double-clicked', () => {
    render(<Desktop />);

    const neoIcon = screen.getByTestId('desktop-icon-neo-tracker');
    fireEvent.doubleClick(neoIcon);

    expect(mockOpenApp).toHaveBeenCalledTimes(1);
    expect(mockOpenApp).toHaveBeenCalledWith('neo');
  });

  test('calls openApp with correct app ID when Resources icon is double-clicked', () => {
    render(<Desktop />);

    const resourcesIcon = screen.getByTestId('desktop-icon-resource-nav');
    fireEvent.doubleClick(resourcesIcon);

    expect(mockOpenApp).toHaveBeenCalledTimes(1);
    expect(mockOpenApp).toHaveBeenCalledWith('resources');
  });

  test('does not render any windows when no windows are open', () => {
    render(<Desktop />);

    expect(screen.queryAllByTestId(/window-/)).toHaveLength(0);
  });

  test('renders open windows when windows array is populated', () => {
    // Override the mock to include windows
    const mockWindowsWithContent = [
      {
        windowId: 'window-1',
        title: 'Test Window 1',
        zIndex: 1,
        x: 100,
        y: 100,
        defaultWidth: 400,
        defaultHeight: 300,
        component: jest.fn(() => <div>Test Component 1</div>),
      },
      {
        windowId: 'window-2',
        title: 'Test Window 2',
        zIndex: 2,
        x: 200,
        y: 200,
        defaultWidth: 500,
        defaultHeight: 400,
        component: jest.fn(() => <div>Test Component 2</div>),
      },
    ];

    // Clear the mock and set up new implementation
    mockWindows.splice(0, mockWindows.length, ...mockWindowsWithContent);

    render(<Desktop />);

    expect(screen.getByTestId('window-window-1')).toBeInTheDocument();
    expect(screen.getByTestId('window-window-2')).toBeInTheDocument();
    expect(screen.getByText('Test Component 1')).toBeInTheDocument();
    expect(screen.getByText('Test Component 2')).toBeInTheDocument();
    
    // Reset the mock
    mockWindows.splice(0, mockWindows.length);
  });

  test('passes correct props to Window components', () => {
    const mockWindowsWithProps = [
      {
        windowId: 'test-window',
        title: 'Test Window',
        zIndex: 5,
        x: 50,
        y: 75,
        defaultWidth: 600,
        defaultHeight: 450,
        component: jest.fn(() => <div>Test Content</div>),
      },
    ];

    // Clear the mock and set up new implementation
    mockWindows.splice(0, mockWindows.length, ...mockWindowsWithProps);

    render(<Desktop />);

    const windowElement = screen.getByTestId('window-test-window');
    expect(windowElement).toBeInTheDocument();
    expect(screen.getByText('Test Window')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    
    // Reset the mock
    mockWindows.splice(0, mockWindows.length);
  });

  test('desktop icons are rendered in correct order', () => {
    render(<Desktop />);

    const iconsContainer = screen.getByRole('main').querySelector('.desktop-icons');
    const icons = iconsContainer.children;

    expect(icons).toHaveLength(3);
    expect(icons[0]).toHaveAttribute('data-testid', 'desktop-icon-apod-viewer');
    expect(icons[1]).toHaveAttribute('data-testid', 'desktop-icon-neo-tracker');
    expect(icons[2]).toHaveAttribute('data-testid', 'desktop-icon-resource-nav');
  });

  test('handles multiple rapid double-clicks on icons', () => {
    render(<Desktop />);

    const apodIcon = screen.getByTestId('desktop-icon-apod-viewer');

    // Simulate rapid double-clicks
    fireEvent.doubleClick(apodIcon);
    fireEvent.doubleClick(apodIcon);
    fireEvent.doubleClick(apodIcon);

    expect(mockOpenApp).toHaveBeenCalledTimes(3);
    expect(mockOpenApp).toHaveBeenCalledWith('apod');
  });
});
