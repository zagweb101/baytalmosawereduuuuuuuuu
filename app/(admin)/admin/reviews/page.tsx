"use client";

import { useTransition, useEffect, useState } from "react";
import { getAllReviews, hideReview } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type Review = Awaited<ReturnType<typeof getAllReviews>>[number];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getAllReviews().then(setReviews);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">التقييمات</h1>
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted">
            لا توجد تقييمات
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.user.name}</span>
                    <span className="text-amber-500">{"★".repeat(review.rating)}</span>
                  </div>
                  <p className="text-sm text-muted">{review.course.title}</p>
                  {review.comment && (
                    <p className="text-sm mt-1">{review.comment}</p>
                  )}
                  <p className="text-xs text-muted mt-1">{formatDate(review.createdAt)}</p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  loading={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await hideReview(review.id);
                      setReviews(await getAllReviews());
                    })
                  }
                >
                  إخفاء
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
