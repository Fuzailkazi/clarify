export type ThemeGroup = {
  name: string;
  keywords: string[];
};

export type AnalyzedTheme = {
  name: string;
  count: number;
  rank: number;
  sampleQuotes: string[];
};

export type AnalysisResult = {
  themes: AnalyzedTheme[];
  assignedCount: number;
};

const THEME_GROUPS: ThemeGroup[] = [
  {
    name: "Fees & Charges",
    keywords: [
      "exit load",
      "fee",
      "charge",
      "charges",
      "deduct",
      "deducted",
      "deduction",
      "cut",
      "money was cut",
      "hidden",
      "fine print",
      "net amount",
      "gross amount",
      "amount credited",
      "scam",
      "unexpected",
    ],
  },
  {
    name: "Bugs & Crashes",
    keywords: [
      "crash",
      "crashes",
      "bug",
      "broken",
      "stuck",
      "freeze",
      "wrong date",
      "wrong dates",
      "error",
      "failed",
      "delayed",
      "delay",
    ],
  },
  {
    name: "UX & Transparency",
    keywords: [
      "confus",
      "unclear",
      "not clear",
      "understand",
      "transparent",
      "transparency",
      "nowhere",
      "where can i",
      "explain",
      "hard to",
      "difficult",
      "frustrat",
      "warn",
      "warning",
      "mention",
    ],
  },
  {
    name: "Support Experience",
    keywords: [
      "support",
      "agent",
      "responsive",
      "help",
      "call",
      "standard answer",
      "answer",
    ],
  },
  {
    name: "Account & Login",
    keywords: [
      "login",
      "log in",
      "logout",
      "log out",
      "session",
      "signed",
      "sign in",
    ],
  },
  {
    name: "Feature Requests",
    keywords: ["please add", "add support", "wish", "need", "feature", "better way"],
  },
  {
    name: "Notifications & Statements",
    keywords: ["notification", "duplicate", "statement", "dark mode", "update broke"],
  },
  {
    name: "Portfolio & NAV",
    keywords: ["nav", "portfolio", "sip", "redemption", "redeem", "redeemed", "units", "withdrawal"],
  },
];

const MAX_THEMES = 5;
const MAX_QUOTES = 3;

function score(reviewText: string, group: ThemeGroup): number {
  const text = reviewText.toLowerCase();
  let hits = 0;
  for (const kw of group.keywords) {
    if (text.includes(kw)) hits++;
  }
  return hits;
}

export function clusterReviews(
  reviews: { id: string; text: string; rating: number | null }[]
): AnalysisResult {
  const assignments = new Map<string, { group: ThemeGroup; hits: number }>();
  let assignedCount = 0;

  for (const review of reviews) {
    let best: { group: ThemeGroup; hits: number } | null = null;
    for (const group of THEME_GROUPS) {
      const hits = score(review.text, group);
      if (hits > 0 && (best === null || hits > best.hits)) {
        best = { group, hits };
      }
    }
    if (best) {
      assignments.set(review.id, best);
      assignedCount++;
    }
  }

  const buckets = new Map<string, { group: ThemeGroup; reviews: typeof reviews }>();
  for (const review of reviews) {
    const assignment = assignments.get(review.id);
    if (!assignment) continue;
    const bucket = buckets.get(assignment.group.name) ?? {
      group: assignment.group,
      reviews: [],
    };
    bucket.reviews.push(review);
    buckets.set(assignment.group.name, bucket);
  }

  const themes: AnalyzedTheme[] = [...buckets.values()]
    .sort((a, b) => b.reviews.length - a.reviews.length)
    .slice(0, MAX_THEMES)
    .map((bucket, i) => {
      const sorted = [...bucket.reviews].sort(
        (a, b) =>
          score(b.text, bucket.group) - score(a.text, bucket.group) ||
          (a.rating ?? 5) - (b.rating ?? 5)
      );
      return {
        name: bucket.group.name,
        count: bucket.reviews.length,
        rank: i + 1,
        sampleQuotes: sorted.slice(0, MAX_QUOTES).map((r) => r.text),
      };
    });

  return { themes, assignedCount };
}
