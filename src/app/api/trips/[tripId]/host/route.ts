// src/app/api/trips/[tripId]/host/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sha256Hex } from "@/lib/tokens";

type Params = { tripId: string };

async function verifyHostToken(tripId: string, token: string | undefined) {
  if (!token) {
    return { error: "token is required", status: 401 };
  }

  const { data: trip, error } = await supabase
    .from("trips")
    .select("host_edit_token_hash")
    .eq("id", tripId)
    .single();

  if (error || !trip) {
    return { error: "Trip not found", status: 404 };
  }

  const hash = sha256Hex(token);
  if (hash !== trip.host_edit_token_hash) {
    return { error: "Invalid token", status: 401 };
  }

  return null;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<Params> }
) {
  try {
    const { tripId } = await context.params;
    const body = await req.json();
    const token = body.token as string | undefined;

    if (!tripId) {
      return NextResponse.json({ error: "tripId is required" }, { status: 400 });
    }

    const authErr = await verifyHostToken(tripId, token);
    if (authErr) {
      return NextResponse.json({ error: authErr.error }, { status: authErr.status });
    }

    const title = typeof body.title === "string" ? body.title.trim() : undefined;

    if (title === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("trips")
      .update({ title })
      .eq("id", tripId)
      .select("id, title")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to update trip", details: error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Invalid request", details: e?.message || String(e) },
      { status: 400 }
    );
  }
}
