import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Error Test App component for testing various error scenarios
 * @component
 * @param {Object} props - Component props
 * @param {string} props.windowId - Unique identifier for the window
 * @returns {JSX.Element} Error testing application
 */
export default function ErrorTestApp({ windowId: _windowId }) {
  const [counter, setCounter] = useState(0);

  // Synchronous error thrower
  const throwSyncError = () => {
    throw new Error('This is a synchronous error for testing!');
  };

  // Asynchronous error thrower
  const throwAsyncError = async () => {
    setTimeout(() => {
      throw new Error('This is an asynchronous error!');
    }, 100);
  };

  // Promise rejection
  const rejectPromise = () => {
    Promise.reject(new Error('This is a rejected promise!'))
      .catch(err => {
        console.error('Caught rejected promise:', err);
      });
  };

  // Type error
  const causeTypeError = () => {
    const obj = null;
    obj.someProperty; // This will cause a TypeError
  };

  // Reference error
  const causeReferenceError = () => {
    // eslint-disable-next-line no-undef
    console.log(undefinedVariable); // This will cause a ReferenceError
  };

  // Range error
  const causeRangeError = () => {
    // eslint-disable-next-line no-unused-vars
    const arr = new Array(-1); // This will cause a RangeError
  };

  // Custom error
  const throwCustomError = () => {
    class CustomError extends Error {
      constructor(message) {
        super(message);
        this.name = 'CustomError';
      }
    }
    throw new CustomError('This is a custom error type!');
  };

  // Infinite loop (will crash the browser tab, so we'll simulate it)
  const simulateInfiniteLoop = () => {
    console.log('Simulating infinite loop... (not actually running to prevent browser crash)');
    // Uncomment the following line to actually crash the tab:
    // while (true) {}
  };

  // Memory leak simulation
  const simulateMemoryLeak = () => {
    const bigArray = [];
    const interval = setInterval(() => {
      bigArray.push(new Array(1000000).fill('memory leak data'));
      console.log('Memory usage increased:', bigArray.length);
    }, 100);

    // Clear after 5 seconds to prevent actual memory issues
    setTimeout(() => {
      clearInterval(interval);
      console.log('Memory leak simulation stopped');
    }, 5000);
  };

  // Resource loading error
  const causeResourceError = () => {
    // eslint-disable-next-line no-undef
    const img = new Image();
    img.src = 'https://nonexistent-domain-12345.com/image.jpg';
    document.body.appendChild(img);
    setTimeout(() => {
      document.body.removeChild(img);
    }, 1000);
  };

  // Network error simulation
  const simulateNetworkError = async () => {
    try {
      // eslint-disable-next-line no-undef
      await fetch('https://nonexistent-api-12345.com/data');
    } catch (error) {
      console.error('Network error simulated:', error);
    }
  };

  // Event handler error
  const attachErroringHandler = () => {
    const button = document.createElement('button');
    button.textContent = 'Click me to cause error';
    button.onclick = () => {
      throw new Error('Error in event handler!');
    };
    document.body.appendChild(button);
    setTimeout(() => {
      document.body.removeChild(button);
    }, 5000);
  };

  return (
    <div style={{ padding: '16px' }}>
      <h2 className="font-chicago" style={{ fontSize: '14px', marginBottom: '16px' }}>
        Error Testing Suite
      </h2>

      <div className="font-geneva" style={{
        fontSize: '9px',
        marginBottom: '16px',
        lineHeight: '1.4',
      }}>
        Use these buttons to test different types of errors and see how the Error Boundary
        handles them. The error boundary will catch most errors and provide a recovery interface.
      </div>

      {/* Counter to test normal operation */}
      <div className="nasa-data-section" style={{ marginBottom: '16px' }}>
        <div className="font-geneva" style={{ fontSize: '9px', marginBottom: '8px' }}>
          Counter: {counter}
        </div>
        <button
          className="nasa-btn font-chicago"
          onClick={() => setCounter(prev => prev + 1)}
          style={{ fontSize: '10px', padding: '4px 8px', marginRight: '8px' }}
        >
          Increment
        </button>
        <button
          className="nasa-btn font-chicago"
          onClick={() => setCounter(0)}
          style={{ fontSize: '10px', padding: '4px 8px' }}
        >
          Reset
        </button>
      </div>

      {/* Error Categories */}
      <div className="nasa-data-section">
        <h3 className="nasa-data-title font-chicago" style={{ fontSize: '12px' }}>
          Synchronous Errors
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="nasa-btn font-chicago"
            onClick={throwSyncError}
            style={{ fontSize: '10px', padding: '4px 8px' }}
          >
            Throw Synchronous Error
          </button>
          <button
            className="nasa-btn font-chicago"
            onClick={causeTypeError}
            style={{ fontSize: '10px', padding: '4px 8px' }}
          >
            Cause TypeError
          </button>
          <button
            className="nasa-btn font-chicago"
            onClick={causeReferenceError}
            style={{ fontSize: '10px', padding: '4px 8px' }}
          >
            Cause ReferenceError
          </button>
          <button
            className="nasa-btn font-chicago"
            onClick={causeRangeError}
            style={{ fontSize: '10px', padding: '4px 8px' }}
          >
            Cause RangeError
          </button>
          <button
            className="nasa-btn font-chicago"
            onClick={throwCustomError}
            style={{ fontSize: '10px', padding: '4px 8px' }}
          >
            Throw Custom Error
          </button>
        </div>
      </div>

      <div className="nasa-data-section">
        <h3 className="nasa-data-title font-chicago" style={{ fontSize: '12px' }}>
          Asynchronous Errors
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="nasa-btn font-chicago"
            onClick={throwAsyncError}
            style={{ fontSize: '10px', padding: '4px 8px' }}
          >
            Throw Async Error
          </button>
          <button
            className="nasa-btn font-chicago"
            onClick={rejectPromise}
            style={{ fontSize: '10px', padding: '4px 8px' }}
          >
            Reject Promise
          </button>
          <button
            className="nasa-btn font-chicago"
            onClick={simulateNetworkError}
            style={{ fontSize: '10px', padding: '4px 8px' }}
          >
            Simulate Network Error
          </button>
        </div>
      </div>

      <div className="nasa-data-section">
        <h3 className="nasa-data-title font-chicago" style={{ fontSize: '12px' }}>
          Resource Errors
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="nasa-btn font-chicago"
            onClick={causeResourceError}
            style={{ fontSize: '10px', padding: '4px 8px' }}
          >
            Load Invalid Resource
          </button>
          <button
            className="nasa-btn font-chicago"
            onClick={attachErroringHandler}
            style={{ fontSize: '10px', padding: '4px 8px' }}
          >
            Create Erroring Event Handler
          </button>
        </div>
      </div>

      <div className="nasa-data-section">
        <h3 className="nasa-data-title font-chicago" style={{ fontSize: '12px' }}>
          Performance Issues
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="nasa-btn font-chicago"
            onClick={simulateMemoryLeak}
            style={{ fontSize: '10px', padding: '4px 8px' }}
          >
            Simulate Memory Leak
          </button>
          <button
            className="nasa-btn font-chicago"
            onClick={simulateInfiniteLoop}
            style={{ fontSize: '10px', padding: '4px 8px' }}
          >
            Simulate Infinite Loop (Safe)
          </button>
        </div>
      </div>

      <div className="nasa-data-section">
        <h3 className="nasa-data-title font-chicago" style={{ fontSize: '12px' }}>
          Error Boundary Features
        </h3>
        <div className="font-geneva" style={{
          fontSize: '9px',
          lineHeight: '1.4',
          marginBottom: '8px',
        }}>
          <strong>Features to test:</strong>
        </div>
        <ul className="font-geneva" style={{ fontSize: '9px', paddingLeft: '16px', margin: '0' }}>
          <li>Error catching and display</li>
          <li>Error recovery (Try Again button)</li>
          <li>Error reporting (Report Issue button)</li>
          <li>Error details (Show/Hide Details)</li>
          <li>Error history tracking</li>
          <li>Retry attempts counter</li>
          <li>System 6 styling consistency</li>
        </ul>
      </div>

      <div className="nasa-data-section">
        <div className="font-geneva" style={{
          fontSize: '9px',
          fontStyle: 'italic',
          color: 'var(--tertiary)',
        }}>
          <strong>Note:</strong> Some errors may be caught by the browser's built-in error
          handling before reaching the Error Boundary. Check the browser console for additional
          error information.
        </div>
      </div>
    </div>
  );
}

ErrorTestApp.propTypes = {
  windowId: PropTypes.string.isRequired,
};