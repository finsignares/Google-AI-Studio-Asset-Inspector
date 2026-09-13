import express from "express";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }

    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  return genAIClient;
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/inspect-device", async (req, res) => {
  try {
    const { frames, additionalNotes, isFollowUp, previousReportSummary } =
      req.body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({
        error:
          "At least one camera frame or video capture is required for inspection.",
      });
    }

    const ai = getGenAI();

    const parts: Array<{
      inlineData?: { mimeType: string; data: string };
      text?: string;
    }> = [];

    const selectedFrames = frames.slice(0, 12);

    selectedFrames.forEach((frameBase64: string) => {
      const cleanBase64 = frameBase64.replace(
        /^data:image\/\w+;base64,/,
        ""
      );

      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64,
        },
      });
    });

    parts.push({
      text: `You are an expert electronic device inspector.

Analyze the provided device images and identify:
1. Device type
2. Brand
3. Model
4. Serial number if visible
5. Physical condition
6. Visible defects
7. Functionality that can actually be demonstrated
8. Accessories visible
9. Information that remains unverified

${additionalNotes ? `Inspector notes: ${additionalNotes}` : ""}

${
  isFollowUp
    ? `This is a follow-up inspection. Previous report:
${previousReportSummary || ""}`
    : ""
}

Return a concise JSON inspection report.`,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text?.trim() || "{}";
    const reportData = JSON.parse(jsonText);

    return res.json({
      success: true,
      report: reportData,
    });
  } catch (error: any) {
    console.error("Error inspecting device:", error);

    return res.status(500).json({
      error:
        error?.message || "Failed to inspect device video frames.",
    });
  }
});

export default app;
