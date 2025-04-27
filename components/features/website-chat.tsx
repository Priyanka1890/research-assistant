"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Globe, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { indexWebsite } from "@/app/actions"

export function WebsiteChat() {
  const { toast } = useToast()
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [isIndexing, setIsIndexing] = useState(false)
  const [isIndexed, setIsIndexed] = useState(false)
  const [websiteId, setWebsiteId] = useState<number | null>(null)
  const [messages, setMessages] = useState<{ role: string; content: string; id: string }[]>([])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleIndexWebsite = async () => {
    if (!websiteUrl) return

    // Basic URL validation
    try {
      new URL(websiteUrl)
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL",
        variant: "destructive",
      })
      return
    }

    setIsIndexing(true)

    try {
      const formData = new FormData()
      formData.append("url", websiteUrl)

      const result = await indexWebsite(formData)

      if (result.success) {
        setIsIndexed(true)
        setWebsiteId(result.websiteId)

        toast({
          title: "Website indexed successfully",
          description: `Indexed ${result.pagesIndexed} pages from the website.`,
        })

        // Add a system message
        const systemMessage = {
          role: "assistant",
          content: `I've indexed the website ${websiteUrl}. You can now ask questions about its content.`,
          id: Date.now().toString(),
        }

        setMessages([systemMessage])
      } else {
        throw new Error("Indexing failed")
      }
    } catch (error) {
      console.error("Error indexing website:", error)
      toast({
        title: "Error indexing website",
        description: "An error occurred while indexing the website.",
        variant: "destructive",
      })
    } finally {
      setIsIndexing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (input.trim() === "" || !isIndexed || !websiteId) return

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
      const response = await fetch("/api/website/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          websiteId,
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Website Knowledge</CardTitle>
        <CardDescription>Index a website and chat with its content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website-url">Website URL</Label>
            <div className="flex gap-2">
              <Input
                id="website-url"
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                disabled={isIndexing || isIndexed}
                className="flex-1"
              />
              <Button onClick={handleIndexWebsite} disabled={!websiteUrl || isIndexing || isIndexed}>
                {isIndexing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Indexing...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Index
                  </>
                )}
              </Button>
            </div>
          </div>

          {isIndexed && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-500">
              <Globe className="h-4 w-4" />
              <span>Website indexed successfully</span>
            </div>
          )}
        </div>

        <div className="border rounded-md">
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div className="max-w-md space-y-2">
                  <h3 className="text-lg font-semibold">No website indexed yet</h3>
                  <p className="text-muted-foreground">Index a website to start chatting with its content</p>
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
              placeholder="Ask about the website..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing || !isIndexed}
              className="flex-1"
            />
            <Button type="submit" disabled={isProcessing || input.trim() === "" || !isIndexed}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
