import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Window from '../Window';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock the AppContext
const mockCloseApp = jest.fn();
const mockFocusApp = jest.fn();
const mockActiveWindow = null;

jest.mock('../../contexts/AppContext', () => ({
  useApps: () => ({
    closeApp: mockCloseApp,
    focusApp: mockFocusApp,
    activeWindow: mockActiveWindow,
  }),
}));

describe('Window Component', () => {
  const defaultProps = {
    title: 'Test Window',
    windowId: 'test-window-1',
    zIndex: 1,
    children: <div>Test Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM styles
    document.body.style.userSelect = '';
  });

  afterEach(() => {
    // Clean up any remaining event listeners
    document.body.innerHTML = '';
    document.body.style.userSelect = '';
  });

  test('renders window with correct structure', () => {
    render(<Window {...defaultProps} />);
    
    const window = screen.getByRole('button');
    expect(window).toHaveClass('window', 'nasa-window');
  });

  test('renders title bar with correct elements', () => {
    render(<Window {...defaultProps} />);
    
    const titleBar = screen.getByRole('button').querySelector('.title-bar');
    expect(titleBar).toBeInTheDocument();
    
    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toHaveClass('close');
    
    const resizeButton = screen.getByLabelText('Resize');
    expect(resizeButton).toHaveClass('resize');
    
    const title = screen.getByText('Test Window');
    expect(title).toHaveClass('title', 'font-chicago');
  });

  test('renders window content', () => {
    render(<Window {...defaultProps} />);
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    
    const contentPane = screen.getByText('Test Content').parentElement;
    expect(contentPane).toHaveClass('window-pane', 'nasa-window-content');
  });

  test('renders separator between title bar and content', () => {
    render(<Window {...defaultProps} />);
    
    const separator = screen.getByRole('button').querySelector('.separator');
    expect(separator).toBeInTheDocument();
  });

  test('calls focusApp when window is clicked', () => {
    render(<Window {...defaultProps} />);
    
    const window = screen.getByRole('button');
    fireEvent.mouseDown(window);
    
    expect(mockFocusApp).toHaveBeenCalledTimes(1);
    expect(mockFocusApp).toHaveBeenCalledWith('test-window-1');
  });

  test('calls closeApp when close button is clicked', () => {
    render(<Window {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(mockCloseApp).toHaveBeenCalledTimes(1);
    expect(mockCloseApp).toHaveBeenCalledWith('test-window-1');
  });

  test('close button click stops propagation', () => {
    render(<Window {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close');
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');
    
    fireEvent(closeButton, clickEvent);
    
    expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
  });

  test('window has correct default dimensions and position', () => {
    render(<Window {...defaultProps} />);
    
    const window = screen.getByRole('button');
    expect(window).toHaveStyle({
      width: '500px',
      height: '400px',
      left: '100px',
      top: '100px',
    });
  });

  test('window accepts custom dimensions and position', () => {
    const customProps = {
      ...defaultProps,
      x: 200,
      y: 150,
      width: 600,
      height: 450,
    };
    
    render(<Window {...customProps} />);
    
    const window = screen.getByRole('button');
    expect(window).toHaveStyle({
      width: '600px',
      height: '450px',
      left: '200px',
      top: '150px',
    });
  });

  test('window has correct z-index', () => {
    const customProps = {
      ...defaultProps,
      zIndex: 10,
    };
    
    render(<Window {...customProps} />);
    
    const window = screen.getByRole('button');
    expect(window).toHaveStyle({ zIndex: 10 });
  });

  test('window is focusable with tabIndex', () => {
    render(<Window {...defaultProps} />);
    
    const window = screen.getByRole('button');
    expect(window).toHaveAttribute('tabIndex', '-1');
  });

  test('window focuses when it becomes active', async () => {
    const mockActiveWindow = 'test-window-1';
    jest.spyOn(require('../../contexts/AppContext'), 'useApps')
      .mockReturnValue({
        closeApp: mockCloseApp,
        focusApp: mockFocusApp,
        activeWindow: mockActiveWindow,
      });

    render(<Window {...defaultProps} />);
    
    await waitFor(() => {
      const window = screen.getByRole('button');
      expect(window).toHaveFocus();
    });
  });

  test('title bar buttons are clickable', () => {
    render(<Window {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close');
    const resizeButton = screen.getByLabelText('Resize');
    
    expect(closeButton).toBeEnabled();
    expect(resizeButton).toBeEnabled();
  });

  test('window content is properly contained', () => {
    const complexContent = (
      <div>
        <h1>Complex Content</h1>
        <p>This is paragraph text</p>
        <button>Action Button</button>
      </div>
    );
    
    render(<Window {...defaultProps}>{complexContent}</Window>);
    
    expect(screen.getByText('Complex Content')).toBeInTheDocument();
    expect(screen.getByText('This is paragraph text')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
  });

  test('window maintains proper structure with complex content', () => {
    const complexContent = (
      <div data-testid="complex-content">
        <h1>Test</h1>
      </div>
    );
    
    render(<Window {...defaultProps}>{complexContent}</Window>);
    
    const window = screen.getByRole('button');
    const titleBar = window.querySelector('.title-bar');
    const separator = window.querySelector('.separator');
    const contentPane = window.querySelector('.window-pane');
    const complexContentElement = screen.getByTestId('complex-content');
    
    expect(titleBar).toBeInTheDocument();
    expect(separator).toBeInTheDocument();
    expect(contentPane).toBeInTheDocument();
    expect(complexContentElement).toBeInTheDocument();
    expect(contentPane).toContainElement(complexContentElement);
  });

  test('window role is properly set for accessibility', () => {
    render(<Window {...defaultProps} />);
    
    const window = screen.getByRole('button');
    expect(window).toBeInTheDocument();
  });

  test('close and resize buttons have proper ARIA labels', () => {
    render(<Window {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close');
    const resizeButton = screen.getByLabelText('Resize');
    
    expect(closeButton).toHaveAttribute('aria-label', 'Close');
    expect(resizeButton).toHaveAttribute('aria-label', 'Resize');
  });
});