"use client";

import { useState } from "react";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    setLoading(true);

    await fetch("/api/ingest", {
      method: "POST",
      body: formData,
    });

    setUploadedDocs(files.map((f) => f.name));
    setFiles([]);
    setLoading(false);
  };

  const askQuestion = async () => {
    if (!question) return;

    setLoading(true);

    const res = await fetch("/api/query", {
      method: "POST",
      body: JSON.stringify({ question }),
    });

    const data = await res.json();
    setAnswer(data.answer);
    setLoading(false);
  };

  return (
    <main className="h-screen bg-gradient-to-br from-orange-50 to-white flex flex-col">

      {/* HEADER */}
      <div className="px-8 py-4 flex justify-between items-center border-b border-orange-100">
        <h1 className="text-2xl font-bold text-slate-900">
          DocMind
        </h1>
        <p className="text-sm text-slate-500">
          AI-powered knowledge retrieval
        </p>
      </div>

      {/* MAIN SPLIT */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL (UPLOAD / KNOWLEDGE) */}
        <div className="w-1/3 border-r border-orange-100 p-6 flex flex-col">

          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Knowledge Base
          </h2>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-orange-300 rounded-lg p-6 cursor-pointer hover:bg-orange-50 transition">

            <div className="text-sm font-medium text-slate-700">
              Upload documents
            </div>

            <div className="text-xs text-slate-500 mt-1">
              PDF or TXT files
            </div>

            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) =>
                setFiles(Array.from(e.target.files || []))
              }
            />

          </label>

          {files.length > 0 && (
            <ul className="mt-4 text-sm text-slate-700 space-y-1">
              {files.map((file) => (
                <li key={file.name}>• {file.name}</li>
              ))}
            </ul>
          )}

          <button
            onClick={handleUpload}
            className="mt-4 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition"
          >
            {loading ? "Indexing..." : "Index Knowledge"}
          </button>

          {/* Indexed docs */}
          {uploadedDocs.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-800 mb-2">
                Indexed
              </p>
              <ul className="text-sm text-slate-600 space-y-1">
                {uploadedDocs.map((doc) => (
                  <li key={doc}>• {doc}</li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* RIGHT PANEL (Q&A) */}
        <div className="flex-1 flex flex-col p-6">

          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Ask Questions
          </h2>

          {/* ANSWER AREA */}
          <div className="flex-1 bg-white border border-slate-200 rounded-lg p-4 overflow-y-auto">

            {!answer ? (
              <p className="text-slate-400 text-sm">
                Ask a question to see results...
              </p>
            ) : (
              <p className="text-slate-800 leading-relaxed">
                {answer}
              </p>
            )}

          </div>

          {/* INPUT */}
          <div className="mt-4 flex gap-3">

            <input
              className="flex-1 border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Ask something about your documents..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            <button
              onClick={askQuestion}
              className="bg-orange-500 text-white px-6 rounded-lg hover:bg-orange-600 transition"
            >
              Ask
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}