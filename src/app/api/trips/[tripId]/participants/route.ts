// src/app/api/trips/[tripId]/participants/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { tripId: string };

export async function POST(
  req: Request,
  context: { params: Promise<Params> }
) {
  try {
    const { tripId } = await context.params;
    const body = await req.json();

    const name = (body.display_name || "").trim();

    if (!tripId) {
      return NextResponse.json({ error: "tripId is required" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("participants")
      .insert({
        trip_id: tripId,
        display_name: name,
      })
      .select("id, display_name")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to create participant", details: error?.message },
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