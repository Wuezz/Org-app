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
import { Download, Plus, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { mockData } from '../utils/mockData';
import jsPDF from 'jspdf';

const OwnershipCanvas = () => {
  const [entities, setEntities] = useState(mockData.entities);
  const [connections, setConnections] = useState(mockData.connections);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggedEntity, setDraggedEntity] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEntity, setNewEntity] = useState({ name: '', id: '', type: 'company' });
  const [parentEntity, setParentEntity] = useState(null);
  const [connectionType, setConnectionType] = useState('owner'); // 'owner' or 'subsidiary'
  const [showEditEntityDialog, setShowEditEntityDialog] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [editEntityData, setEditEntityData] = useState({ name: '', id: '', type: 'company' });
  
  const canvasRef = useRef(null);
  const { toast } = useToast();

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('ownershipData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setEntities(parsed.entities || mockData.entities);
      setConnections(parsed.connections || mockData.connections);
    }
  }, []);

  // Save data to localStorage whenever entities or connections change
  useEffect(() => {
    const dataToSave = { entities, connections };
    localStorage.setItem('ownershipData', JSON.stringify(dataToSave));
  }, [entities, connections]);

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
      setEntities(prev => prev.map(entity => 
        entity.id === draggedEntity 
          ? { 
              ...entity, 
              position: { 
                x: mousePos.x - dragOffset.x, 
                y: mousePos.y - dragOffset.y 
              } 
            }
          : entity
      ));
    }
  }, [draggedEntity, dragOffset]);

  const handleEntityDragEnd = useCallback(() => {
    setDraggedEntity(null);
    setDragOffset({ x: 0, y: 0 });
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

  const exportToPDF = () => {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1200, 800]
    });

    pdf.setFontSize(16);
    pdf.text('Ownership Hierarchy Diagram', 20, 30);
    
    // Add entities as rectangles with text
    entities.forEach(entity => {
      const x = entity.position.x / 2;
      const y = entity.position.y / 2 + 60;
      
      pdf.setDrawColor(0, 0, 0);
      pdf.setFillColor(248, 250, 252);
      pdf.rect(x, y, 120, 60, 'FD');
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(entity.name, x + 10, y + 25);
      
      if (entity.idNumber) {
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`ID: ${entity.idNumber}`, x + 10, y + 40);
      }
    });

    // Add connection lines
    connections.forEach(conn => {
      const fromEntity = entities.find(e => e.id === conn.from);
      const toEntity = entities.find(e => e.id === conn.to);
      
      if (fromEntity && toEntity) {
        const fromX = fromEntity.position.x / 2 + 60;
        const fromY = fromEntity.position.y / 2 + 90;
        const toX = toEntity.position.x / 2 + 60;
        const toY = toEntity.position.y / 2 + 60;
        
        pdf.setDrawColor(100, 100, 100);
        pdf.line(fromX, fromY, toX, toY);
        
        // Add percentage label
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${conn.percentage}%`, midX, midY);
      }
    });

    pdf.save('ownership-hierarchy.pdf');
    
    toast({
      title: "Success",
      description: "PDF exported successfully"
    });
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Ownership Hierarchy Builder</h1>
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

            <Button onClick={exportToPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={canvasRef}
          className="w-full h-full relative cursor-move"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0'
          }}
          onMouseMove={(e) => {
            if (draggedEntity) {
              const rect = canvasRef.current.getBoundingClientRect();
              const mousePos = {
                x: (e.clientX - rect.left - pan.x) / zoom,
                y: (e.clientY - rect.top - pan.y) / zoom
              };
              handleEntityDrag(mousePos);
            }
          }}
          onMouseUp={handleEntityDragEnd}
        >
          {/* Grid Background */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />

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