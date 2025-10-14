import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    time: Date.now(),
    message: 'Ping successful — your API is working!',
  });
}
