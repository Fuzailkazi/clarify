import type { AnalysisBatch } from "@/prompts/analyze";
import type { FeeExplanation, Pulse } from "@/prompts/generate";

export function mockThemeAnalysis(): AnalysisBatch {
  return {
    feeConfusion: {
      detected: true,
      feeName: "Exit load",
      explanation:
        "Customers repeatedly report unexpected deductions on redemption, which matches the scheme's exit load.",
    },
    themes: [
      {
        name: "Exit load confusion",
        count: 11,
        summary: "Customers are surprised by deductions at redemption and could not find the policy beforehand.",
        quotes: [
          "Exit load was deducted unexpectedly when I redeemed my mutual fund.",
          "I don't understand why money was cut during redemption. Support couldn't explain it.",
          "The fine print hides the exit load. I thought my money would come in full.",
        ],
      },
      {
        name: "Fee transparency in app",
        count: 4,
        summary: "Users want expected charges shown before confirming a redemption.",
        quotes: [
          "App should show expected charges before I redeem. It only appears later.",
          "Redeem shows gross amount but net amount gets cut. Confusing UX.",
          "Where can I find the exit load policy in the app?",
        ],
      },
      {
        name: "Bugs after update",
        count: 3,
        summary: "Recent update introduced crashes, wrong dates, and duplicate notifications.",
        quotes: [
          "Recent update broke the transaction history tab.",
          "Transaction list shows wrong dates after the update.",
          "Notifications are duplicated every time I get a mutual fund statement.",
        ],
      },
    ],
  };
}

export function mockPulse(): Pulse {
  return {
    summary:
      "Exit load confusion dominates this week's reviews: customers are surprised by redemption deductions and frustrated that charges are not shown before confirming. App performance issues (crashes, slow login) and duplicate notifications also surface as lower-frequency but consistent complaints.",
    observation:
      "Fee awareness is a communication problem, not just a pricing one — no warning exists in the redemption flow and support lacks a standard explanation, so the same confusion recurs weekly.",
    actions: [
      "Show expected exit load and net proceeds before the user confirms redemption.",
      "Add a plain-language exit load explainer in the mutual fund help center.",
      "Give support agents a copy-ready fees explanation to use consistently.",
    ],
  };
}

export function mockFeeExplanation(): FeeExplanation {
  return {
    feeName: "Exit load",
    explanation:
      "An exit load is a fee charged by a mutual fund scheme when you redeem (sell) your units within a specified period. It is set by the fund, disclosed in the scheme's offer document, and not a platform fee. The amount you receive is the redemption value minus any applicable exit load and taxes.",
    officialSources: [
      {
        title: "SEBI — Mutual funds and fees",
        url: "https://www.sebi.gov.in/",
      },
      {
        title: "AMFI — Understanding exit load",
        url: "https://www.amfiindia.com/",
      },
    ],
  };
}
