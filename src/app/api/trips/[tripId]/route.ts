// src/app/api/trips/[tripId]/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { tripId: string };

export async function GET(
  _req: Request,
  context: { params: Promise<Params> }
) {
  try {
    const { tripId } = await context.params;

    if (!tripId) {
      return NextResponse.json({ error: "tripId is required" }, { status: 400 });
    }

    // 1) trip
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("id,title,timezone,is_archived,created_at")
      .eq("id", tripId)
      .single();

    if (tripErr || !trip) {
      const status = tripErr?.code === "PGRST116" ? 404 : 500; // PGRST116 = No rows
      return NextResponse.json(
        { error: "Trip not found", details: tripErr?.message },
        { status }
      );
    }

    // 2) dates
    const { data: dates, error: datesErr } = await supabase
      .from("trip_dates")
      .select("id,trip_id,date_start,label")
      .eq("trip_id", tripId)
      .order("date_start", { ascending: true });

    if (datesErr) {
      return NextResponse.json(
        { error: "Failed to load dates", details: datesErr.message },
        { status: 500 }
      );
    }

    // 3) participants
    const { data: participants, error: partErr } = await supabase
      .from("participants")
      .select("id,trip_id,display_name,created_at")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true });

    if (partErr) {
      return NextResponse.json(
        { error: "Failed to load participants", details: partErr.message },
        { status: 500 }
      );
    }

    // 4) availability
    const { data: availability, error: availErr } = await supabase
      .from("availability")
      .select("id,trip_id,participant_id,trip_date_id,status")
      .eq("trip_id", tripId);

    if (availErr) {
      return NextResponse.json(
        { error: "Failed to load availability", details: availErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        trip,
        dates: dates ?? [],
        participants: participants ?? [],
        availability: availability ?? [],
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "Invalid request", details: e?.message || String(e) },
      { status: 400 }
    );
  }
}