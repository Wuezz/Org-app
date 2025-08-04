import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from '../hooks/use-toast';
import EntityBox from './EntityBox';
import ConnectionLine from './ConnectionLine';
import { Download, Plus, ZoomIn, ZoomOut, RotateCcw, Trash2, Grid3X3 } from 'lucide-react';
import { mockData } from '../utils/mockData';
import domtoimage from 'dom-to-image';
import { Switch } from './ui/switch';

const OwnershipCanvas = () => {
  const [entities, setEntities] = useState(mockData.entities);
  const [connections, setConnections] = useState(mockData.connections);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggedEntity, setDraggedEntity] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [snapGuides, setSnapGuides] = useState({ horizontal: [], vertical: [] });
  const [isSnapping, setIsSnapping] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [snapToAlignment, setSnapToAlignment] = useState(() => {
    const saved = localStorage.getItem('snapToAlignment');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEntity, setNewEntity] = useState({ name: '', id: '', type: 'company' });
  const [parentEntity, setParentEntity] = useState(null);
  const [connectionType, setConnectionType] = useState('owner'); // 'owner' or 'subsidiary'
  const [showEditEntityDialog, setShowEditEntityDialog] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [editEntityData, setEditEntityData] = useState({ name: '', id: '', type: 'company' });
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  
  const canvasRef = useRef(null);
  const { toast } = useToast();

  // Save data to localStorage whenever entities or connections change
  useEffect(() => {
    const dataToSave = { entities, connections };
    localStorage.setItem('ownershipData', JSON.stringify(dataToSave));
  }, [entities, connections]);

  // Save snap preference to localStorage
  useEffect(() => {
    localStorage.setItem('snapToAlignment', JSON.stringify(snapToAlignment));
  }, [snapToAlignment]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('ownershipData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setEntities(parsed.entities || mockData.entities);
      setConnections(parsed.connections || mockData.connections);
    }
  }, []);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleEntityDragStart = useCallback((entityId, mousePos) => {
    const entity = entities.find(e => e.id === entityId);
    if (entity) {
      setDraggedEntity(entityId);
      setDragOffset({
        x: mousePos.x - entity.position.x,
        y: mousePos.y - entity.position.y
      });
    }
  }, [entities]);

  const handleEntityDrag = useCallback((mousePos) => {
    if (draggedEntity) {
      const SNAP_THRESHOLD = 12; // pixels
      const ENTITY_WIDTH = 180;
      
      // Function to calculate entity box height based on name length and content
      const calculateEntityHeight = (entity) => {
        const baseHeight = 68; // Base height for single line content (padding + icon + text + id)
        const nameLineHeight = 16; // Height per line of text
        
        // Calculate how many lines the name will take
        const nameLines = entity.name.length <= 25 ? 1 : Math.ceil(entity.name.length / 25);
        const additionalHeight = (nameLines - 1) * nameLineHeight;
        
        return baseHeight + additionalHeight;
      };
      
      // Default to following mouse position exactly
      let newX = mousePos.x - dragOffset.x;
      let newY = mousePos.y - dragOffset.y;
      
      const horizontalGuides = [];
      const verticalGuides = [];
      let snappedX = newX;
      let snappedY = newY;
      let hasSnapped = false;
      
      // Only apply snapping if enabled and within threshold
      if (snapToAlignment) {
        const otherEntities = entities.filter(e => e.id !== draggedEntity);
        const draggedEntityData = entities.find(e => e.id === draggedEntity);
        
        // Check for horizontal alignment (same Y position)
        for (const entity of otherEntities) {
          const entityHeight = calculateEntityHeight(entity);
          const draggedHeight = calculateEntityHeight(draggedEntityData);
          
          const entityCenterY = entity.position.y + entityHeight / 2;
          const draggedCenterY = newY + draggedHeight / 2;
          const yDistance = Math.abs(draggedCenterY - entityCenterY);
          
          if (yDistance <= SNAP_THRESHOLD) {
            // Align the centers by adjusting the position
            snappedY = entity.position.y + (entityHeight - draggedHeight) / 2;
            horizontalGuides.push({
              y: entityCenterY,
              x1: Math.min(entity.position.x, newX) - 50,
              x2: Math.max(entity.position.x + ENTITY_WIDTH, newX + ENTITY_WIDTH) + 50
            });
            hasSnapped = true;
            break; // Only snap to the closest alignment
          }
        }
        
        // Check for vertical alignment (same X position)
        for (const entity of otherEntities) {
          const entityHeight = calculateEntityHeight(entity);
          const draggedHeight = calculateEntityHeight(draggedEntityData);
          
          const entityCenterX = entity.position.x + ENTITY_WIDTH / 2;
          const draggedCenterX = newX + ENTITY_WIDTH / 2;
          const xDistance = Math.abs(draggedCenterX - entityCenterX);
          
          if (xDistance <= SNAP_THRESHOLD) {
            snappedX = entity.position.x;
            verticalGuides.push({
              x: entityCenterX,
              y1: Math.min(entity.position.y, newY) - 50,
              y2: Math.max(entity.position.y + entityHeight, newY + draggedHeight) + 50
            });
            hasSnapped = true;
            break; // Only snap to the closest alignment
          }
        }
      }
      
      // Update snap guides only when snapping is active
      setSnapGuides({ horizontal: horizontalGuides, vertical: verticalGuides });
      setIsSnapping(snapToAlignment && hasSnapped);
      
      // Update entity position (snapped or original mouse position)
      setEntities(prev => prev.map(entity => 
        entity.id === draggedEntity 
          ? { 
              ...entity, 
              position: { 
                x: snappedX, 
                y: snappedY 
              } 
            }
          : entity
      ));
    }
  }, [draggedEntity, dragOffset, entities, snapToAlignment]);

  const handleEntityDragEnd = useCallback(() => {
    setDraggedEntity(null);
    setDragOffset({ x: 0, y: 0 });
    setSnapGuides({ horizontal: [], vertical: [] });
    setIsSnapping(false);
  }, []);

  const handleCanvasMouseDown = useCallback((e) => {
    // Only start panning if we're not clicking on an entity or connection
    if (e.target === e.currentTarget || e.target.classList.contains('grid-background')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggedEntity) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mousePos = {
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom
      };
      handleEntityDrag(mousePos);
    }
  }, [isPanning, panStart, draggedEntity, pan, zoom, handleEntityDrag]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    handleEntityDragEnd();
  }, [handleEntityDragEnd]);

  const handleAddEntity = (parentId, type) => {
    setParentEntity(parentId);
    setConnectionType(type);
    setShowAddDialog(true);
  };

  const handleEditEntity = (entityId) => {
    const entity = entities.find(e => e.id === entityId);
    if (entity) {
      setEditingEntity(entityId);
      setEditEntityData({
        name: entity.name,
        id: entity.idNumber || '',
        type: entity.type
      });
      setShowEditEntityDialog(true);
    }
  };

  const handleUpdateEntity = () => {
    if (!editEntityData.name.trim()) {
      toast({
        title: "Error",
        description: "Entity name is required",
        variant: "destructive"
      });
      return;
    }

    setEntities(prev => prev.map(entity => 
      entity.id === editingEntity 
        ? {
            ...entity,
            name: editEntityData.name,
            idNumber: editEntityData.id,
            type: editEntityData.type
          }
        : entity
    ));

    setShowEditEntityDialog(false);
    setEditingEntity(null);
    setEditEntityData({ name: '', id: '', type: 'company' });
    
    toast({
      title: "Success",
      description: "Entity updated successfully"
    });
  };

  const handleUpdatePercentage = (connectionId, newPercentage) => {
    const percentage = Math.max(0, Math.min(100, parseInt(newPercentage) || 0));
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId 
        ? { ...conn, percentage }
        : conn
    ));
  };

  const handleDeleteEntity = () => {
    if (!editingEntity) return;

    // Remove the entity
    setEntities(prev => prev.filter(entity => entity.id !== editingEntity));
    
    // Remove all connections involving this entity
    setConnections(prev => prev.filter(conn => 
      conn.from !== editingEntity && conn.to !== editingEntity
    ));

    setShowEditEntityDialog(false);
    setEditingEntity(null);
    setEditEntityData({ name: '', id: '', type: 'company' });
    
    toast({
      title: "Success",
      description: "Entity deleted successfully"
    });
  };

  const handleClearAll = () => {
    setEntities([]);
    setConnections([]);
    setShowClearAllDialog(false);
    localStorage.removeItem('ownershipData');
    
    toast({
      title: "Success",
      description: "All entities cleared successfully"
    });
  };

  const createEntity = () => {
    if (!newEntity.name.trim()) {
      toast({
        title: "Error",
        description: "Entity name is required",
        variant: "destructive"
      });
      return;
    }

    const id = Date.now().toString();
    const parentPos = entities.find(e => e.id === parentEntity)?.position || { x: 400, y: 300 };
    
    const newEntityObj = {
      id,
      name: newEntity.name,
      idNumber: newEntity.id,
      type: newEntity.type,
      position: {
        x: parentPos.x + (connectionType === 'owner' ? 0 : 200),
        y: parentPos.y + (connectionType === 'owner' ? -150 : 150)
      }
    };

    setEntities(prev => [...prev, newEntityObj]);

    // Create connection
    if (parentEntity) {
      const connectionId = Date.now().toString() + '_conn';
      const newConnection = {
        id: connectionId,
        from: connectionType === 'owner' ? id : parentEntity,
        to: connectionType === 'owner' ? parentEntity : id,
        percentage: 100
      };
      setConnections(prev => [...prev, newConnection]);
    }

    setNewEntity({ name: '', id: '', type: 'company' });
    setShowAddDialog(false);
    setParentEntity(null);
    
    toast({
      title: "Success",
      description: "Entity added successfully"
    });
  };

  const captureCanvasAsImage = async () => {
    try {
      setIsExporting(true);
      
      // Hide snap guides and add/edit arrows during export
      setSnapGuides({ horizontal: [], vertical: [] });
      setIsSnapping(false);
      
      const canvasElement = canvasRef.current;
      if (!canvasElement) {
        throw new Error('Canvas element not found');
      }

      // Wait a moment for UI updates to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the canvas with high resolution
      const dataUrl = await domtoimage.toPng(canvasElement, {
        quality: 1.0,
        width: canvasElement.offsetWidth,
        height: canvasElement.offsetHeight,
        style: {
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: '0 0'
        },
        // Filter out add/edit buttons
        filter: (node) => {
          // Hide add owner/subsidiary buttons during export
          if (node.classList && (
            node.classList.contains('add-owner-btn') || 
            node.classList.contains('add-subsidiary-btn')
          )) {
            return false;
          }
          return true;
        },
        scale: 3 // 3x resolution for high quality
      });

      setIsExporting(false);
      return dataUrl;
    } catch (error) {
      setIsExporting(false);
      console.error('Error capturing canvas:', error);
      toast({
        title: "Error",
        description: "Failed to capture canvas. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const downloadAsImage = async () => {
    try {
      const dataUrl = await captureCanvasAsImage();
      
      // Create download link
      const link = document.createElement('a');
      link.download = 'ownership-hierarchy.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Image downloaded successfully"
      });
    } catch (error) {
      // Error already handled in captureCanvasAsImage
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Ownership & Org Chart Tool</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleZoomOut}
                className="p-2"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleZoomIn}
                className="p-2"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                className="p-2"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2 border-l pl-4">
              <Grid3X3 className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Snap to alignment</span>
              <Switch
                checked={snapToAlignment}
                onCheckedChange={setSnapToAlignment}
              />
            </div>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setParentEntity(null);
                    setConnectionType('owner');
                    setShowAddDialog(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Entity</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="entity-name">Entity Name</Label>
                    <Input
                      id="entity-name"
                      value={newEntity.name}
                      onChange={(e) => setNewEntity(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter entity name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-id">ID Number (Optional)</Label>
                    <Input
                      id="entity-id"
                      value={newEntity.id}
                      onChange={(e) => setNewEntity(prev => ({ ...prev, id: e.target.value }))}
                      placeholder="Enter ID number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-type">Entity Type</Label>
                    <Select 
                      value={newEntity.type} 
                      onValueChange={(value) => setNewEntity(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="person">Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createEntity} className="w-full">
                    Create Entity
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={downloadAsImage} 
              variant="outline"
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Generating...' : 'Download Image'}
            </Button>

            <Button 
              onClick={() => setShowClearAllDialog(true)} 
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Entity Dialog */}
      <Dialog open={showEditEntityDialog} onOpenChange={setShowEditEntityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Entity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-entity-name">Entity Name</Label>
              <Input
                id="edit-entity-name"
                value={editEntityData.name}
                onChange={(e) => setEditEntityData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter entity name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-entity-id">ID Number (Optional)</Label>
              <Input
                id="edit-entity-id"
                value={editEntityData.id}
                onChange={(e) => setEditEntityData(prev => ({ ...prev, id: e.target.value }))}
                placeholder="Enter ID number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-entity-type">Entity Type</Label>
              <Select 
                value={editEntityData.type} 
                onValueChange={(value) => setEditEntityData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="person">Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleUpdateEntity} className="flex-1">
                Update Entity
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEditEntityDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEntity}
              className="w-full mt-2"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Entity
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Entities</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to clear the current hierarchy? This will delete all entities and connections. This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <Button 
                variant="destructive" 
                onClick={handleClearAll}
                className="flex-1"
              >
                Yes, Clear All
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowClearAllDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={canvasRef}
          className={`w-full h-full relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0'
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {/* Grid Background */}
          <div 
            className="absolute inset-0 opacity-20 grid-background pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />

          {/* Snap Guidelines */}
          {isSnapping && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Horizontal snap guides */}
              {snapGuides.horizontal.map((guide, index) => (
                <div
                  key={`h-${index}`}
                  className="absolute bg-blue-500 opacity-70 animate-pulse"
                  style={{
                    left: guide.x1,
                    top: guide.y - 1,
                    width: guide.x2 - guide.x1,
                    height: 2,
                    transition: 'opacity 0.2s ease-in-out'
                  }}
                />
              ))}
              
              {/* Vertical snap guides */}
              {snapGuides.vertical.map((guide, index) => (
                <div
                  key={`v-${index}`}
                  className="absolute bg-blue-500 opacity-70 animate-pulse"
                  style={{
                    left: guide.x - 1,
                    top: guide.y1,
                    width: 2,
                    height: guide.y2 - guide.y1,
                    transition: 'opacity 0.2s ease-in-out'
                  }}
                />
              ))}
            </div>
          )}

          {/* Connection Lines */}
          {connections.map(connection => (
            <ConnectionLine 
              key={connection.id}
              connection={connection}
              entities={entities}
              onUpdatePercentage={handleUpdatePercentage}
            />
          ))}

          {/* Entity Boxes */}
          {entities.map(entity => (
            <EntityBox
              key={entity.id}
              entity={entity}
              onDragStart={handleEntityDragStart}
              onAddOwner={(id) => handleAddEntity(id, 'owner')}
              onAddSubsidiary={(id) => handleAddEntity(id, 'subsidiary')}
              onEdit={handleEditEntity}
              isDragging={draggedEntity === entity.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OwnershipCanvas;