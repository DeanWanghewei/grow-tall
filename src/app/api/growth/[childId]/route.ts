import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  bmi,
  midParentalHeight,
  devStage,
  percentileFromLmsTable,
  type Gender,
} from '@/lib/growth';
import { getLmsTable, buildBands } from '@/lib/growth-data';

function ageMonths(birth: Date, d: Date): number {
  return (d.getTime() - birth.getTime()) / (86400000 * 30.4375);
}

export async function GET(_req: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: { records: { orderBy: { date: 'asc' } } },
  });
  if (!child) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const birth = child.birthDate;
  const gender = child.gender as Gender;

  const points = child.records.map((r) => ({
    ageMonths: +ageMonths(birth, r.date).toFixed(1),
    date: r.date,
    height: r.height,
    weight: r.weight,
    bmi: r.height && r.weight ? +bmi(r.weight, r.height / 100).toFixed(1) : null,
  }));

  const latest = child.records.at(-1);
  const ageYearsNow = ageMonths(birth, new Date()) / 12;

  const predictedHeight =
    child.fatherHeight && child.motherHeight
      ? midParentalHeight(child.fatherHeight, child.motherHeight, gender)
      : null;
  const dev = devStage(ageYearsNow, gender);
  const latestBmi =
    latest?.height && latest?.weight ? +bmi(latest.weight, latest.height / 100).toFixed(1) : null;

  // 百分位带 + 当前百分位(需 WHO LMS 数据)
  const heightTable = await getLmsTable('lhfa', gender);
  let heightBands = null;
  let heightPercentile = null;
  if (heightTable && latest?.height) {
    const maxAge = Math.max(Math.ceil(ageMonths(birth, new Date())) + 12, 24);
    heightBands = buildBands(heightTable, 0, maxAge, 3);
    heightPercentile = percentileFromLmsTable(
      latest.height,
      Math.round(ageMonths(birth, latest.date)),
      heightTable,
    );
  }

  return NextResponse.json({
    child: { name: child.name, gender, birthDate: child.birthDate },
    points,
    derived: {
      ageYears: +ageYearsNow.toFixed(1),
      predictedHeight,
      devStage: dev,
      latestHeight: latest?.height ?? null,
      latestWeight: latest?.weight ?? null,
      latestBmi,
      heightPercentile,
    },
    bands: { height: heightBands },
    hasReferenceData: !!heightTable,
  });
}
