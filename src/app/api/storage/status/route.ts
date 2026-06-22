import { NextResponse } from 'next/server';
import { isStorageConfigured } from '@/lib/storage';

export async function GET() {
  return NextResponse.json({ available: isStorageConfigured() });
}
