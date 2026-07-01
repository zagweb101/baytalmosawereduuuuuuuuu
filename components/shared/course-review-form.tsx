"use client";

import { useState, useTransition } from "react";
import { addReview, updateReview } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ExistingReview = {
  id: string;
  rating: number;
  comment: string | null;
};

type CourseReviewFormProps = {
  courseId: string;
  courseTitle: string;
  existingReview: ExistingReview | null;
};

export function CourseReviewForm({
  courseId,
  courseTitle,
  existingReview,
}: CourseReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {existingReview ? "تقييمك للدورة" : "قيّم هذه الدورة"}
        </CardTitle>
        <p className="text-sm text-muted">{courseTitle}</p>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (rating < 1) {
              setMessage("اختر تقييماً من 1 إلى 5");
              return;
            }
            setMessage("");
            const fd = new FormData();
            fd.set("courseId", courseId);
            fd.set("rating", String(rating));
            fd.set("comment", comment);

            startTransition(async () => {
              const result = existingReview
                ? await updateReview(existingReview.id, fd)
                : await addReview(fd);
              setMessage(
                result.success ? result.data.message : result.error,
              );
            });
          }}
        >
          <div className="space-y-2">
            <Label>التقييم</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={cn(
                    "text-2xl transition-colors",
                    star <= rating ? "text-amber-400" : "text-border",
                  )}
                  aria-label={`${star} نجوم`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-comment">تعليق (اختياري)</Label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
              placeholder="شاركنا تجربتك مع الدورة..."
            />
          </div>
          {message && (
            <p
              className={cn(
                "text-sm",
                message.includes("تم") ? "text-green-600" : "text-red-500",
              )}
            >
              {message}
            </p>
          )}
          <Button type="submit" loading={pending} size="sm">
            {existingReview ? "تحديث التقييم" : "إرسال التقييم"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
