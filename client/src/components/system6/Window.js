import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useApps } from '../../contexts/AppContext';

export default function Window({ children, title, windowId, zIndex, x = 100, y = 100, width = 500, height = 400 }) {
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

  const handleMouseDown = (e) => {
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

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;

    const newX = Math.max(0, windowStartPos.current.x + deltaX);
    const newY = Math.max(0, windowStartPos.current.y + deltaY);

    setPosition({ x: newX, y: newY });
  }, [isDragging]);

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
          onClick={(e) => {
            e.stopPropagation();
            closeApp(windowId);
          }}
        />
        <h1 className="title font-chicago">{title}</h1>
        <button
          aria-label="Resize"
          className="resize"
        />
      </div>
      <div className="separator"></div>

      {/* Window Content */}
      <div className="window-pane nasa-window-content">
        {children}
      </div>
    </motion.div>
  );
}