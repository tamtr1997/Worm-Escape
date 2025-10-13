'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Level } from '@/lib/types';
import { useToast } from './use-toast';

const LEVELS_STORAGE_KEY = 'worm-escape-levels';
const PROGRESS_STORAGE_KEY = 'worm-escape-progress';

export function useLevels() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [highestLevelUnlocked, setHighestLevelUnlocked] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedLevels = localStorage.getItem(LEVELS_STORAGE_KEY);
      if (storedLevels) {
        const parsedLevels: Level[] = JSON.parse(storedLevels);
        // Ensure levels have an order property for backwards compatibility
        const orderedLevels = parsedLevels.map((level, index) => ({
            ...level,
            order: level.order || index + 1,
        })).sort((a,b) => a.order - b.order);
        
        // Re-assign order to ensure it's sequential
        const finalLevels = orderedLevels.map((level, index) => ({...level, order: index + 1}));
        setLevels(finalLevels);
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
  }, [toast]);

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

  const updateLevel = (id: string, updatedData: Omit<Level, 'id'>) => {
    let levelOrder = 0;
    const updatedLevels = levels.map(level => {
        if (level.id === id) {
            levelOrder = level.order;
            return { ...level, ...updatedData };
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
