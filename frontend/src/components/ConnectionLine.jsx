import React, { useState } from 'react';
import { Input } from './ui/input';

const ConnectionLine = ({ connection, entities, onUpdatePercentage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(connection.percentage.toString());

  const fromEntity = entities.find(e => e.id === connection.from);
  const toEntity = entities.find(e => e.id === connection.to);

  if (!fromEntity || !toEntity) return null;

  // Function to calculate entity box height based on name length and content
  const calculateEntityHeight = (entity) => {
    const baseHeight = 68; // Base height for single line content (padding + icon + text + id)
    const nameLineHeight = 16; // Height per line of text
    const CHARACTER_LIMIT = 32; // Updated to match EntityBox
    
    // Calculate how many lines the name will take
    const nameLines = entity.name.length <= CHARACTER_LIMIT ? 1 : Math.ceil(entity.name.length / CHARACTER_LIMIT);
    const additionalHeight = (nameLines - 1) * nameLineHeight;
    
    return baseHeight + additionalHeight;
  };

  // Calculate connection points (center of entities with dynamic dimensions)
  const ENTITY_WIDTH = 180; // Fixed width as defined in EntityBox
  
  const fromHeight = calculateEntityHeight(fromEntity);
  const toHeight = calculateEntityHeight(toEntity);
  
  const fromX = fromEntity.position.x + ENTITY_WIDTH / 2; // Center X
  const fromY = fromEntity.position.y + fromHeight / 2; // Center Y
  const toX = toEntity.position.x + ENTITY_WIDTH / 2; // Center X
  const toY = toEntity.position.y + toHeight / 2; // Center Y

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