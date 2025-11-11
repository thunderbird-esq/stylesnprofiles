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
}) {
  const { closeApp, focusApp, activeWindow } = useApps();
  const [position, setPosition] = useState({ x, y });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const windowStartPos = useRef({ x: 0, y: 0 });
  const windowRef = useRef(null);

  const isActive = activeWindow === windowId;

  // Handle window focusing
  useEffect(() => {
    if (isActive && windowRef.current) {
      windowRef.current.focus();
    }
  }, [isActive]);

  const handleMouseDown = e => {
    focusApp(windowId);

    // Only enable dragging from title bar
    if (e.target.closest('.title-bar')) {
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
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      const newX = Math.max(0, windowStartPos.current.x + deltaX);
      const newY = Math.max(0, windowStartPos.current.y + deltaY);

      setPosition({ x: newX, y: newY });
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.userSelect = '';
    }
  }, [isDragging]);

  // Global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <motion.div
      ref={windowRef}
      className="window nasa-window"
      style={{
        width: `${width}px`,
        height: `${height}px`,
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
            closeApp(windowId);
          }}
        />
        <h1 className="title font-chicago">{title}</h1>
        <button aria-label="Resize" className="resize" />
      </div>
      <div className="separator"></div>

      {/* Window Content */}
      <div className="window-pane nasa-window-content">{children}</div>
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
};

Window.defaultProps = {
  x: 100,
  y: 100,
  width: 500,
  height: 400,
};
