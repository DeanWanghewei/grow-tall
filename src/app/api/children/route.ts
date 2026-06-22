import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { recommendedThemeForAge } from '@/lib/themes';

const Create = z.object({
  name: z.string().min(1),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  birthDate: z.string(),
  themeId: z.string().optional(),
});

function ageYears(birth: Date): number {
  return (Date.now() - birth.getTime()) / (365.25 * 86400000);
}

export async function GET() {
  const children = await prisma.child.findMany({ orderBy: { birthDate: 'asc' } });
  return NextResponse.json({ children });
}

export async function POST(req: Request) {
  const parsed = Create.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const birth = new Date(d.birthDate);
  if (Number.isNaN(birth.getTime())) return NextResponse.json({ error: 'birthDate 无效' }, { status: 400 });
  const themeId = d.themeId ?? recommendedThemeForAge(ageYears(birth));
  const child = await prisma.child.create({
    data: { name: d.name, gender: d.gender, birthDate: birth, themeId },
  });
  return NextResponse.json({ child });
}
