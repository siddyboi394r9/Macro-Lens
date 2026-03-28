import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = searchParams.get('session');

  if (!session) return NextResponse.json({ error: 'Session required' }, { status: 400 });

  try {
    const syncSession = await prisma.syncSession.findUnique({
      where: { id: session },
    });

    if (syncSession) {
      // Delete immediately after consumption to keep DB clean
      await prisma.syncSession.delete({
        where: { id: session },
      });
      return NextResponse.json({ status: 'success', image: syncSession.image });
    }
  } catch (error) {
    console.error('Failed to fetch sync session', error);
  }

  return NextResponse.json({ status: 'pending' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session, image } = body;

    if (!session || !image) {
      return NextResponse.json({ error: 'Session and image required' }, { status: 400 });
    }

    // Upsert the sync session (update if exists, create if not)
    await prisma.syncSession.upsert({
      where: { id: session },
      update: { image, createdAt: new Date() },
      create: { id: session, image },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to sync image', error);
    return NextResponse.json({ error: 'Failed to sync image' }, { status: 500 });
  }
}
