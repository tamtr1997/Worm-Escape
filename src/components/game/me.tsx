     {/* Render từng cell riêng */}
              {obj.cells.map((cell, i) => (
                <Block
                  key={`${obj.id}-${i}`} // key cố định, không theo row/col
                  color={obj.color}
                  size={cellSize}
                  className="absolute"
                  style={{
                    top: `${(cell.row - minRow) * cellSize}px`,
                    left: `${(cell.col - minCol) * cellSize}px`,
                    outline: selectedObjectId === obj.id ? '2px solid #00D8FF' : undefined,
                    outlineOffset: selectedObjectId === obj.id ? '-2px' : undefined,
                  }}
                />
              ))}