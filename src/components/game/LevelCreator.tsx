'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLevels } from '@/hooks/useLevels';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BlockType, GridCell, Level, Movement } from '@/lib/types';
import {
  Home, Save, Eraser, Pipette, Frame, Apple, Trash2, Pencil,
  ArrowUp, ArrowDown, Play, PlusCircle,
  ArrowRightLeft, ArrowBigUp, ArrowBigDown, ArrowBigLeft, ArrowBigRight, Square
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { WormIcon } from '../icons/WormIcon';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Input } from '../ui/input'; // ✅ thêm Input
import { cn } from '@/lib/utils';

const BLOCK_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#f97316'];

type ToolType = BlockType | 'direction';

const TOOL_CONFIG: Record<ToolType, { color?: string; name: string; icon: React.ReactNode }> = {
  frame: { color: 'hsl(240, 10%, 40%)', name: 'Frame', icon: <Frame className="h-5 w-5" /> },
  worm: { color: 'hsl(120, 60%, 50%)', name: 'Worm', icon: <WormIcon className="h-5 w-5" /> },
  apple: { color: 'hsl(0, 84%, 60%)', name: 'Apple', icon: <Apple className="h-5 w-5" /> },
  block: { color: BLOCK_COLORS[0], name: 'Block', icon: <Pipette className="h-5 w-5" /> },
  floor: { name: 'Floor', icon: <Square className="h-5 w-5" /> },
  empty: { color: 'transparent', name: 'Eraser', icon: <Eraser className="h-5 w-5" /> },
  direction: { name: 'Direction', icon: <ArrowRightLeft className="h-5 w-5" /> },
};

const createEmptyGrid = (rows: number, cols: number): GridCell[][] =>
  Array(rows).fill(null).map(() =>
    Array(cols).fill(null).map(() => ({ type: 'empty', color: 'transparent' }))
  );

export default function LevelCreator() {
  const [rows, setRows] = useState(16);
  const [cols, setCols] = useState(10);
  const [grid, setGrid] = useState<GridCell[][]>(createEmptyGrid(rows, cols));
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolType>('frame');
  const [selectedBlockColor, setSelectedBlockColor] = useState(BLOCK_COLORS[0]);
  const [selectedDirection, setSelectedDirection] = useState<Movement>('horizontal');
  const [isDrawing, setIsDrawing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { levels, saveLevel, updateLevel, deleteLevel, moveLevel } = useLevels();

  const sortedLevels = [...levels].sort((a, b) => a.order - b.order);

  const startNewLevel = useCallback(() => {
    setEditingLevelId(null);
    setGrid(createEmptyGrid(rows, cols));
    toast({ title: "New Canvas", description: `Started a new ${rows}x${cols} level. Don't forget to save!` });
  }, [rows, cols, toast]);

  const startEditingLevel = useCallback((level: Level) => {
    setEditingLevelId(level.id);
    setRows(level.rows);
    setCols(level.cols);
    const gridCopy = level.grid.map(row => row.map(cell => ({ ...cell })));
    setGrid(gridCopy);
  }, []);

  const validateGrid = (): boolean => {
    let wormCount = 0;
    let appleCount = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === 'worm') wormCount++;
        if (cell.type === 'apple') appleCount++;
      }
    }
    if (wormCount !== 3) {
      toast({ title: "Invalid Level", description: "The worm must be exactly 3 cells long.", variant: "destructive" });
      return false;
    }
    if (appleCount !== 1) {
      toast({ title: "Invalid Level", description: "There must be exactly one apple.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateGrid()) return;
    const levelData = { rows, cols, grid };
    if (editingLevelId) {
      await updateLevel(editingLevelId, levelData);
    } else {
      const newLevel = await saveLevel(levelData);
      if (newLevel) setEditingLevelId(newLevel.id);
    }
  };

  const handlePlaytest = () => {
    if (!editingLevelId) {
      toast({ title: 'Save First!', description: 'Please save your level before playtesting.', variant: 'destructive' });
      return;
    }
    router.push(`/play/${editingLevelId}?from=editor`);
  };

  const clearCellsOfType = (grid: GridCell[][], type: BlockType) =>
    grid.map(row => row.map(cell =>
      cell.type === type ? { type: 'empty', color: 'transparent', floorColor: cell.floorColor } : cell
    ));

  const handleCellAction = (row: number, col: number) => {
    let newGrid = grid.map(r => r.map(c => ({ ...c })));
    const currentCell = newGrid[row][col];

    if (selectedTool === 'direction') {
      if (currentCell.type !== 'block') {
        toast({ title: "Cannot apply direction", description: "Direction can only be applied to blocks.", variant: 'destructive' });
        return;
      }
      const blockCellsToUpdate: { r: number, c: number }[] = [];
      const q: [number, number][] = [[row, col]];
      const visited = new Set<string>([`${row},${col}`]);
      const blockColor = currentCell.color;

      while (q.length > 0) {
        const [r, c] = q.shift()!;
        blockCellsToUpdate.push({ r, c });
        const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of neighbors) {
          const newR = r + dr, newC = c + dc, key = `${newR},${newC}`;
          if (newR >= 0 && newR < rows && newC >= 0 && newC < cols &&
            !visited.has(key) &&
            newGrid[newR][newC].type === 'block' &&
            newGrid[newR][newC].color === blockColor) {
            visited.add(key);
            q.push([newR, newC]);
          }
        }
      }

      const newMovement = currentCell.movement === selectedDirection ? undefined : selectedDirection;
      blockCellsToUpdate.forEach(({ r, c }) => { newGrid[r][c].movement = newMovement; });
    } else if (selectedTool === 'worm') {
      if (col + 2 >= cols) {
        toast({ title: 'Cannot place worm', description: 'Not enough space for the worm here.', variant: 'destructive' });
        return;
      }
      newGrid = clearCellsOfType(newGrid, 'worm');
      for (let i = 0; i < 3; i++) {
        newGrid[row][col + i] = { ...newGrid[row][col + i], type: 'worm', color: TOOL_CONFIG['worm'].color! };
      }
    } else if (selectedTool === 'apple') {
      newGrid = clearCellsOfType(newGrid, 'apple');
      newGrid[row][col] = { ...newGrid[row][col], type: 'apple', color: TOOL_CONFIG['apple'].color! };
    } else if (selectedTool === 'floor') {
      if (currentCell.type === 'empty') {
        const newFloorColor = currentCell.floorColor === selectedBlockColor ? undefined : selectedBlockColor;
        currentCell.floorColor = newFloorColor;
      } else {
        toast({ title: 'Cannot paint floor', description: 'Floor can only be painted on empty cells.', variant: 'destructive' });
      }
    } else if (selectedTool === 'empty') {
      currentCell.type = 'empty';
      currentCell.color = 'transparent';
      delete currentCell.movement;
      delete currentCell.floorColor;
    } else {
      currentCell.type = selectedTool;
      currentCell.color = selectedTool === 'block'
        ? selectedBlockColor
        : (TOOL_CONFIG[selectedTool].color || 'transparent');
      if (selectedTool !== 'block') delete currentCell.movement;
    }

    setGrid(newGrid);
  };

  const handleMouseDown = (r: number, c: number) => { setIsDrawing(true); handleCellAction(r, c); };
  const handleMouseOver = (r: number, c: number) => {
    if (isDrawing && !['worm', 'apple', 'direction'].includes(selectedTool)) handleCellAction(r, c);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col xl:flex-row gap-4 max-w-screen-2xl mx-auto p-4 h-[calc(100vh-2rem)]">
        {/* Sidebar: Level Management */}
        <Card className="w-full xl:w-96 flex-shrink-0">
          <CardHeader>
            <CardTitle className='flex justify-between items-center'>
              <span>Level Management</span>
              <Button onClick={() => router.push('/')} variant="ghost" size="icon" className="h-8 w-8">
                <Home className="h-5 w-5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* 🧱 Input Rows & Cols */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rows">Rows</Label>
                <Input id="rows" type="number" min={4} max={40}
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="cols">Cols</Label>
                <Input id="cols" type="number" min={4} max={40}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                />
              </div>
            </div>

            <Button onClick={startNewLevel} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Level
            </Button>

            <ScrollArea className="h-[calc(100vh-16rem)] border rounded-lg p-2">
              {sortedLevels.length > 0 ? (
                <div className="space-y-2">
                  {sortedLevels.map((level, index) => (
                    <div key={level.id} className={`flex items-center gap-2 p-2 rounded-md ${editingLevelId === level.id ? 'bg-primary/10' : ''}`}>
                      <span className="font-semibold flex-grow">Level {level.order}</span>
                      <div className="flex items-center">
                        <div className="flex flex-col mr-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLevel(level.id, 'up')} disabled={index === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLevel(level.id, 'down')} disabled={index === sortedLevels.length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditingLevel(level)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => deleteLevel(level.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-10">
                  No levels created yet.
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Canvas */}
        <div
          className="flex-grow flex items-center justify-center rounded-lg"
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
        >
          <div
            className="grid bg-card p-2 rounded-lg shadow-inner"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="w-8 h-8 md:w-9 md:h-9 border border-border/50 relative flex items-center justify-center"
                  style={{
                    backgroundColor:
                      cell.type === 'empty'
                        ? (cell.floorColor ? `${cell.floorColor}33` : 'transparent')
                        : cell.color,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseEnter={() => handleMouseOver(rowIndex, colIndex)}
                >
                  {cell.movement === 'horizontal' && (
                    <div className="absolute inset-0 flex items-center justify-between px-1 text-white/70 pointer-events-none">
                      <ArrowBigLeft fill="white" className="w-4 h-4" />
                      <div className="flex-grow h-0.5 bg-white/70 rounded-full mx-0.5"></div>
                      <ArrowBigRight fill="white" className="w-4 h-4" />
                    </div>
                  )}
                  {cell.movement === 'vertical' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-between py-1 text-white/70 pointer-events-none">
                      <ArrowBigUp fill="white" className="w-4 h-4" />
                      <div className="flex-grow w-0.5 bg-white/70 rounded-full my-0.5"></div>
                      <ArrowBigDown fill="white" className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tool Panel */}
        <Card className="flex-none w-full xl:w-80">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Editor Tools</span>
              <span className="text-sm font-medium text-muted-foreground">
                {editingLevelId
                  ? `Editing Level ${sortedLevels.find(l => l.id === editingLevelId)?.order || ''}`
                  : 'New Level'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="space-y-3">
              <RadioGroup value={selectedTool} onValueChange={(v) => setSelectedTool(v as ToolType)} className="grid grid-cols-3 gap-2">
                {Object.entries(TOOL_CONFIG).map(([key, { name, icon }]) => (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <div>
                        <RadioGroupItem value={key} id={`tool-${key}`} className="sr-only" />
                        <Label
                          htmlFor={`tool-${key}`}
                          className={cn(`flex flex-col items-center justify-center gap-1.5 rounded-md border-2 p-3 text-center text-sm aspect-square cursor-pointer transition-colors ${selectedTool === key ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent/50'}`)}
                        >
                          {icon}
                          <span className="text-xs">{name}</span>
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent><p>{name}</p></TooltipContent>
                  </Tooltip>
                ))}
              </RadioGroup>
            </div>

            {(selectedTool === 'block' || selectedTool === 'floor') && (
              <div className="space-y-3">
                <Label>{selectedTool === 'block' ? 'Block' : 'Floor'} Color</Label>
                <div className="flex flex-wrap gap-2">
                  {BLOCK_COLORS.map(color => (
                    <Button
                      key={color}
                      aria-label={`Select color ${color}`}
                      onClick={() => setSelectedBlockColor(color)}
                      className={`h-8 w-8 rounded-full border-2 ${selectedBlockColor === color ? 'border-primary' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedTool === 'direction' && (
              <div className="space-y-3">
                <Label>Movement Direction</Label>
                <RadioGroup value={selectedDirection} onValueChange={(v) => setSelectedDirection(v as Movement)} className="flex gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="horizontal" id="dir-h" />
                    <Label htmlFor="dir-h">Horizontal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vertical" id="dir-v" />
                    <Label htmlFor="dir-v">Vertical</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="flex flex-col gap-3 mt-4">
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" /> Save Level
              </Button>
              <Button onClick={handlePlaytest} variant="outline">
                <Play className="mr-2 h-4 w-4" /> Playtest
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
