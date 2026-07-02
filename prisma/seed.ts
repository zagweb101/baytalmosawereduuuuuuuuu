import {
  UserRole,
  UserStatus,
  CourseStatus,
  CourseLevel,
  LessonType,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { db as prisma } from "../lib/db";

const CATEGORIES = [
  {
    name: "التصوير الفوتوغرافي",
    slug: "photography",
    description: "دورات أساسيات ومتقدمة في التصوير الفوتوغرافي",
    icon: "camera",
    order: 1,
  },
  {
    name: "مونتاج الفيديو",
    slug: "video-editing",
    description: "تعلم المونتاج والإخراج باستخدام برامج احترافية",
    icon: "film",
    order: 2,
  },
  {
    name: "الإضاءة الاحترافية",
    slug: "lighting",
    description: "تقنيات الإضاءة للاستوديو والتصوير الخارجي",
    icon: "lightbulb",
    order: 3,
  },
  {
    name: "التصوير بالموبايل",
    slug: "mobile-photography",
    description: "احتراف التصوير باستخدام الهاتف الذكي",
    icon: "smartphone",
    order: 4,
  },
  {
    name: "التسويق للمصورين",
    slug: "photographer-marketing",
    description: "بناء العلامة الشخصية وتسويق خدمات التصوير",
    icon: "megaphone",
    order: 5,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("Admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@baytalmosawer.com" },
    update: {},
    create: {
      name: "مدير المنصة",
      email: "admin@baytalmosawer.com",
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });

  const instructorPasswordHash = await bcrypt.hash("Instructor123!", 12);

  const instructor = await prisma.user.upsert({
    where: { email: "instructor@baytalmosawer.com" },
    update: {},
    create: {
      name: "أحمد المصور",
      email: "instructor@baytalmosawer.com",
      passwordHash: instructorPasswordHash,
      role: UserRole.INSTRUCTOR,
      status: UserStatus.ACTIVE,
      bio: "مصور محترف مع أكثر من 10 سنوات خبرة في التصوير الفوتوغرافي والفيديو",
      emailVerified: new Date(),
    },
  });

  const studentPasswordHash = await bcrypt.hash("Student123!", 12);

  const student = await prisma.user.upsert({
    where: { email: "student@baytalmosawer.com" },
    update: {},
    create: {
      name: "سارة الطالبة",
      email: "student@baytalmosawer.com",
      passwordHash: studentPasswordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });

  await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "بيت المصور",
      commissionPercent: 20,
      vatPercent: 15,
      maxFreePreviewLessons: 2,
      refundDays: 7,
      refundMaxProgressPercent: 20,
    },
  });

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const photographyCategory = await prisma.category.findUniqueOrThrow({
    where: { slug: "photography" },
  });

  const videoCategory = await prisma.category.findUniqueOrThrow({
    where: { slug: "video-editing" },
  });

  const course1 = await prisma.course.upsert({
    where: { slug: "photography-basics" },
    update: {},
    create: {
      title: "أساسيات التصوير الفوتوغرافي",
      slug: "photography-basics",
      description:
        "دورة شاملة لتعلم أساسيات التصوير الفوتوغرافي من الصفر. ستتعلم كيفية استخدام الكاميرا، الإعدادات الأساسية، التكوين، والإضاءة.",
      shortDescription: "تعلم أساسيات التصوير من الصفر",
      status: CourseStatus.PUBLISHED,
      level: CourseLevel.BEGINNER,
      price: 299,
      durationHours: 12,
      learningOutcomes: [
        "فهم إعدادات الكاميرا (ISO, Shutter Speed, Aperture)",
        "إتقان قواعد التكوين",
        "التصوير في ظروف إضاءة مختلفة",
        "معالجة الصور الأساسية",
      ],
      requirements: [
        "كاميرا (DSLR أو Mirrorless أو حتى موبايل)",
        "رغبة في التعلم والممارسة",
      ],
      instructorId: instructor.id,
      categoryId: photographyCategory.id,
      publishedAt: new Date(),
    },
  });

  const course1SectionCount = await prisma.section.count({
    where: { courseId: course1.id },
  });

  if (course1SectionCount === 0) {
    await prisma.section.create({
      data: {
        title: "مقدمة في التصوير",
        order: 1,
        courseId: course1.id,
        lessons: {
          create: [
            {
              title: "مرحباً بك في الدورة",
              type: LessonType.VIDEO,
              content: "مقدمة عن الدورة وأهدافها",
              videoRef: "https://example.com/videos/intro",
              order: 1,
              durationMinutes: 5,
              isFreePreview: true,
            },
            {
              title: "أنواع الكاميرات",
              type: LessonType.TEXT,
              content: "شرح أنواع الكاميرات المختلفة ومتى تستخدم كل نوع",
              order: 2,
              durationMinutes: 15,
              isFreePreview: true,
            },
            {
              title: "مثلث التعريض",
              type: LessonType.VIDEO,
              content: "شرح ISO وسرعة الغالق والفتحة",
              videoRef: "https://example.com/videos/exposure-triangle",
              order: 3,
              durationMinutes: 25,
            },
          ],
        },
      },
    });

    await prisma.section.create({
      data: {
        title: "التكوين والإطار",
        order: 2,
        courseId: course1.id,
        lessons: {
          create: [
            {
              title: "قاعدة الأثلاث",
              type: LessonType.VIDEO,
              content: "تطبيق قاعدة الأثلاث في التصوير",
              videoRef: "https://example.com/videos/rule-of-thirds",
              order: 1,
              durationMinutes: 20,
            },
            {
              title: "ملف تمرين التكوين",
              type: LessonType.FILE,
              content: "تمارين عملية للتكوين",
              fileRef: "https://example.com/files/composition-exercises.pdf",
              order: 2,
              durationMinutes: 30,
            },
          ],
        },
      },
    });
  }

  const course2 = await prisma.course.upsert({
    where: { slug: "video-editing-premiere" },
    update: {},
    create: {
      title: "مونتاج الفيديو بـ Adobe Premiere",
      slug: "video-editing-premiere",
      description:
        "تعلم مونتاج الفيديو الاحترافي باستخدام Adobe Premiere Pro. من استيراد الملفات إلى التصدير النهائي.",
      shortDescription: "مونتاج احترافي بـ Premiere Pro",
      status: CourseStatus.PUBLISHED,
      level: CourseLevel.INTERMEDIATE,
      price: 449,
      durationHours: 18,
      learningOutcomes: [
        "إتقان واجهة Premiere Pro",
        "القص والمونتاج الأساسي",
        "إضافة المؤثرات والانتقالات",
        "تصدير الفيديو بجودة احترافية",
      ],
      requirements: [
        "Adobe Premiere Pro مثبت على الجهاز",
        "معرفة أساسية بالحاسوب",
      ],
      instructorId: instructor.id,
      categoryId: videoCategory.id,
      publishedAt: new Date(),
    },
  });

  const course2SectionCount = await prisma.section.count({
    where: { courseId: course2.id },
  });

  if (course2SectionCount === 0) {
    await prisma.section.create({
      data: {
        title: "البداية مع Premiere",
        order: 1,
        courseId: course2.id,
        lessons: {
          create: [
            {
              title: "تثبيت وإعداد البرنامج",
              type: LessonType.VIDEO,
              content: "خطوات تثبيت Premiere Pro وإعداد المشروع",
              videoRef: "https://example.com/videos/premiere-setup",
              order: 1,
              durationMinutes: 10,
              isFreePreview: true,
            },
            {
              title: "واجهة البرنامج",
              type: LessonType.VIDEO,
              content: "جولة في واجهة Premiere Pro",
              videoRef: "https://example.com/videos/premiere-interface",
              order: 2,
              durationMinutes: 20,
            },
          ],
        },
      },
    });
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME20" },
    update: {},
    create: {
      code: "WELCOME20",
      discountType: "PERCENT",
      discountValue: 20,
      maxUses: 100,
      isActive: true,
    },
  });

  console.log("✅ Seed completed");
  if (process.env.CI !== "true") {
    console.log(`   Admin: admin@baytalmosawer.com / Admin123!`);
    console.log(`   Instructor: instructor@baytalmosawer.com / Instructor123!`);
    console.log(`   Student: student@baytalmosawer.com / Student123!`);
  }
  console.log(`   Courses: ${course1.title}, ${course2.title}`);
  console.log(`   Admin ID: ${admin.id}`);
  console.log(`   Student ID: ${student.id}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
