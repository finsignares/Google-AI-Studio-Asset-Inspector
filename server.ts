import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

export const app = express();
const PORT = 3000;

// Generous payload limit to receive high-res camera frames from mobile devices
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize GoogleGenAI lazily with telemetry headers
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

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Main inspection API endpoint
app.post("/api/inspect-device", async (req, res) => {
  try {
    const { frames, additionalNotes, isFollowUp, previousReportSummary } = req.body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({
        error: "At least one camera frame or video capture is required for inspection.",
      });
    }

    const ai = getGenAI();

    // Prepare multimodal parts from frames
    const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];

    // Add up to 12 frames to ensure thorough coverage without exceeding reasonable token bandwidth
    const selectedFrames = frames.slice(0, 12);
    selectedFrames.forEach((frameBase64: string, index: number) => {
      // Strip data URL prefix if present
      const cleanBase64 = frameBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64,
        },
      });
    });

    const inspectionPrompt = `You are a certified senior electronic, electric, and asset diagnostic auditor inspecting a device or appliance from a video recording capture.

Analyze all the provided sequential video frames thoroughly and systematically evaluate the asset according to four mandatory criteria:

1. DEVICE IDENTIFICATION:
   - Identify the exact device type (e.g. Laptop, Smartphone, Cordless Drill, Oscilloscope, Microwave, Smart TV, Soldering Station, Audio Receiver, Tablet, Electric Scooter, Blender, 3D Printer, etc.).
   - Identify brand / manufacturer, model number, series, and regulatory / serial number or rating plate sticker if visible or partially visible.
   - Categorize the asset.

2. PHYSICAL STATUS ASSESSMENT:
   - Evaluate external casing/chassis for scuffs, dents, cracks, missing screws, warped frame, or opening gaps.
   - Screen/Display (if present): check for hairline scratches, cracks, delamination, shatter, pressure marks.
   - Ports & Connectors: check charging ports, USB/HDMI/aux, AC prongs, socket pins, debris, oxidation, burns.
   - Buttons, Knobs & Switches: check if power, volume, or control dials are present, depressed, loose, or missing.
   - Wiring & Thermal: check power cords for fraying, bends, exposed wiring, and ventilation grilles for dust/blockage.
   - Cleanliness and cosmetic score (0 to 100).

3. FUNCIONALIDAD (FUNCTIONAL STATUS):
   - Determine what functional state can be confirmed from the video.
   - Check power indicators (LED lights, standby light, pilot lamps).
   - Check display response (boots up to OS/menu, blank screen, backlighting only, error screen, off).
   - Check mechanical / moving parts (spinning chuck, fan rotation, motorized tray, vibration).
   - List what actions were demonstrably tested or visible.
   - Crucially highlight what functional aspects REMAIN UNTESTED or unverified because they were not demonstrated in the video.

4. ACCESORIOS (ACCESSORIES COMPLETENESS & STATUS):
   - Based on this exact type of device, what standard accessories are expected? (e.g., for a laptop: charger/AC power adapter, power cord, stylus if supported; for a power drill: detachable battery pack, charger base, chuck key, case; for a TV: remote control, power cord, stand legs; for a blender: pitcher, lid, tamper; etc.).
   - Determine overall completeness: "complete", "partially_complete", "missing_critical", or "none_detected".
   - Itemize each accessory with presence (present_verified, partially_present, missing_critical, missing_optional) and individual physical status (good, worn, damaged, unknown_not_present).

5. AUDIT SUFFICIENCY & MISSING INFORMATION (CRITICAL REQUIREMENT):
   - You MUST determine if all information required to complete a thorough, certified audit is COMPLETE, OR if additional video or info is required.
   - Set "isAuditComplete" to TRUE ONLY IF all key aspects (device identification/serial, all exterior angles, ports, power/functional test, and expected accessories) are clearly demonstrated.
   - Set "isAuditComplete" to FALSE if critical angles (e.g. bottom label/serial number, ports, power-on demonstration, charger) are missing or obscured.
   - If false, list specific, highly actionable "missingRequirements" explaining EXACTLY what angle, test, or accessory the user needs to record in an additional follow-up video clip or provide as additional information.

${additionalNotes ? `User inspector notes: "${additionalNotes}"` : ""}
${isFollowUp ? `Note: This is an additional follow-up video submitted to resolve previous gaps. Previous audit summary: "${previousReportSummary}". Synthesize the new angles and tests with the previous assessment to update the completeness state.` : ""}`;

    parts.push({ text: inspectionPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        systemInstruction:
          "You are an expert industrial asset & electronics inspector. Output strict, valid JSON matching the specified schema. Be objective, thorough, and highly specific in your defect and accessory evaluations.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            device: {
              type: Type.OBJECT,
              properties: {
                deviceType: { type: Type.STRING, description: "Identified device name (e.g., 'Business Laptop', 'Cordless Hammer Drill')" },
                deviceCategory: {
                  type: Type.STRING,
                  enum: [
                    "consumer_electronics",
                    "office_it",
                    "power_tools",
                    "appliances",
                    "audio_visual",
                    "networking",
                    "industrial_measurement",
                    "other",
                  ],
                },
                brand: { type: Type.STRING, description: "Brand name or 'Unidentified / Generic'" },
                model: { type: Type.STRING, description: "Model name/number or best estimate" },
                serialNumberOrTag: {
                  type: Type.OBJECT,
                  properties: {
                    detected: { type: Type.BOOLEAN },
                    value: { type: Type.STRING, description: "Serial number string or null if unreadable" },
                    locationNotes: { type: Type.STRING, description: "Where the label is or should be located" },
                    confidence: { type: Type.STRING, enum: ["high", "medium", "low", "not_found"] },
                  },
                  required: ["detected", "confidence", "locationNotes"],
                },
                estimatedYearOrGeneration: { type: Type.STRING },
                summary: { type: Type.STRING, description: "Concise 1-2 sentence overview of the device" },
              },
              required: ["deviceType", "deviceCategory", "brand", "model", "serialNumberOrTag", "summary"],
            },
            physical: {
              type: Type.OBJECT,
              properties: {
                overallGrade: { type: Type.STRING, enum: ["mint", "good", "fair", "poor", "damaged"] },
                score: { type: Type.NUMBER, description: "Condition score from 0 to 100" },
                housingAndChassis: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.STRING, enum: ["pristine", "minor_wear", "moderate_scratches", "dents_or_cracks", "broken"] },
                    details: { type: Type.STRING },
                  },
                  required: ["status", "details"],
                },
                screenOrDisplay: {
                  type: Type.OBJECT,
                  properties: {
                    hasScreen: { type: Type.BOOLEAN },
                    status: { type: Type.STRING, enum: ["not_applicable", "flawless", "surface_scratches", "cracked_glass", "damaged_lcd"] },
                    details: { type: Type.STRING },
                  },
                  required: ["hasScreen", "status", "details"],
                },
                portsAndConnectors: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.STRING, enum: ["clean_intact", "minor_wear", "debris_dust", "bent_pins_corrosion", "uninspected"] },
                    details: { type: Type.STRING },
                  },
                  required: ["status", "details"],
                },
                buttonsAndSwitches: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.STRING, enum: ["all_intact", "worn", "missing_or_stuck", "uninspected"] },
                    details: { type: Type.STRING },
                  },
                  required: ["status", "details"],
                },
                cablesAndWiring: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.STRING, enum: ["healthy", "minor_abrasion", "frayed_exposed_copper", "not_applicable"] },
                    details: { type: Type.STRING },
                  },
                  required: ["status", "details"],
                },
                cleanliness: { type: Type.STRING, enum: ["clean", "dusty", "heavily_soiled", "sticky_residue"] },
                defectsList: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      area: { type: Type.STRING },
                      severity: { type: Type.STRING, enum: ["minor", "moderate", "severe"] },
                      description: { type: Type.STRING },
                    },
                    required: ["area", "severity", "description"],
                  },
                },
              },
              required: ["overallGrade", "score", "housingAndChassis", "screenOrDisplay", "portsAndConnectors", "buttonsAndSwitches", "cablesAndWiring", "cleanliness", "defectsList"],
            },
            functionality: {
              type: Type.OBJECT,
              properties: {
                observableStatus: {
                  type: Type.STRING,
                  enum: ["operational", "partially_functional", "non_functional", "untested_not_demonstrated"],
                },
                powerIndicator: {
                  type: Type.OBJECT,
                  properties: {
                    observed: { type: Type.BOOLEAN },
                    state: { type: Type.STRING, enum: ["lit_normal", "blinking_error", "off", "not_connected_or_shown"] },
                    notes: { type: Type.STRING },
                  },
                  required: ["observed", "state", "notes"],
                },
                displayOrScreenResponse: {
                  type: Type.OBJECT,
                  properties: {
                    observed: { type: Type.BOOLEAN },
                    state: { type: Type.STRING, enum: ["normal_boot", "abnormal_artifacts", "blank_backlight", "no_power", "not_applicable"] },
                    notes: { type: Type.STRING },
                  },
                  required: ["observed", "state", "notes"],
                },
                mechanicalOrMovingParts: {
                  type: Type.OBJECT,
                  properties: {
                    observed: { type: Type.BOOLEAN },
                    state: { type: Type.STRING, enum: ["smooth_operation", "unusual_noise_vibration", "seized_stuck", "not_applicable"] },
                    notes: { type: Type.STRING },
                  },
                  required: ["observed", "state", "notes"],
                },
                audibleAlerts: {
                  type: Type.OBJECT,
                  properties: {
                    detected: { type: Type.BOOLEAN },
                    notes: { type: Type.STRING },
                  },
                  required: ["detected", "notes"],
                },
                demonstratedActions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                untestedRisks: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["observableStatus", "powerIndicator", "displayOrScreenResponse", "mechanicalOrMovingParts", "demonstratedActions", "untestedRisks"],
            },
            accessories: {
              type: Type.OBJECT,
              properties: {
                overallCompleteness: {
                  type: Type.STRING,
                  enum: ["complete", "partially_complete", "missing_critical", "none_detected"],
                },
                completenessScore: { type: Type.NUMBER, description: "0 to 100 percentage" },
                summary: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: "Name of the accessory, e.g., '65W Power Adapter', 'Battery Pack'" },
                      category: {
                        type: Type.STRING,
                        enum: ["essential_power", "control_input", "cable_connector", "protective_case", "attachment", "documentation_box", "other"],
                      },
                      presence: {
                        type: Type.STRING,
                        enum: ["present_verified", "partially_present", "missing_critical", "missing_optional"],
                      },
                      condition: {
                        type: Type.STRING,
                        enum: ["good", "worn", "damaged", "unknown_not_present"],
                      },
                      isOriginal: { type: Type.BOOLEAN },
                      notes: { type: Type.STRING },
                    },
                    required: ["name", "category", "presence", "condition", "notes"],
                  },
                },
              },
              required: ["overallCompleteness", "completenessScore", "summary", "items"],
            },
            sufficiency: {
              type: Type.OBJECT,
              properties: {
                isAuditComplete: {
                  type: Type.BOOLEAN,
                  description: "True if all necessary information to certify the device is complete. False if additional video angles or details are required.",
                },
                confidenceScore: { type: Type.NUMBER, description: "0 to 100 confidence in evaluation" },
                readinessStatus: {
                  type: Type.STRING,
                  enum: ["ready_for_certification", "requires_additional_video", "requires_additional_info"],
                },
                missingRequirements: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      category: {
                        type: Type.STRING,
                        enum: ["serial_plate", "all_angles", "ports_underside", "power_test", "accessories_display", "label_clarity"],
                      },
                      urgency: { type: Type.STRING, enum: ["critical", "recommended", "optional"] },
                      title: { type: Type.STRING },
                      userInstruction: { type: Type.STRING, description: "Direct clear instructions to the user on what to record next or provide" },
                      reason: { type: Type.STRING, description: "Why this additional information is needed" },
                    },
                    required: ["id", "category", "urgency", "title", "userInstruction", "reason"],
                  },
                },
                suggestedNextActions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                recommendations: { type: Type.STRING },
              },
              required: ["isAuditComplete", "confidenceScore", "readinessStatus", "missingRequirements", "suggestedNextActions", "recommendations"],
            },
          },
          required: ["device", "physical", "functionality", "accessories", "sufficiency"],
        },
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
      error: error?.message || "Failed to inspect device video frames.",
    });
  }
});

async function startServer() {
  // Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

app.listen(PORT, "0.0.0.0", () => {
    console.log(Asset Inspector server running on http://0.0.0.0:${PORT});
  });
}

if (!process.env.VERCEL) {
  startServer();
}
