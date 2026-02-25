// src/app/t/[tripId]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

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

type TripPayload = {
  trip: Trip;
  dates: TripDate[];
  participants: unknown[];
  availability: unknown[];
};

export default function EditTripPage() {
  const params = useParams<{ tripId: string }>();
  const searchParams = useSearchParams();
  const tripId = params?.tripId;
  const token = searchParams.get("token");

  const [data, setData] = useState<TripPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Rename state
  const [title, setTitle] = useState("");

  // Add-date state
  const [newDate, setNewDate] = useState("");
  const [newLabel, setNewLabel] = useState("");

  async function loadTrip() {
    if (!tripId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/trips/${tripId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load trip (HTTP ${res.status})`);
      const payload = (await res.json()) as TripPayload;
      setData(payload);
      setTitle(payload.trip.title);
    } catch (e: any) {
      setError(e?.message || "Something went wrong loading the trip.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function renameTrip() {
    if (!tripId || !token) return;
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title cannot be empty.");
      return;
    }
    setError(null);
    setBusy(true);

    try {
      const res = await fetch(`/api/trips/${tripId}/host`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, title: trimmed }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || `Failed (HTTP ${res.status})`);
      await loadTrip();
    } catch (e: any) {
      setError(e?.message || "Failed to rename trip.");
    } finally {
      setBusy(false);
    }
  }

  async function addDate() {
    if (!tripId || !token) return;
    if (!newDate) {
      setError("Date is required (YYYY-MM-DD).");
      return;
    }
    setError(null);
    setBusy(true);

    try {
      const body: Record<string, string> = {
        token,
        date_start: newDate,
      };
      if (newLabel.trim()) body.label = newLabel.trim();

      const res = await fetch(`/api/trips/${tripId}/dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || `Failed (HTTP ${res.status})`);
      setNewDate("");
      setNewLabel("");
      await loadTrip();
    } catch (e: any) {
      setError(e?.message || "Failed to add date.");
    } finally {
      setBusy(false);
    }
  }

  async function removeDate(tripDateId: string) {
    if (!tripId || !token) return;
    setError(null);
    setBusy(true);

    try {
      const res = await fetch(
        `/api/trips/${tripId}/dates/${tripDateId}?token=${encodeURIComponent(token)}`,
        { method: "DELETE" }
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || `Failed (HTTP ${res.status})`);
      await loadTrip();
    } catch (e: any) {
      setError(e?.message || "Failed to remove date.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
        <p style={{ color: "#b91c1c" }}>
          Missing token. Use the host edit link to access this page.
        </p>
      </main>
    );
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

      {error && (
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
            Edit: {data.trip.title}
          </h1>

          {/* Rename trip */}
          <section
            style={{
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 10,
              marginBottom: 18,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>
              Rename trip
            </h2>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                style={{
                  flex: 1,
                  padding: 10,
                  border: "1px solid #ccc",
                  borderRadius: 8,
                }}
              />
              <button
                onClick={renameTrip}
                disabled={busy}
                style={{
                  padding: "10px 12px",
                  border: "1px solid #333",
                  borderRadius: 8,
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </section>

          {/* Dates */}
          <section
            style={{
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 10,
              marginBottom: 18,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>
              Dates
            </h2>

            {data.dates.length === 0 && (
              <p style={{ opacity: 0.7, marginBottom: 10 }}>No dates yet.</p>
            )}

            <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
              {data.dates.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 10,
                    border: "1px solid #eee",
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{d.date_start}</span>
                    {d.label && (
                      <span style={{ opacity: 0.7, marginLeft: 8 }}>
                        {d.label}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeDate(d.id)}
                    disabled={busy}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #f2b8b5",
                      borderRadius: 8,
                      color: "#b91c1c",
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Add date
            </h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                style={{
                  padding: 10,
                  border: "1px solid #ccc",
                  borderRadius: 8,
                }}
              />
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (optional)"
                maxLength={60}
                style={{
                  padding: 10,
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  flex: 1,
                }}
              />
              <button
                onClick={addDate}
                disabled={busy}
                style={{
                  padding: "10px 12px",
                  border: "1px solid #333",
                  borderRadius: 8,
                  opacity: busy ? 0.6 : 1,
                }}
              >
                Add
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
