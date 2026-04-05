export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// same /tmp path
const filePath = path.join("/tmp", "data.json");

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const question: string = body.question;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    let store: any[] = [];

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      store = JSON.parse(fileContent || "[]");
    }

    if (!store.length) {
      return NextResponse.json({
        answer: "No documents uploaded yet. Please upload files first.",
        sources: [],
      });
    }

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    const ranked = store
      .map((item) => ({
        ...item,
        score: cosineSimilarity(queryEmbedding, item.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const context = ranked.map((r) => r.text).join("\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
You are a helpful support assistant.

Use the provided documentation to answer the question clearly.

If the answer is partially available, try your best to respond using the closest relevant information.

Only say "I don't know" if the information is completely missing.
`, },
        {
          role: "user",
          content: `Documentation:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });

    return NextResponse.json({
      answer: completion.choices[0].message.content,
      sources: ranked.map((r) => r.source),
    });
  } catch (error) {
    console.error("QUERY ERROR:", error);

    return NextResponse.json(
      { error: "Failed to answer question" },
      { status: 500 }
    );
  }
}