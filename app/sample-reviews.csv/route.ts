import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

export function GET() {
  const csv = readFileSync(join(process.cwd(), "data", "sample-reviews.csv"), "utf-8");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8" },
  });
}