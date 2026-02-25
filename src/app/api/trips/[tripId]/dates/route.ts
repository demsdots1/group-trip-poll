// src/app/api/trips/[tripId]/dates/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sha256Hex } from "@/lib/tokens";

type Params = { tripId: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(
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

    // Auth
    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 401 });
    }

    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("host_edit_token_hash")
      .eq("id", tripId)
      .single();

    if (tripErr || !trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (sha256Hex(token) !== trip.host_edit_token_hash) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Validate date_start
    const dateStart = body.date_start as string | undefined;
    if (!dateStart || !DATE_RE.test(dateStart)) {
      return NextResponse.json(
        { error: "date_start is required and must be YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const label = body.label !== undefined ? body.label : null;

    const { data, error } = await supabase
      .from("trip_dates")
      .insert({ trip_id: tripId, date_start: dateStart, label })
      .select("id, trip_id, date_start, label")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to add date", details: error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Invalid request", details: e?.message || String(e) },
      { status: 400 }
    );
  }
}
