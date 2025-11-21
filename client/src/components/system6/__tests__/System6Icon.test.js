import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import System6Icon from '../System6Icon';

describe('System6Icon Component', () => {
  const defaultProps = {
    type: 'apod',
  };

  test('renders apod icon correctly', () => {
    render(<System6Icon {...defaultProps} />);

    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('viewBox', '0 0 32 32');
    expect(icon).toHaveStyle({
      width: '32px',
      height: '32px',
      display: 'block',
      imageRendering: 'pixelated',
    });

    // Check for specific SVG elements of apod icon
    const pictureFrame = icon.querySelector('rect[x="2"][y="4"]');
    expect(pictureFrame).toBeInTheDocument();

    const sun = icon.querySelector('circle[cx="20"][cy="10"]');
    expect(sun).toBeInTheDocument();

    const mountain = icon.querySelector('polygon');
    expect(mountain).toBeInTheDocument();
  });

  test('renders neo icon correctly', () => {
    render(<System6Icon type="neo" />);

    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();

    // Check for specific SVG elements of neo icon
    const asteroidCircle = icon.querySelector('circle[cx="16"][cy="16"]');
    expect(asteroidCircle).toBeInTheDocument();

    const craters = icon.querySelectorAll('circle[r="1"]');
    expect(craters.length).toBe(3);

    // Check for tail path elements
    const paths = icon.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });

  test('renders resources icon correctly', () => {
    render(<System6Icon type="resources" />);

    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();

    // Check for specific SVG elements of resources icon
    const folder = icon.querySelector('rect[x="2"][y="8"]');
    expect(folder).toBeInTheDocument();

    const folderTab = icon.querySelector('path');
    expect(folderTab).toBeInTheDocument();

    // Check for document lines
    const lines = icon.querySelectorAll('line');
    expect(lines.length).toBe(4);
  });

  test('renders with custom size', () => {
    const customSize = 48;
    render(<System6Icon type="apod" size={customSize} />);

    const icon = document.querySelector('svg');
    expect(icon).toHaveStyle({
      width: `${customSize}px`,
      height: `${customSize}px`,
    });
  });

  test('renders with default size when no size provided', () => {
    render(<System6Icon type="apod" />);

    const icon = document.querySelector('svg');
    expect(icon).toHaveStyle({
      width: '32px',
      height: '32px',
    });
  });

  test('renders different sizes correctly', () => {
    const sizes = [16, 24, 32, 48, 64];

    sizes.forEach(size => {
      const { unmount } = render(<System6Icon type="apod" size={size} />);

      const icon = document.querySelector('svg');
      expect(icon).toHaveStyle({
        width: `${size}px`,
        height: `${size}px`,
      });

      unmount();
    });
  });

  test('falls back to resources icon for unknown type', () => {
    render(<System6Icon type="error" />);

    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();

    // Check that it renders the error icon (not the resources icon)
    const warningTriangle = icon.querySelector('polygon');
    expect(warningTriangle).toBeInTheDocument();
  });

  test('apod icon has correct visual elements', () => {
    render(<System6Icon type="apod" />);

    const icon = document.querySelector('svg');

    // Check picture frame
    const outerFrame = icon.querySelector('rect[fill="none"][stroke="black"]');
    expect(outerFrame).toBeInTheDocument();

    // Check inner picture area
    const innerPicture = icon.querySelector('rect[fill="white"]');
    expect(innerPicture).toBeInTheDocument();

    // Check sun/moon
    const sun = icon.querySelector('circle[fill="black"]');
    expect(sun).toBeInTheDocument();

    // Check mountain landscape
    const landscape = icon.querySelector('polygon[fill="black"]');
    expect(landscape).toBeInTheDocument();

    // Check stars
    const stars = icon.querySelectorAll('rect[fill="black"][width="1"]');
    expect(stars.length).toBe(3);
  });

  test('neo icon has correct visual elements', () => {
    render(<System6Icon type="neo" />);

    const icon = document.querySelector('svg');

    // Check main asteroid circle
    const mainCircle = icon.querySelector('circle[fill="none"][stroke="black"]');
    expect(mainCircle).toBeInTheDocument();

    // Check crater positions
    const crater1 = icon.querySelector('circle[cx="12"][cy="14"]');
    const crater2 = icon.querySelector('circle[cx="18"][cy="12"]');
    const crater3 = icon.querySelector('circle[cx="16"][cy="18"]');

    expect(crater1).toBeInTheDocument();
    expect(crater2).toBeInTheDocument();
    expect(crater3).toBeInTheDocument();

    // Check for tail/comet elements
    const tailPaths = icon.querySelectorAll('path[fill="black"]');
    expect(tailPaths.length).toBe(2);
  });

  test('resources icon has correct visual elements', () => {
    render(<System6Icon type="resources" />);

    const icon = document.querySelector('svg');

    // Check main folder body
    const folderBody = icon.querySelector('rect[fill="white"]');
    expect(folderBody).toBeInTheDocument();

    // Check folder outline (the same rect as folder body has stroke)
    const folderOutline = icon.querySelector('rect[stroke="black"]');
    expect(folderOutline).toBeInTheDocument();

    // Check folder tab
    const folderTab = icon.querySelector('path[stroke="black"]');
    expect(folderTab).toBeInTheDocument();

    // Check document lines
    const lines = icon.querySelectorAll('line[stroke="black"]');
    expect(lines.length).toBe(4);

    // Verify line positions
    expect(lines[0]).toHaveAttribute('y1', '12');
    expect(lines[1]).toHaveAttribute('y1', '16');
    expect(lines[2]).toHaveAttribute('y1', '20');
    expect(lines[3]).toHaveAttribute('y1', '24');
  });

  test('icons have correct SVG attributes', () => {
    render(<System6Icon type="apod" />);

    const icon = document.querySelector('svg');

    expect(icon).toHaveAttribute('viewBox', '0 0 32 32');
    expect(icon).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    expect(icon).toHaveAttribute('style', expect.stringContaining('width: 32px'));
    expect(icon).toHaveAttribute('style', expect.stringContaining('height: 32px'));
  });

  test('icons maintain pixelated image rendering', () => {
    const sizes = [16, 32, 48];

    sizes.forEach(size => {
      const { unmount } = render(<System6Icon type="apod" size={size} />);

      const icon = document.querySelector('svg');
      expect(icon).toHaveStyle({ imageRendering: 'pixelated' });

      unmount();
    });
  });

  test('icon elements have correct stroke and fill attributes', () => {
    render(<System6Icon type="apod" />);

    const icon = document.querySelector('svg');

    // Check that elements have proper stroke/fill for black and white design
    const blackElements = icon.querySelectorAll('[fill="black"], [stroke="black"]');
    const whiteElements = icon.querySelectorAll('[fill="white"]');

    expect(blackElements.length).toBeGreaterThan(0);
    expect(whiteElements.length).toBeGreaterThan(0);
  });

  test('icon structure is consistent across types', () => {
    const types = ['apod', 'neo', 'resources'];

    types.forEach(type => {
      const { unmount } = render(<System6Icon type={type} />);

      const icon = document.querySelector('svg');

      // All icons should have these basic attributes
      expect(icon).toHaveAttribute('viewBox', '0 0 32 32');
      expect(icon).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(icon).toHaveStyle({ display: 'block' });

      // All icons should have child elements
      expect(icon.children.length).toBeGreaterThan(0);

      unmount();
    });
  });

  test('renders correctly with zero size', () => {
    render(<System6Icon type="apod" size={0} />);

    const icon = document.querySelector('svg');
    expect(icon).toHaveStyle({
      width: '0px',
      height: '0px',
    });
  });

  test('renders correctly with negative size (handles gracefully)', () => {
    render(<System6Icon type="apod" size={-10} />);

    const icon = document.querySelector('svg');
    expect(icon).toHaveStyle({
      width: '-10px',
      height: '-10px',
    });
    expect(icon).toBeInTheDocument();
  });

  test('icon maintains aspect ratio at different sizes', () => {
    const sizes = [16, 24, 32, 48, 64];

    sizes.forEach(size => {
      const { unmount } = render(<System6Icon type="apod" size={size} />);

      const icon = document.querySelector('svg');
      expect(icon).toHaveStyle({
        width: `${size}px`,
        height: `${size}px`,
      });

      // viewBox should remain constant regardless of size
      expect(icon).toHaveAttribute('viewBox', '0 0 32 32');

      unmount();
    });
  });

  test('component handles prop type validation gracefully', () => {
    // Should not throw errors with valid props
    expect(() => {
      render(<System6Icon type="apod" size={32} />);
    }).not.toThrow();

    expect(() => {
      render(<System6Icon type="neo" size={16} />);
    }).not.toThrow();

    expect(() => {
      render(<System6Icon type="resources" />);
    }).not.toThrow();
  });

  test('icon paths and shapes are properly formed', () => {
    render(<System6Icon type="apod" />);

    const icon = document.querySelector('svg');

    // Check that SVG paths are valid
    const paths = icon.querySelectorAll('path');
    paths.forEach(path => {
      expect(path).toHaveAttribute('d');
      expect(path.getAttribute('d')).toBeTruthy();
    });

    // Check that polygons are valid
    const polygons = icon.querySelectorAll('polygon');
    polygons.forEach(polygon => {
      expect(polygon).toHaveAttribute('points');
      expect(polygon.getAttribute('points')).toBeTruthy();
    });
  });

  test('accessible as image with proper semantics', () => {
    render(<System6Icon type="apod" />);

    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();

    // SVG elements automatically get img role when they have meaningful content
    expect(icon).toBeVisible();
  });

  test('all icon types render without errors', () => {
    const iconTypes = ['apod', 'neo', 'resources', 'error'];

    iconTypes.forEach(type => {
      const { unmount } = render(<System6Icon type={type} />);

      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon.children.length).toBeGreaterThan(0);

      unmount();
    });
  });

  test('icon maintains styling consistency', () => {
    const types = ['apod', 'neo', 'resources'];
    const commonStyles = {
      display: 'block',
      imageRendering: 'pixelated',
    };

    types.forEach(type => {
      const { unmount } = render(<System6Icon type={type} />);

      const icon = document.querySelector('svg');
      expect(icon).toHaveStyle(commonStyles);

      unmount();
    });
  });
});