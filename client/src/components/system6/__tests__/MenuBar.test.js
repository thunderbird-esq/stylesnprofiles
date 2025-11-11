import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MenuBar from '../MenuBar';

describe('MenuBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders menu bar with correct structure', () => {
    render(<MenuBar />);

    const menuBar = screen.getByRole('banner');
    expect(menuBar).toHaveClass('nasa-menu-bar');
  });

  test('renders left menu section with correct items', () => {
    render(<MenuBar />);

    const menuLeft = screen.getByText('File').parentElement;
    expect(menuLeft).toHaveClass('nasa-menu-left');

    expect(screen.getByText('')).toBeInTheDocument();
    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Special')).toBeInTheDocument();
  });

  test('renders right menu section with time', () => {
    render(<MenuBar />);

    const menuRight = screen.getByText(/\d{1,2}:\d{2}/).parentElement;
    expect(menuRight).toHaveClass('nasa-menu-right');
  });

  test('displays current time in correct format', () => {
    const mockDate = new Date('2024-01-01T14:30:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    render(<MenuBar />);

    // Should show time in 12-hour format with AM/PM
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();

    global.Date.mockRestore();
  });

  test('displays midnight correctly', () => {
    const mockDate = new Date('2024-01-01T00:00:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    render(<MenuBar />);

    expect(screen.getByText('12:00 AM')).toBeInTheDocument();

    global.Date.mockRestore();
  });

  test('displays noon correctly', () => {
    const mockDate = new Date('2024-01-01T12:00:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    render(<MenuBar />);

    expect(screen.getByText('12:00 PM')).toBeInTheDocument();

    global.Date.mockRestore();
  });

  test('updates time every 30 seconds', () => {
    const initialDate = new Date('2024-01-01T14:30:00');
    jest.spyOn(global, 'Date').mockImplementation(() => initialDate);

    render(<MenuBar />);

    expect(screen.getByText('2:30 PM')).toBeInTheDocument();

    // Advance time by 30 seconds
    const updatedDate = new Date('2024-01-01T14:30:30');
    global.Date.mockImplementation(() => updatedDate);

    act(() => {
      jest.advanceTimersByTime(30000); // 30 seconds
    });

    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    // Still 2:30 since we advanced by 30 seconds

    // Advance time by another 30 seconds (total 60 seconds)
    const finalDate = new Date('2024-01-01T14:31:00');
    global.Date.mockImplementation(() => finalDate);

    act(() => {
      jest.advanceTimersByTime(30000); // Another 30 seconds
    });

    expect(screen.getByText('2:31 PM')).toBeInTheDocument();

    global.Date.mockRestore();
  });

  test('cleans up timer on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = render(<MenuBar />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

    clearIntervalSpy.mockRestore();
  });

  test('menu items are rendered in correct order', () => {
    render(<MenuBar />);

    const menuLeft = screen.getByText('File').parentElement;
    const menuItems = menuLeft.querySelectorAll('span');

    expect(menuItems).toHaveLength(5);
    expect(menuItems[0]).toHaveTextContent('');
    expect(menuItems[1]).toHaveTextContent('File');
    expect(menuItems[2]).toHaveTextContent('Edit');
    expect(menuItems[3]).toHaveTextContent('View');
    expect(menuItems[4]).toHaveTextContent('Special');
  });

  test('time display updates when system time changes', () => {
    const mockDate = new Date('2024-01-01T09:15:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    render(<MenuBar />);

    expect(screen.getByText('9:15 AM')).toBeInTheDocument();

    // Change the mock date
    const newMockDate = new Date('2024-01-01T15:45:00');
    global.Date.mockImplementation(() => newMockDate);

    act(() => {
      jest.advanceTimersByTime(30000); // Trigger timer update
    });

    expect(screen.getByText('3:45 PM')).toBeInTheDocument();

    global.Date.mockRestore();
  });

  test('handles single digit hours correctly', () => {
    const mockDate = new Date('2024-01-01T09:05:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    render(<MenuBar />);

    expect(screen.getByText('9:05 AM')).toBeInTheDocument();

    global.Date.mockRestore();
  });

  test('handles double digit hours correctly', () => {
    const mockDate = new Date('2024-01-01T23:59:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    render(<MenuBar />);

    expect(screen.getByText('11:59 PM')).toBeInTheDocument();

    global.Date.mockRestore();
  });

  test('menu bar has correct accessibility role', () => {
    render(<MenuBar />);

    const menuBar = screen.getByRole('banner');
    expect(menuBar).toBeInTheDocument();
  });

  test('time is displayed with correct font styling', () => {
    render(<MenuBar />);

    const timeElement = screen.getByText(/\d{1,2}:\d{2}/);
    const menuRight = timeElement.parentElement;

    expect(menuRight).toHaveClass('nasa-menu-right');
  });
});
