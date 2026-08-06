export type CsvRow = {
  text: string;
  rating: number | null;
};

export function parseCsv(content: string): CsvRow[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    row.push(field.trim());
    field = "";
  };

  const pushRow = () => {
    pushField();
    if (row.some((cell) => cell.length > 0)) rows.push(row);
    row = [];
  };

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && content[i + 1] === "\n") i++;
      pushRow();
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) pushRow();

  const [header, ...body] = rows;
  if (!header) return [];

  const textIdx = header.indexOf("text");
  const ratingIdx = header.indexOf("rating");

  return body
    .map((cells) => ({
      text: textIdx >= 0 ? cells[textIdx] ?? "" : cells[0] ?? "",
      rating:
        ratingIdx >= 0 && cells[ratingIdx] !== undefined && cells[ratingIdx] !== ""
          ? Number(cells[ratingIdx])
          : null,
    }))
    .filter((r) => r.text.length > 0 && (r.rating === null || !Number.isNaN(r.rating)))
    .map((r) => ({
      text: r.text,
      rating: r.rating === null ? null : Math.min(Math.max(Math.round(r.rating), 1), 5),
    }));
}
