// src/app/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DateRow = { date_start: string; label?: string };

export default function HomePage() {
  const router = useRouter();

  const defaultTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const [title, setTitle] = useState("");
  const [timezone, setTimezone] = useState(defaultTz);
  const [dates, setDates] = useState<DateRow[]>([{ date_start: "" }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDate(idx: number, patch: Partial<DateRow>) {
    setDates((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  function addDate() {
    setDates((prev) => [...prev, { date_start: "" }]);
  }

  function removeDate(idx: number) {
    setDates((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    const cleanTz = timezone.trim();
    const cleanDates = dates
      .map((d) => ({
        date_start: (d.date_start || "").trim(),
        label: (d.label || "").trim() || undefined,
      }))
      .filter((d) => d.date_start);

    if (!cleanTitle) return setError("Title is required.");
    if (!cleanTz) return setError("Timezone is required.");
    if (cleanDates.length === 0) return setError("Add at least one date.");

    setLoading(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          timezone: cleanTz,
          dates: cleanDates,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          data?.error ||
          `Failed to create trip (HTTP ${res.status})`;
        throw new Error(msg);
      }

      if (!data?.guestUrl) throw new Error("Missing guestUrl in response.");

      router.push(data.guestUrl);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Create a Trip Poll
      </h1>
      <p style={{ marginBottom: 24, opacity: 0.8 }}>
        Share a link, collect availability, pick the best date.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Trip title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Montreal Trip"
            maxLength={120}
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Timezone</span>
          <input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="e.g., America/Toronto"
            maxLength={80}
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <small style={{ opacity: 0.7 }}>
            Default detected: {defaultTz}
          </small>
        </label>

        <section style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Candidate dates</h2>
            <button
              type="button"
              onClick={addDate}
              style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8 }}
            >
              + Add date
            </button>
          </div>

          {dates.map((row, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr auto",
                gap: 10,
                alignItems: "end",
              }}
            >
              <label style={{ display: "grid", gap: 6 }}>
                <span>Date</span>
                <input
                  type="date"
                  value={row.date_start}
                  onChange={(e) => updateDate(idx, { date_start: e.target.value })}
                  style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span>Label (optional)</span>
                <input
                  value={row.label || ""}
                  onChange={(e) => updateDate(idx, { label: e.target.value })}
                  placeholder="e.g., Option B"
                  maxLength={60}
                  style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
                />
              </label>

              <button
                type="button"
                onClick={() => removeDate(idx)}
                disabled={dates.length <= 1}
                style={{
                  padding: "10px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  opacity: dates.length <= 1 ? 0.4 : 1,
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </section>

        {error && (
          <div
            style={{
              padding: 12,
              border: "1px solid #f2b8b5",
              background: "#fff5f5",
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #333",
            fontWeight: 600,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Creating..." : "Create trip"}
        </button>
      </form>
    </main>
  );
}