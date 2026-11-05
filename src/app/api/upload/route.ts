import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const ext = path.extname(file.name || '.webp').toLowerCase() || '.webp';
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.mp4', '.webm'];
    const safeExt = allowedExts.includes(ext) ? ext : '.webp';
    const isVideo = safeExt === '.mp4' || safeExt === '.webm';
    const prefix = isVideo ? 'vid' : 'thumb';
    const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${safeExt}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/api/uploads/${filename}`,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
