import {
  AUCTION_TOPICS,
  AuctionItem,
  CAREER_PATHS,
  CareerPathItem,
  PASSWORD_WORDS,
  PasswordItem,
  SPEED_PROMPTS,
  SpeedPromptItem,
} from "./sabaho-data";

export type SabahoChallengeType = "AUCTION" | "CAREER_PATH" | "SPEED" | "PASSWORD";

export type ActiveSabahoQuestion = {
  type: SabahoChallengeType;
  roundNumber: number;
  auction?: AuctionItem;
  career?: CareerPathItem;
  speed?: SpeedPromptItem;
  passwordList?: PasswordItem[];
  currentPasswordIndex?: number;
};

export function pickChallengeForRound(
  mode: "MIXED" | "AUCTION" | "CAREER_PATH" | "SPEED" | "PASSWORD",
  roundNumber: number,
  usedIds: string[] = [],
): ActiveSabahoQuestion {
  let targetType: SabahoChallengeType;

  if (mode === "AUCTION") {
    targetType = "AUCTION";
  } else if (mode === "CAREER_PATH") {
    targetType = "CAREER_PATH";
  } else if (mode === "SPEED") {
    targetType = "SPEED";
  } else if (mode === "PASSWORD") {
    targetType = "PASSWORD";
  } else {
    // Mixed mode cycle: Auction -> Career -> Password -> Speed
    const cycle: SabahoChallengeType[] = ["AUCTION", "CAREER_PATH", "PASSWORD", "SPEED"];
    targetType = cycle[(roundNumber - 1) % cycle.length];
  }

  if (targetType === "AUCTION") {
    const available = AUCTION_TOPICS.filter((a) => !usedIds.includes(a.id));
    const pool = available.length > 0 ? available : AUCTION_TOPICS;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return { type: "AUCTION", roundNumber, auction: item };
  } else if (targetType === "CAREER_PATH") {
    const available = CAREER_PATHS.filter((c) => !usedIds.includes(c.id));
    const pool = available.length > 0 ? available : CAREER_PATHS;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return { type: "CAREER_PATH", roundNumber, career: item };
  } else if (targetType === "SPEED") {
    const available = SPEED_PROMPTS.filter((s) => !usedIds.includes(s.id));
    const pool = available.length > 0 ? available : SPEED_PROMPTS;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return { type: "SPEED", roundNumber, speed: item };
  } else {
    // Password round: pick a shuffled list of 10 words
    const shuffled = [...PASSWORD_WORDS].sort(() => Math.random() - 0.5);
    return {
      type: "PASSWORD",
      roundNumber,
      passwordList: shuffled.slice(0, 10),
      currentPasswordIndex: 0,
    };
  }
}

