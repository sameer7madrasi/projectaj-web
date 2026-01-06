// lib/segmentDiaryText.ts
// Utility for segmenting diary text into multiple date-based segments

export type Segment = {
  segment_index: number;
  segment_date: string | null; // ISO YYYY-MM-DD
  text: string;
};

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Try to parse a date from a single line of text.
 * Supports:
 * - "January 1, 2024" / "Jan 1 2024" / "Jan 1"
 * - "1/1/2024" / "01-01-24"
 */
export function parseDateFromLine(
  line: string,
  defaultYear?: number
): string | null {
  const s = line.trim().replace(/\s+/g, " ");
  if (!s) return null;

  // Numeric date: 1/1/2024 or 01-01-24
  {
    const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})$/);
    if (m) {
      const month = parseInt(m[1], 10);
      const day = parseInt(m[2], 10);
      let year = parseInt(m[3], 10);
      if (year < 100) year = 2000 + year;
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return toIsoDate(year, month, day);
      }
    }
  }

  // Month name date: "January 1, 2024" or "Jan 1"
  {
    const m = s.match(
      /^([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?$/
    );
    if (m) {
      const monthName = m[1].toLowerCase();
      const day = parseInt(m[2], 10);
      const year = m[3]
        ? parseInt(m[3], 10)
        : defaultYear ?? new Date().getFullYear();
      const month = MONTHS[monthName];
      if (month && day >= 1 && day <= 31) {
        return toIsoDate(year, month, day);
      }
    }
  }

  return null;
}

/**
 * Split the OCR text into segments based on date headings.
 * Heuristic: whenever a line parses as a date, start a new segment.
 */
export function segmentDiaryText(
  ocrText: string,
  fallbackDate?: string | null
): Segment[] {
  const lines = (ocrText || "")
    .split(/\r?\n/)
    .map((l) => l.trimEnd());
  const segments: Segment[] = [];
  let currentLines: string[] = [];
  let currentDate: string | null = null;

  // Choose defaultYear from fallbackDate if available
  const defaultYear = (() => {
    if (!fallbackDate) return undefined;
    const m = fallbackDate.match(/^(\d{4})-/);
    return m ? parseInt(m[1], 10) : undefined;
  })();

  const flush = () => {
    const text = currentLines.join("\n").trim();
    if (!text) return;
    segments.push({
      segment_index: segments.length,
      segment_date: currentDate ?? fallbackDate ?? null,
      text,
    });
    currentLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentLines.push(""); // preserve paragraph breaks
      continue;
    }

    const parsed = parseDateFromLine(trimmed, defaultYear);
    if (parsed) {
      // Start new segment when a date header appears
      flush();
      currentDate = parsed;
      currentLines.push(trimmed); // keep header line in segment
    } else {
      currentLines.push(trimmed);
    }
  }

  flush();

  // If we somehow produced zero segments but have text, create one
  if (segments.length === 0 && ocrText.trim()) {
    return [
      {
        segment_index: 0,
        segment_date: fallbackDate ?? null,
        text: ocrText.trim(),
      },
    ];
  }

  return segments;
}

