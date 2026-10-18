import { NextResponse } from 'next/server';
import { getSiteData, saveSiteData } from '@/lib/storage';

export async function GET() {
  const data = getSiteData();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const updated = await req.json();
    const success = saveSiteData(updated);
    if (!success) {
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
