import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  const identity = req.nextUrl.searchParams.get("identity") || "user-" + Math.random().toString(36).slice(2, 7);

  if (!room) {
    return NextResponse.json({ error: 'Missing room parameter' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: identity,
  });

  at.addGrant({
    roomJoin: true,
    room: room,
  });

  return NextResponse.json({ token: await at.toJwt() });
}
