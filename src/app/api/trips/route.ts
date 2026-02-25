// src/app/api/trips/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateEditToken, sha256Hex } from "@/lib/tokens";

type CreateTripBody = {
  title: string;
  timezone: string;
  dates: Array<{ date_start: string; label?: string | null }>; // date_start: YYYY-MM-DD
};

function isISODateOnly(s: string) {
  // Basic YYYY-MM-DD check
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CreateTripBody>;

    const title = (body.title || "").trim();
    const timezone = (body.timezone || "").trim();
    const dates = Array.isArray(body.dates) ? body.dates : [];

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "Timezone is required" }, { status: 400 });
    }
    if (dates.length === 0) {
      return NextResponse.json({ error: "At least one date is required" }, { status: 400 });
    }

    // validate dates
    for (const d of dates) {
      if (!d?.date_start || !isISODateOnly(d.date_start)) {
        return NextResponse.json(
          { error: "Each date_start must be in YYYY-MM-DD format" },
          { status: 400 }
        );
      }
    }

    // token + hash
    const editToken = generateEditToken(32);
    const tokenHash = sha256Hex(editToken);

    // 1) create trip
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .insert({
        title,
        timezone,
        host_edit_token_hash: tokenHash,
      })
      .select("id")
      .single();

    if (tripErr || !trip) {
      return NextResponse.json(
        { error: "Failed to create trip", details: tripErr?.message },
        { status: 500 }
      );
    }

    const tripId = trip.id as string;

    // 2) insert dates
    const rows = dates.map((d) => ({
      trip_id: tripId,
      date_start: d.date_start,
      label: (d.label ?? null) ? String(d.label).trim() : null,
    }));

    const { error: datesErr } = await supabase.from("trip_dates").insert(rows);
    if (datesErr) {
      // Best-effort cleanup
      await supabase.from("trips").delete().eq("id", tripId);
      return NextResponse.json(
        { error: "Failed to create trip dates", details: datesErr.message },
        { status: 500 }
      );
    }

    const origin = req.headers.get("origin") || "";
    const guestUrl = origin ? `${origin}/t/${tripId}` : `/t/${tripId}`;
    const hostEditUrl = origin
      ? `${origin}/t/${tripId}/edit?token=${editToken}`
      : `/t/${tripId}/edit?token=${editToken}`;

    return NextResponse.json(
      {
        tripId,
        guestUrl,
        hostEditUrl,
      },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "Invalid request", details: e?.message || String(e) },
      { status: 400 }
    );
  }
}