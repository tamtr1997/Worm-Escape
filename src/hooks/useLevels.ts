'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Level, GridCell } from '@/lib/types';
import { useToast } from './use-toast';

const LEVELS_STORAGE_KEY = 'worm-escape-levels';
const PROGRESS_STORAGE_KEY = 'worm-escape-progress';

const createDefaultLevels = (): Level[] => {
  const level1Grid: GridCell[][] = Array(14).fill(null).map(() => Array(10).fill({ type: 'empty', color: 'transparent' }));
  // Frame
  for(let i = 0; i < 14; i++) {
    level1Grid[i][0] = { type: 'frame', color: 'hsl(240, 10%, 40%)' };
    level1Grid[i][9] = { type: 'frame', color: 'hsl(240, 10%, 40%)' };
  }
   for(let i = 0; i < 10; i++) {
    level1Grid[0][i] = { type: 'frame', color: 'hsl(240, 10%, 40%)' };
    level1Grid[13][i] = { type: 'frame', color: 'hsl(240, 10%, 40%)' };
  }

  // Worm
  level1Grid[6][1] = { type: 'worm', color: 'hsl(120, 60%, 50%)' };
  level1Grid[6][2] = { type: 'worm', color: 'hsl(120, 60%, 50%)' };
  level1Grid[6][3] = { type: 'worm', color: 'hsl(120, 60%, 50%)' };
  // Apple
  level1Grid[6][8] = { type: 'apple', color: 'hsl(0, 84%, 60%)' };
  // Block
  level1Grid[6][5] = { type: 'block', color: '#3b82f6' };
  level1Grid[6][6] = { type: 'block', color: '#3b82f6' };
  
  const level2Grid: GridCell[][] = Array(14).fill(null).map(() => Array(10).fill({ type: 'empty', color: 'transparent' }));
   // Frame
  for(let i = 0; i < 14; i++) {
    level2Grid[i][0] = { type: 'frame', color: 'hsl(240, 10%, 40%)' };
    level2Grid[i][9] = { type: 'frame', color: 'hsl(240, 10%, 40%)' };
  }
   for(let i = 0; i < 10; i++) {
    level2Grid[0][i] = { type: 'frame', color: 'hsl(240, 10%, 40%)' };
    level2Grid[13][i] = { type: 'frame', color: 'hsl(240, 10%, 40%)' };
  }
   // Worm
  level2Grid[2][1] = { type: 'worm', color: 'hsl(120, 60%, 50%)' };
  level2Grid[2][2] = { type: 'worm', color: 'hsl(120, 60%, 50%)' };
  level2Grid[2][3] = { type: 'worm', color: 'hsl(120, 60%, 50%)' };
  // Apple
  level2Grid[11][8] = { type: 'apple', color: 'hsl(0, 84%, 60%)' };
  // Blocks
  [...Array(6)].forEach((_, i) => level2Grid[i+4][3] = { type: 'block', color: '#ef4444' });
  [...Array(6)].forEach((_, i) => level2Grid[i+4][6] = { type: 'block', color: '#22c55e' });
  level2Grid[9][4] = { type: 'block', color: '#eab308' };
  level2Grid[9][5] = { type: 'block', color: '#eab308' };

  const level3Grid: GridCell[][] = Array(14).fill(null).map(() => Array(10).fill({ type: 'empty', color: 'transparent' }));
   // Frame
  for(let i = 0; i < 14; i++) {
    level3Grid[i][0] = { type: 'frame', color: 'hsl(240, 10%, 40%)' };
    level3Grid[i][9] = { type: 'frame', color: 'hsl(240, 10%, 40%)' };
  }
   for(let i = 0; i < 10; i++) {
    level3Grid[0][i] = { type: 'frame', color: 'hsl(240, 10%, 40%)' };
    level3Grid[13][i] = { type: 'frame', color: 'hsl(240, 10%, 40%)' };
  }
   // Worm
  level3Grid[1][4] = { type: 'worm', color: 'hsl(120, 60%, 50%)' };
  level3Grid[1][5] = { type: 'worm', color: 'hsl(120, 60%, 50%)' };
  level3Grid[1][6] = { type: 'worm', color: 'hsl(120, 60%, 50%)' };
  // Apple
  level3Grid[12][4] = { type: 'apple', color: 'hsl(0, 84%, 60%)' };
  
  // Blocks
  [...Array(3)].forEach((_, i) => level3Grid[i+3][2] = { type: 'block', color: '#3b82f6' });
  [...Array(3)].forEach((_, i) => level3Grid[i+3][7] = { type: 'block', color: '#3b82f6' });
  [...Array(3)].forEach((_, i) => level3Grid[i+7][2] = { type: 'block', color: '#ef4444' });
  [...Array(3)].forEach((_, i) => level3Grid[i+7][7] = { type: 'block', color: '#ef4444' });
  level3Grid[5][4] = { type: 'block', color: '#22c55e' };
  level3Grid[5][5] = { type: 'block', color: '#22c55e' };
  level3Grid[9][4] = { type: 'block', color: '#eab308' };
  level3Grid[9][5] = { type: 'block', color: '#eab308' };

  return [
    { id: 'level-demo-1', order: 1, rows: 14, cols: 10, grid: level1Grid },
    { id: 'level-demo-2', order: 2, rows: 14, cols: 10, grid: level2Grid },
    { id: 'level-demo-3', order: 3, rows: 14, cols: 10, grid: level3Grid },
  ];
}


export function useLevels() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [highestLevelUnlocked, setHighestLevelUnlocked] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedLevels = localStorage.getItem(LEVELS_STORAGE_KEY);
      if (storedLevels && JSON.parse(storedLevels).length > 0) {
        const parsedLevels: Level[] = JSON.parse(storedLevels);
        const orderedLevels = parsedLevels.map((level, index) => ({
            ...level,
            order: level.order || index + 1,
        })).sort((a,b) => a.order - b.order);
        
        const finalLevels = orderedLevels.map((level, index) => ({...level, order: index + 1}));
        setLevels(finalLevels);
      } else {
        const defaultLevels = createDefaultLevels();
        setLevels(defaultLevels);
        saveLevelsToStorage(defaultLevels);
      }
      
      const storedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (storedProgress) {
        setHighestLevelUnlocked(JSON.parse(storedProgress));
      } else {
        setHighestLevelUnlocked(1);
      }

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast({
        title: "Error",
        description: "Could not load your saved levels or progress.",
        variant: "destructive",
      });
    }
  // We only want this to run once on mount, so we disable the exhaustive-deps rule.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveLevelsToStorage = useCallback((levelsToSave: Level[]) => {
    try {
      const sorted = levelsToSave.sort((a, b) => a.order - b.order);
      localStorage.setItem(LEVELS_STORAGE_KEY, JSON.stringify(sorted));
    } catch (error) {
      console.error("Failed to save levels to localStorage", error);
      toast({
        title: "Error",
        description: "Could not save your levels.",
        variant: "destructive",
      });
    }
  }, [toast]);
  
  const saveProgressToStorage = useCallback((progress: number) => {
     try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error("Failed to save progress to localStorage", error);
      toast({
        title: "Error",
        description: "Could not save your progress.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const getLevel = useCallback((id: string): Level | undefined => {
    // This is a temporary workaround to get levels from localStorage synchronously.
    // A better solution would involve a more robust state management.
    try {
        const storedLevels = localStorage.getItem(LEVELS_STORAGE_KEY);
        if (storedLevels) {
          const allLevels: Level[] = JSON.parse(storedLevels);
          return allLevels.find(level => level.id === id);
        }
    } catch (error) {
        console.error("Failed to get level from localStorage", error);
    }
    return undefined;
  }, []);

  const getNextLevel = useCallback((currentLevelOrder: number): Level | undefined => {
    const sortedLevels = [...levels].sort((a, b) => a.order - b.order);
    return sortedLevels.find(level => level.order === currentLevelOrder + 1);
  }, [levels]);


  const saveLevel = (levelData: Omit<Level, 'id' | 'order'> & {order?: number}): Level => {
    const maxOrder = levels.reduce((max, l) => Math.max(max, l.order), 0);
    const newLevel: Level = { ...levelData, id: `level-${Date.now()}`, order: maxOrder + 1 };
    const updatedLevels = [...levels, newLevel];
    setLevels(updatedLevels);
    saveLevelsToStorage(updatedLevels);
    toast({
      title: "Level Saved!",
      description: `New level has been saved as Level ${newLevel.order}.`,
    });
    return newLevel;
  };

  const updateLevel = (id: string, updatedData: Omit<Level, 'id' | 'order'>) => {
    let levelOrder = 0;
    const updatedLevels = levels.map(level => {
        if (level.id === id) {
            levelOrder = level.order;
            return { ...level, ...updatedData, grid: updatedData.grid };
        }
        return level;
    });

    setLevels(updatedLevels);
    saveLevelsToStorage(updatedLevels);
    toast({
      title: 'Level Updated!',
      description: `Level ${levelOrder} has been updated.`,
    });
  };

  const reorderLevels = (newOrderedLevels: Level[]) => {
      const finalLevels = newOrderedLevels.map((level, index) => ({
          ...level,
          order: index + 1
      }));
      setLevels(finalLevels);
      saveLevelsToStorage(finalLevels);
  };
  
  const moveLevel = (levelId: string, direction: 'up' | 'down') => {
    const sortedLevels = [...levels].sort((a, b) => a.order - b.order);
    const index = sortedLevels.findIndex(l => l.id === levelId);

    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sortedLevels.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    [sortedLevels[index], sortedLevels[newIndex]] = [sortedLevels[newIndex], sortedLevels[index]];

    reorderLevels(sortedLevels);
  };

  const deleteLevel = (id: string) => {
      const levelToDelete = levels.find(l => l.id === id);
      const updatedLevels = levels.filter(level => level.id !== id);
      
      if (levelToDelete) {
        reorderLevels(updatedLevels);
        toast({
            title: "Level Deleted",
            description: `Level ${levelToDelete.order} has been removed.`,
        });
      }
  };

  const completeLevel = (completedLevelOrder: number) => {
    const nextLevelOrder = completedLevelOrder + 1;
    if (nextLevelOrder > highestLevelUnlocked) {
      setHighestLevelUnlocked(nextLevelOrder);
      saveProgressToStorage(nextLevelOrder);
    }
  };
  
  const resetProgress = () => {
    setHighestLevelUnlocked(1);
    saveProgressToStorage(1);
    toast({
        title: "Progress Reset",
        description: "Your game progress has been reset to Level 1."
    });
  };

  return { levels, getLevel, saveLevel, updateLevel, deleteLevel, moveLevel, highestLevelUnlocked, completeLevel, getNextLevel, resetProgress };
}
