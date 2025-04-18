import { NextRequest, NextResponse } from 'next/server';

// Ez az API route proxy-ként működik a localhost:6666 API felé
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Build the path from the path array parameter
    const pathSegments = params.path;
    const path = pathSegments.join('/');
    const targetUrl = `http://localhost:6666/${path}`;
    
    console.log(`Proxying request to: ${targetUrl}`);
    
    // Use fetch API
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    // Get data as JSON
    const data = await response.json();
    console.log(`API response received successfully`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to API', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 