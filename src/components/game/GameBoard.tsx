'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLevels } from '@/hooks/useLevels';
import type { Level, GridCell, GameObject } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Home, RotateCcw } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { WormIcon } from '../icons/WormIcon';
import { Apple } from 'lucide-react';

function createRuntimeGrid(levelGrid: GridCell[][]): GridCell[][] {
    return levelGrid.map(row => row.map(cell => {
        if (cell.type === 'empty') {
            return { type: 'space', color: 'hsl(240, 20%, 96%)' };
        }
        return cell;
    }));
}

function parseLevelToGameObjects(grid: GridCell[][]): GameObject[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
  const gameObjects: GameObject[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!visited[r][c] && (grid[r][c].type === 'block' || grid[r][c].type === 'worm' || grid[r][c].type === 'apple')) {
        const type = grid[r][c].type as 'block' | 'worm' | 'apple';
        const color = grid[r][c].color;
        const cells: { row: number, col: number }[] = [];
        const stack: [number, number][] = [[r, c]];
        visited[r][c] = true;

        while (stack.length > 0) {
          const [curR, curC] = stack.pop()!;
          cells.push({ row: curR, col: curC });

          const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          for (const [dr, dc] of neighbors) {
            const newR = curR + dr;
            const newC = curC + dc;
            if (newR >= 0 && newR < rows && newC >= 0 && newC < cols && !visited[newR][newC] && grid[newR][newC].type === type && grid[newR][newC].color === color) {
              visited[newR][newC] = true;
              stack.push([newR, newC]);
            }
          }
        }
        
        if (cells.length > 0) {
            gameObjects.push({
                id: `obj-${r}-${c}`,
                type,
                cells,
                color,
            });
        }
      }
    }
  }
  return gameObjects;
}

const CELL_SIZE = 48; // Corresponds to w-12/h-12 in rem (3rem = 48px)

export default function GameBoard({ levelId, isPlaytest = false }: { levelId: string, isPlaytest?: boolean }) {
  const router = useRouter();
  const { getLevel, completeLevel, getNextLevel } = useLevels();
  
  const [level, setLevel] = useState<Level | null>(null);
  const [runtimeGrid, setRuntimeGrid] = useState<GridCell[][]>([]);
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [win, setWin] = useState(false);
  const [nextLevelId, setNextLevelId] = useState<string | null>(null);


  // State for drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const lastMoveTimestamp = useRef(0);

  useEffect(() => {
    const levelData = getLevel(levelId);
    if (levelData) {
      setLevel(levelData);
      const newRuntimeGrid = createRuntimeGrid(levelData.grid);
      setRuntimeGrid(newRuntimeGrid);
      setGameObjects(parseLevelToGameObjects(newRuntimeGrid));
      const nextLevel = getNextLevel(levelData.order);
      setNextLevelId(nextLevel ? nextLevel.id : null);
    } else if (levelId) {
      // Handle case where level not found
    }
  }, [levelId, getLevel, getNextLevel]);

  const resetGame = useCallback(() => {
    if (level) {
        const newRuntimeGrid = createRuntimeGrid(level.grid);
        setRuntimeGrid(newRuntimeGrid);
        setGameObjects(parseLevelToGameObjects(newRuntimeGrid));
        setSelectedObjectId(null);
        setWin(false);
    }
  }, [level]);

  const handleWin = useCallback(() => {
    if (level && !isPlaytest) {
        completeLevel(level.order);
    }
    setWin(true);
  }, [level, isPlaytest, completeLevel]);
  
  const handleMove = useCallback((dr: number, dc: number) => {
    if (!selectedObjectId || !level || runtimeGrid.length === 0) return;

    setGameObjects(prevObjects => {
        const newObjects = JSON.parse(JSON.stringify(prevObjects)) as GameObject[];
        const objectToMove = newObjects.find(o => o.id === selectedObjectId);
        if (!objectToMove) return prevObjects;
        
        if (objectToMove.type === 'apple') return prevObjects;

        const objectsToMove = new Set<string>([selectedObjectId]);
        const objectsToCheck = [objectToMove];
        let canMove = true;
        let hasWon = false;

        const appleObject = newObjects.find(o => o.type === 'apple');
        const applePos = appleObject?.cells[0];

        while (objectsToCheck.length > 0) {
            const currentObject = objectsToCheck.shift()!;
            
            for (const cell of currentObject.cells) {
                const newR = cell.row + dr;
                const newC = cell.col + dc;

                if (currentObject.type === 'worm' && applePos && newR === applePos.row && newC === applePos.col) {
                    hasWon = true;
                    continue; 
                }

                if (newR < 0 || newR >= level.rows || newC < 0 || newC >= level.cols) {
                    canMove = false;
                    break;
                }
                
                const gridCell = runtimeGrid[newR][newC];
                if (gridCell.type === 'frame') {
                    canMove = false;
                    break;
                }

                const occupyingObject = newObjects.find(obj => 
                    !objectsToMove.has(obj.id) && obj.cells.some(c => c.row === newR && c.col === newC)
                );
                
                if (occupyingObject) {
                    if (occupyingObject.type === 'apple') {
                        canMove = false;
                        break;
                    }
                    objectsToMove.add(occupyingObject.id);
                    objectsToCheck.push(occupyingObject);
                }
            }
            if (!canMove) break;
        }

        if (canMove) {
            const finalObjects = newObjects.map(obj => {
                if (objectsToMove.has(obj.id)) {
                    return {
                        ...obj,
                        cells: obj.cells.map(c => ({ row: c.row + dr, col: c.col + dc }))
                    };
                }
                return obj;
            });

            if (hasWon) {
              const apple = finalObjects.find(o => o.type === 'apple');
              if (apple) {
                  apple.cells = [];
              }
              setTimeout(() => handleWin(), 300);
            }
            return finalObjects;
        }

        return prevObjects;
    });
}, [selectedObjectId, level, runtimeGrid, handleWin]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, objectId: string) => {
        setSelectedObjectId(objectId);
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        lastMoveTimestamp.current = 0;
        e.stopPropagation();
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !selectedObjectId) return;

        const now = Date.now();
        if (now - lastMoveTimestamp.current < 150) { 
            return;
        }

        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        
        let dr = 0;
        let dc = 0;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > CELL_SIZE / 2) {
                dc = dx > 0 ? 1 : -1;
            }
        } else {
            if (Math.abs(dy) > CELL_SIZE / 2) {
                dr = dy > 0 ? 1 : -1;
            }
        }

        if (dr !== 0 || dc !== 0) {
            handleMove(dr, dc);
            dragStartPos.current = { x: e.clientX, y: e.clientY };
            lastMoveTimestamp.current = now;
        }
    }, [isDragging, selectedObjectId, handleMove]);

    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            setSelectedObjectId(null);
        }
    }, [isDragging]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!level || runtimeGrid.length === 0) {
    return <main className="flex items-center justify-center min-h-screen"><p>Level not found or still loading...</p></main>;
  }
  
  const wormObject = gameObjects.find(o => o.type === 'worm');

  const goToNextLevel = () => {
    if (nextLevelId) {
      router.push(`/play/${nextLevelId}`);
    } else {
      router.push('/');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 gap-6 select-none">
      <div className="absolute top-4 left-4 flex gap-2">
        <Button variant="outline" size="icon" onClick={() => router.push(isPlaytest ? '/create' : '/')}><Home className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={resetGame}><RotateCcw className="h-4 w-4" /></Button>
      </div>
      <h1 className="text-3xl font-bold text-primary font-headline">Level {level.order} {isPlaytest && '(Playtest)'}</h1>
      <div 
        className="relative border-4 border-primary/20 bg-card p-1 rounded-lg shadow-2xl" 
        style={{ aspectRatio: `${level.cols} / ${level.rows}` }}
      >
        <div className="relative grid" style={{ gridTemplateColumns: `repeat(${level.cols}, 3rem)`, gridTemplateRows: `repeat(${level.rows}, 3rem)`}}>
          {runtimeGrid.map((row, r) => row.map((cell, c) => (
            <div key={`${r}-${c}`} className="w-12 h-12 flex items-center justify-center" style={{ backgroundColor: cell.type === 'space' ? cell.color : 'transparent' }}>
              {cell.type === 'frame' && <div className="w-full h-full" style={{backgroundColor: cell.color}}/>}
            </div>
          )))}
          
          {gameObjects.map(obj => {
              if (obj.type === 'worm') return null; // Render worm separately
              return (
                <div key={obj.id} onMouseDown={(e) => handleMouseDown(e, obj.id)}>
                {obj.cells.map(({ row, col }, index) => (
                    <div
                    key={`${obj.id}-${index}`}
                    className={`absolute w-12 h-12 rounded-md cursor-pointer transition-all duration-150 ease-in-out border-2 ${selectedObjectId === obj.id ? 'border-accent ring-4 ring-accent/50' : 'border-black/20'}`}
                    style={{
                        top: `${row * 3}rem`,
                        left: `${col * 3}rem`,
                        backgroundColor: obj.color,
                        boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 4px rgba(0,0,0,0.3)',
                        zIndex: selectedObjectId === obj.id ? 10 : 5,
                    }}
                    >
                    {obj.type === 'apple' && <Apple className="w-full h-full p-1 text-white" fill="white" />}
                    </div>
                ))}
                </div>
              )
          })}
          {wormObject && (
            <div key={wormObject.id} onMouseDown={(e) => handleMouseDown(e, wormObject.id)}
              className={`absolute cursor-pointer transition-all duration-150 ease-in-out group`}
              style={{
                top: `${wormObject.cells[0].row * 3}rem`,
                left: `${Math.min(...wormObject.cells.map(c => c.col)) * 3}rem`,
                width: `${wormObject.cells.length * 3}rem`,
                height: `3rem`,
                zIndex: selectedObjectId === wormObject.id ? 10 : 5,
              }}
            >
              <WormIcon className={`w-full h-full text-white ${selectedObjectId === wormObject.id ? 'drop-shadow-[0_0_8px_hsl(var(--accent))]' : ''}`} style={{color: wormObject.color}}/>
            </div>
          )}
        </div>
      </div>
      
      <AlertDialog open={win} onOpenChange={setWin}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex flex-col items-center gap-4 text-2xl">
                <WormIcon className="w-20 h-auto text-green-500"/>
                You Win!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {isPlaytest ? "Playtest successful!" : `You passed Level ${level.order}! Great job!`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            {isPlaytest ? (
              <Button onClick={() => router.push('/create')} variant="outline">
                Back to Editor
              </Button>
            ) : (
               <>
                <Button onClick={() => router.push('/')} variant="outline">
                  Back to Menu
                </Button>
                {nextLevelId ? (
                  <Button onClick={goToNextLevel} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Next Level
                  </Button>
                ) : (
                     <p className="text-sm text-muted-foreground">You have completed all levels!</p>
                )}
               </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </main>
  );
}
