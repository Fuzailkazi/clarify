import type { AnalysisBatch } from "@/prompts/analyze";

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
