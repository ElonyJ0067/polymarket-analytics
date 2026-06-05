import { NextResponse } from "next/server";
import {
  analyzeWalletPositions,
  WalletInput,
} from "@/lib/openai/analyzePositions";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const wallets: WalletInput[] = body.wallets ?? [];
    const rankRange = body.rankRange ?? { min: null, max: null };

    if (!Array.isArray(wallets) || wallets.length === 0) {
      return NextResponse.json(
        { error: "wallets array is required" },
        { status: 400 }
      );
    }

    if (wallets.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 wallets per AI analysis" },
        { status: 400 }
      );
    }

    const result = await analyzeWalletPositions(wallets, rankRange);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run AI analysis";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
