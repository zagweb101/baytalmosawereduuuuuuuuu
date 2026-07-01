import Link from "next/link";
import type { CourseLevel, CourseStatus } from "@prisma/client";
import { Clock, Users, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

type CourseCardProps = {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string | null;
  price: number | { toNumber(): number };
  level: CourseLevel;
  instructorName: string;
  enrollmentCount?: number;
  rating?: number;
  status?: CourseStatus;
  href?: string;
};

const levelLabels: Record<CourseLevel, string> = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
};

export function CourseCard({
  title,
  slug,
  thumbnail,
  price,
  level,
  instructorName,
  enrollmentCount,
  rating,
  href,
}: CourseCardProps) {
  const link = href ?? `/courses/${slug}`;

  return (
    <Link href={link}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        <div className="aspect-video bg-gradient-to-br from-brand-purple/20 to-brand-magenta/20 relative overflow-hidden">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt={title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center brand-gradient-text text-4xl font-bold opacity-30">
              بم
            </div>
          )}
          <Badge className="absolute top-3 start-3">{levelLabels[level]}</Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold line-clamp-2 group-hover:text-brand-magenta transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted mt-1">{instructorName}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="font-bold text-brand-purple">
              {formatPrice(price)}
            </span>
            <div className="flex items-center gap-3 text-xs text-muted">
              {rating !== undefined && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {rating.toFixed(1)}
                </span>
              )}
              {enrollmentCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {enrollmentCount}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
