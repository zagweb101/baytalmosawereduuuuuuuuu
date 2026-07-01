import { CourseStatus, EnrollmentStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import {
  getPreviewLessonIdsForCourse,
  isLessonInPreviewSet,
  type SectionWithLessons,
} from "@/lib/preview";

type AccessUser = {
  id: string;
  role: UserRole;
};

type CourseAccess = {
  id: string;
  instructorId: string;
  status: CourseStatus;
  price: { toNumber(): number } | number;
};

export async function isEnrolled(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: userId,
        courseId,
      },
    },
  });

  return enrollment?.status === EnrollmentStatus.ACTIVE;
}

export async function canAccessCourse(
  user: AccessUser | null,
  course: CourseAccess,
): Promise<boolean> {
  if (course.status === CourseStatus.PUBLISHED) {
    const price = toNumber(course.price);
    if (price === 0) {
      return true;
    }
  }

  if (!user) {
    return false;
  }

  if (user.role === UserRole.ADMIN) {
    return true;
  }

  if (
    user.role === UserRole.INSTRUCTOR &&
    course.instructorId === user.id
  ) {
    return true;
  }

  return isEnrolled(user.id, course.id);
}

export async function canEditCourse(
  user: AccessUser | null,
  course: Pick<CourseAccess, "instructorId">,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  if (user.role === UserRole.ADMIN) {
    return true;
  }

  return (
    user.role === UserRole.INSTRUCTOR && course.instructorId === user.id
  );
}

export async function canPreviewLesson(
  user: AccessUser | null,
  course: CourseAccess,
  lessonId: string,
  sections: SectionWithLessons[],
): Promise<boolean> {
  if (course.status !== CourseStatus.PUBLISHED) {
    return false;
  }

  if (user && (await canAccessCourse(user, course))) {
    return true;
  }

  const previewIds = await getPreviewLessonIdsForCourse(sections);
  return isLessonInPreviewSet(lessonId, previewIds);
}
