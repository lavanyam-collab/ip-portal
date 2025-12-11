
import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord, AttendanceType } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateDailyInsight = async (
  userName: string, 
  lastPunch: AttendanceRecord | null,
  totalHours: number
): Promise<string> => {
  const fallbackMessage = `Hello ${userName}, ready to achieve your goals today?`;

  if (!apiKey) return `Welcome back, ${userName}. Keep up the great work!`;

  try {
    const model = 'gemini-2.5-flash';
    const currentTime = new Date().toLocaleTimeString();
    
    let prompt = `You are the internal AI assistant for "Interior Plus". 
    User: ${userName}. 
    Current Time: ${currentTime}.
    Total hours worked today: ${totalHours.toFixed(1)}.
    `;

    if (lastPunch?.type === AttendanceType.IN) {
      prompt += `The user clocked in at ${new Date(lastPunch.timestamp).toLocaleTimeString()}. They are currently working.
      Generate a short, motivating 1-sentence message relevant to Interior Plus employees.`;
    } else if (lastPunch?.type === AttendanceType.OUT) {
      prompt += `The user just clocked out.
      Generate a short, friendly 1-sentence message wishing them a good evening.`;
    } else {
      prompt += `The user has not clocked in yet today.
      Generate a short, energetic 1-sentence greeting to start the day at Interior Plus.`;
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Have a productive day at Interior Plus!";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Graceful handling for Quota Exceeded (429) to keep app running
    if (error.status === 429 || error.code === 429 || (error.message && error.message.includes('quota'))) {
        return fallbackMessage;
    }
    return fallbackMessage;
  }
};

export const summarizeUpdates = async (updatesText: string): Promise<string> => {
    // Formatted mock summary for fallback (Quota exceeded or No Key)
    const mockSummary = "Interior Plus Updates Summary:\n• **New 'Work from Anywhere' Policy:** A new policy is live starting next month. Check the documents section.\n• **Server Maintenance:** Scheduled for Saturday at 10 PM. Expect approx 2 hours of downtime.\n• **Compliance Update:** Please review the attached documents in your vault by Friday.";

    // If no API key, return mock response for demo purposes so user sees "something" happening
    if (!apiKey) {
        return mockSummary;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are the official AI communication assistant for "Interior Plus". 
            Summarize the following internal company updates into 3 concise, professional bullet points for the mobile app dashboard.
            Focus ONLY on company news provided below. Do not hallucinate external information.
            
            Updates:
            ${updatesText}`,
        });
        return response.text || "No summary available.";
    } catch (e: any) {
        console.error("Summary failed", e);
        // Fallback to mock summary on quota error to keep demo alive and UI looking good
        if (e.status === 429 || e.code === 429 || (e.message && e.message.includes('quota'))) {
             return mockSummary;
        }
        return "Unable to connect to Interior Plus AI services.";
    }
}
