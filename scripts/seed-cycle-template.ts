/**
 * Seeds the default 4+1 cycle template for a user.
 * Run after registration: npx tsx scripts/seed-cycle-template.ts
 *
 * Creates the "学长4+1周期" template with:
 *   W1 增肌周1  → hypertrophy_1
 *   W2 增肌周2  → hypertrophy_2
 *   W3 轻训周   → light
 *   W4 增力周   → strength
 *   W5 减载周   → deload (optional)
 */
import { PrismaClient, PhaseType, ExerciseRole } from '../prisma/generated/client';

const db = new PrismaClient({} as never);

async function main() {
  const users = await db.user.findMany();
  for (const user of users) {
    const existing = await db.cycleTemplate.findFirst({
      where: { userId: user.id, name: '学长4+1周期' },
    });
    if (existing) {
      console.log(`Cycle template already exists for ${user.email}, skipping.`);
      continue;
    }

    // Create template
    const template = await db.cycleTemplate.create({
      data: {
        userId: user.id,
        name: '学长4+1周期',
        description: '增肌→增肌→轻训→增力→减载（减载可选），约5周一循环',
        isDefault: true,
      },
    });

    // Define phases with their prescriptions
    const phases = [
      {
        name: '增肌周1',
        phaseType: PhaseType.HYPERTROPHY_1,
        orderIndex: 1,
        durationWeeks: 1,
        isOptional: false,
        prescriptions: [
          { role: ExerciseRole.PRIMARY_COMPOUND,   repMin: 8,  repMax: 12, rpeMin: 8,  rpeMax: 8.5,  vol: 1.0, int: 1.0 },
          { role: ExerciseRole.SECONDARY_COMPOUND, repMin: 8,  repMax: 12, rpeMin: 8,  rpeMax: 8.5,  vol: 1.0, int: 1.0 },
          { role: ExerciseRole.ISOLATION,           repMin: 12, repMax: 20, rpeMin: 8,  rpeMax: 8.5,  vol: 1.0, int: 1.0 },
        ],
      },
      {
        name: '增肌周2',
        phaseType: PhaseType.HYPERTROPHY_2,
        orderIndex: 2,
        durationWeeks: 1,
        isOptional: false,
        prescriptions: [
          { role: ExerciseRole.PRIMARY_COMPOUND,   repMin: 8,  repMax: 12, rpeMin: 8,  rpeMax: 8.5,  vol: 1.0, int: 1.0 },
          { role: ExerciseRole.SECONDARY_COMPOUND, repMin: 8,  repMax: 12, rpeMin: 8,  rpeMax: 8.5,  vol: 1.0, int: 1.0 },
          { role: ExerciseRole.ISOLATION,           repMin: 12, repMax: 20, rpeMin: 8,  rpeMax: 8.5,  vol: 1.0, int: 1.0 },
        ],
      },
      {
        name: '轻训周',
        phaseType: PhaseType.LIGHT,
        orderIndex: 3,
        durationWeeks: 1,
        isOptional: false,
        prescriptions: [
          { role: ExerciseRole.PRIMARY_COMPOUND,   repMin: 8,  repMax: 12, rpeMin: 6,  rpeMax: 6.5,  vol: 0.7, int: 0.9 },
          { role: ExerciseRole.SECONDARY_COMPOUND, repMin: 8,  repMax: 12, rpeMin: 6.5, rpeMax: 7,    vol: 0.7, int: 0.9 },
          { role: ExerciseRole.ISOLATION,           repMin: 12, repMax: 20, rpeMin: 6,  rpeMax: 7,    vol: 0.7, int: 0.9 },
        ],
      },
      {
        name: '增力周',
        phaseType: PhaseType.STRENGTH,
        orderIndex: 4,
        durationWeeks: 1,
        isOptional: false,
        prescriptions: [
          { role: ExerciseRole.PRIMARY_COMPOUND,   repMin: 3,  repMax: 5,  rpeMin: 8.5, rpeMax: 9,    vol: 0.8, int: 1.15 },
          { role: ExerciseRole.SECONDARY_COMPOUND, repMin: 4,  repMax: 6,  rpeMin: 8,   rpeMax: 8.5,  vol: 0.8, int: 1.1  },
          { role: ExerciseRole.ISOLATION,           repMin: 6,  repMax: 8,  rpeMin: 7,   rpeMax: 7,    vol: 0.6, int: 0.85 },
        ],
      },
      {
        name: '减载周',
        phaseType: PhaseType.DELOAD,
        orderIndex: 5,
        durationWeeks: 1,
        isOptional: true, // Deload is optional
        prescriptions: [
          { role: ExerciseRole.PRIMARY_COMPOUND,   repMin: 4,  repMax: 5,  rpeMin: 5,  rpeMax: 6,   vol: 0.5, int: 0.8 },
          { role: ExerciseRole.SECONDARY_COMPOUND, repMin: 4,  repMax: 5,  rpeMin: 6,  rpeMax: 6,   vol: 0.5, int: 0.8 },
          { role: ExerciseRole.ISOLATION,           repMin: 6,  repMax: 8,  rpeMin: 6,  rpeMax: 6,   vol: 0.5, int: 0.8 },
        ],
      },
    ];

    for (const phase of phases) {
      const { prescriptions, ...phaseData } = phase;
      const created = await db.cyclePhase.create({
        data: {
          templateId: template.id,
          ...phaseData,
        },
      });
      for (const p of prescriptions) {
        await db.phasePrescription.create({
          data: {
            phaseId: created.id,
            exerciseRole: p.role,
            targetRepMin: p.repMin,
            targetRepMax: p.repMax,
            targetRpeMin: p.rpeMin,
            targetRpeMax: p.rpeMax,
            volumeMult: p.vol,
            intensityMult: p.int,
          },
        });
      }
    }

    console.log(`Seeded 4+1 cycle template for ${user.email}`);
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
