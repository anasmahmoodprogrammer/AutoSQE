import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const idea = formData.get('idea') as string;
    const files = formData.getAll('files') as File[];

    if (!idea) {
      return new Response(JSON.stringify({ error: "Idea is required" }), { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY environment variable is missing" }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Process uploaded files into Gemini's inlineData format
    const inlineDataParts = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        return {
          inlineData: {
            data: Buffer.from(buffer).toString('base64'),
            mimeType: file.type || 'application/octet-stream',
          },
        };
      })
    );

    const generateWithRetry = async (params: any, retries = 3, delay = 2000): Promise<any> => {
      try {
        return await ai.models.generateContent(params);
      } catch (err: any) {
        // Retry on 503 (Service Unavailable) or 429 (Too Many Requests)
        if (retries > 0 && (err?.status === 503 || err?.status === 429 || err?.message?.includes('503') || err?.message?.includes('429'))) {
          console.warn(`Gemini API overloaded. Retrying in ${delay}ms... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return generateWithRetry(params, retries - 1, delay * 2);
        }
        throw err;
      }
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // --- STAGE 1: Product Architect ---
          sendEvent({ stage: 1 });
          const architectPrompt = `You are an elite Product Architect. Your job is to take a raw project description and expand it into a comprehensive product vision.
Analyze the provided inputs and define the following, using proper Markdown headings (e.g., '##', '###') for each section:
- Core Objectives (What specific problem does this solve?)
- Target User Personas (Who will use this and what are their technical proficiencies?)
- System Boundaries (Explicitly state what is in scope vs. out of scope).
- High-Level Features (List 5-7 core functional pillars).
Output this strictly as structured Markdown with well-defined hierarchical headings. Do not include any introductory fluff or conversational filler.

Raw Project Idea:
${idea}`;

          const architectRes = await generateWithRetry({
            model: 'gemini-2.5-flash',
            contents: [...inlineDataParts, architectPrompt],
          });
          const architectOutput = architectRes.text || "";
          sendEvent({ results: { architect: architectOutput } });

          // --- STAGE 2: Systems Analyst ---
          sendEvent({ stage: 2 });
          const analystPrompt = `You are a senior Systems Analyst specializing in rigorous Software Quality Engineering (SQE). You will receive high-level product architecture notes. Your task is to translate them into a formal Software Requirements Specification (SRS).
Extract the details and categorize them strictly into:
- Functional Requirements (FRs): What the system must do.
- Non-Functional Requirements (NFRs): Focus heavily on system performance, database scalability, and security constraints.
Ensure all requirements are clear, testable, and unambiguous. Format your output as a strict JSON object containing an array of requirement items, assigning a unique ID to each (e.g., FR-01, NFR-02).

High-level Product Architecture:
${architectOutput}`;

          const analystRes = await generateWithRetry({
            model: 'gemini-2.5-flash',
            contents: analystPrompt,
            config: {
              responseMimeType: "application/json"
            }
          });
          const analystOutput = analystRes.text || "";
          
          // Prettify JSON if it's raw
          let parsedJSON = analystOutput;
          try {
            parsedJSON = JSON.stringify(JSON.parse(analystOutput), null, 2);
          } catch(e) {}
          
          sendEvent({ results: { analyst: parsedJSON } });

          // --- STAGE 3: QA Engineer ---
          sendEvent({ stage: 3 });
          const qaPrompt = `You are a meticulous Lead QA Engineer. You will be provided with a JSON list of software requirements.
Your task is to:
- Generate a Requirement Traceability Matrix (RTM) mapping each requirement ID to a specific test scenario. This MUST be formatted as a strict Markdown Table. You MUST include the table separator row (e.g., '|---|---|---|').
- Draft comprehensive Test Cases for each functional requirement, detailing the Test Case ID, Description, Input, Expected Output, and Edge Cases.
- Include a dedicated section with the heading '## User Acceptance Testing (UAT)' that lists end-user verification scenarios based on business requirements.
Output the results using proper Markdown headings (e.g., '##', '###') and ensure all tables render correctly. Do not include introductory fluff.

Software Requirements (JSON):
${analystOutput}`;

          const qaRes = await generateWithRetry({
            model: 'gemini-2.5-flash',
            contents: qaPrompt,
          });
          const qaOutput = qaRes.text || "";
          
          sendEvent({ results: { qa: qaOutput }, stage: 4 });
          controller.close();
        } catch (err: any) {
          console.error("Pipeline error:", err);
          sendEvent({ error: err.message || "Failed to process pipeline" });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
