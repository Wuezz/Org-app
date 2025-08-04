import React from 'react';

const ConnectionLine = ({ connection, entities }) => {
  const fromEntity = entities.find(e => e.id === connection.from);
  const toEntity = entities.find(e => e.id === connection.to);

  if (!fromEntity || !toEntity) return null;

  // Calculate connection points (center of entities)
  const fromX = fromEntity.position.x + 90; // Half of entity width
  const fromY = fromEntity.position.y + 40; // Half of entity height
  const toX = toEntity.position.x + 90;
  const toY = toEntity.position.y + 40;

  // Calculate midpoint for label
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;

  // Calculate line length for SVG viewBox
  const minX = Math.min(fromX, toX) - 50;
  const minY = Math.min(fromY, toY) - 50;
  const maxX = Math.max(fromX, toX) + 50;
  const maxY = Math.max(fromY, toY) + 50;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        left: minX,
        top: minY,
        width: maxX - minX,
        height: maxY - minY
      }}
    >
      {/* Connection Line */}
      <line
        x1={fromX - minX}
        y1={fromY - minY}
        x2={toX - minX}
        y2={toY - minY}
        stroke="#6B7280"
        strokeWidth="2"
        className="drop-shadow-sm"
      />
      
      {/* Ownership Percentage Label */}
      <g>
        <rect
          x={midX - minX - 15}
          y={midY - minY - 10}
          width="30"
          height="20"
          fill="white"
          stroke="#D1D5DB"
          strokeWidth="1"
          rx="4"
          className="drop-shadow-sm"
        />
        <text
          x={midX - minX}
          y={midY - minY + 4}
          textAnchor="middle"
          className="text-xs font-medium fill-gray-700"
          style={{ fontSize: '10px' }}
        >
          {connection.percentage}%
        </text>
      </g>
    </svg>
  );
};

export default ConnectionLine;