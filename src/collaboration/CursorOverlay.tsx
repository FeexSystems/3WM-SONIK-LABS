import React, { useEffect, useState } from 'react';
import { useCollaboration } from './useCollaboration';

interface Cursor {
  userId: string;
  x: number;
  y: number;
  name: string;
  color: string;
}

interface CursorOverlayProps {
  roomName: string;
  userName: string;
  userColor: string;
}

export const CursorOverlay: React.FC<CursorOverlayProps> = ({ roomName, userName, userColor }) => {
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const { isConnected, updateAwareness, getAwarenessStates } = useCollaboration({
    roomName,
  });

  useEffect(() => {
    if (!isConnected) return;

    updateAwareness({
      name: userName,
      color: userColor,
    });

    const interval = setInterval(() => {
      const states = getAwarenessStates();
      const remoteCursors = states
        .filter((state: any) => state.user && state.user.name !== userName)
        .map((state: any) => ({
          userId: state.user.name,
          x: state.user.cursor?.x || 0,
          y: state.user.cursor?.y || 0,
          name: state.user.name,
          color: state.user.color,
        }));

      setCursors(remoteCursors);
    }, 100);

    return () => clearInterval(interval);
  }, [isConnected, userName, userColor, updateAwareness, getAwarenessStates]);

  const handleMouseMove = (e: React.MouseEvent) => {
    updateAwareness({
      name: userName,
      color: userColor,
      cursor: { x: e.clientX, y: e.clientY },
    });
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50" onMouseMove={handleMouseMove}>
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-all duration-100"
          style={{
            left: cursor.x,
            top: cursor.y,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: cursor.color }}
          >
            <path
              d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.85 2.85a.5.5 0 0 0-.35.36z"
              fill="currentColor"
            />
          </svg>
          <span
            className="absolute left-6 top-4 px-2 py-1 text-xs font-medium text-white rounded whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </span>
        </div>
      ))}
    </div>
  );
};
