"use client";
import { useState } from "react";

interface Result {
  url: string; title: string; description: string; canonical: string; h1s: string[];
  og: { title: string; description: string; image: string; type: string; url: string };
  twitter: { card: string; title: string; description: string; image: string };
  viewport: string; robots: string; charset: string;
  images: { total: number; missingAlt: number };
  checks: { label: string; pass: boolean; tip: string }[];
  score: number;
  error?: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const check = async () => {
    if (!url) return;
    setLoading(true); setError(""); setResult(null);
    try {
      let target = url;
      if (!target.startsWith("http")) target = "https://" + target;
      const res = await fetch(`/api/check?url=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (data.error) { setError(data.error); } else { setResult(data); }
    } catch { setError("Failed to check URL"); }
    setLoading(false);
  };

  const scoreColor = (s: number) => s >= 80 ? "text-green-400" : s >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">🔍 SEO Checker</h1>
      <p className="text-gray-400 mb-8">Analyze meta tags, OG data, and SEO for any URL</p>

      <div className="flex gap-2 mb-8">
        <input type="text" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && check()} className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" />
        <button onClick={check} disabled={loading} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-medium disabled:opacity-50">
          {loading ? "Checking..." : "Check"}
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6">{error}</div>}

      {result && (
        <>
          {/* Score */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6 text-center">
            <div className={`text-6xl font-bold ${scoreColor(result.score)}`}>{result.score}</div>
            <div className="text-gray-400">SEO Score</div>
          </div>

          {/* Checks */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
            <h2 className="font-semibold mb-4">Checklist</h2>
            <div className="space-y-2">
              {result.checks.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${c.pass ? "bg-green-500" : "bg-red-500"}`}>
                    {c.pass ? "✓" : "×"}
                  </span>
                  <span className="flex-1">{c.label}</span>
                  {!c.pass && <span className="text-sm text-gray-500">{c.tip}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm text-gray-400 mb-2">Basic Meta</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">Title:</span> {result.title || "-"}</div>
                <div><span className="text-gray-500">Description:</span> {result.description || "-"}</div>
                <div><span className="text-gray-500">Canonical:</span> {result.canonical || "-"}</div>
                <div><span className="text-gray-500">H1:</span> {result.h1s.join(", ") || "-"}</div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm text-gray-400 mb-2">Open Graph</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">Title:</span> {result.og.title || "-"}</div>
                <div><span className="text-gray-500">Description:</span> {result.og.description || "-"}</div>
                <div><span className="text-gray-500">Image:</span> {result.og.image ? "✅" : "❌"}</div>
                <div><span className="text-gray-500">Type:</span> {result.og.type || "-"}</div>
              </div>
            </div>
          </div>

          {/* OG Preview */}
          {result.og.image && (
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6">
              <h3 className="text-sm text-gray-400 mb-2">Social Preview</h3>
              <div className="bg-gray-800 rounded-lg overflow-hidden max-w-md">
                <img src={result.og.image} alt="OG" className="w-full" />
                <div className="p-3">
                  <div className="font-semibold text-sm">{result.og.title || result.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{result.og.description || result.description}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
