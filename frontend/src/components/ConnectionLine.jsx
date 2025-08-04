import React, { useState } from 'react';
import { Input } from './ui/input';

const ConnectionLine = ({ connection, entities, onUpdatePercentage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(connection.percentage.toString());

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

  const handlePercentageClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(connection.percentage.toString());
  };

  const handlePercentageSubmit = () => {
    const newPercentage = parseInt(editValue) || 0;
    if (newPercentage >= 0 && newPercentage <= 100) {
      onUpdatePercentage(connection.id, newPercentage);
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePercentageSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(connection.percentage.toString());
    }
  };

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
          x={midX - minX - 25}
          y={midY - minY - 12}
          width="50"
          height="24"
          fill="white"
          stroke="#D1D5DB"
          strokeWidth="1"
          rx="4"
          className="drop-shadow-sm cursor-pointer pointer-events-auto"
          onClick={handlePercentageClick}
        />
        
        {isEditing ? (
          <foreignObject
            x={midX - minX - 20}
            y={midY - minY - 8}
            width="40"
            height="16"
            className="pointer-events-auto"
          >
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handlePercentageSubmit}
              onKeyDown={handleKeyPress}
              className="text-xs h-4 px-1 text-center border-none bg-transparent"
              style={{ fontSize: '10px' }}
              autoFocus
              type="number"
              min="0"
              max="100"
            />
          </foreignObject>
        ) : (
          <text
            x={midX - minX}
            y={midY - minY + 4}
            textAnchor="middle"
            className="text-xs font-medium fill-gray-700 cursor-pointer pointer-events-auto hover:fill-blue-600"
            style={{ fontSize: '10px' }}
            onClick={handlePercentageClick}
            title="Click to edit percentage"
          >
            {connection.percentage}%
          </text>
        )}
      </g>
    </svg>
  );
};

export default ConnectionLine;