"use server"

import { revalidatePath } from "next/cache"
import {
  createUser,
  getUserByEmail,
  saveMedia,
  updateMediaTranscription,
  saveMediaTranslation,
  saveDocument,
  updateDocumentContent,
  saveWebsite,
  saveWebsitePage,
  createConversation,
  saveMessage,
  getMediaWithTranslation,
  sql,
} from "@/lib/db"
import { generateEmbeddings, transcribeAudio, translateText, searchWithEmbeddings, generateAIText } from "@/lib/ai"
import { extractTextFromDocument } from "@/lib/document-processor"
import { crawlWebsite } from "@/lib/website-crawler"

// Temporary user ID for demo purposes
const DEMO_USER_ID = 1

// Function to ensure demo user exists
async function ensureDemoUser() {
  try {
    let user = await getUserByEmail("demo@example.com")
    if (!user) {
      const result = await createUser("Demo User", "demo@example.com")
      user = result[0]
    }
    return user.id || DEMO_USER_ID
  } catch (error) {
    console.error("Error ensuring demo user:", error)
    return DEMO_USER_ID
  }
}

// Process media file
export async function processMediaFile(formData: FormData) {
  const userId = await ensureDemoUser()
  const file = formData.get("file") as File
  const targetLanguage = formData.get("targetLanguage") as string

  if (!file) {
    throw new Error("No file provided")
  }

  try {
    // In a real implementation, this would upload the file to storage
    // For now, we'll simulate it
    const storagePath = `/uploads/media/${Date.now()}_${file.name}`

    // Save media record to database
    const mediaResult = await saveMedia(
      userId,
      file.name,
      file.type,
      file.size,
      "auto", // Auto-detect language
      storagePath,
    )

    const mediaId = mediaResult[0].id

    // Convert file to ArrayBuffer for processing
    const buffer = await file.arrayBuffer()

    // Transcribe audio using OpenAI's Whisper API
    const transcription = await transcribeAudio(buffer)

    // Update media record with transcription
    await updateMediaTranscription(mediaId, transcription)

    // Translate transcription
    const translation = await translateText(transcription, targetLanguage)

    // Save translation with an audio path
    await saveMediaTranslation(
      mediaId,
      targetLanguage,
      translation,
      `/uploads/media/translations/${mediaId}_${targetLanguage}.mp3`,
    )

    // Generate embeddings for transcription and translation
    await generateEmbeddings("media", mediaId, transcription)
    await generateEmbeddings("media", mediaId, translation)

    // Use the mediaId as the contentId - this is more persistent than in-memory storage
    const contentId = `media_${mediaId}`

    revalidatePath("/")

    return {
      success: true,
      mediaId,
      transcription,
      translation,
      contentId,
    }
  } catch (error) {
    console.error("Error processing media file:", error)
    throw error
  }
}

// Get content by ID
export async function getContentById(contentId: string) {
  try {
    // Extract the mediaId from the contentId
    const parts = contentId.split("_")
    if (parts.length < 2 || parts[0] !== "media") {
      return null
    }

    const mediaId = Number.parseInt(parts[1], 10)
    if (isNaN(mediaId)) {
      return null
    }

    // Get the media record with transcription and translation
    const mediaData = await getMediaWithTranslation(mediaId)

    if (!mediaData) {
      return null
    }

    return {
      transcription: mediaData.transcription || "",
      translation: mediaData.translation || "",
      language: mediaData.target_language || "unknown",
    }
  } catch (error) {
    console.error("Error retrieving content by ID:", error)
    return null
  }
}

// Process document file
export async function processDocumentFile(formData: FormData) {
  const userId = await ensureDemoUser()
  const file = formData.get("file") as File

  if (!file) {
    throw new Error("No file provided")
  }

  try {
    // In a real implementation, this would upload the file to storage
    // For now, we'll simulate it
    const storagePath = `/uploads/documents/${Date.now()}_${file.name}`

    // Save document record to database
    const documentResult = await saveDocument(userId, file.name, file.type, file.size, storagePath)

    const documentId = documentResult[0].id

    // Extract text from document
    const buffer = await file.arrayBuffer()
    const extractedText = await extractTextFromDocument(buffer, file.type)

    // Update document with extracted text
    await updateDocumentContent(documentId, extractedText)

    // Generate embeddings for document content
    await generateEmbeddings("document", documentId, extractedText)

    revalidatePath("/")

    return {
      success: true,
      documentId,
      extractedText,
    }
  } catch (error) {
    console.error("Error processing document file:", error)
    throw error
  }
}

// Index website
export async function indexWebsite(formData: FormData) {
  const userId = await ensureDemoUser()
  const url = formData.get("url") as string

  if (!url) {
    throw new Error("No URL provided")
  }

  try {
    // Basic URL validation
    new URL(url)

    // Save website record to database
    const websiteResult = await saveWebsite(
      userId,
      url,
      `Website: ${url}`, // Initial title
      `Indexed website from ${url}`, // Initial description
    )

    const websiteId = websiteResult[0].id

    // Crawl website and extract content
    const crawledPages = await crawlWebsite(url, 5) // Limit to 5 pages for testing

    // Save pages and generate embeddings
    for (const page of crawledPages) {
      const pageResult = await saveWebsitePage(websiteId, page.url, page.title, page.content)

      const pageId = pageResult[0].id

      // Generate embeddings for page content
      await generateEmbeddings("website", pageId, page.content)
    }

    // Update website title if we have a home page
    if (crawledPages.length > 0) {
      await sql`
        UPDATE websites
        SET title = ${crawledPages[0].title}
        WHERE id = ${websiteId}
      `
    }

    revalidatePath("/")

    return {
      success: true,
      websiteId,
      pagesIndexed: crawledPages.length,
    }
  } catch (error) {
    console.error("Error indexing website:", error)
    throw error
  }
}

// Create or continue conversation
export async function createOrContinueConversation(formData: FormData) {
  const userId = await ensureDemoUser()
  const conversationId = formData.get("conversationId") as string
  const message = formData.get("message") as string
  const documentIds = formData.getAll("documentIds") as string[]
  const websiteId = formData.get("websiteId") as string

  if (!message) {
    throw new Error("No message provided")
  }

  try {
    let currentConversationId: number

    if (conversationId) {
      currentConversationId = Number.parseInt(conversationId)
    } else {
      // Create new conversation
      const conversationResult = await createConversation(userId, `Conversation ${new Date().toLocaleString()}`)
      currentConversationId = conversationResult[0].id
    }

    // Save user message
    await saveMessage(currentConversationId, "user", message)

    // Retrieve relevant context based on the query
    let context = ""

    // If document IDs are provided, search within those documents
    if (documentIds.length > 0) {
      for (const docId of documentIds) {
        const documentContext = await searchWithEmbeddings(message, "document", Number.parseInt(docId))
        if (documentContext) {
          context += documentContext + "\n\n"
        }
      }
    }

    // If website ID is provided, search within that website
    if (websiteId) {
      const websiteContext = await searchWithEmbeddings(message, "website", Number.parseInt(websiteId))
      if (websiteContext) {
        context += websiteContext + "\n\n"
      }
    }

    // Generate response with context
    const systemPrompt = context
      ? `You are a helpful research assistant for UMG (University Medical Center Groningen). Use the following information to answer the user's question. If the information doesn't contain the answer, say so honestly and provide general information if possible.\n\nContext:\n${context}`
      : "You are a helpful research assistant for UMG (University Medical Center Groningen). Answer the user's question based on your knowledge. Be concise, accurate, and helpful."

    const assistantResponse = await generateAIText(message, systemPrompt)

    // Save assistant message
    await saveMessage(currentConversationId, "assistant", assistantResponse)

    revalidatePath("/")

    return {
      success: true,
      conversationId: currentConversationId,
      response: assistantResponse,
    }
  } catch (error) {
    console.error("Error in conversation:", error)
    throw error
  }
}
