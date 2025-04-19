import { NextRequest, NextResponse } from 'next/server';
import http from 'http';

// Dedikált proxy a statisztikák lekéréséhez
export async function GET(request: NextRequest) {
  try {
    const apiUrl = 'http://localhost:6666/statisztikak';
    console.log(`Fetching statistics from: ${apiUrl}`);
    
    // Node.js http klient
    const data = await new Promise<string>((resolve, reject) => {
      const req = http.get(apiUrl, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`API error: ${res.statusCode} ${res.statusMessage}`));
          return;
        }
        
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          resolve(responseData);
        });
      });
      
      req.on('error', (error) => {
        console.error('Request error:', error);
        reject(error);
      });
      
      req.end();
    });
    
    console.log(`Statistics data received, length: ${data.length}`);
    
    try {
      const jsonData = JSON.parse(data);
      return NextResponse.json(jsonData);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse statistics data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Statisztikak proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
} 