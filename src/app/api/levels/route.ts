
import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

// Determine the path to the JSON file
const jsonFilePath = path.join(process.cwd(), 'src', 'data', 'levels.json');

/**
 * Handles GET requests to fetch the current levels.
 */
export async function GET(req: NextRequest) {
  try {
    const fileContents = await fs.readFile(jsonFilePath, 'utf8');
    const levels = JSON.parse(fileContents);
    return NextResponse.json(levels);
  } catch (error) {
    console.error('Failed to read levels:', error);
    // If the file doesn't exist, return an empty array.
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json([]);
    }
    return NextResponse.json({ message: 'Error reading levels data.' }, { status: 500 });
  }
}

/**
 * Handles POST requests to update the levels.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await fs.writeFile(jsonFilePath, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json({ message: 'Levels updated successfully.' });
  } catch (error) {
    console.error('Failed to write levels:', error);
    return NextResponse.json({ message: 'Error writing levels data.' }, { status: 500 });
  }
}
