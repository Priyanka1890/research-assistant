import { NextResponse } from "next/server"
import { generateAIText } from "@/lib/ai"

// Adjust maxDuration to comply with hobby plan limits (max 60 seconds)
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { query, transcription, translation, language, hasMore } = await req.json()

    // Create a system prompt with the context that allows for broader knowledge
    const systemPrompt = `
You are a helpful research assistant answering questions about media content that has been transcribed and translated.

The following is ${hasMore ? "a preview of" : ""} the content from the media:

Transcription${hasMore ? " (preview)" : ""}:
${transcription || "No transcription available."}
${hasMore ? "... (content continues)" : ""}

Translation (${language || "unknown language"})${hasMore ? " (preview)" : ""}:
${translation || "No translation available."}
${hasMore ? "... (content continues)" : ""}

Important instructions:
1. If the user's question is directly about the content provided above, use that information to answer accurately.
2. If the question is about the broader topic or context related to the content, use your general knowledge to provide a comprehensive answer.
3. If the user asks about topics that seem related to the general subject matter of the content, provide helpful information from your knowledge.
4. Always be informative, accurate, and helpful. Provide detailed explanations when appropriate.
5. If you're unsure or the question is completely unrelated to both the content and its general context, acknowledge this and provide the best answer you can.
${hasMore ? "6. Be aware that you're only seeing a preview of the content, so your understanding may be limited." : ""}
    `.trim()

    // Generate the response
    const assistantResponse = await generateAIText(query, systemPrompt)

    // Return the response
    return NextResponse.json({
      role: "assistant",
      content: assistantResponse,
      id: Date.now().toString(),
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      {
        error: "Failed to process chat request",
        content: "I'm sorry, I encountered an error while processing your question. Please try again.",
      },
      { status: 500 },
    )
  }
}
