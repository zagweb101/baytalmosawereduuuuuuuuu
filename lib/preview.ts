import { db } from "@/lib/db";

export type SectionWithLessons = {
  order: number;
  lessons: { id: string; order: number; isFreePreview: boolean }[];
};

type SectionWithLessonsInput = SectionWithLessons;

export function getOrderedLessons(sections: SectionWithLessonsInput[]) {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .flatMap((section) =>
      [...section.lessons].sort((a, b) => a.order - b.order),
    );
}

export async function getMaxFreePreviewLessons(): Promise<number> {
  const settings = await db.platformSettings.findUnique({
    where: { id: "default" },
  });
  return settings?.maxFreePreviewLessons ?? 2;
}

/** يحدد الدروس القابلة للمعاينة: المُعلَّمة + أول N دروس حسب إعدادات المنصة */
export function computePreviewLessonIds(
  sections: SectionWithLessonsInput[],
  maxFree: number,
): Set<string> {
  const ordered = getOrderedLessons(sections);
  const ids = new Set<string>();
  let autoSlots = 0;

  for (const lesson of ordered) {
    if (lesson.isFreePreview) {
      ids.add(lesson.id);
    } else if (autoSlots < maxFree) {
      ids.add(lesson.id);
      autoSlots++;
    }
  }

  return ids;
}

export async function getPreviewLessonIdsForCourse(
  sections: SectionWithLessonsInput[],
): Promise<Set<string>> {
  const maxFree = await getMaxFreePreviewLessons();
  return computePreviewLessonIds(sections, maxFree);
}

export function isLessonInPreviewSet(
  lessonId: string,
  previewIds: Set<string>,
): boolean {
  return previewIds.has(lessonId);
}
