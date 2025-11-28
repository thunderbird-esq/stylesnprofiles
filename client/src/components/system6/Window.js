import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useApps } from '../../contexts/AppContext';

/**
 * Window component that represents a draggable application window
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render inside the window
 * @param {string} props.title - Window title displayed in title bar
 * @param {string} props.windowId - Unique identifier for the window
 * @param {number} props.zIndex - Z-index for window layering
 * @param {number} [props.x=100] - Initial X position
 * @param {number} [props.y=100] - Initial Y position
 * @param {number} [props.width=500] - Window width
 * @param {number} [props.height=400] - Window height
 * @returns {JSX.Element} A draggable application window
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
      const menuBarHeight = 20; // Approximate menu bar height

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
      // Restore window to original size and position
      setSize({ width, height });
      setPosition({ x, y });
      setIsMaximized(false);
    } else {
      // Store previous size and position before maximizing
      windowStartSize.current = { ...size };
      windowStartPos.current = { ...position };

      // Maximize window with System 6 style margins
      const maxWindowWidth = window.innerWidth - 32; // 16px margin on each side
      const maxWindowHeight = window.innerHeight - 52; // 20px for menu bar + 16px bottom margin
      setSize({ width: maxWindowWidth, height: maxWindowHeight });
      setPosition({ x: 16, y: 36 }); // 16px left, 20px menu bar + 16px top margin
      setIsMaximized(true);
    }
  };

  const handleMouseDown = e => {
    focusApp(windowId);

    // Only enable dragging from title bar when not maximized
    if (e.target.closest('.title-bar') && !isMaximized) {
      setIsDragging(true);
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      windowStartPos.current = { ...position };

      // Prevent text selection while dragging
      e.preventDefault();
      document.body.style.userSelect = 'none';
    }
  };

  const handleMouseMove = useCallback(
    e => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;

        const newX = Math.max(0, windowStartPos.current.x + deltaX);
        const newY = Math.max(0, windowStartPos.current.y + deltaY);

        setPosition({ x: newX, y: newY });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;

        // Calculate new dimensions with constraints
        const newWidth = Math.max(
          300,
          Math.min(window.innerWidth - 32, windowStartSize.current.width + deltaX),
        );
        const newHeight = Math.max(
          200,
          Math.min(window.innerHeight - 52, windowStartSize.current.height + deltaY),
        );

        // Ensure window stays within viewport
        const newX = Math.min(position.x, window.innerWidth - newWidth - 16);
        const newY = Math.min(position.y, window.innerHeight - newHeight - 16);

        setSize({ width: newWidth, height: newHeight });

        // Adjust position if window would go off-screen
        if (newX !== position.x || newY !== position.y) {
          setPosition({ x: newX, y: newY });
        }
      }
    },
    [isDragging, isResizing, position.x, position.y],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      document.body.style.userSelect = '';
    }
  }, [isDragging, isResizing]);

  // Global mouse event listeners for dragging and resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

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
      }}
      onMouseDown={handleMouseDown}
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
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
            dragStartPos.current = { x: e.clientX, y: e.clientY };
            windowStartPos.current = { ...position };
            windowStartSize.current = { ...size };
            document.body.style.userSelect = 'none';
          }}
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
