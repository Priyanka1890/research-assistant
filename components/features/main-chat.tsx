"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mic, Send, StopCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export function MainChat() {
  const { toast } = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<{ role: string; content: string; id: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const toggleRecording = () => {
    // In a real implementation, this would use the Web Speech API
    setIsRecording(!isRecording)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (input.trim() === "") return

    // Add user message to UI
    const userMessage = {
      role: "user",
      content: input,
      id: Date.now().toString(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      // Send request to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      // Extract conversation ID from response if available
      const responseConversationId = response.headers.get("X-Conversation-Id")
      if (responseConversationId) {
        setConversationId(responseConversationId)
      }

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
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Research Assistant</CardTitle>
        <CardDescription>Ask questions, get information, or request assistance with your research</CardDescription>
      </CardHeader>
      <CardContent className="h-[60vh] overflow-y-auto flex flex-col gap-4 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-semibold">Welcome to UMG Research Assistant</h3>
              <p className="text-muted-foreground">
                Start a conversation to get help with your research, translate content, or analyze documents.
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
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="button"
            size="icon"
            variant={isRecording ? "destructive" : "outline"}
            onClick={toggleRecording}
            disabled={isLoading}
          >
            {isRecording ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button type="submit" disabled={(input.trim().length === 0 && !isRecording) || isLoading}>
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
