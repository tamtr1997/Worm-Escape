'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLevels } from '@/hooks/useLevels';
import type { Level, GridCell, GameObject } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Home, RotateCcw, ArrowBigUp, ArrowBigDown, ArrowBigLeft, ArrowBigRight } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { WormIcon , Block} from '../icons/WormIcon';
import { Apple } from 'lucide-react';

function createRuntimeGrid(levelGrid: GridCell[][]): GridCell[][] {
    return levelGrid.map(row => row.map(cell => {
        if (cell.type === 'empty') {
            return  { type: 'space', color: 'hsl(231, 68%, 15%)' ,floorColor: cell.floorColor };;
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
  const [nextLevelId, setNextLevelId] = useState<string | null>(null);

  // Thêm state cho kích thước ô
  const [cellSize, setCellSize] = useState(0);

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

      // Tính toán kích thước ô dựa trên số hàng và cột
      const containerWidth = 375;
      const containerHeight = 600;
      
      // Tính kích thước ô tối đa có thể mà không vượt quá container
      const maxCellWidth = containerWidth / levelData.cols;
      const maxCellHeight = containerHeight / levelData.rows;
      
      // Chọn kích thước nhỏ hơn để đảm bảo vừa khít cả hai chiều
      const calculatedCellSize = Math.min(maxCellWidth, maxCellHeight);
      setCellSize(calculatedCellSize);
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

        // Check for movement restrictions
        if (objectToMove.movement === 'horizontal' && dr !== 0) return prevObjects;
        if (objectToMove.movement === 'vertical' && dc !== 0) return prevObjects;

        const objectsToMove = new Set<string>([selectedObjectId]);
        const objectsToCheck = [objectToMove];
        let canMove = true;
        let hasWon = false;

        const appleObject = newObjects.find(o => o.type === 'apple');
        const applePos = appleObject?.cells[0];

        while (objectsToCheck.length > 0) {
            const currentObject = objectsToCheck.shift()!;
            
            // A group of blocks can only move if the initial block's direction allows it
            if (objectToMove.movement === 'horizontal' && dr !== 0) {
                canMove = false;
                break;
            }
            if (objectToMove.movement === 'vertical' && dc !== 0) {
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
                
                // Floor color check
                if (gridCell.floorColor && gridCell.floorColor !== currentObject.color) {
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

                    // Check movement restriction of the next object in the push chain
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

    const handleMouseDown = (e: React.MouseEvent, objectId: string) => {
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

        // Sử dụng cellSize thay vì CELL_SIZE cố định
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
            dragStartPos.current = { x: e.clientX, y: e.clientY };
            lastMoveTimestamp.current = now;
        }
    }, [isDragging, selectedObjectId, handleMove, cellSize]);

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

  if (!level || runtimeGrid.length === 0 || cellSize === 0) {
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

  const getCellClasses = (obj: GameObject, cell: { row: number; col: number; }) => {
    const isTop = !obj.cells.some(c => c.row === cell.row - 1 && c.col === cell.col);
    const isBottom = !obj.cells.some(c => c.row === cell.row + 1 && c.col === cell.col);
    const isLeft = !obj.cells.some(c => c.row === cell.row && c.col === cell.col - 1);
    const isRight = !obj.cells.some(c => c.row === cell.row && c.col === cell.col + 1);

    let classes = '';
    if (isTop && isLeft) classes += ' rounded-tl-md';
    if (isTop && isRight) classes += ' rounded-tr-md';
    if (isBottom && isLeft) classes += ' rounded-bl-md';
    if (isBottom && isRight) classes += ' rounded-br-md';
    return classes;
  };

  // Tính toán kích thước thực tế của lưới
  const gridWidth = cellSize * level.cols;
  const gridHeight = cellSize * level.rows;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-6 select-none">
      {/* Khung điện thoại */}
      <div className="relative bg-[#0f172a] w-[390px] h-[844px] rounded-[2rem] shadow-2xl overflow-hidden border border-gray-700 flex flex-col items-center gap-4 py-10">
        <div className="absolute top-4 left-4 flex gap-2">
        <Button variant="outline" size="icon" onClick={() => router.push(isPlaytest ? '/create' : '/')}><Home className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={resetGame}><RotateCcw className="h-4 w-4" /></Button>
      </div>
      <h1 className="text-3xl font-bold text-primary font-headline">Level {level.order} {isPlaytest && '(Playtest)'}</h1>
      <div 
        className="relative border-4 border-primary/20 bg-card p-1 rounded-lg shadow-2xl flex items-center justify-center" 
        style={{ width: '375px', height: '600px' }}
      >
        <div className="relative grid" style={{ 
          gridTemplateColumns: `repeat(${level.cols}, ${cellSize}px)`, 
          gridTemplateRows: `repeat(${level.rows}, ${cellSize}px)`,
          width: `${gridWidth}px`,
          height: `${gridHeight}px`
        }}>
          {runtimeGrid.map((row, r) => row.map((cell, c) => (
          <div
              key={`${r}-${c}`}
              className="relative flex items-center justify-center"
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: cell.type === "space" ? cell.color : "transparent",
                boxShadow: "inset 0 0 0 1px hsl(231, 68%, 10%)",
              }}
            >
              {/* Block & Frame cells */}
              {[ "frame"].includes(cell.type) && (
                <Block
                  color={cell.color}
                  size={cellSize}
                  className="absolute inset-0"
                />
              )}

              {/* Floor overlay */}
              {cell.floorColor && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: cell.floorColor,
                    opacity: 0.3,
                  }}
                />
              )}
            </div>

          )))}
          
          {gameObjects.map(obj => {
              if (obj.type === 'worm') return null;

              const minRow = Math.min(...obj.cells.map(c => c.row));
              const maxRow = Math.max(...obj.cells.map(c => c.row));
              const minCol = Math.min(...obj.cells.map(c => c.col));
              const maxCol = Math.max(...obj.cells.map(c => c.col));
              
              const width = (maxCol - minCol + 1) * cellSize;
              const height = (maxRow - minRow + 1) * cellSize;

              return (
                <div key={obj.id} 
                  className="absolute cursor-pointer group"
                  onMouseDown={(e) => handleMouseDown(e, obj.id)}
                  style={{
                    top: `${minRow * cellSize}px`,
                    left: `${minCol * cellSize}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    transition: 'top 0.15s ease-in-out, left 0.15s ease-in-out',
                  }}
                >
                    {["block"].includes(obj.type) && (
                      <div className="relative w-full h-full">
                        {obj.cells.map((cell, i) => (
                          <Block
                            key={`${obj.id}-${i}`} // giữ key cố định theo object, không phụ thuộc vị trí
                            color={obj.color}
                            size={cellSize}
                            className="absolute"
                            style={{
                              top: `${(cell.row - minRow) * cellSize}px`,
                              left: `${(cell.col - minCol) * cellSize}px`,
                            }}
                          />
                        ))}
                      </div>
                    )}


                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: (selectedObjectId === obj.id ? 11 : 6) }}>
                      {obj.type === 'apple' && (
                        <Apple className="w-full h-full p-1.5 text-white" fill="#fff" />
                      )}
                      
                      {obj.movement === 'horizontal' && (
                          <div className="absolute inset-0 flex items-center justify-between px-2 text-white/90">
                              <ArrowBigLeft fill="white" className="w-6 h-6"/>
                              <div className="flex-grow h-1 bg-white/90 rounded-full mx-1"></div>
                              <ArrowBigRight fill="white" className="w-6 h-6"/>
                          </div>
                      )}
                      {obj.movement === 'vertical' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-between py-2 text-white/90">
                              <ArrowBigUp fill="white" className="w-6 h-6"/>
                              <div className="flex-grow w-1 bg-white/90 rounded-full my-1"></div>
                              <ArrowBigDown fill="white" className="w-6 h-6"/>
                          </div>
                      )}
                    </div>
                </div>
              )
          })}

          {wormObject && (
            <div key={wormObject.id} onMouseDown={(e) => handleMouseDown(e, wormObject.id)}
              className={`absolute cursor-pointer transition-all duration-150 ease-in-out group`}
              style={{
                top: `${wormObject.cells[0].row * cellSize}px`,
                left: `${Math.min(...wormObject.cells.map(c => c.col)) * cellSize}px`,
                width: `${wormObject.cells.length * cellSize}px`,
                height: `${cellSize}px`,
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
      
      </div>
    </main>

  );
}