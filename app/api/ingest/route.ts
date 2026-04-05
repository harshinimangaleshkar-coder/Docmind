export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// use /tmp (important fix)
const filePath = path.join("/tmp", "data.json");

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

    let existingData: any[] = [];

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      existingData = JSON.parse(fileContent || "[]");
    }

    for (const file of files) {
      const text = await file
        .arrayBuffer()
        .then((buffer) => new TextDecoder("utf-8").decode(buffer));

      const chunks = chunkText(text);

      const embeddings: number[][] = [];

const batchSize = 20; // safe size

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

    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

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