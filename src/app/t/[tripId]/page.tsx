// src/app/t/[tripId]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Trip = {
  id: string;
  title: string;
  timezone: string;
  is_archived: boolean;
  created_at: string;
};

type TripDate = {
  id: string;
  trip_id: string;
  date_start: string;
  label: string | null;
};

type Participant = {
  id: string;
  trip_id: string;
  display_name: string;
  created_at: string;
};

type Availability = {
  id: string;
  trip_id: string;
  participant_id: string;
  trip_date_id: string;
  status: 0 | 1 | 2;
};

type TripPayload = {
  trip: Trip;
  dates: TripDate[];
  participants: Participant[];
  availability: Availability[];
};

function storageKey(tripId: string) {
  return `gtp_participant_${tripId}`;
}

function statusLabel(s: number) {
  if (s === 2) return "Yes";
  if (s === 1) return "Maybe";
  return "No";
}

export default function TripPage() {
  const params = useParams<{ tripId: string }>();
  const tripId = params?.tripId;

  const [data, setData] = useState<TripPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);

  // map trip_date_id -> status
  const [responses, setResponses] = useState<Record<string, 0 | 1 | 2>>({});

  const dates = data?.dates ?? [];

  const canSave = useMemo(() => {
    if (!participantId) return false;
    if (!data) return false;
    if (dates.length === 0) return false;
    return true;
  }, [participantId, data, dates.length]);

  const results = useMemo(() => {
    if (!data || dates.length === 0) return null;

    const summaries = dates.map((d) => {
      let yes = 0;
      let maybe = 0;
      let no = 0;
      for (const row of data.availability) {
        if (row.trip_date_id === d.id) {
          if (row.status === 2) yes++;
          else if (row.status === 1) maybe++;
          else no++;
        }
      }
      const score = yes * 2 + maybe * 1;
      return { date: d, yes, maybe, no, score };
    });

    const maxScore = Math.max(...summaries.map((s) => s.score));

    return { summaries, maxScore };
  }, [data, dates]);

  async function loadTrip() {
    if (!tripId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/trips/${tripId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load trip (HTTP ${res.status})`);
      const payload = (await res.json()) as TripPayload;
      setData(payload);

      // If we have a saved participant, prefill from availability
      const saved = localStorage.getItem(storageKey(tripId));
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.participantId) setParticipantId(parsed.participantId);
          if (parsed?.name) setName(parsed.name);
        } catch {
          // ignore
        }
      }

      // prefill responses from availability (once participantId is known)
      // We'll do this in a separate effect below too.
    } catch (e: any) {
      setError(e?.message || "Something went wrong loading the trip.");
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    loadTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  // Whenever data or participantId changes, prefill statuses from availability
  useEffect(() => {
    if (!data || !participantId) return;

    const next: Record<string, 0 | 1 | 2> = {};
    for (const d of data.dates) next[d.id] = 0;

    for (const row of data.availability) {
      if (row.participant_id === participantId) {
        next[row.trip_date_id] = row.status;
      }
    }

    setResponses(next);
  }, [data, participantId]);

  async function createParticipant() {
    if (!tripId) return;
    setError(null);

    const clean = name.trim();
    if (!clean) {
      setError("Please enter your name.");
      return;
    }

    try {
      const res = await fetch(`/api/trips/${tripId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: clean }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || `Failed (HTTP ${res.status})`);

      const newId = payload.id as string;
      setParticipantId(newId);

      localStorage.setItem(
        storageKey(tripId),
        JSON.stringify({ participantId: newId, name: clean })
      );

      // Reload to get participant/availability context updated
      await loadTrip();
    } catch (e: any) {
      setError(e?.message || "Failed to create participant.");
    }
  }

  function setStatus(tripDateId: string, status: 0 | 1 | 2) {
    setResponses((prev) => ({ ...prev, [tripDateId]: status }));
  }

  async function saveAvailability() {
    if (!tripId || !participantId) return;
    setError(null);
    setSaving(true);

    try {
      const responsesArr = dates.map((d) => ({
        trip_date_id: d.id,
        status: responses[d.id] ?? 0,
      }));

      const res = await fetch(`/api/trips/${tripId}/availability`, {
        method: "POST", // works (alias) and avoids PUT confusion
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          responses: responsesArr,
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || `Failed (HTTP ${res.status})`);

      await loadTrip();
    } catch (e: any) {
      setError(e?.message || "Failed to save availability.");
    } finally {
      setSaving(false);
    }
  }

  if (!tripId) {
    return (
      <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
        <p>Missing tripId.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      {loading && <p>Loading…</p>}

      {!loading && error && (
        <div
          style={{
            padding: 12,
            border: "1px solid #f2b8b5",
            background: "#fff5f5",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            {data.trip.title}
          </h1>

          <p style={{ opacity: 0.7, marginBottom: 20 }}>
            Timezone: {data.trip.timezone}
          </p>

          {/* Identity */}
          <section
            style={{
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 10,
              marginBottom: 18,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>
              Your name
            </h2>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Umer"
                maxLength={60}
                style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
                disabled={!!participantId}
              />
              {!participantId ? (
                <button
                  onClick={createParticipant}
                  style={{ padding: "10px 12px", border: "1px solid #333", borderRadius: 8 }}
                >
                  Continue
                </button>
              ) : (
                <span style={{ fontSize: 12, opacity: 0.7 }}>Saved</span>
              )}
            </div>

            {participantId && (
              <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                You’re responding as <strong>{name || "Guest"}</strong>
              </p>
            )}
          </section>

          {/* Dates */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
              Availability
            </h2>

            <div style={{ display: "grid", gap: 10 }}>
              {dates.map((d) => {
                const current = responses[d.id] ?? 0;
                return (
                  <div
                    key={d.id}
                    style={{
                      padding: 12,
                      border: "1px solid #ddd",
                      borderRadius: 10,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{d.date_start}</div>
                        {d.label && <div style={{ opacity: 0.7 }}>{d.label}</div>}
                      </div>
                      <div style={{ opacity: 0.7 }}>{statusLabel(current)}</div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setStatus(d.id, 0)}
                        disabled={!participantId}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid #ccc",
                          opacity: !participantId ? 0.5 : 1,
                          fontWeight: current === 0 ? 700 : 400,
                        }}
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(d.id, 1)}
                        disabled={!participantId}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid #ccc",
                          opacity: !participantId ? 0.5 : 1,
                          fontWeight: current === 1 ? 700 : 400,
                        }}
                      >
                        Maybe
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(d.id, 2)}
                        disabled={!participantId}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid #ccc",
                          opacity: !participantId ? 0.5 : 1,
                          fontWeight: current === 2 ? 700 : 400,
                        }}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button
                onClick={saveAvailability}
                disabled={!canSave || saving}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #333",
                  fontWeight: 600,
                  opacity: !canSave || saving ? 0.6 : 1,
                }}
              >
                {saving ? "Saving…" : "Save availability"}
              </button>

              <button
                onClick={loadTrip}
                disabled={loading}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #ccc",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Refresh
              </button>
            </div>
          </section>

          {/* Results */}
          {results && data.availability.length > 0 && (
            <section style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                Results
              </h2>

              <div style={{ display: "grid", gap: 10 }}>
                {results.summaries.map((s) => {
                  const isBest =
                    results.maxScore > 0 && s.score === results.maxScore;
                  return (
                    <div
                      key={s.date.id}
                      style={{
                        padding: 12,
                        border: isBest
                          ? "2px solid #16a34a"
                          : "1px solid #ddd",
                        background: isBest ? "#f0fdf4" : "transparent",
                        borderRadius: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600 }}>
                            {s.date.date_start}
                          </span>
                          {s.date.label && (
                            <span style={{ opacity: 0.7, marginLeft: 8 }}>
                              {s.date.label}
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          Score: {s.score}
                          {isBest && (
                            <span style={{ color: "#16a34a", marginLeft: 6 }}>
                              Best
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: 14, opacity: 0.8 }}>
                        Yes: {s.yes} &middot; Maybe: {s.maybe} &middot; No:{" "}
                        {s.no}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}