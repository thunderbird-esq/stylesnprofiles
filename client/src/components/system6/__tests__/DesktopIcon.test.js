import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DesktopIcon from '../DesktopIcon';

describe('DesktopIcon Component', () => {
  const mockOnDoubleClick = jest.fn();
  const defaultProps = {
    label: 'Test App',
    icon: '🚀',
    onDoubleClick: mockOnDoubleClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders desktop icon with correct structure', () => {
    render(<DesktopIcon {...defaultProps} />);
    
    const desktopIcon = screen.getByRole('button');
    expect(desktopIcon).toHaveClass('desktop-icon');
  });

  test('renders icon with correct styling', () => {
    render(<DesktopIcon {...defaultProps} />);
    
    const icon = screen.getByText('🚀');
    expect(icon).toHaveStyle({ fontSize: '32px' });
  });

  test('renders label text', () => {
    render(<DesktopIcon {...defaultProps} />);
    
    expect(screen.getByText('Test App')).toBeInTheDocument();
    
    const labelElement = screen.getByText('Test App');
    expect(labelElement).toHaveClass('desktop-icon-text');
  });

  test('calls onDoubleClick when double-clicked', () => {
    render(<DesktopIcon {...defaultProps} />);
    
    const desktopIcon = screen.getByRole('button');
    fireEvent.doubleClick(desktopIcon);
    
    expect(mockOnDoubleClick).toHaveBeenCalledTimes(1);
  });

  test('handles multiple double-clicks', () => {
    render(<DesktopIcon {...defaultProps} />);
    
    const desktopIcon = screen.getByRole('button');
    
    fireEvent.doubleClick(desktopIcon);
    fireEvent.doubleClick(desktopIcon);
    fireEvent.doubleClick(desktopIcon);
    
    expect(mockOnDoubleClick).toHaveBeenCalledTimes(3);
  });

  test('renders with different emoji icons', () => {
    const emojiProps = {
      ...defaultProps,
      icon: '🌟',
    };
    
    render(<DesktopIcon {...emojiProps} />);
    
    expect(screen.getByText('🌟')).toBeInTheDocument();
    expect(screen.getByText('🌟')).toHaveStyle({ fontSize: '32px' });
  });

  test('renders with text-based icons', () => {
    const textIconProps = {
      ...defaultProps,
      icon: '📷',
    };
    
    render(<DesktopIcon {...textIconProps} />);
    
    expect(screen.getByText('📷')).toBeInTheDocument();
    expect(screen.getByText('📷')).toHaveStyle({ fontSize: '32px' });
  });

  test('renders with different labels', () => {
    const differentLabelProps = {
      ...defaultProps,
      label: 'Different App',
    };
    
    render(<DesktopIcon {...differentLabelProps} />);
    
    expect(screen.getByText('Different App')).toBeInTheDocument();
    expect(screen.getByText('Different App')).toHaveClass('desktop-icon-text');
  });

  test('icon and label are properly structured', () => {
    render(<DesktopIcon {...defaultProps} />);
    
    const desktopIcon = screen.getByRole('button');
    const icon = screen.getByText('🚀');
    const label = screen.getByText('Test App');
    
    expect(desktopIcon).toContainElement(icon);
    expect(desktopIcon).toContainElement(label);
  });

  test('handles empty label gracefully', () => {
    const emptyLabelProps = {
      ...defaultProps,
      label: '',
    };
    
    render(<DesktopIcon {...emptyLabelProps} />);
    
    const labelElement = screen.getByTestId('desktop-icon-text');
    expect(labelElement).toBeInTheDocument();
    expect(labelElement).toHaveTextContent('');
  });

  test('handles empty icon gracefully', () => {
    const emptyIconProps = {
      ...defaultProps,
      icon: '',
    };
    
    render(<DesktopIcon {...emptyIconProps} />);
    
    // Should still render the icon span even if empty
    const desktopIcon = screen.getByRole('button');
    const iconSpan = desktopIcon.querySelector('span');
    expect(iconSpan).toBeInTheDocument();
    expect(iconSpan).toHaveStyle({ fontSize: '32px' });
  });

  test('double-click event is properly handled', () => {
    render(<DesktopIcon {...defaultProps} />);
    
    const desktopIcon = screen.getByRole('button');
    const doubleClickEvent = new MouseEvent('dblclick', { bubbles: true });
    
    fireEvent.doubleClick(desktopIcon);
    
    expect(mockOnDoubleClick).toHaveBeenCalledTimes(1);
  });

  test('single click does not trigger double-click handler', () => {
    render(<DesktopIcon {...defaultProps} />);
    
    const desktopIcon = screen.getByRole('button');
    fireEvent.click(desktopIcon);
    
    expect(mockOnDoubleClick).not.toHaveBeenCalled();
  });

  test('icon is rendered before label in DOM order', () => {
    render(<DesktopIcon {...defaultProps} />);
    
    const desktopIcon = screen.getByRole('button');
    const children = desktopIcon.children;
    
    expect(children).toHaveLength(2);
    expect(children[0]).toHaveTextContent('🚀'); // Icon first
    expect(children[1]).toHaveTextContent('Test App'); // Label second
  });

  test('desktop icon has proper cursor on hover', () => {
    render(<DesktopIcon {...defaultProps} />);
    
    const desktopIcon = screen.getByRole('button');
    
    // Desktop icons should indicate they are clickable
    expect(desktopIcon).toHaveStyle({ cursor: 'pointer' });
  });

  test('handles special characters in label', () => {
    const specialCharsProps = {
      ...defaultProps,
      label: 'App & More!',
    };
    
    render(<DesktopIcon {...specialCharsProps} />);
    
    expect(screen.getByText('App & More!')).toBeInTheDocument();
  });

  test('handles unicode characters in icon', () => {
    const unicodeProps = {
      ...defaultProps,
      icon: '🔭',
    };
    
    render(<DesktopIcon {...unicodeProps} />);
    
    expect(screen.getByText('🔭')).toBeInTheDocument();
    expect(screen.getByText('🔭')).toHaveStyle({ fontSize: '32px' });
  });

  test('propTypes validation works correctly', () => {
    // This test ensures the component can be imported and used
    // PropTypes validation happens at runtime in development
    expect(() => {
      render(<DesktopIcon {...defaultProps} />);
    }).not.toThrow();
  });

  test('component is properly exported and functional', () => {
    // Test that the component can be imported and instantiated
    expect(DesktopIcon).toBeDefined();
    expect(typeof DesktopIcon).toBe('function');
    
    const { container } = render(<DesktopIcon {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});