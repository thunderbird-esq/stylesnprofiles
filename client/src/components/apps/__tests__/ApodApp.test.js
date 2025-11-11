import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApodApp from '../ApodApp';

// Mock the NASA API service
const mockGetApod = jest.fn();

jest.mock('../../services/nasaApi', () => ({
  getApod: () => mockGetApod(),
}));

describe('ApodApp Component', () => {
  const mockApodData = {
    title: 'Test Astronomy Picture',
    date: '2024-01-01',
    explanation: 'This is a test explanation of the astronomy picture.',
    url: 'https://example.com/test-image.jpg',
    media_type: 'image',
    copyright: 'Test Author',
  };

  const mockVideoData = {
    title: 'Test Astronomy Video',
    date: '2024-01-01',
    explanation: 'This is a test explanation of the astronomy video.',
    url: 'https://youtube.com/watch?v=test123',
    media_type: 'video',
    copyright: 'Test Video Author',
  };

  const mockApodDataNoCopyright = {
    title: 'Test Picture No Copyright',
    date: '2024-01-01',
    explanation: 'This picture has no copyright information.',
    url: 'https://example.com/test-image-2.jpg',
    media_type: 'image',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    mockGetApod.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ApodApp />);
    
    expect(screen.getByText("Loading today's astronomy picture...")).toBeInTheDocument();
    expect(screen.getByText("Loading today's astronomy picture...")).toHaveClass('nasa-loading');
  });

  test('renders error state when API fails', async () => {
    const errorMessage = 'Network error';
    mockGetApod.mockRejectedValue(new Error(errorMessage));
    
    render(<ApodApp />);
    
    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
    
    expect(screen.getByText(`Error: ${errorMessage}`)).toHaveClass('nasa-error');
  });

  test('renders APOD image data successfully', async () => {
    mockGetApod.mockResolvedValue({ data: mockApodData });
    
    render(<ApodApp />);
    
    await waitFor(() => {
      expect(
        screen.getByText('Test Astronomy Picture'),
      ).toBeInTheDocument();
    });
    
    // Check title
    const titleElement = screen.getByText('Test Astronomy Picture');
    expect(titleElement).toHaveClass('nasa-data-title');
    
    // Check date
    expect(screen.getByText('Date: 2024-01-01')).toBeInTheDocument();
    
    // Check image
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg');
    expect(image).toHaveAttribute('alt', 'Test Astronomy Picture');
    expect(image).toHaveStyle({
      width: '100%',
      maxWidth: '400px',
      height: 'auto',
      border: '1px solid var(--secondary)',
    });
    
    // Check explanation
    expect(screen.getByText('Explanation:')).toBeInTheDocument();
    expect(
      screen.getByText('This is a test explanation of the astronomy picture.'),
    ).toBeInTheDocument();
    
    // Check copyright
    expect(screen.getByText('© Test Author')).toBeInTheDocument();
  });

  test('renders APOD video data successfully', async () => {
    mockGetApod.mockResolvedValue({ data: mockVideoData });
    
    render(<ApodApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Astronomy Video')).toBeInTheDocument();
    });
    
    // Check video link instead of image
    const videoLink = screen.getByRole('link', { name: 'View Video (YouTube)' });
    expect(videoLink).toHaveAttribute('href', 'https://youtube.com/watch?v=test123');
    expect(videoLink).toHaveAttribute('target', '_blank');
    expect(videoLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(videoLink).toHaveClass('nasa-link');
    
    // Should not have an image
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    
    // Check explanation
    expect(
      screen.getByText('This is a test explanation of the astronomy video.'),
    ).toBeInTheDocument();
    
    // Check copyright
    expect(screen.getByText('© Test Video Author')).toBeInTheDocument();
  });

  test('handles APOD data without copyright', async () => {
    mockGetApod.mockResolvedValue({ data: mockApodDataNoCopyright });
    
    render(<ApodApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Picture No Copyright')).toBeInTheDocument();
    });
    
    // Should not show copyright
    expect(screen.queryByText(/©/)).not.toBeInTheDocument();
    
    // Should still show other content
    expect(screen.getByText('This picture has no copyright information.')).toBeInTheDocument();
  });

  test('handles null APOD data', async () => {
    mockGetApod.mockResolvedValue({ data: null });
    
    const { container } = render(<ApodApp />);
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  test('handles undefined APOD data', async () => {
    mockGetApod.mockResolvedValue({ data: undefined });
    
    const { container } = render(<ApodApp />);
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  test('logs error to console on API failure', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const errorMessage = 'API Error';
    
    mockGetApod.mockRejectedValue(new Error(errorMessage));
    
    render(<ApodApp />);
    
    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch APOD:', expect.any(Error));
    
    consoleErrorSpy.mockRestore();
  });

  test('renders with windowId prop', async () => {
    mockGetApod.mockResolvedValue({ data: mockApodData });
    
    render(<ApodApp windowId="test-window-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Astronomy Picture')).toBeInTheDocument();
    });
  });

  test('content has proper CSS classes and structure', async () => {
    mockGetApod.mockResolvedValue({ data: mockApodData });
    
    render(<ApodApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Astronomy Picture')).toBeInTheDocument();
    });
    
    const mainSection = screen.getByText('Test Astronomy Picture').parentElement;
    expect(mainSection).toHaveClass('nasa-data-section');
    
    const explanationSection = screen.getByText('Explanation:').parentElement;
    expect(explanationSection).toHaveClass('nasa-data-content');
  });

  test('explanation paragraph has proper line height', async () => {
    mockGetApod.mockResolvedValue({ data: mockApodData });
    
    render(<ApodApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Astronomy Picture')).toBeInTheDocument();
    });
    
    const explanationParagraph = screen.getByText(
      'This is a test explanation of the astronomy picture.',
    );
    expect(explanationParagraph).toHaveStyle({ lineHeight: '1.3' });
  });

  test('image container has proper margin', async () => {
    mockGetApod.mockResolvedValue({ data: mockApodData });
    
    render(<ApodApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Astronomy Picture')).toBeInTheDocument();
    });
    
    const imageContainer = screen.getByRole('img').parentElement;
    expect(imageContainer).toHaveClass('mb-2');
  });

  test('date display has proper margin', async () => {
    mockGetApod.mockResolvedValue({ data: mockApodData });
    
    render(<ApodApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Astronomy Picture')).toBeInTheDocument();
    });
    
    const dateContainer = screen.getByText('Date: 2024-01-01').parentElement;
    expect(dateContainer).toHaveClass('mb-1');
  });

  test('copyright notice has proper margin', async () => {
    mockGetApod.mockResolvedValue({ data: mockApodData });
    
    render(<ApodApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Astronomy Picture')).toBeInTheDocument();
    });
    
    const copyrightContainer = screen.getByText('© Test Author').parentElement;
    expect(copyrightContainer).toHaveClass('mt-2');
  });

  test('explanation title has proper margin', async () => {
    mockGetApod.mockResolvedValue({ data: mockApodData });
    
    render(<ApodApp />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Astronomy Picture')).toBeInTheDocument();
    });
    
    const explanationTitle = screen.getByText('Explanation:');
    expect(explanationTitle).toHaveClass('nasa-data-title', 'mb-1');
  });

  test('component is properly exported and functional', () => {
    // Test that the component can be imported and instantiated
    expect(ApodApp).toBeDefined();
    expect(typeof ApodApp).toBe('function');
    
    const { container } = render(<ApodApp />);
    expect(container.firstChild).toBeInTheDocument();
  });
});