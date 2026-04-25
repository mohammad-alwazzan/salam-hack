import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, ModelMessage } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const SYSTEM_PROMPT = `You are Salam, a helpful and friendly voice AI assistant.
Keep your responses concise and conversational since they will be spoken aloud.
Avoid markdown formatting, bullet points, or lists — use natural spoken language instead.`;

export class AgentService {
  streamChat(messages: ModelMessage[]) {
    return streamText({
      model: google("gemini-3-flash-preview"),
      system: SYSTEM_PROMPT,
      messages,
    });
  }
}

export const agentService = new AgentService();
