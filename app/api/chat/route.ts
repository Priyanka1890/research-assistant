import { NextResponse } from "next/server"
import { generateAIText } from "@/lib/ai"

// Adjust maxDuration to comply with hobby plan limits (max 60 seconds)
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { query, transcription, translation, language } = await req.json()

    // Create a system prompt with the context that allows for broader knowledge
    const systemPrompt = `
You are a helpful research assistant answering questions about media content that has been transcribed and translated.

The following is the content from the media:

Transcription:
${transcription || "No transcription available."}

Translation (${language || "unknown language"}):
${translation || "No translation available."}

Important instructions:
1. If the user's question is directly about the content provided above, use that information to answer accurately.
2. If the question is about the broader topic or context related to the content, use your general knowledge to provide a comprehensive answer.
3. If the user asks about topics that seem related to the general subject matter of the content, provide helpful information from your knowledge.
4. Always be informative, accurate, and helpful. Provide detailed explanations when appropriate.
5. If you're unsure or the question is completely unrelated to both the content and its general context, acknowledge this and provide the best answer you can.

For example, if the content is about sailing or boats, you should be able to answer specific questions about what was mentioned in the content, as well as general questions about sailing, boat types, navigation, etc.
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
