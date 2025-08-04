import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Factory, User, ArrowUp, ArrowDown } from 'lucide-react';

const EntityBox = ({ entity, onDragStart, onAddOwner, onAddSubsidiary, onEdit, isDragging }) => {
  const handleMouseDown = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    onDragStart(entity.id, { x: entity.position.x + mousePos.x, y: entity.position.y + mousePos.y });
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(entity.id);
  };

  return (
    <div
      className={`absolute transition-all duration-200 ${isDragging ? 'z-50' : 'z-10'}`}
      style={{
        left: entity.position.x,
        top: entity.position.y,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)'
      }}
    >
      {/* Add Owner Button */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
        <Button
          size="sm"
          variant="outline"
          className={`h-6 w-6 p-0 bg-white shadow-md hover:bg-blue-50 hover:border-blue-300 add-owner-btn ${
            isDragging ? 'opacity-0 pointer-events-none' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onAddOwner(entity.id);
          }}
        >
          <ArrowUp className="h-3 w-3 text-blue-600" />
        </Button>
      </div>

      {/* Entity Card */}
      <Card 
        className={`p-4 cursor-move select-none transition-all duration-200 min-w-[180px] ${
          isDragging 
            ? 'shadow-xl border-blue-300 bg-blue-50' 
            : 'shadow-md hover:shadow-lg border-gray-200 bg-white hover:bg-gray-50'
        }`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        title="Double-click to edit"
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {entity.type === 'company' ? (
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Factory className="h-5 w-5 text-blue-600" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {entity.name}
            </h3>
            {entity.idNumber && (
              <p className="text-xs text-gray-500 truncate">
                ID: {entity.idNumber}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Add Subsidiary Button */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
        <Button
          size="sm"
          variant="outline"
          className={`h-6 w-6 p-0 bg-white shadow-md hover:bg-green-50 hover:border-green-300 add-subsidiary-btn ${
            isDragging ? 'opacity-0 pointer-events-none' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onAddSubsidiary(entity.id);
          }}
        >
          <ArrowDown className="h-3 w-3 text-green-600" />
        </Button>
      </div>
    </div>
  );
};

export default EntityBox;