import { NextResponse } from "next/server";
import {
  fetchWalletActivity,
  isValidAddress,
} from "@/lib/polymarket/walletActivity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get("user")?.trim();

    if (!user) {
      return NextResponse.json(
        { error: "user address is required" },
        { status: 400 }
      );
    }

    if (!isValidAddress(user)) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    const activity = await fetchWalletActivity(user);
    return NextResponse.json(activity);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch wallet activity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
