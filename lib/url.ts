export function buildCoursesPageUrl(
  page: number,
  filters: {
    search?: string;
    category?: string;
    level?: string;
    price?: string;
  },
): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.level) params.set("level", filters.level);
  if (filters.price) params.set("price", filters.price);
  if (page > 1) params.set("page", String(page));

  const qs = params.toString();
  return qs ? `/courses?${qs}` : "/courses";
}
