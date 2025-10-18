
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Level } from '@/lib/types';
import { useToast } from './use-toast';

const PROGRESS_STORAGE_KEY = 'worm-escape-progress';

async function fetchLevels(): Promise<Level[]> {
    try {
        const response = await fetch('/api/levels');
        if (!response.ok) {
            throw new Error(`Failed to fetch levels: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function saveLevelsToServer(levels: Level[]): Promise<boolean> {
    try {
        const response = await fetch('/api/levels', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(levels),
        });
        if (!response.ok) {
            throw new Error(`Failed to save levels: ${response.statusText}`);
        }
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export function useLevels() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [highestLevelUnlocked, setHighestLevelUnlocked] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      const serverLevels = await fetchLevels();
      setLevels(serverLevels.sort((a, b) => a.order - b.order));
      
      try {
        const storedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
        if (storedProgress) {
          setHighestLevelUnlocked(JSON.parse(storedProgress));
        } else {
          setHighestLevelUnlocked(1);
        }
      } catch (error) {
        console.error("Failed to load progress from localStorage", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

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
    return levels.find(level => level.id === id);
  }, [levels]);

  const getNextLevel = useCallback((currentLevelOrder: number): Level | undefined => {
    return levels.find(level => level.order === currentLevelOrder + 1);
  }, [levels]);

  const saveLevel = async (levelData: Omit<Level, 'id' | 'order'> & {order?: number}): Promise<Level | null> => {
    const maxOrder = levels.reduce((max, l) => Math.max(max, l.order), 0);
    const newLevel: Level = { ...levelData, id: `level-${Date.now()}`, order: maxOrder + 1 };
    const updatedLevels = [...levels, newLevel];
    
    const success = await saveLevelsToServer(updatedLevels);
    if (success) {
      setLevels(updatedLevels);
      toast({
        title: "Level Saved!",
        description: `New level has been saved as Level ${newLevel.order}.`,
      });
      return newLevel;
    } else {
      toast({
        title: "Error",
        description: "Could not save the new level to the server.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateLevel = async (id: string, updatedData: Omit<Level, 'id' | 'order'>) => {
    let levelOrder = 0;
    const updatedLevels = levels.map(level => {
        if (level.id === id) {
            levelOrder = level.order;
            return { ...level, ...updatedData, grid: updatedData.grid };
        }
        return level;
    });

    const success = await saveLevelsToServer(updatedLevels);
    if (success) {
        setLevels(updatedLevels);
        toast({
          title: 'Level Updated!',
          description: `Level ${levelOrder} has been updated.`,
        });
    } else {
        toast({
            title: 'Error',
            description: `Could not save changes to Level ${levelOrder}.`,
            variant: "destructive",
        });
    }
  };

  const reorderLevels = async (newOrderedLevels: Level[]) => {
      const finalLevels = newOrderedLevels.map((level, index) => ({
          ...level,
          order: index + 1
      }));
      
      const success = await saveLevelsToServer(finalLevels);
      if(success) {
          setLevels(finalLevels);
      } else {
          toast({
              title: "Error",
              description: "Could not save the new level order.",
              variant: "destructive",
          });
      }
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

  const deleteLevel = async (id: string) => {
      const levelToDelete = levels.find(l => l.id === id);
      const updatedLevels = levels.filter(level => level.id !== id);
      
      if (levelToDelete) {
        const reordered = updatedLevels.map((level, index) => ({...level, order: index + 1}));
        const success = await saveLevelsToServer(reordered);
        if (success) {
            setLevels(reordered);
            toast({
                title: "Level Deleted",
                description: `Level ${levelToDelete.order} has been removed.`,
            });
        } else {
            toast({
              title: "Error",
              description: `Could not delete Level ${levelToDelete.order}.`,
              variant: "destructive",
          });
        }
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

  return { levels, getLevel, saveLevel, updateLevel, deleteLevel, moveLevel, highestLevelUnlocked, completeLevel, getNextLevel, resetProgress, isLoading };
}
