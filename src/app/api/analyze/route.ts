import { NextResponse } from "next/server";
import { analyzeWallet } from "@/lib/polymarket/analyze";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const addresses: { address: string; pnl: number; volume: number }[] =
      body.addresses ?? [];

    if (!Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json(
        { error: "addresses array is required" },
        { status: 400 }
      );
    }

    if (addresses.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 addresses per request" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      addresses.map(async ({ address, pnl, volume }) => {
        try {
          return await analyzeWallet(address, pnl ?? 0, volume ?? 0);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Analyze failed";
          return {
            address,
            error: message,
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to analyze wallets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
