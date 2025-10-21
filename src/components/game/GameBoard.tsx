
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLevels } from '@/hooks/useLevels';
import type { Level, GridCell, GameObject } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Home, RotateCcw, ArrowBigUp, ArrowBigDown, ArrowBigLeft, ArrowBigRight, Clock, SkipForward } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { WormIcon , Block, FlatBlock} from '../icons/WormIcon';
import { Apple } from 'lucide-react';
import { cn } from '@/lib/utils';

function createRuntimeGrid(levelGrid: GridCell[][]): GridCell[][] {
    return levelGrid.map(row => row.map(cell => {
        if (cell.type === 'empty') {
            return { type: 'space', color: 'transparent', floorColor: cell.floorColor };
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
        const movement = grid[r][c].movement;
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
            const gameObject: GameObject = {
                id: `obj-${r}-${c}`,
                type,
                cells,
                color,
            };
            if (movement) {
                gameObject.movement = movement;
            }
            if (type === 'apple') {
                gameObject.movement = 'any';
            }
            gameObjects.push(gameObject);
        }
      }
    }
  }
  return gameObjects;
}

export default function GameBoard({ levelId, isPlaytest = false }: { levelId: string, isPlaytest?: boolean }) {
  const router = useRouter();
  const { getLevel, completeLevel, getNextLevel } = useLevels();
  
  const [level, setLevel] = useState<Level | null>(null);
  const [runtimeGrid, setRuntimeGrid] = useState<GridCell[][]>([]);
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [win, setWin] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [nextLevelId, setNextLevelId] = useState<string | null>(null);

  const [cellSize, setCellSize] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const lastMoveTimestamp = useRef(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const levelData = getLevel(levelId);
    if (levelData) {
      setLevel(levelData);
      const newRuntimeGrid = createRuntimeGrid(levelData.grid);
      setRuntimeGrid(newRuntimeGrid);
      setGameObjects(parseLevelToGameObjects(newRuntimeGrid));
      const nextLevel = getNextLevel(levelData.order);
      setNextLevelId(nextLevel ? nextLevel.id : null);

      const maxTime = levelData.maxTime || 60;
      setTimeLeft(maxTime);

      const containerWidth = 375 - 16;
      const containerHeight = 440 - 8;
      const cellWidth = containerWidth / levelData.cols;
      const cellHeight = containerHeight / levelData.rows;
      const calculatedCellSize = Math.min(cellWidth, cellHeight);
      setCellSize(calculatedCellSize);

    } else if (levelId) {
      // Handle case where level not found
    }
  }, [levelId, getLevel, getNextLevel]);

  useEffect(() => {
    if (level && timeLeft > 0 && !win && !timeUp) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimeUp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [level, timeLeft, win, timeUp]);

  useEffect(() => {
    if (win || timeUp) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [win, timeUp]);

  const resetGame = useCallback(() => {
    if (level) {
        const newRuntimeGrid = createRuntimeGrid(level.grid);
        setRuntimeGrid(newRuntimeGrid);
        setGameObjects(parseLevelToGameObjects(newRuntimeGrid));
        setSelectedObjectId(null);
        setWin(false);
        setTimeUp(false);
        const maxTime = level.maxTime || 60;
        setTimeLeft(maxTime);
    }
  }, [level]);

  const handleWin = useCallback(() => {
    if (level && !isPlaytest) {
        completeLevel(level.order);
    }
    setWin(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [level, isPlaytest, completeLevel]);
  
 const handleMove = useCallback((dr: number, dc: number) => {
    if (!selectedObjectId || !level || runtimeGrid.length === 0) return;

    setGameObjects(prevObjects => {
        const newObjects = JSON.parse(JSON.stringify(prevObjects)) as GameObject[];
        const objectToMove = newObjects.find(o => o.id === selectedObjectId);
        if (!objectToMove) return prevObjects;

        if (objectToMove.movement === 'horizontal' && dr !== 0) return prevObjects;
        if (objectToMove.movement === 'vertical' && dc !== 0) return prevObjects;

        const objectsToMove = new Set<string>([selectedObjectId]);
        const objectsToCheck = [objectToMove];
        let canMove = true;
        let hasWon = false;

        const appleObject = newObjects.find(o => o.type === 'apple' && o.id !== selectedObjectId);
        const applePos = appleObject?.cells[0];

        while (objectsToCheck.length > 0) {
            const currentObject = objectsToCheck.shift()!;
            
            if (currentObject.movement === 'horizontal' && dr !== 0) {
                canMove = false;
                break;
            }
            if (currentObject.movement === 'vertical' && dc !== 0) {
                canMove = false;
                break;
            }

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
                
                if (gridCell.floorColor && gridCell.floorColor !== currentObject.color) {
                    canMove = false;
                    break;
                }

                const occupyingObject = newObjects.find(obj => 
                    !objectsToMove.has(obj.id) && obj.cells.some(c => c.row === newR && c.col === newC)
                );
                
                if (occupyingObject) {
                    if (occupyingObject.movement === 'horizontal' && dr !== 0) {
                        canMove = false;
                        break;
                    }
                    if (occupyingObject.movement === 'vertical' && dc !== 0) {
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

    const handleInteractionStart = (clientX: number, clientY: number, objectId: string) => {
        if (timeUp) return;
        setSelectedObjectId(objectId);
        setIsDragging(true);
        dragStartPos.current = { x: clientX, y: clientY };
        lastMoveTimestamp.current = 0;
    };

    const handleMouseDown = (e: React.MouseEvent, objectId: string) => {
        handleInteractionStart(e.clientX, e.clientY, objectId);
        e.stopPropagation();
    };

    const handleTouchStart = (e: React.TouchEvent, objectId: string) => {
        if (e.touches[0]) {
            handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY, objectId);
        }
        e.stopPropagation();
    };


    const handleInteractionMove = useCallback((clientX: number, clientY: number) => {
        if (!isDragging || !selectedObjectId || timeUp) return;
        
        const now = Date.now();
        if (now - lastMoveTimestamp.current < 100) { 
            return;
        }

        const dx = clientX - dragStartPos.current.x;
        const dy = clientY - dragStartPos.current.y;
        
        let dr = 0;
        let dc = 0;

        const threshold = cellSize / 2;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > threshold) {
                dc = dx > 0 ? 1 : -1;
            }
        } else {
            if (Math.abs(dy) > threshold) {
                dr = dy > 0 ? 1 : -1;
            }
        }
        
        if (dr !== 0 || dc !== 0) {
            handleMove(dr, dc);
            dragStartPos.current = { x: clientX, y: clientY };
            lastMoveTimestamp.current = now;
        }
    }, [isDragging, selectedObjectId, handleMove, cellSize, timeUp]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        handleInteractionMove(e.clientX, e.clientY);
    }, [handleInteractionMove]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (e.touches[0]) {
            handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, [handleInteractionMove]);

    const handleInteractionEnd = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            setSelectedObjectId(null);
        }
    }, [isDragging]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleInteractionEnd);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleInteractionEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleInteractionEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleInteractionEnd);
        };
    }, [isDragging, handleMouseMove, handleTouchMove, handleInteractionEnd]);


  if (!level || runtimeGrid.length === 0 || cellSize === 0) {
    return <main className="flex items-center justify-center min-h-screen"><p>Level not found or still loading...</p></main>;
  }
  
  const wormObject = gameObjects.find(o => o.type === 'worm');
  const selectedObject = gameObjects.find(o => o.id === selectedObjectId);

  const goToNextLevel = () => {
    if (nextLevelId) {
      router.push(`/play/${nextLevelId}`);
    } else {
      router.push('/');
    }
  };

  const gridWidth = cellSize * level.cols;
  const gridHeight = cellSize * level.rows;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isEdge = (cell: {row: number, col: number}, object: GameObject, side: 'top' | 'bottom' | 'left' | 'right') => {
      const { row, col } = cell;
      switch (side) {
          case 'top':
              return !object.cells.some(c => c.row === row - 1 && c.col === col);
          case 'bottom':
              return !object.cells.some(c => c.row === row + 1 && c.col === col);
          case 'left':
              return !object.cells.some(c => c.row === row && c.col === col - 1);
          case 'right':
              return !object.cells.some(c => c.row === row && c.col === col + 1);
          default:
              return false;
      }
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-black p-6 select-none">
      <div className="relative bg-[#0f172a] w-[390px] h-[640px] rounded-[2rem] shadow-2xl overflow-hidden border border-gray-700 flex flex-col items-center gap-2 py-4"
        style={{
          backgroundImage: "url('/Background fd.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        
      <div className="w-full px-4 flex justify-between items-center">
          <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => router.push(isPlaytest ? '/create' : '/')}><Home className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={resetGame}><RotateCcw className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`} />
            <span className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex gap-2">
              <div className="w-10 h-10"></div>
              <Button variant="outline" size="icon" onClick={goToNextLevel}><SkipForward className="h-4 w-4" /></Button>
          </div>
      </div>


      <h1 className="text-3xl font-bold text-primary font-headline">Level {level.order} {isPlaytest && '(Playtest)'}</h1>
      
        <div 
            className="relative border-4 border-primary/20 bg-card p-1 rounded-lg shadow-2xl flex items-center justify-center my-auto" 
            style={{ width: '375px', maxHeight: '440px' }}
        >
            <div className="relative grid border-b border-r" style={{ 
            gridTemplateColumns: `repeat(${level.cols}, ${cellSize}px)`, 
            gridTemplateRows: `repeat(${level.rows}, ${cellSize}px)`,
            width: `${gridWidth}px`,
            height: `${gridHeight}px`,
            borderColor: 'hsl(var(--border))'
            }}>
            {runtimeGrid.map((row, r) => row.map((cell, c) => {
                const isFloorSelected = selectedObject && cell.floorColor === selectedObject.color;
                return (
                    <div
                        key={`${r}-${c}`}
                        className="relative flex items-center justify-center border-t border-l"
                        style={{
                            width: cellSize,
                            height: cellSize,
                            backgroundColor: "transparent",
                            borderColor: isFloorSelected ? selectedObject.color : 'hsl(var(--border))',
                        }}
                    >
                        {[ "frame"].includes(cell.type) && (
                            <Block
                            color={cell.color}
                            size={cellSize}
                            className="absolute inset-0"
                            />
                        )}

                        {cell.floorColor && (
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundColor: cell.floorColor,
                                    opacity: 0.5,
                                    filter: isFloorSelected ? `drop-shadow(0 0 12px ${selectedObject.color})` : 'none',
                                }}
                            />
                        )}
                    </div>
                );
            }))}
            
            {gameObjects.map(obj => {
                const isSelected = selectedObjectId === obj.id;
                
                return (
                    <div key={obj.id} className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {obj.cells.map((cell, i) => {
                            let borderClasses = '';
                            if (isSelected && obj.type === 'block') {
                                const BORDER_STYLE = 'absolute border-sky-400';
                                if (isEdge(cell, obj, 'top')) borderClasses += ` ${BORDER_STYLE} border-t-4`;
                                if (isEdge(cell, obj, 'bottom')) borderClasses += ` ${BORDER_STYLE} border-b-4`;
                                if (isEdge(cell, obj, 'left')) borderClasses += ` ${BORDER_STYLE} border-l-4`;
                                if (isEdge(cell, obj, 'right')) borderClasses += ` ${BORDER_STYLE} border-r-4`;
                            }
                            const isWorm = obj.type === 'worm';

                            return (
                                <div
                                    key={`${obj.id}-cell-${i}`}
                                    className="absolute cursor-pointer group transition-all duration-300 ease-in-out"
                                    onMouseDown={(e) => !isWorm && handleMouseDown(e, obj.id)}
                                    onTouchStart={(e) => !isWorm && handleTouchStart(e, obj.id)}
                                    style={{
                                        top: `${cell.row * cellSize}px`,
                                        left: `${cell.col * cellSize}px`,
                                        width: `${cellSize}px`,
                                        height: `${cellSize}px`,
                                        zIndex: isSelected ? 20 : 5,
                                        pointerEvents: isWorm ? 'none' : 'auto'
                                    }}
                                >
                                    {!isWorm && obj.type === 'block' && (
                                        <>
                                            <Block color={obj.color} size={cellSize} className="absolute inset-0" />
                                            {isSelected && <div className={cn('absolute inset-0 pointer-events-none', borderClasses)} style={{zIndex: 25}} />}
                                        </>
                                    )}

                                    {!isWorm && obj.type === 'apple' && (
                                        <>
                                           <Block color="#ef4444" size={cellSize} className="absolute inset-0" >
                                                <div className="relative w-full h-full flex items-center justify-center">
                                                    <Apple className="w-[70%] h-[70%]" fill="#FFFFFF" color="#FFFFFF" />
                                                </div>
                                            </Block>
                                            {isSelected && (
                                              <div
                                                className="absolute -inset-1 rounded-lg"
                                                style={{
                                                  boxShadow: '0 0 12px 4px #38bdf8', // sky-400
                                                  zIndex: 25,
                                                }}
                                              />
                                            )}
                                        </>
                                    )}
                                    
                                    {/* Movement indicators for non-worm objects */}
                                    {!isWorm && obj.movement === 'horizontal' && (
                                        <div className="absolute inset-0 flex items-center justify-between px-2 text-white/90 pointer-events-none">
                                            <ArrowBigLeft fill="white" className="w-6 h-6"/>
                                            <div className="flex-grow h-1 bg-white/90 rounded-full mx-1"></div>
                                            <ArrowBigRight fill="white" className="w-6 h-6"/>
                                        </div>
                                    )}
                                    {!isWorm && obj.movement === 'vertical' && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-between py-2 text-white/90 pointer-events-none">
                                            <ArrowBigUp fill="white" className="w-6 h-6"/>
                                            <div className="flex-grow w-1 bg-white/90 rounded-full my-1"></div>
                                            <ArrowBigDown fill="white" className="w-6 h-6"/>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {wormObject && (() => {
                 const isSelected = selectedObjectId === wormObject.id;
                 const minRow = Math.min(...wormObject.cells.map(c => c.row));
                 const minCol = Math.min(...wormObject.cells.map(c => c.col));
                 const maxCol = Math.max(...wormObject.cells.map(c => c.col));
                 const width = (maxCol - minCol + 1) * cellSize;
                 const height = cellSize;
                 
                return (
                    <div key={wormObject.id} 
                        onMouseDown={(e) => handleMouseDown(e, wormObject.id)}
                        onTouchStart={(e) => handleTouchStart(e, wormObject.id)}
                        className={cn(
                            `absolute cursor-pointer transition-all duration-150 ease-in-out group`
                        )}
                        style={{
                            top: `${minRow * cellSize}px`,
                            left: `${minCol * cellSize}px`,
                            width: `${width}px`,
                            height: `${height}px`,
                            zIndex: isSelected ? 20 : 5,
                            borderRadius: '0.5rem',
                        }}
                    >
                         {isSelected && (
                          <div
                            className="absolute -inset-1 rounded-lg"
                            style={{ 
                                zIndex: 25,
                                boxShadow: '0 0 12px 4px #38bdf8' // sky-400
                            }}
                          />
                        )}
                        <WormIcon className={`w-full h-full text-white`} style={{color: wormObject.color}}/>
                    </div>
                )
            })()}

            </div>
       
        </div>
        <div className='flex-grow' />
      
      <AlertDialog open={timeUp} onOpenChange={setTimeUp}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex flex-col items-center gap-4 text-2xl">
                <Clock className="w-16 h-16 text-red-500" />
                Time's Up!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You ran out of time! Don't worry, you can try again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <Button onClick={() => router.push('/')} variant="outline">
              Back to Menu
            </Button>
            <Button onClick={resetGame} className="bg-primary hover:bg-primary/90">
              Try Again
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
      
      </div>
    </main>

  );
}

    

    


