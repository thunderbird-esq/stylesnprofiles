import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NeoWsApp from '../NeoWsApp';

// Mock the NASA API service
const mockGetNeoFeed = jest.fn();

jest.mock('../../../services/nasaApi', () => ({
  getNeoFeed: (startDate, endDate) => mockGetNeoFeed(startDate, endDate),
}));

describe('NeoWsApp Component', () => {
  const mockNeoData = {
    element_count: 3,
    near_earth_objects: {
      '2024-01-01': [
        {
          id: '12345',
          name: '(2024 AB)',
          is_potentially_hazardous_asteroid: true,
          estimated_diameter: {
            meters: {
              estimated_diameter_max: 150.5,
            },
          },
          close_approach_data: [
            {
              miss_distance: {
                kilometers: 5000000,
              },
            },
          ],
        },
        {
          id: '67890',
          name: '(2024 CD)',
          is_potentially_hazardous_asteroid: false,
          estimated_diameter: {
            meters: {
              estimated_diameter_max: 75.2,
            },
          },
          close_approach_data: [
            {
              miss_distance: {
                kilometers: 10000000,
              },
            },
          ],
        },
      ],
    },
  };

  const mockEmptyNeoData = {
    element_count: 0,
    near_earth_objects: {
      '2024-01-01': [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date to return a consistent date
    const mockDate = new Date('2024-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    // Also mock the static methods
    global.Date.now = jest.fn(() => mockDate.getTime());
    global.Date.UTC = jest.fn(() => mockDate.getTime());
    global.Date.parse = jest.fn(() => mockDate.getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders loading state initially', () => {
    mockGetNeoFeed.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<NeoWsApp />);

    expect(screen.getByText('Loading Near Earth Objects...')).toBeInTheDocument();
  });

  test('renders error state when API fails', async () => {
    const errorMessage = 'Network error';
    mockGetNeoFeed.mockRejectedValue(new Error(errorMessage));

    render(<NeoWsApp />);

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  test('renders NEO data successfully', async () => {
    mockGetNeoFeed.mockResolvedValue({ data: mockNeoData });

    render(<NeoWsApp />);

    await waitFor(() => {
      expect(screen.getByText('Near Earth Objects (2024-01-01)')).toBeInTheDocument();
    });

    // Check element count
    expect(screen.getByText('Found 3 objects today.')).toBeInTheDocument();

    // Check first NEO (hazardous)
    expect(screen.getByText('(2024 AB)')).toBeInTheDocument();
    expect(screen.getAllByText('Potentially Hazardous:').length).toBeGreaterThan(0);
    const hazardousElement = screen.getByText('YES');
    expect(hazardousElement).toHaveStyle({ color: '#ff0000' });
    expect(screen.getByText('151')).toBeInTheDocument();
    expect(screen.getByText('meters')).toBeInTheDocument();
    expect(screen.getByText('5,000,000')).toBeInTheDocument();
    expect(screen.getByText('km')).toBeInTheDocument();

    // Check second NEO (non-hazardous)
    expect(screen.getByText('(2024 CD)')).toBeInTheDocument();
    expect(screen.getAllByText('No').length).toBeGreaterThan(0);
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('10,000,000')).toBeInTheDocument();
  });

  test('renders empty state when no NEOs found', async () => {
    mockGetNeoFeed.mockResolvedValue({ data: mockEmptyNeoData });

    render(<NeoWsApp />);

    await waitFor(() => {
      expect(screen.getByText('Near Earth Objects (2024-01-01)')).toBeInTheDocument();
    });

    expect(screen.getByText('Found 0 objects today.')).toBeInTheDocument();
    expect(screen.getByText('No objects tracked for today.')).toBeInTheDocument();
  });

  test('handles missing close_approach_data gracefully', async () => {
    const neoDataWithoutCloseApproach = {
      element_count: 1,
      near_earth_objects: {
        '2024-01-01': [
          {
            id: '12345',
            name: '(2024 AB)',
            is_potentially_hazardous_asteroid: false,
            estimated_diameter: {
              meters: {
                estimated_diameter_max: 100,
              },
            },
            // Missing close_approach_data
          },
        ],
      },
    };

    mockGetNeoFeed.mockResolvedValue({ data: neoDataWithoutCloseApproach });

    render(<NeoWsApp />);

    await waitFor(() => {
      expect(screen.getByText('(2024 AB)')).toBeInTheDocument();
    });

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('meters')).toBeInTheDocument();
    // Should not show miss distance if no close approach data
    expect(screen.queryByText(/Miss Distance:/)).not.toBeInTheDocument();
  });

  test('handles null NEO data', async () => {
    mockGetNeoFeed.mockResolvedValue({ data: null });

    const { container } = render(<NeoWsApp />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  test('handles undefined NEO data', async () => {
    mockGetNeoFeed.mockResolvedValue({ data: undefined });

    const { container } = render(<NeoWsApp />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  test('logs error to console on API failure', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const errorMessage = 'API Error';

    mockGetNeoFeed.mockRejectedValue(new Error(errorMessage));

    render(<NeoWsApp />);

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch NEO data:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  test('calls getNeoFeed with correct date parameters', async () => {
    mockGetNeoFeed.mockResolvedValue({ data: mockNeoData });

    render(<NeoWsApp />);

    await waitFor(() => {
      expect(screen.getByText('Near Earth Objects (2024-01-01)')).toBeInTheDocument();
    });

    expect(mockGetNeoFeed).toHaveBeenCalledWith('2024-01-01', '2024-01-01');
  });

  test('applies correct CSS classes and styling', async () => {
    mockGetNeoFeed.mockResolvedValue({ data: mockNeoData });

    render(<NeoWsApp />);

    await waitFor(() => {
      expect(screen.getByText('Near Earth Objects (2024-01-01)')).toBeInTheDocument();
    });

    // Check main container classes
    const mainContainer = screen.getByText('Near Earth Objects (2024-01-01)').parentElement;
    expect(mainContainer).toHaveClass('nasa-data-section');

    // Check title classes
    const titleElement = screen.getByText('Near Earth Objects (2024-01-01)');
    expect(titleElement).toHaveClass('nasa-data-title');

    // Check individual NEO container styling
    const neoContainers = screen.getAllByText(/\(2024/);
    expect(neoContainers.length).toBeGreaterThan(0);
    neoContainers.forEach(container => {
      const parentDiv = container.parentElement?.parentElement;
      expect(parentDiv).toBeInTheDocument();
      expect(parentDiv).toHaveStyle({
        padding: '8px',
        marginBottom: '8px',
      });
    });

    // Check scrollable container
    const scrollableContainer = screen.getByText('Found 3 objects today.').nextElementSibling;
    expect(scrollableContainer).toHaveStyle({
      maxHeight: '300px',
      overflowY: 'auto',
    });
  });

  test('formats numbers correctly with locale string', async () => {
    mockGetNeoFeed.mockResolvedValue({ data: mockNeoData });

    render(<NeoWsApp />);

    await waitFor(() => {
      expect(screen.getByText('Near Earth Objects (2024-01-01)')).toBeInTheDocument();
    });

    // Check that large numbers are formatted with commas
    expect(screen.getByText('5,000,000')).toBeInTheDocument();
    expect(screen.getByText('10,000,000')).toBeInTheDocument();
  });

  test('rounds diameter values correctly', async () => {
    mockGetNeoFeed.mockResolvedValue({ data: mockNeoData });

    render(<NeoWsApp />);

    await waitFor(() => {
      expect(screen.getByText('Near Earth Objects (2024-01-01)')).toBeInTheDocument();
    });

    // 150.5 should be rounded to 151, 75.2 should be rounded to 75
    expect(screen.getByText('151')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });
});
