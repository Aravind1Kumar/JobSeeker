import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

// Allow extra time for PDF parsing and LLM streaming (especially on Vercel)
export const maxDuration = 60; 

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file object to Buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the PDF buffer to raw text
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    // Truncate text to avoid massive token costs/limits, though Gemma-2 handles thousands seamlessly
    const truncatedText = text.substring(0, 6000); 

    // Construct the LLM prompt
    const prompt = `You are an expert technical AI recruiter. Analyze the following resume text and extract the top 3-5 dominating professional and technical skills. 
Output strictly a valid JSON array of strings and NOTHING ELSE. Do not use Markdown formatting or code blocks. Example: ["React", "Python", "Cloud Architecture"]

Resume Text:
${truncatedText}`;

    // Call NVIDIA NIM API natively with standard fetch
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemma-2-27b-it",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 256,
        stream: false
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("NVIDIA API Error:", errText);
      return NextResponse.json({ error: "Failed to analyze resume on backend" }, { status: 500 });
    }

    const responseJson = await response.json();
    const aiContent = responseJson.choices?.[0]?.message?.content || "[]";

    let skills: string[] = [];
    try {
      // The LLM might occasionally wrap with markdown code blocks despite instructions
      const cleanContent = aiContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      skills = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse extracted skills into JSON", aiContent);
      return NextResponse.json({ error: "Failed to parse skills from AI output" }, { status: 500 });
    }

    return NextResponse.json({ skills });

  } catch (error: any) {
    console.error("Resume Analysis Critical Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
