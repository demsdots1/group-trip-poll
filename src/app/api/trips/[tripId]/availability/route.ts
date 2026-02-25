// src/app/api/trips/[tripId]/availability/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { tripId: string };

type AvailabilityInput = {
  participant_id: string;
  responses: {
    trip_date_id: string;
    status: 0 | 1 | 2;
  }[];
};

async function handleSave(req: Request, context: { params: Promise<Params> }) {
  try {
    const { tripId } = await context.params;
    const body = (await req.json()) as AvailabilityInput;

    if (!tripId) {
      return NextResponse.json({ error: "tripId is required" }, { status: 400 });
    }

    if (!body?.participant_id) {
      return NextResponse.json(
        { error: "participant_id is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.responses) || body.responses.length === 0) {
      return NextResponse.json(
        { error: "responses array is required" },
        { status: 400 }
      );
    }

    for (const r of body.responses) {
      if (!r.trip_date_id) {
        return NextResponse.json(
          { error: "trip_date_id is required for each response" },
          { status: 400 }
        );
      }
      if (![0, 1, 2].includes(r.status)) {
        return NextResponse.json(
          { error: "Invalid status value (must be 0, 1, or 2)" },
          { status: 400 }
        );
      }
    }

    // Ensure participant belongs to this trip
    const { data: participant, error: pErr } = await supabase
      .from("participants")
      .select("id, trip_id")
      .eq("id", body.participant_id)
      .single();

    if (pErr || !participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    if (participant.trip_id !== tripId) {
      return NextResponse.json(
        { error: "Participant does not belong to this trip" },
        { status: 400 }
      );
    }

    const rows = body.responses.map((r) => ({
      trip_id: tripId,
      participant_id: body.participant_id,
      trip_date_id: r.trip_date_id,
      status: r.status,
    }));

    const { error } = await supabase.from("availability").upsert(rows, {
      onConflict: "participant_id,trip_date_id",
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to save availability", details: error.message },
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

export async function PUT(req: Request, context: { params: Promise<Params> }) {
  return handleSave(req, context);
}

// Alias POST -> same behavior (avoids confusion)
export async function POST(req: Request, context: { params: Promise<Params> }) {
  return handleSave(req, context);
}