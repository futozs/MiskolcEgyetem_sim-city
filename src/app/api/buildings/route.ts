import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Grid size settings
    const gridSize = 10; // 10x10 grid
    const cellSize = 15; // Size of each grid cell
    const gridOffset = gridSize * cellSize / 2; // Offset to center the grid

    // Building types for variety
    const buildingTypes = ['residential', 'commercial', 'office', 'industrial'];
    
    // Create buildings in a grid pattern - exactly one building per non-road cell
    const buildings = [];
    let id = 1;
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Skip positions for roads (every third row/column is a road)
        if (row % 3 === 0 || col % 3 === 0) {
          continue;
        }
        
        // Calculate position in centered grid - place exactly in center of cell
        const x = col * cellSize - gridOffset + cellSize/2;
        const z = row * cellSize - gridOffset + cellSize/2;
        
        // Create a deterministic random based on grid position for consistency
        const seed = (row * 1000 + col * 10);
        const seedX = Math.sin(seed) * 10000;
        const seedY = Math.cos(seed) * 10000;
        const seedZ = Math.sin(seed + 5000) * 10000;
        
        // Get deterministic random values between 0 and 1
        const randX = Math.abs(seedX - Math.floor(seedX));
        const randY = Math.abs(seedY - Math.floor(seedY));
        const randZ = Math.abs(seedZ - Math.floor(seedZ));
        
        // Calculate scale based on position (deterministic)
        // Keep width and depth smaller to ensure buildings don't extend beyond their cells
        const width = 2 + randX * 2; 
        const height = 2 + randY * 5;
        const depth = 2 + randZ * 2;
        
        // Determine building type based on quadrant
        let type;
        if (row < gridSize/2 && col < gridSize/2) {
          type = 'residential';
        } else if (row < gridSize/2 && col >= gridSize/2) {
          type = 'commercial';
        } else if (row >= gridSize/2 && col < gridSize/2) {
          type = 'office';
        } else {
          type = 'industrial';
        }
        
        // Add building to the array with exact grid positioning
        buildings.push({
          id: id++,
          position: { x, y: 0, z },
          scale: { x: width, y: height, z: depth },
          type,
          gridPosition: { row, col } // Store grid position for reference
        });
      }
    }
    
    return NextResponse.json(buildings);
  } catch (error) {
    console.error('Error generating building data:', error);
    return NextResponse.json({ error: 'Failed to generate building data' }, { status: 500 });
  }
} 