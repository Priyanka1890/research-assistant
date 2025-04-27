import { searchWithEmbeddings, generateAIText } from "@/lib/ai"

// Adjust maxDuration to comply with hobby plan limits (max 60 seconds)
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { messages, websiteId } = await req.json()

    // Retrieve relevant website content based on the query
    let context = ""
    const userMessage = messages[messages.length - 1]

    if (websiteId) {
      const websiteContext = await searchWithEmbeddings(userMessage.content, "website", Number.parseInt(websiteId))

      if (websiteContext) {
        context = websiteContext
      }
    }

    // Generate system prompt with context
    const systemPrompt = context
      ? `You are a helpful research assistant for UMG (University Medical Center Groningen). You are answering questions about a specific website that has been indexed. Use the following information to answer the user's question. If the information doesn't contain the answer, say so honestly.\n\nContext:\n${context}`
      : "You are a helpful research assistant for UMG (University Medical Center Groningen). You are answering questions about a specific website that has been indexed. Be concise, accurate, and helpful. Only answer questions based on the content of the website."

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
    console.error("Error in website chat API:", error)
    return new Response(JSON.stringify({ error: "Failed to process chat request" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
