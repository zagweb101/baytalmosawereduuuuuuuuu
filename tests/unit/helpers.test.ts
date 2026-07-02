import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCoursesPageUrl } from "@/lib/url";
import { sanitizeUploadFolder, validateUploadFile } from "@/lib/upload-policy";
import { slugify } from "@/lib/utils";

test("buildCoursesPageUrl preserves filters", () => {
  const url = buildCoursesPageUrl(2, {
    search: "photo",
    category: "cat1",
    level: "BEGINNER",
    price: "free",
  });
  assert.equal(
    url,
    "/courses?search=photo&category=cat1&level=BEGINNER&price=free&page=2",
  );
});

test("sanitizeUploadFolder blocks traversal", () => {
  assert.equal(sanitizeUploadFolder("../secrets"), "secrets");
  assert.equal(sanitizeUploadFolder(""), "uploads");
});

test("validateUploadFile rejects unknown mime", () => {
  const file = new File(["x"], "a.exe", { type: "application/x-msdownload" });
  const result = validateUploadFile(file);
  assert.equal(result.ok, false);
});

test("slugify keeps Arabic letters", () => {
  assert.match(slugify("أساسيات التصوير"), /[\p{L}]/u);
});
