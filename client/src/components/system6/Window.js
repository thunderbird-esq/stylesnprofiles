import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useApps } from '../../contexts/AppContext';

/**
 * Window component that represents a draggable application window
 * Supports both mouse and touch events for desktop and mobile
 * @component
 */
export default function Window({
  children,
  title,
  windowId,
  zIndex,
  x = 100,
  y = 100,
  width = 500,
  height = 400,
  ...props
}) {
  const { closeApp, focusApp, activeWindow } = useApps();

  // Handle center positioning
  const getInitialPosition = () => {
    if (x === 'center' || y === 'center') {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const menuBarHeight = 30;

      return {
        x: x === 'center' ? Math.max(16, (windowWidth - width) / 2) : x,
        y: y === 'center' ? Math.max(menuBarHeight + 16, (windowHeight - height) / 2) : y,
      };
    }
    return { x, y };
  };

  const [position, setPosition] = useState(getInitialPosition());
  const [size, setSize] = useState({ width, height });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const windowStartPos = useRef({ x: 0, y: 0 });
  const windowStartSize = useRef({ width: 0, height: 0 });
  const windowRef = useRef(null);

  const isActive = activeWindow === windowId;

  // Handle window focusing
  useEffect(() => {
    if (isActive && windowRef.current) {
      windowRef.current.focus();
    }
  }, [isActive]);

  const handleResizeClick = e => {
    e.stopPropagation();

    if (isMaximized) {
      setSize({ width, height });
      setPosition({ x, y });
      setIsMaximized(false);
    } else {
      windowStartSize.current = { ...size };
      windowStartPos.current = { ...position };

      const maxWindowWidth = window.innerWidth - 32;
      const maxWindowHeight = window.innerHeight - 52;
      setSize({ width: maxWindowWidth, height: maxWindowHeight });
      setPosition({ x: 16, y: 36 });
      setIsMaximized(true);
    }
  };

  // Get coordinates from mouse or touch event
  const getEventCoords = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Start dragging (mouse or touch)
  const handleDragStart = (e) => {
    focusApp(windowId);

    // Only enable dragging from title bar when not maximized
    if (e.target.closest('.title-bar') && !isMaximized) {
      const coords = getEventCoords(e);
      setIsDragging(true);
      dragStartPos.current = { x: coords.clientX, y: coords.clientY };
      windowStartPos.current = { ...position };

      // Prevent text selection and scrolling
      if (e.type === 'mousedown') {
        e.preventDefault();
      }
      document.body.style.userSelect = 'none';
    }
  };

  // Handle movement (mouse or touch)
  const handleMove = useCallback(
    (e) => {
      const coords = getEventCoords(e);

      if (isDragging) {
        const deltaX = coords.clientX - dragStartPos.current.x;
        const deltaY = coords.clientY - dragStartPos.current.y;

        const newX = Math.max(0, windowStartPos.current.x + deltaX);
        const newY = Math.max(0, windowStartPos.current.y + deltaY);

        setPosition({ x: newX, y: newY });

        // Prevent scrolling on touch devices while dragging
        if (e.cancelable) {
          e.preventDefault();
        }
      } else if (isResizing) {
        const deltaX = coords.clientX - dragStartPos.current.x;
        const deltaY = coords.clientY - dragStartPos.current.y;

        const newWidth = Math.max(
          300,
          Math.min(window.innerWidth - 32, windowStartSize.current.width + deltaX),
        );
        const newHeight = Math.max(
          200,
          Math.min(window.innerHeight - 52, windowStartSize.current.height + deltaY),
        );

        const newX = Math.min(position.x, window.innerWidth - newWidth - 16);
        const newY = Math.min(position.y, window.innerHeight - newHeight - 16);

        setSize({ width: newWidth, height: newHeight });

        if (newX !== position.x || newY !== position.y) {
          setPosition({ x: newX, y: newY });
        }

        if (e.cancelable) {
          e.preventDefault();
        }
      }
    },
    [isDragging, isResizing, position.x, position.y],
  );

  // End dragging/resizing
  const handleEnd = useCallback(() => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      document.body.style.userSelect = '';
    }
  }, [isDragging, isResizing]);

  // Start resizing (mouse or touch)
  const handleResizeStart = (e) => {
    e.stopPropagation();
    const coords = getEventCoords(e);
    setIsResizing(true);
    dragStartPos.current = { x: coords.clientX, y: coords.clientY };
    windowStartPos.current = { ...position };
    windowStartSize.current = { ...size };
    document.body.style.userSelect = 'none';
  };

  // Global event listeners for dragging and resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      // Mouse events
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      // Touch events
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('touchcancel', handleEnd);

      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
        document.removeEventListener('touchcancel', handleEnd);
      };
    }
  }, [isDragging, isResizing, handleMove, handleEnd]);

  return (
    <motion.div
      ref={windowRef}
      className="window nasa-window"
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex,
        cursor: isDragging ? 'move' : 'default',
        touchAction: 'none', // Prevent browser handling of touch gestures
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      tabIndex={-1}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* System.css Title Bar */}
      <div className="title-bar">
        <button
          aria-label="Close"
          className="close"
          onClick={e => {
            e.stopPropagation();
            if (props.onClose) {
              props.onClose();
            } else {
              closeApp(windowId);
            }
          }}
        />
        <h1 className="title font-chicago">{title}</h1>
        <button
          aria-label="Resize"
          className="resize"
          onClick={handleResizeClick}
          title={isMaximized ? 'Restore' : 'Maximize'}
        />
      </div>
      <div className="separator"></div>

      {/* Window Content */}
      <div className="window-pane nasa-window-content">{children}</div>

      {/* System 6 Resize Handle */}
      {!isMaximized && (
        <div
          className="nasa-window-resize-handle"
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          title="Drag to resize window"
        />
      )}
    </motion.div>
  );
}

Window.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  windowId: PropTypes.string.isRequired,
  zIndex: PropTypes.number.isRequired,
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  onClose: PropTypes.func,
};

Window.defaultProps = {
  x: 100,
  y: 100,
  width: 500,
  height: 400,
};

