import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(100),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير")
    .regex(/[0-9]/, "يجب أن تحتوي على رقم"),
  role: z.enum(["STUDENT", "INSTRUCTOR"]).default("STUDENT"),
});

export const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const courseSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط"),
  description: z.string().min(20),
  shortDescription: z.string().max(300).optional(),
  categoryId: z.string().cuid(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  price: z.number().min(0),
  durationHours: z.number().int().min(0).default(0),
  learningOutcomes: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  thumbnail: z.string().url().optional(),
});

export const lessonSchema = z.object({
  title: z.string().min(2).max(200),
  type: z.enum(["VIDEO", "TEXT", "FILE"]),
  content: z.string().optional(),
  videoRef: z.string().optional(),
  fileRef: z.string().optional(),
  order: z.number().int().min(0).default(0),
  durationMinutes: z.number().int().min(0).optional(),
  isFreePreview: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sectionId: z.string().cuid(),
});

export const orderSchema = z.object({
  courseId: z.string().cuid(),
  couponCode: z.string().optional(),
});

export const reviewSchema = z.object({
  courseId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const quizSchema = z.object({
  title: z.string().min(3).max(200),
  passingScore: z.number().int().min(0).max(100).default(70),
  timeLimitMinutes: z.number().int().min(1).optional(),
  courseId: z.string().cuid().optional(),
  lessonId: z.string().cuid().optional(),
  questions: z
    .array(
      z.object({
        text: z.string().min(5),
        type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "TEXT"]),
        options: z.array(z.string()).optional(),
        correctAnswer: z.string().min(1),
        order: z.number().int().min(0).default(0),
      }),
    )
    .min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type QuizInput = z.infer<typeof quizSchema>;
