import { saveEmbedding, sql } from "./db"

// OpenAI models
const chatModel = "gpt-4o"
const embeddingModel = "text-embedding-ada-002"

// Function to generate embeddings for text chunks
export async function generateEmbeddings(sourceType: "document" | "media" | "website", sourceId: number, text: string) {
  // Split text into chunks with overlap for better context preservation
  const chunkSize = 1000
  const overlap = 200
  const chunks = []

  // Simple text chunking with overlap
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    const chunk = text.slice(i, i + chunkSize)
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim())
    }
  }

  // Generate embeddings for all chunks
  const embeddings = await Promise.all(
    chunks.map(async (chunk) => {
      // Use the OpenAI embeddings API directly
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          input: chunk,
          model: embeddingModel,
        }),
      })

      if (!response.ok) {
        throw new Error(`Embedding generation failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data[0].embedding
    }),
  )

  // Save embeddings to database
  const savedEmbeddings = await Promise.all(
    chunks.map((chunk, index) => saveEmbedding(sourceType, sourceId, index, chunk, embeddings[index])),
  )

  return savedEmbeddings
}

// Function to generate text with OpenAI
export async function generateAIText(prompt: string, systemPrompt?: string) {
  try {
    // Use the OpenAI completions API directly
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: chatModel,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Text generation failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.choices[0].message.content
  } catch (error) {
    console.error("Error generating AI text:", error)
    return `Sorry, I encountered an error while generating a response. Please try again later.`
  }
}

// Function to transcribe audio using OpenAI's Whisper API
export async function transcribeAudio(audioBuffer: ArrayBuffer, language?: string) {
  try {
    // Convert ArrayBuffer to Blob
    const audioBlob = new Blob([audioBuffer], { type: "audio/mp3" })

    // Create FormData for the API request
    const formData = new FormData()
    formData.append("file", audioBlob, "audio.mp3")
    formData.append("model", "whisper-1")

    if (language && language !== "auto") {
      formData.append("language", language)
    }

    // Make request to OpenAI's Whisper API
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.text
  } catch (error) {
    console.error("Error transcribing audio:", error)
    throw error
  }
}

// Function to translate text
export async function translateText(text: string, targetLanguage: string) {
  const prompt = `Translate the following text to ${targetLanguage}:\n\n${text}`
  const systemPrompt =
    "You are a professional translator. Translate the text accurately while preserving the meaning and tone."

  return await generateAIText(prompt, systemPrompt)
}

// Function to search for relevant content using embeddings
export async function searchWithEmbeddings(
  query: string,
  sourceType?: "document" | "media" | "website",
  sourceId?: number,
) {
  try {
    // Generate embedding for the query using OpenAI API directly
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: query,
        model: embeddingModel,
      }),
    })

    if (!response.ok) {
      throw new Error(`Embedding generation failed: ${response.statusText}`)
    }

    const result = await response.json()
    const queryEmbedding = result.data[0].embedding

    let results

    // For document type, directly fetch the document content
    if (sourceType === "document" && sourceId) {
      // Get the document content directly from the documents table
      const documentResult = await sql`
        SELECT content_text, filename
        FROM documents
        WHERE id = ${sourceId}
      `

      if (documentResult.length > 0) {
        const { content_text, filename } = documentResult[0]

        // Return the document content with some metadata
        return `Document: ${filename}\n\nContent:\n${content_text}`
      }
    }
    // For website type, get content from website_pages
    else if (sourceType === "website" && sourceId) {
      const websiteResult = await sql`
        SELECT wp.content, wp.title, wp.url
        FROM website_pages wp
        WHERE wp.website_id = ${sourceId}
        LIMIT 10
      `

      if (websiteResult.length > 0) {
        return websiteResult
          .map((page: any) => `Page: ${page.title}\nURL: ${page.url}\n\nContent:\n${page.content}`)
          .join("\n\n---\n\n")
      }
    }
    // For media type, get transcription and translation
    else if (sourceType === "media" && sourceId) {
      const mediaResult = await sql`
        SELECT m.transcription, mt.translation, mt.target_language
        FROM media m
        LEFT JOIN media_translations mt ON m.id = mt.media_id
        WHERE m.id = ${sourceId}
        LIMIT 1
      `

      if (mediaResult.length > 0) {
        const { transcription, translation, target_language } = mediaResult[0]
        return `Transcription:\n${transcription}\n\nTranslation (${target_language}):\n${translation || "Not available"}`
      }
    }
    // Fallback to vector search if direct content retrieval doesn't work
    else {
      // Build SQL query using tagged template literals
      if (sourceType && sourceId) {
        // Query with both sourceType and sourceId
        results = await sql`
          SELECT source_type, source_id, chunk_text
          FROM vector_embeddings
          WHERE source_type = ${sourceType} AND source_id = ${sourceId}
          ORDER BY created_at DESC
          LIMIT 5
        `
      } else if (sourceType) {
        // Query with only sourceType
        results = await sql`
          SELECT source_type, source_id, chunk_text
          FROM vector_embeddings
          WHERE source_type = ${sourceType}
          ORDER BY created_at DESC
          LIMIT 5
        `
      } else {
        // Query without filters
        results = await sql`
          SELECT source_type, source_id, chunk_text
          FROM vector_embeddings
          ORDER BY created_at DESC
          LIMIT 5
        `
      }

      return results.map((row: any) => row.chunk_text).join("\n\n")
    }

    // If no results found
    return ""
  } catch (error) {
    console.error("Error searching with embeddings:", error)
    return ""
  }
}
