export type BlockType = 'frame' | 'block' | 'worm' | 'apple' | 'empty' | 'floor';

export type Movement = 'horizontal' | 'vertical';

export type GridCell = {
  type: BlockType | 'space';
  color: string;
  movement?: Movement;
  floorColor?: string;
};

export interface Level {
  id: string;
  order: number;
  rows: number;
  cols: number;
  grid: GridCell[][];
}

export interface GameObject {
    id: string; 
    type: 'block' | 'worm' | 'apple';
    cells: { row: number, col: number }[];
    color: string;
    movement?: Movement;
    maxTime: number;
}
