import { searchWithEmbeddings, generateAIText } from "@/lib/ai"

// Adjust maxDuration to comply with hobby plan limits (max 60 seconds)
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { messages, documentIds } = await req.json()

    // Retrieve relevant document content based on the query
    let context = ""
    const userMessage = messages[messages.length - 1]

    if (documentIds && documentIds.length > 0) {
      for (const docId of documentIds) {
        const documentContext = await searchWithEmbeddings(userMessage.content, "document", Number.parseInt(docId))
        if (documentContext) {
          context += documentContext + "\n\n"
        }
      }
    }

    // Generate system prompt with context
    const systemPrompt = context
      ? `You are a helpful research assistant for UMG (University Medical Center Groningen). You are answering questions about specific documents that have been uploaded. Use the following information to answer the user's question. If the information doesn't contain the answer, say so honestly.\n\nContext:\n${context}`
      : "You are a helpful research assistant for UMG (University Medical Center Groningen). You are answering questions about specific documents that have been uploaded. Be concise, accurate, and helpful. Only answer questions based on the content of the documents."

    // Generate the complete response (non-streaming)
    const assistantResponse = await generateAIText(userMessage.content, systemPrompt)

    // Return the response in the format expected by the client
    return new Response(
      JSON.stringify({
        role: "assistant",
        content: assistantResponse,
        id: Date.now().toString(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("Error in documents chat API:", error)
    return new Response(JSON.stringify({ error: "Failed to process chat request" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
