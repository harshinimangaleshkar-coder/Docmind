
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
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    setAnswer(data.answer);
    setLoading(false);
  };

  const suggestedQuestions = [
    "What is DocMind?",
    "What are the key features?",
    "What models are used?",
    "Who can use this product?",
    "What are the limitations?",
  ];

  return (
    <main className="h-screen bg-slate-50 flex flex-col">

      {/* HEADER */}
      <div className="px-8 py-4 flex justify-between items-center border-b bg-white">
        <h1 className="text-xl font-semibold text-slate-900">
          DocMind
        </h1>
        <span className="text-xs text-slate-400">
          AI Knowledge Assistant
        </span>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <div className="w-80 bg-white border-r p-5 flex flex-col">

          <h2 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wide">
            Knowledge Base
          </h2>

          {/* Upload */}
          <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:bg-slate-50 transition">
            <p className="text-sm font-medium text-slate-700">
              Upload documents
            </p>
            <p className="text-xs text-slate-400 mt-1">
              PDF or TXT files
            </p>

            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) =>
                setFiles(Array.from(e.target.files || []))
              }
            />
          </label>

          {/* Demo vs Custom Guidance */}
          <div className="mt-4 text-xs text-slate-500 leading-relaxed">
            <p className="mb-2">
              🚀 <span className="font-medium text-slate-700">Try demo:</span> Upload the demo file and use suggested questions below.
            </p>
            <p>
              📄 <span className="font-medium text-slate-700">Or upload your own:</span> Ask anything about your document.
            </p>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-slate-400 mb-2">Selected</p>
              <ul className="space-y-1 text-sm">
                {files.map((file) => (
                  <li key={file.name} className="truncate text-slate-700">
                    {file.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            className="mt-4 bg-slate-900 text-white py-2 rounded-lg text-sm hover:bg-slate-800 transition"
          >
            {loading ? "Indexing..." : "Index Documents"}
          </button>

          {/* Indexed Docs */}
          {uploadedDocs.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-slate-400 mb-2">Indexed</p>
              <ul className="space-y-1 text-sm">
                {uploadedDocs.map((doc) => (
                  <li key={doc} className="truncate text-slate-600">
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col">

          {/* ANSWER AREA */}
          <div className="flex-1 overflow-y-auto p-8">

            {!answer ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <h3 className="text-lg font-medium text-slate-700">
                    Ask questions about your documents
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Upload a document and start exploring insights instantly
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl">
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <p className="text-slate-900 leading-relaxed">
                    {answer}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* INPUT + SUGGESTED */}
          <div className="border-t bg-white p-4">

            {/* Suggested Questions */}
            <p className="text-xs text-slate-400 mb-2">
              Suggested questions (for demo file)
            </p>

            <div className="mb-3 flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="text-xs px-3 py-1 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-3">
              <input
                className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ask a question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />

              <button
                onClick={askQuestion}
                className="bg-indigo-600 text-white px-6 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
              >
                Ask
              </button>
            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

