import { neon } from "@neondatabase/serverless"

// Initialize the SQL client with the database URL
const sql = neon(process.env.DATABASE_URL!)

// Helper function to execute raw SQL queries with tagged template literals
export async function executeQuery(strings: TemplateStringsArray, ...values: any[]) {
  try {
    return await sql(strings, ...values)
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// User-related functions
export async function createUser(name: string, email: string) {
  return await sql`
    INSERT INTO users (name, email)
    VALUES (${name}, ${email})
    RETURNING id, name, email, created_at
  `
}

export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT id, name, email, created_at
    FROM users
    WHERE email = ${email}
  `
  return result[0] || null
}

// Media-related functions
export async function saveMedia(
  userId: number,
  filename: string,
  fileType: string,
  fileSize: number,
  originalLanguage: string,
  storagePath: string,
) {
  return await sql`
    INSERT INTO media (user_id, filename, file_type, file_size, original_language, storage_path)
    VALUES (${userId}, ${filename}, ${fileType}, ${fileSize}, ${originalLanguage}, ${storagePath})
    RETURNING id
  `
}

export async function updateMediaTranscription(mediaId: number, transcription: string) {
  return await sql`
    UPDATE media
    SET transcription = ${transcription}
    WHERE id = ${mediaId}
    RETURNING id
  `
}

export async function saveMediaTranslation(
  mediaId: number,
  targetLanguage: string,
  translation: string,
  audioPath?: string,
) {
  return await sql`
    INSERT INTO media_translations (media_id, target_language, translation, audio_path)
    VALUES (${mediaId}, ${targetLanguage}, ${translation}, ${audioPath || null})
    RETURNING id
  `
}

export async function getMediaWithTranslation(mediaId: number) {
  const mediaResult = await sql`
    SELECT m.id, m.transcription, mt.translation, mt.target_language
    FROM media m
    LEFT JOIN media_translations mt ON m.id = mt.media_id
    WHERE m.id = ${mediaId}
    ORDER BY mt.id DESC
    LIMIT 1
  `
  return mediaResult[0] || null
}

// Document-related functions
export async function saveDocument(
  userId: number,
  filename: string,
  fileType: string,
  fileSize: number,
  storagePath: string,
  contentText?: string,
) {
  return await sql`
    INSERT INTO documents (user_id, filename, file_type, file_size, storage_path, content_text)
    VALUES (${userId}, ${filename}, ${fileType}, ${fileSize}, ${storagePath}, ${contentText || null})
    RETURNING id
  `
}

export async function updateDocumentContent(documentId: number, contentText: string) {
  return await sql`
    UPDATE documents
    SET content_text = ${contentText}
    WHERE id = ${documentId}
    RETURNING id
  `
}

// Website-related functions
export async function saveWebsite(userId: number, url: string, title?: string, description?: string) {
  return await sql`
    INSERT INTO websites (user_id, url, title, description)
    VALUES (${userId}, ${url}, ${title || null}, ${description || null})
    RETURNING id
  `
}

export async function saveWebsitePage(websiteId: number, url: string, title: string, content: string) {
  return await sql`
    INSERT INTO website_pages (website_id, url, title, content)
    VALUES (${websiteId}, ${url}, ${title}, ${content})
    RETURNING id
  `
}

// Embedding-related functions
export async function saveEmbedding(
  sourceType: "document" | "media" | "website",
  sourceId: number,
  chunkIndex: number,
  chunkText: string,
  embedding: number[],
) {
  return await sql`
    INSERT INTO vector_embeddings (source_type, source_id, chunk_index, chunk_text, embedding)
    VALUES (${sourceType}, ${sourceId}, ${chunkIndex}, ${chunkText}, ${JSON.stringify(embedding)})
    RETURNING id
  `
}

// Conversation-related functions
export async function createConversation(userId: number, title?: string) {
  return await sql`
    INSERT INTO conversations (user_id, title)
    VALUES (${userId}, ${title || null})
    RETURNING id, user_id, title, created_at, updated_at
  `
}

export async function saveMessage(conversationId: number, role: "user" | "assistant" | "system", content: string) {
  return await sql`
    INSERT INTO messages (conversation_id, role, content)
    VALUES (${conversationId}, ${role}, ${content})
    RETURNING id, conversation_id, role, content, created_at
  `
}

export async function getConversationMessages(conversationId: number) {
  return await sql`
    SELECT id, conversation_id, role, content, created_at
    FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `
}

// Export the sql client for direct use when needed
export { sql }
