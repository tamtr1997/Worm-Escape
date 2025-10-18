
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLevels } from '@/hooks/useLevels';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BlockType, GridCell, Level } from '@/lib/types';
import { Home, Save, Eraser, Pipette, Frame, Apple, Trash2, Pencil, ArrowUp, ArrowDown, Play, PlusCircle, Share2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { WormIcon } from '../icons/WormIcon';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Skeleton } from '../ui/skeleton';

const ROWS = 16;
const COLS = 10;

const BLOCK_COLORS = [
  '#F9C600', // accentYellow
  '#F36B2D', // accentOrange
  '#52B848', // accentGreen
  '#9B5DE5', // accentPurple
  '#3498DB', // accentBlue
  '#E74C3C', // accentRed
];

const TOOL_CONFIG: Record<BlockType, { color: string; name: string; icon: React.ReactNode }> = {
  frame: { color: 'hsl(231, 30%, 30%)', name: 'Frame', icon: <Frame className="h-5 w-5"/> },
  worm: { color: '#52B848', name: 'Worm', icon: <WormIcon className="h-5 w-5" /> },
  apple: { color: '#E74C3C', name: 'Apple', icon: <Apple className="h-5 w-5" /> },
  block: { color: BLOCK_COLORS[0], name: 'Block', icon: <Pipette className="h-5 w-5"/> },
  empty: { color: 'transparent', name: 'Eraser', icon: <Eraser className="h-5 w-5"/> },
};

const initialGrid = (): GridCell[][] => Array(ROWS).fill(null).map(() => 
  Array(COLS).fill(null).map(() => ({ type: 'empty', color: 'transparent' }))
);

export default function LevelCreator() {
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [grid, setGrid] = useState<GridCell[][]>(initialGrid);
  const [selectedTool, setSelectedTool] = useState<BlockType>('frame');
  const [selectedBlockColor, setSelectedBlockColor] = useState(BLOCK_COLORS[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const { toast } = useToast();

  const router = useRouter();
  const { levels, saveLevel, updateLevel, deleteLevel, moveLevel, isLoading } = useLevels();
  
  const startNewLevel = useCallback(() => {
    setEditingLevelId(null);
    setGrid(initialGrid());
    toast({ title: "New Canvas", description: "Started a new level. Don't forget to save!" });
  }, [toast]);
  
  const startEditingLevel = useCallback((level: Level) => {
    setEditingLevelId(level.id);
    const gridCopy = level.grid.map(row => row.map(cell => ({...cell})));
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
    
    const levelData = { rows: ROWS, cols: COLS, grid };

    if (editingLevelId) {
      await updateLevel(editingLevelId, levelData);
    } else {
      const newLevel = await saveLevel(levelData);
      if (newLevel) {
        setEditingLevelId(newLevel.id);
      }
    }
  };

  const handlePlaytest = () => {
     if (!editingLevelId) {
        toast({ title: 'Save First!', description: 'Please save your level before playtesting.', variant: 'destructive'});
        return;
    }
    router.push(`/play/${editingLevelId}?from=editor`);
  }
  
  const clearCellsOfType = (grid: GridCell[][], type: BlockType) => {
    return grid.map(row => row.map(cell => cell.type === type ? { type: 'empty', color: 'transparent' } : cell));
  }

  const handleCellAction = (row: number, col: number) => {
    let newGrid = grid.map(r => r.map(c => ({...c})));
    
    if (selectedTool === 'worm') {
        if (col + 2 >= COLS) {
            toast({ title: 'Cannot place worm', description: 'Not enough space for the worm here.', variant: 'destructive' });
            return;
        }
        newGrid = clearCellsOfType(newGrid, 'worm');
        for (let i = 0; i < 3; i++) {
            newGrid[row][col + i] = { type: 'worm', color: TOOL_CONFIG['worm'].color };
        }
    } else if (selectedTool === 'apple') {
        newGrid = clearCellsOfType(newGrid, 'apple');
        newGrid[row][col] = { type: 'apple', color: TOOL_CONFIG['apple'].color };
    } else {
      const currentCell = newGrid[row][col];
      currentCell.type = selectedTool;
      currentCell.color = selectedTool === 'block' ? selectedBlockColor : TOOL_CONFIG[selectedTool].color;
    }
    
    setGrid(newGrid);
  };
  
  const handleMouseDown = (row: number, col: number) => {
    setIsDrawing(true);
    handleCellAction(row, col);
  }

  const handleMouseOver = (row: number, col: number) => {
    if (isDrawing && selectedTool !== 'worm' && selectedTool !== 'apple') {
      handleCellAction(row, col);
    }
  }

  const handleDelete = async (levelId: string) => {
    await deleteLevel(levelId);
    if (editingLevelId === levelId) {
      startNewLevel();
    }
  }

  return (
    <TooltipProvider>
    <div className="flex flex-col xl:flex-row gap-4 max-w-screen-2xl mx-auto p-4 h-[calc(100vh-2rem)]">
        <Card className="w-full xl:w-96 flex-shrink-0 bg-primary/30 border-primary/50">
            <CardHeader>
                <CardTitle className='flex justify-between items-center text-foreground'>
                    <span>Level Management</span>
                     <Button onClick={() => router.push('/')} variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:bg-white/10 hover:text-white">
                        <Home className="h-5 w-5" />
                        <span className="sr-only">Back to Home</span>
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                 <Button onClick={startNewLevel} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Level
                </Button>
                <ScrollArea className="h-[calc(100vh-16rem)] border rounded-lg p-2 border-primary/50 bg-primary/20">
                    {isLoading ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full bg-white/10" />)}
                      </div>
                    ) : levels.length > 0 ? (
                        <div className="space-y-2">
                        {levels.map((level, index) => (
                            <div key={level.id} className={`flex items-center gap-2 p-2 rounded-md text-foreground ${editingLevelId === level.id ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                                <span className="font-semibold flex-grow">Level {level.order}</span>
                                <div className="flex items-center">
                                    <div className="flex flex-col mr-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-foreground hover:bg-white/20" onClick={() => moveLevel(level.id, 'up')} disabled={index === 0}>
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-foreground hover:bg-white/20" onClick={() => moveLevel(level.id, 'down')} disabled={index === levels.length - 1}>
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:bg-white/20" onClick={() => startEditingLevel(level)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/20" onClick={() => handleDelete(level.id)}>
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

      <div 
        className="flex-grow flex items-center justify-center rounded-lg"
        onMouseUp={() => setIsDrawing(false)}
        onMouseLeave={() => setIsDrawing(false)}
      >
        <div 
          className="grid bg-card p-2 rounded-lg shadow-inner border-4 border-primary/50" 
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="w-8 h-8 md:w-9 md:h-9 border border-black/20"
                style={{ backgroundColor: cell.type === 'empty' ? 'transparent' : cell.color, transition: 'background-color 0.2s' }}
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleMouseOver(rowIndex, colIndex)}
              />
            ))
          )}
        </div>
      </div>
      
      <Card className="flex-none w-full xl:w-80 bg-primary/30 border-primary/50">
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-foreground">
            <span>Editor Tools</span>
            <span className="text-sm font-medium text-foreground/80">
              {editingLevelId ? `Editing Level ${levels.find(l => l.id === editingLevelId)?.order || ''}` : 'New Level'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="space-y-3">
            <RadioGroup value={selectedTool} onValueChange={(value) => setSelectedTool(value as BlockType)} className="grid grid-cols-2 gap-2">
              {Object.entries(TOOL_CONFIG).map(([key, { name, icon }]) => (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <div>
                      <RadioGroupItem value={key} id={`tool-${key}`} className="sr-only" />
                      <Label
                        htmlFor={`tool-${key}`}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-md border-2 p-3 text-center text-sm aspect-square cursor-pointer transition-colors ${selectedTool === key ? 'border-accent bg-accent/20 text-accent-foreground' : 'border-border bg-white/5 text-foreground hover:bg-white/10'}`}
                      >
                        {icon}
                        <span className="text-xs">{name}</span>
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </RadioGroup>
          </div>
          
          {selectedTool === 'block' && (
            <div className="space-y-3">
              <Label className="text-foreground">Block Color</Label>
              <div className="flex flex-wrap gap-2">
                {BLOCK_COLORS.map(color => (
                  <Button
                    key={color}
                    aria-label={`Select color ${color}`}
                    onClick={() => setSelectedBlockColor(color)}
                    className={`h-8 w-8 rounded-full border-2 ${selectedBlockColor === color ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={handleSave} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Save className="mr-2 h-4 w-4" /> Save Level
            </Button>
            <Button onClick={handlePlaytest} variant="outline" className="bg-white/10 text-foreground hover:bg-white/20">
              <Play className="mr-2 h-4 w-4" /> Playtest
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}
