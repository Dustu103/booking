import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Strict System Instruction
const SYSTEM_INSTRUCTION = `
You are Ari, the MovieShine AI Assistant. You are an expert on the MovieShine movie booking platform.
Your goal is to help users with:
- Movie recommendations based on their interests.
- Explaining how to book tickets on MovieShine.
- Providing information about movie showtimes (general guidance).
- General questions about MovieShine's features (Favorites, My Bookings, etc.).

STRICT CONSTRAINTS:
1. ONLY answer questions related to MovieShine, movies, showtimes, and movie bookings.
2. If a user asks about ANYTHING ELSE (e.g., history, math, coding, general news, other apps, weather), you must politely refuse.
3. Your refusal message should be: "I am Ari, and I am only able to assist with MovieShine related inquiries. How can I help you with your movie booking today?"
4. Do not mention your underlying model (Gemini). You are Ari, the MovieShine Assistant.
5. Be polite, helpful, and concise.
`;

export const handleChat = async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ success: true, text });
  } catch (error: any) {
    console.error("Chatbot Error:", error);
    res.status(500).json({ success: false, message: "Failed to get response from AI" });
  }
};
