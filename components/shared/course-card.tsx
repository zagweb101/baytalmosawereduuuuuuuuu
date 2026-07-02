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
    <Link href={link} className="block h-full">
      <Card className="brand-gradient-border group h-full overflow-hidden border-border/50 bg-card/50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-purple/10">
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-brand-purple/20 to-brand-magenta/20">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center brand-gradient-text text-4xl font-bold opacity-30">
              بم
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <Badge className="absolute top-3 start-3 backdrop-blur-sm">{levelLabels[level]}</Badge>
        </div>
        <CardContent className="p-5">
          <h3 className="font-semibold line-clamp-2 transition-colors duration-300 group-hover:text-brand-magenta-light">
            {title}
          </h3>
          <p className="mt-1.5 text-sm text-muted">{instructorName}</p>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
            <span className="font-bold brand-gradient-text">
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
