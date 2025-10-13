export type BlockType = 'frame' | 'block' | 'worm' | 'apple' | 'empty';

export type GridCell = {
  type: BlockType | 'space';
  color: string;
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
}
