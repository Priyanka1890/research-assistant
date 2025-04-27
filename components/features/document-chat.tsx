"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileUploader } from "@/components/ui/file-uploader"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, FileText, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { processDocumentFile } from "@/app/actions"

export function DocumentChat() {
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [documentIds, setDocumentIds] = useState<number[]>([])
  const [processedDocuments, setProcessedDocuments] = useState<{ id: number; name: string }[]>([])
  const [messages, setMessages] = useState<{ role: string; content: string; id: string }[]>([])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = (fileList: FileList | null) => {
    if (fileList) {
      const newFiles = Array.from(fileList)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)

    try {
      const newDocumentIds = []
      const newProcessedDocs = []

      // Process each file
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)

        const result = await processDocumentFile(formData)

        if (result.success) {
          newDocumentIds.push(result.documentId)
          newProcessedDocs.push({
            id: result.documentId,
            name: file.name,
          })
        }
      }

      setDocumentIds((prev) => [...prev, ...newDocumentIds])
      setProcessedDocuments((prev) => [...prev, ...newProcessedDocs])

      toast({
        title: "Files uploaded successfully",
        description: `${files.length} file(s) have been processed and indexed.`,
      })

      // Add a system message
      const systemMessage = {
        role: "assistant",
        content: `I've processed ${files.length} document(s): ${files.map((f) => f.name).join(", ")}. You can now ask questions about their content.`,
        id: Date.now().toString(),
      }

      setMessages((prev) => [...prev, systemMessage])

      // Clear the files list after successful upload
      setFiles([])
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Error uploading files",
        description: "An error occurred while uploading your files.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (input.trim() === "" || documentIds.length === 0) return

    // Add user message to UI
    const userMessage = {
      role: "user",
      content: input,
      id: Date.now().toString(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsProcessing(true)

    try {
      // Send request to API
      const response = await fetch("/api/documents/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          documentIds,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      // Add assistant response to UI
      setMessages((prev) => [...prev, data])
    } catch (error) {
      console.error("Error processing query:", error)
      toast({
        title: "Error processing query",
        description: "An error occurred while processing your query.",
        variant: "destructive",
      })

      // Add error message
      const errorMessage = {
        role: "assistant",
        content: "I'm sorry, I encountered an error while processing your query. Please try again.",
        id: (Date.now() + 1).toString(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeProcessedDocument = (id: number) => {
    setDocumentIds((prev) => prev.filter((docId) => docId !== id))
    setProcessedDocuments((prev) => prev.filter((doc) => doc.id !== id))

    // Add a system message
    const systemMessage = {
      role: "assistant",
      content: `Document has been removed from the current session.`,
      id: Date.now().toString(),
    }

    setMessages((prev) => [...prev, systemMessage])
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Document Chat</CardTitle>
        <CardDescription>Upload documents and chat with their content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <FileUploader
            onFilesSelected={handleFileChange}
            accept=".pdf,.docx,.xlsx,.csv,.txt"
            maxSize={50} // 50MB
          />

          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Files to Process</h4>
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[300px]">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)} disabled={isUploading}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={handleUpload} disabled={isUploading || files.length === 0} className="w-full">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Documents"
                )}
              </Button>
            </div>
          )}

          {processedDocuments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Processed Documents</h4>
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {processedDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-muted p-2 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm truncate max-w-[300px]">{doc.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeProcessedDocument(doc.id)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border rounded-md">
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div className="max-w-md space-y-2">
                  <h3 className="text-lg font-semibold">
                    {documentIds.length > 0 ? "Ask questions about your documents" : "No documents processed yet"}
                  </h3>
                  <p className="text-muted-foreground">
                    {documentIds.length > 0
                      ? "Start typing below to chat with your documents"
                      : "Upload and process documents to start chatting with their content"}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                    message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{message.role === "user" ? "U" : "AI"}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{message.role === "user" ? "You" : "Assistant"}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
            <Input
              placeholder="Ask about your documents..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing || documentIds.length === 0}
              className="flex-1"
            />
            <Button type="submit" disabled={isProcessing || input.trim() === "" || documentIds.length === 0}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
