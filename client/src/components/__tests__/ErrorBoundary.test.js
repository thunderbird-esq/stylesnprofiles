import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../ErrorBoundary';
import { AppProvider } from '../../contexts/AppContext';

// Mock console methods to avoid test output pollution
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
  jest.clearAllMocks();
});

// Test component that throws an error
const ThrowErrorComponent = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Normal Component</div>;
};

// Test component with async error
const AsyncErrorComponent = ({ shouldThrowAsync = false }) => {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (shouldThrowAsync) {
      setTimeout(() => {
        setError(new Error('Async error occurred'));
      }, 100);
    }
  }, [shouldThrowAsync]);

  if (error) {
    throw error;
  }

  return <div>Async Component</div>;
};

// Helper function to wrap components with AppProvider
const renderWithAppProvider = (component, options = {}) => {
  return render(
    <AppProvider>
      {component}
    </AppProvider>,
    options,
  );
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    renderWithAppProvider(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Normal Component')).toBeInTheDocument();
    expect(screen.queryByText('System Error')).not.toBeInTheDocument();
  });

  it('catches and displays error when child component throws', () => {
    renderWithAppProvider(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('System Error')).toBeInTheDocument();
    expect(screen.getByText(/error id: err-\d+-\w+/i)).toBeInTheDocument();
    expect(screen.getByText('Application Error')).toBeInTheDocument();
  });

  it('displays error details in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    renderWithAppProvider(
      <ErrorBoundary showErrorDetails={true}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Show Details')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Show Details'));

    expect(screen.getByText('Error Details')).toBeInTheDocument();
    expect(screen.getByText('Current Error:')).toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('hides error details in production mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    renderWithAppProvider(
      <ErrorBoundary showErrorDetails={false}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.queryByText('Show Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Error Details')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();

    renderWithAppProvider(
      <ErrorBoundary onError={onError}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
      expect.stringMatching(/^ERR-\d+-\w+$/),
    );
  });

  it('calls onReset callback when error boundary is reset', () => {
    const onReset = jest.fn();

    renderWithAppProvider(
      <ErrorBoundary onReset={onReset}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByText('Try Again'));

    expect(onReset).toHaveBeenCalled();
  });

  it('reloads the page when reload button is clicked', () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, reload: jest.fn() };

    renderWithAppProvider(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByText('Reload App'));

    expect(window.location.reload).toHaveBeenCalled();

    window.location = originalLocation;
  });

  it('resets error state when try again is clicked', () => {
    const { rerender } = renderWithAppProvider(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('System Error')).toBeInTheDocument();

    // Reset and render without error
    rerender(
      <AppProvider>
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={false} />
        </ErrorBoundary>
      </AppProvider>,
    );

    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText('Normal Component')).toBeInTheDocument();
    expect(screen.queryByText('System Error')).not.toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    const CustomFallback = () => <div>Custom Error UI</div>;

    renderWithAppProvider(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.queryByText('System Error')).not.toBeInTheDocument();
  });

  it('uses custom fallback function when provided', () => {
    const CustomFallbackFn = ({ error, reset }) => (
      <div>
        <div>Custom Function Error UI: {error.message}</div>
        <button onClick={reset}>Custom Reset</button>
      </div>
    );

    renderWithAppProvider(
      <ErrorBoundary fallback={CustomFallbackFn}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom Function Error UI: Test error message')).toBeInTheDocument();
    expect(screen.getByText('Custom Reset')).toBeInTheDocument();
  });

  it('handles multiple errors and shows retry count', () => {
    const { rerender } = renderWithAppProvider(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('System Error')).toBeInTheDocument();

    // First retry
    rerender(
      <AppProvider>
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      </AppProvider>,
    );
    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText('Retry attempt: 1')).toBeInTheDocument();
  });

  it('generates unique error IDs for different errors', () => {
    const { rerender } = renderWithAppProvider(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    const firstErrorText = screen.getByText(/error id: err-\d+-\w+/i).textContent;

    rerender(
      <AppProvider>
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      </AppProvider>,
    );
    fireEvent.click(screen.getByText('Try Again'));

    const secondErrorText = screen.getByText(/error id: err-\d+-\w+/i).textContent;

    expect(firstErrorText).not.toBe(secondErrorText);
  });
});

describe('ErrorBoundary Error Logging', () => {
  it('logs error to console in development', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    renderWithAppProvider(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('🚨 Error Boundary - ERR-'),
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
      expect.objectContaining({
        id: expect.stringMatching(/^ERR-\d+-\w+$/),
        message: 'Test error message',
        timestamp: expect.any(String),
      }),
    );

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('attempts to send error to external service in production', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const originalEndpoint = process.env.REACT_APP_ERROR_ENDPOINT;
    process.env.REACT_APP_ERROR_ENDPOINT = 'https://api.example.com/errors';

    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    renderWithAppProvider(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        process.env.REACT_APP_ERROR_ENDPOINT,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.any(String),
        },
      );
    });

    process.env.NODE_ENV = originalNodeEnv;
    process.env.REACT_APP_ERROR_ENDPOINT = originalEndpoint;
    global.fetch = undefined;
  });
});

describe('ErrorBoundary Component Interactions', () => {
  it('shows and hides error details when toggle button is clicked', () => {
    renderWithAppProvider(
      <ErrorBoundary showErrorDetails={true}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.queryByText('Error Details')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Show Details'));
    expect(screen.getByText('Error Details')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hide Details'));
    expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
  });

  it('displays component stack when available', () => {
    renderWithAppProvider(
      <ErrorBoundary showErrorDetails={true}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByText('Show Details'));

    expect(screen.getByText('Component Stack:')).toBeInTheDocument();
  });

  it('maintains error history across multiple errors', () => {
    const { rerender } = renderWithAppProvider(
      <ErrorBoundary showErrorDetails={true}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    // First error
    fireEvent.click(screen.getByText('Show Details'));
    expect(screen.getByText(/Recent Errors \(\d+\)/)).toBeInTheDocument();

    // Trigger another error
    rerender(
      <AppProvider>
        <ErrorBoundary showErrorDetails={true}>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      </AppProvider>,
    );
    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText(/Recent Errors \(\d+\)/)).toBeInTheDocument();
  });
});