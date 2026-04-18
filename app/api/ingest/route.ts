export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { redis } from "@/lib/redis";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function chunkText(text: string, chunkSize = 500, overlap = 200) {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json(
        { error: "No files uploaded" },
        { status: 400 }
      );
    }

    // 🔑 Get existing data from Redis
    let existingData: any[] = [];
    const stored = await redis.get("docmind");

    if (stored) {
      existingData = stored as any[];
    }

    for (const file of files) {
      const text = await file
        .arrayBuffer()
        .then((buffer) => new TextDecoder("utf-8").decode(buffer));

      const chunks = chunkText(text);

      const embeddings: number[][] = [];
      const batchSize = 20;

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);

        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: batch,
        });

        response.data.forEach((e) => embeddings.push(e.embedding));
      }

      chunks.forEach((chunk, i) => {
        existingData.push({
          text: chunk,
          embedding: embeddings[i],
          source: file.name,
        });
      });
    }

    // 🔑 Save to Redis
    await redis.set("docmind", existingData);

    return NextResponse.json({
      message: "Documents processed successfully",
      totalChunks: existingData.length,
    });
  } catch (error) {
    console.error("INGEST ERROR:", error);

    return NextResponse.json(
      { error: "Failed to process documents" },
      { status: 500 }
    );
  }
}
