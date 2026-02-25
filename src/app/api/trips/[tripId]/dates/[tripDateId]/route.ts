// src/app/api/trips/[tripId]/dates/[tripDateId]/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sha256Hex } from "@/lib/tokens";

type Params = { tripId: string; tripDateId: string };

export async function DELETE(
  req: Request,
  context: { params: Promise<Params> }
) {
  try {
    const { tripId, tripDateId } = await context.params;

    if (!tripId) {
      return NextResponse.json({ error: "tripId is required" }, { status: 400 });
    }
    if (!tripDateId) {
      return NextResponse.json({ error: "tripDateId is required" }, { status: 400 });
    }

    // Token from query string (DELETE bodies are unreliable)
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

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

    // Verify the date belongs to this trip
    const { data: dateRow, error: dateErr } = await supabase
      .from("trip_dates")
      .select("id, trip_id")
      .eq("id", tripDateId)
      .single();

    if (dateErr || !dateRow) {
      return NextResponse.json({ error: "Date not found" }, { status: 404 });
    }

    if (dateRow.trip_id !== tripId) {
      return NextResponse.json(
        { error: "Date does not belong to this trip" },
        { status: 400 }
      );
    }

    const { error: delErr } = await supabase
      .from("trip_dates")
      .delete()
      .eq("id", tripDateId);

    if (delErr) {
      return NextResponse.json(
        { error: "Failed to delete date", details: delErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Invalid request", details: e?.message || String(e) },
      { status: 400 }
    );
  }
}
