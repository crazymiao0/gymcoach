import { MuscleGroup, ExerciseCategory, type PrismaClient } from '@/prisma/generated/client';

// ============================================================
// Default exercise catalog
// ============================================================
// Seeded per user: at registration (so a new account is not empty) and by the
// demo seed. Generic, evidence-informed technique cues, no personal data.

export interface CatalogExercise {
  name: string;
  muscleGroup: MuscleGroup;
  category: ExerciseCategory;
  defaultRestSec: number;
  usesBodyweight?: boolean;
  notes?: string;
}

export const EXERCISE_CATALOG: CatalogExercise[] = [
  // Chest
  {
    name: '杠铃卧推',
    muscleGroup: MuscleGroup.CHEST,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 150,
    notes: '杠铃位于掌根，手腕与前臂对齐。肘部与躯干成45度角。触胸。',
  },
  {
    name: '上斜哑铃卧推（30度）',
    muscleGroup: MuscleGroup.CHEST,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 120,
    notes: '长凳调至30度。节奏3-0-1-0。顶部不要锁定肘关节。专注上胸。',
  },
  {
    name: '蝴蝶机夹胸（或龙门架飞鸟）',
    muscleGroup: MuscleGroup.CHEST,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 75,
    notes: '肘部低于肩线5到10度。由肘部驱动。在拉伸和收缩位各停顿一秒。',
  },

  // Back
  {
    name: '正手引体向上（可负重）',
    muscleGroup: MuscleGroup.BACK_WIDTH,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 120,
    usesBodyweight: true,
    notes: '正手握法，肩宽+10厘米。严格节奏。用肘部向髋部方向拉。达到4x10后增加负重。',
  },
  {
    name: '高位下拉（宽握）',
    muscleGroup: MuscleGroup.BACK_WIDTH,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 120,
    notes: '宽距正握。拉至锁骨位置，肩胛骨下沉。躯干微微后倾。',
  },
  {
    name: '俯身杠铃划船',
    muscleGroup: MuscleGroup.BACK_THICKNESS,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 120,
    notes: '躯干前倾30至45度，背部挺直。拉向肚脐方向。肘部贴近身体。',
  },
  {
    name: '坐姿绳索划船（对握手柄）',
    muscleGroup: MuscleGroup.BACK_THICKNESS,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 90,
    notes: '对握手柄。拉向肚脐方向。挤压肩胛骨。肘部贴近身体。',
  },

  // Shoulders
  {
    name: '坐姿哑铃推举',
    muscleGroup: MuscleGroup.SHOULDERS_FRONT,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 120,
    notes: '靠背调至90度。下背部不要反弓。下放至耳朵高度。',
  },
  {
    name: '龙门架侧平举',
    muscleGroup: MuscleGroup.SHOULDERS_LATERAL,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '绳索位于身体前方。肘部微屈。以肘部带动。停在肩部高度。缓慢下落。',
  },
  {
    name: '反向蝴蝶机飞鸟',
    muscleGroup: MuscleGroup.SHOULDERS_REAR,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '反向蝴蝶机。由肘部向后带动。掌心朝下。挤压1秒。',
  },

  // Biceps
  {
    name: 'EZ杠弯举',
    muscleGroup: MuscleGroup.BICEPS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 75,
    notes: '不要晃动。顶部挤压1秒。肘部贴近身体。',
  },
  {
    name: '上斜哑铃弯举（长凳60度）',
    muscleGroup: MuscleGroup.BICEPS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 75,
    notes: '长凳调至60度。肘部位于躯干后方固定。上举时旋后。底部充分拉伸（Maeo 2021）。',
  },

  // Triceps
  {
    name: '双杠臂屈伸或双杠',
    muscleGroup: MuscleGroup.TRICEPS,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 75,
    usesBodyweight: true,
    notes: '躯干垂直以专注肱三头肌。使用辅助器械时，将辅助重量记录为额外负重。',
  },
  {
    name: '绳索下压',
    muscleGroup: MuscleGroup.TRICEPS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '肘部固定于身体两侧。底部将绳索分开。不要将肘部弹入锁定状态（最大伸展95%）。',
  },

  // Quads
  {
    name: '倒蹬机（或哈克深蹲）',
    muscleGroup: MuscleGroup.QUADS,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 150,
    notes: '下蹲至大腿与地面平行。控制3秒下放。',
  },
  {
    name: '腿屈伸',
    muscleGroup: MuscleGroup.QUADS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 75,
    notes: '顶部停顿1秒。脚踝保持中立位。',
  },
  {
    name: '哑铃箭步走',
    muscleGroup: MuscleGroup.QUADS,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 90,
    notes: '膝盖距地面1厘米，不要弹起。',
  },

  // Hamstrings
  {
    name: '哑铃罗马尼亚硬拉',
    muscleGroup: MuscleGroup.HAMSTRINGS,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 120,
    notes: '臀部向后推，背部挺直。膝盖微屈。最大程度拉伸腘绳肌。',
  },
  {
    name: '坐姿腿弯举',
    muscleGroup: MuscleGroup.HAMSTRINGS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 75,
    notes: '收缩位停顿1秒。全范围运动。',
  },

  // Glutes
  {
    name: '杠铃臀推（或器械）',
    muscleGroup: MuscleGroup.GLUTES,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 120,
    notes: '顶部停顿1秒，颈部中立。顶部锁定臀部。',
  },

  // Adductors
  {
    name: '髋内收机',
    muscleGroup: MuscleGroup.QUADS, // approximation, no dedicated group
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '收缩位停顿1秒。',
  },

  // Calves
  {
    name: '站姿提踵（或器械）',
    muscleGroup: MuscleGroup.CALVES,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '腓肠肌（腿伸直）。全范围，底部停顿1秒。不要弹动。',
  },
  {
    name: '坐姿提踵机',
    muscleGroup: MuscleGroup.CALVES,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '比目鱼肌（腿弯曲90度）。底部拉伸位停顿。节奏3-1-1-1。不要弹动。',
  },

  // Abs
  {
    name: '绳索卷腹（跪姿）',
    muscleGroup: MuscleGroup.ABS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '髋部锁定。卷曲脊柱。将肋骨向骨盆方向移动。',
  },
  {
    name: '悬垂举腿',
    muscleGroup: MuscleGroup.ABS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    usesBodyweight: true,
    notes: '下放控制2秒。不要晃动。',
  },
  {
    name: '平板支撑+侧平板支撑',
    muscleGroup: MuscleGroup.ABS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 45,
    usesBodyweight: true,
    notes: '核心稳定性。作为收尾做1组。',
  },

  // ============================================================
  // Additional common movements (machine, cable and accessory work)
  // ============================================================

  // Chest
  {
    name: '平板哑铃卧推',
    muscleGroup: MuscleGroup.CHEST,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 120,
    notes: '哑铃让两侧独立发力。手腕位于肘部正上方。触胸位置，不要完全锁定。',
  },
  {
    name: '坐姿推胸机',
    muscleGroup: MuscleGroup.CHEST,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 90,
    notes: '把手位于胸中部高度。通过胸部发力，在锁定前停止。适合安全地接近力竭。',
  },

  // Back
  {
    name: '对握高位下拉',
    muscleGroup: MuscleGroup.BACK_WIDTH,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 120,
    notes: '掌心相对，肩宽握把。拉向上胸部，肘部向下后方驱动。',
  },
  {
    name: '直臂绳索下压',
    muscleGroup: MuscleGroup.BACK_WIDTH,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 75,
    notes: '手臂近乎伸直，保持微屈肘。用背阔肌将杠铃推向大腿。顶部大幅拉伸。',
  },
  {
    name: '坐姿器械划船（有胸垫）',
    muscleGroup: MuscleGroup.BACK_THICKNESS,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 90,
    notes: '胸垫消除了下背部疲劳。划向躯干，挤压肩胛骨，控制拉伸。',
  },
  {
    name: '单臂哑铃划船',
    muscleGroup: MuscleGroup.BACK_THICKNESS,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 90,
    notes: '膝盖和手撑在长凳上，背部挺直。拉向髋部，肘部贴近身体。底部充分拉伸。',
  },

  // Shoulders
  {
    name: '站姿杠铃推举',
    muscleGroup: MuscleGroup.SHOULDERS_FRONT,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 150,
    notes: '收紧核心，臀部收紧，不要过度反弓。杠铃沿足中上方轨迹移动。头部前穿锁定。',
  },
  {
    name: '哑铃侧平举',
    muscleGroup: MuscleGroup.SHOULDERS_LATERAL,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '微微前倾，肘部微屈。以肘部带动至肩部高度。控制下落，不要晃动。',
  },
  {
    name: '面拉（绳索）',
    muscleGroup: MuscleGroup.SHOULDERS_REAR,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '绳索调至面部高度。将绳索向额头方向拉开，外旋。刺激后束和上背部。',
  },

  // Biceps
  {
    name: '站姿绳索弯举（直杆）',
    muscleGroup: MuscleGroup.BICEPS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '全程保持绳索张力。肘部固定。顶部挤压1秒，不要晃动。',
  },
  {
    name: '集中弯举',
    muscleGroup: MuscleGroup.BICEPS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '坐姿，肘部撑在大腿内侧。严格，全程收缩。高顶峰收缩张力。',
  },

  // Forearms
  {
    name: '杠铃腕弯举',
    muscleGroup: MuscleGroup.FOREARMS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '前臂置于大腿或长凳上，掌心向上。让杠铃滚到手指，然后卷起手腕。全范围，不要借力。',
  },
  {
    name: '反握EZ杠弯举',
    muscleGroup: MuscleGroup.FOREARMS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '正握（掌心向下）握法。针对肱桡肌和腕伸肌。较轻负重，严格节奏。',
  },

  // Biceps (brachialis emphasis)
  {
    name: '锤式弯举（哑铃）',
    muscleGroup: MuscleGroup.BICEPS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '全程对握。强调肱肌和肱桡肌。肘部固定，不要晃动。',
  },

  // Triceps
  {
    name: '窄距杠铃卧推',
    muscleGroup: MuscleGroup.TRICEPS,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 120,
    notes: '握距略窄于肩宽。肘部内收。杠铃落至下胸。偏向肱三头肌的推举。',
  },
  {
    name: '过头绳索臂屈伸',
    muscleGroup: MuscleGroup.TRICEPS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '使用低或高滑轮绳索，背对器械。长头在头部上方拉伸。完全伸展，保持肘部内收。',
  },
  {
    name: 'EZ杠仰卧臂屈伸',
    muscleGroup: MuscleGroup.TRICEPS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 75,
    notes: '下放至额头或头后以获得更多拉伸。肘部朝上，保持窄距。控制下落。',
  },

  // Quads
  {
    name: '倒蹬机（45度）',
    muscleGroup: MuscleGroup.QUADS,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 150,
    notes: '脚放在踏板中部，肩宽。下放至膝盖靠近胸部，下背部不要弓起。不要完全锁定。',
  },
  {
    name: '高脚杯深蹲',
    muscleGroup: MuscleGroup.QUADS,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 120,
    notes: '胸前托举哑铃。躯干直立，底部肘部在膝盖内侧。适合学习深蹲深度。',
  },
  {
    name: '保加利亚分腿蹲',
    muscleGroup: MuscleGroup.QUADS,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 90,
    notes: '后脚垫高。大部分重量在前腿，小腿垂直以刺激股四头肌。控制下放。',
  },

  // Hamstrings
  {
    name: '俯卧腿弯举',
    muscleGroup: MuscleGroup.HAMSTRINGS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 75,
    notes: '髋部压在垫子上。完全弯举，收缩位停顿1秒，控制离心。不要抬髋。',
  },

  // Glutes
  {
    name: '绳索臀后踢',
    muscleGroup: MuscleGroup.GLUTES,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '脚踝绑带在低滑轮上。微微俯身，将脚跟向后上方驱动。顶部挤压臀部，下背部不要反弓。',
  },

  // Lower back
  {
    name: '背伸（山羊挺身）',
    muscleGroup: MuscleGroup.LOWER_BACK,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    usesBodyweight: true,
    notes: '髋部置于垫上。卷曲并伸展脊柱，或保持刚硬以刺激臀部。加杠铃片增加负重。',
  },
  {
    name: '杠铃早安式',
    muscleGroup: MuscleGroup.LOWER_BACK,
    category: ExerciseCategory.COMPOUND,
    defaultRestSec: 120,
    notes: '杠铃置于上背部。髋部为轴后推，背部挺直，膝盖微屈。轻负重，感受竖脊肌和腘绳肌。',
  },

  // Abs
  {
    name: '器械卷腹',
    muscleGroup: MuscleGroup.ABS,
    category: ExerciseCategory.ISOLATION,
    defaultRestSec: 60,
    notes: '对抗阻力卷曲脊柱，肋骨向骨盆方向移动。控制节奏，收缩位停顿。',
  },

  // ============================================================
  // Conditioning / cardio (issue #133)
  // ============================================================
  // Duration/distance based: sets on these log a time (and optionally a
  // distance) instead of weight x reps. Grouped under OTHER - cardio does
  // not map to a single muscle group.

  {
    name: '跑步',
    muscleGroup: MuscleGroup.OTHER,
    category: ExerciseCategory.CARDIO,
    defaultRestSec: 60,
    notes: '能维持交谈的稳定配速，或间歇跑。记录时间和距离。',
  },
  {
    name: '划船机',
    muscleGroup: MuscleGroup.OTHER,
    category: ExerciseCategory.CARDIO,
    defaultRestSec: 60,
    notes: '先腿部发力，再摆动髋部，最后拉臂。记录时间和距离。',
  },
  {
    name: '骑行',
    muscleGroup: MuscleGroup.OTHER,
    category: ExerciseCategory.CARDIO,
    defaultRestSec: 60,
    notes: '户外或固定自行车。记录时间和距离。',
  },
  {
    name: '跳绳',
    muscleGroup: MuscleGroup.OTHER,
    category: ExerciseCategory.CARDIO,
    defaultRestSec: 60,
    notes: '脚步轻盈，肘部贴近，手腕发力转动。记录时间。',
  },
];

// Upserts the default catalog for a user. Returns a name -> exercise id map so
// callers can wire up a starter program. Idempotent (safe to re-run).
export async function seedExerciseCatalog(
  prisma: PrismaClient,
  userId: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const data of EXERCISE_CATALOG) {
    const exercise = await prisma.exercise.upsert({
      where: { userId_name: { userId, name: data.name } },
      update: data,
      create: { ...data, userId },
    });
    map.set(data.name, exercise.id);
  }
  return map;
}
