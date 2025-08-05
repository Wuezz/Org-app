import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from '../hooks/use-toast';
import EntityBox from './EntityBox';
import ConnectionLine from './ConnectionLine';
import { Download, Plus, ZoomIn, ZoomOut, RotateCcw, Trash2, Grid3X3, HelpCircle, MessageSquare } from 'lucide-react';
import { mockData } from '../utils/mockData';
import domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';
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
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  const canvasRef = useRef(null);
  const gridCanvasRef = useRef(null);
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

  // Grid rendering function
  const renderGrid = useCallback(() => {
    if (!gridCanvasRef.current || !canvasRef.current || !snapToAlignment) {
      return;
    }

    const gridCanvas = gridCanvasRef.current;
    const ctx = gridCanvas.getContext('2d');
    const canvasRect = canvasRef.current.getBoundingClientRect();

    // Set canvas size to match the viewport
    gridCanvas.width = canvasRect.width;
    gridCanvas.height = canvasRect.height;

    // Clear the canvas
    ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    const GRID_SIZE = 120;
    
    // Calculate the visible area in canvas coordinates (accounting for zoom and pan)
    const viewportLeft = (-pan.x) / zoom;
    const viewportTop = (-pan.y) / zoom;
    const viewportRight = (canvasRect.width - pan.x) / zoom;
    const viewportBottom = (canvasRect.height - pan.y) / zoom;

    // Calculate grid line positions
    const startX = Math.floor(viewportLeft / GRID_SIZE) * GRID_SIZE;
    const endX = Math.ceil(viewportRight / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor(viewportTop / GRID_SIZE) * GRID_SIZE;
    const endY = Math.ceil(viewportBottom / GRID_SIZE) * GRID_SIZE;

    // Set grid line style
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Apply the same transform as the main canvas
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x / zoom, pan.y / zoom);

    // Draw vertical lines
    for (let x = startX; x <= endX; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, startY - GRID_SIZE);
      ctx.lineTo(x, endY + GRID_SIZE);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = startY; y <= endY; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(startX - GRID_SIZE, y);
      ctx.lineTo(endX + GRID_SIZE, y);
      ctx.stroke();
    }

    ctx.restore();
  }, [zoom, pan, snapToAlignment]);

  // Re-render grid when zoom, pan, or snap state changes
  useEffect(() => {
    renderGrid();
  }, [renderGrid]);

  // Re-render grid when window resizes
  useEffect(() => {
    const handleResize = () => {
      setTimeout(renderGrid, 100); // Small delay to ensure layout has updated
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderGrid]);

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

  const handleEntityDragStart = useCallback((entityId, clientPos) => {
    const entity = entities.find(e => e.id === entityId);
    if (entity && canvasRef.current) {
      setDraggedEntity(entityId);
      
      // Convert client coordinates to canvas coordinates
      const rect = canvasRef.current.getBoundingClientRect();
      const canvasPos = {
        x: (clientPos.x - rect.left - pan.x) / zoom,
        y: (clientPos.y - rect.top - pan.y) / zoom
      };
      
      // Calculate the offset from the entity's top-left corner to the mouse position
      setDragOffset({
        x: canvasPos.x - entity.position.x,
        y: canvasPos.y - entity.position.y
      });
    }
  }, [entities, pan, zoom]);

  const handleEntityDrag = useCallback((mousePos) => {
    if (draggedEntity) {
      // Grid configuration
      const GRID_SIZE = 120; // Grid spacing in pixels
      const SNAP_THRESHOLD = 20; // Increased threshold for grid snapping
      
      // Function to estimate entity box width based on content
      const estimateEntityWidth = (entity) => {
        const MIN_WIDTH = 140;
        const MAX_WIDTH = 240;
        const CHAR_WIDTH = 7; // Approximate character width
        const PADDING = 48; // Icon space + padding
        
        // Calculate text width based on name length
        const nameWidth = entity.name.length * CHAR_WIDTH;
        const idWidth = entity.idNumber ? entity.idNumber.length * 6 : 0;
        
        const estimatedWidth = Math.max(nameWidth, idWidth) + PADDING;
        
        return Math.min(Math.max(estimatedWidth, MIN_WIDTH), MAX_WIDTH);
      };
      
      // Function to calculate entity box height based on name length and content
      const calculateEntityHeight = (entity) => {
        const baseHeight = 68; // Base height for single line content
        const nameLineHeight = 16; // Height per line of text
        const CHARACTER_LIMIT = 32; // Updated to match EntityBox
        
        // Calculate how many lines the name will take
        const nameLines = entity.name.length <= CHARACTER_LIMIT ? 1 : Math.ceil(entity.name.length / CHARACTER_LIMIT);
        const additionalHeight = (nameLines - 1) * nameLineHeight;
        
        return baseHeight + additionalHeight;
      };
      
      // Calculate the desired position based on mouse
      let newX = mousePos.x - dragOffset.x;
      let newY = mousePos.y - dragOffset.y;
      
      const horizontalGuides = [];
      const verticalGuides = [];
      let snappedX = newX;
      let snappedY = newY;
      let hasSnapped = false;
      
      // Grid-based snapping when snap-to-alignment is enabled
      if (snapToAlignment) {
        const draggedEntityData = entities.find(e => e.id === draggedEntity);
        const draggedWidth = estimateEntityWidth(draggedEntityData);
        const draggedHeight = calculateEntityHeight(draggedEntityData);
        
        // Find the center point of the dragged entity
        const draggedCenterX = newX + draggedWidth / 2;
        const draggedCenterY = newY + draggedHeight / 2;
        
        // Calculate nearest grid points
        const nearestGridX = Math.round(draggedCenterX / GRID_SIZE) * GRID_SIZE;
        const nearestGridY = Math.round(draggedCenterY / GRID_SIZE) * GRID_SIZE;
        
        // Calculate distance to nearest grid point
        const distanceToGridX = Math.abs(draggedCenterX - nearestGridX);
        const distanceToGridY = Math.abs(draggedCenterY - nearestGridY);
        
        // Snap to grid if within threshold
        if (distanceToGridX <= SNAP_THRESHOLD) {
          snappedX = nearestGridX - draggedWidth / 2;
          verticalGuides.push({
            x: nearestGridX,
            y1: nearestGridY - 200,
            y2: nearestGridY + 200
          });
          hasSnapped = true;
        }
        
        if (distanceToGridY <= SNAP_THRESHOLD) {
          snappedY = nearestGridY - draggedHeight / 2;
          horizontalGuides.push({
            y: nearestGridY,
            x1: nearestGridX - 200,
            x2: nearestGridX + 200
          });
          hasSnapped = true;
        }
        
        // Additional snapping: Between existing entities for V-shapes
        const otherEntities = entities.filter(e => e.id !== draggedEntity);
        
        // Look for pairs of entities at the same Y level to create V-shape opportunities
        for (let i = 0; i < otherEntities.length; i++) {
          for (let j = i + 1; j < otherEntities.length; j++) {
            const entity1 = otherEntities[i];
            const entity2 = otherEntities[j];
            
            const entity1Width = estimateEntityWidth(entity1);
            const entity2Width = estimateEntityWidth(entity2);
            const entity1Height = calculateEntityHeight(entity1);
            const entity2Height = calculateEntityHeight(entity2);
            
            const entity1CenterX = entity1.position.x + entity1Width / 2;
            const entity1CenterY = entity1.position.y + entity1Height / 2;
            const entity2CenterX = entity2.position.x + entity2Width / 2;
            const entity2CenterY = entity2.position.y + entity2Height / 2;
            
            // Check if entities are roughly at the same Y level (within grid spacing)
            if (Math.abs(entity1CenterY - entity2CenterY) <= GRID_SIZE / 2) {
              // Calculate midpoint between the two entities
              const midpointX = (entity1CenterX + entity2CenterX) / 2;
              const avgY = (entity1CenterY + entity2CenterY) / 2;
              
              // Check if dragged entity center is near this midpoint
              const distanceToMidX = Math.abs(draggedCenterX - midpointX);
              const distanceToMidY = Math.abs(draggedCenterY - (avgY + GRID_SIZE)); // Below the pair
              
              if (distanceToMidX <= SNAP_THRESHOLD && distanceToMidY <= SNAP_THRESHOLD) {
                snappedX = midpointX - draggedWidth / 2;
                snappedY = avgY + GRID_SIZE - draggedHeight / 2;
                
                // Add visual guides for V-shape
                verticalGuides.push({
                  x: midpointX,
                  y1: avgY - 50,
                  y2: avgY + GRID_SIZE + 50
                });
                
                horizontalGuides.push({
                  y: avgY + GRID_SIZE,
                  x1: Math.min(entity1CenterX, entity2CenterX) - 50,
                  x2: Math.max(entity1CenterX, entity2CenterX) + 50
                });
                
                hasSnapped = true;
                break;
              }
            }
          }
          if (hasSnapped) break;
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

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedbackMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a feedback message",
        variant: "destructive"
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('message', feedbackMessage);
      formData.append('_subject', 'Feedback from Ownero.app');
      
      const response = await fetch('https://formsubmit.co/edward@tuvekarr.com', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
        toast({
          title: "Success",
          description: "Feedback sent successfully!"
        });
      } else {
        throw new Error('Failed to send feedback');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFeedbackDialogClose = () => {
    setShowFeedbackDialog(false);
    setFeedbackMessage('');
    setFeedbackSubmitted(false);
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

  const downloadAsPDF = async () => {
    try {
      const dataUrl = await captureCanvasAsImage();
      
      // Create PDF document in landscape mode
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // A4 landscape dimensions (297mm x 210mm)
      const pdfWidth = 297;
      const pdfHeight = 210;
      
      // Add the image to PDF, scaled to fit the page
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Save the PDF
      pdf.save('ownership-chart.pdf');
      
      toast({
        title: "Success",
        description: "PDF downloaded successfully"
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
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-900">Ownership & Org Chart Tool</h1>
            <Link 
              to="/faq" 
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              FAQ
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFeedbackDialog(true)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Feedback
            </Button>
          </div>
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
              onClick={downloadAsPDF} 
              variant="outline"
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Generating...' : 'Download PDF'}
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
              <Button onClick={handleUpdateEntity} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
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
        {/* Grid Canvas */}
        <canvas
          id="grid-canvas"
          ref={gridCanvasRef}
          className="absolute top-0 left-0 pointer-events-none z-0"
          style={{
            width: '100%',
            height: '100%'
          }}
        />
        
        <div 
          id="ownership-canvas"
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