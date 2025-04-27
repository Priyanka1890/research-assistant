"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploader } from "@/components/ui/file-uploader"
import { Textarea } from "@/components/ui/textarea"
import { Play, Download, MessageSquare, Loader2, Pause, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { processMediaFile } from "@/app/actions"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// Define message type for chat
interface ChatMessage {
  role: "user" | "assistant"
  content: string
  id: string
}

export function MediaProcessor() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [targetLanguage, setTargetLanguage] = useState("en")
  const [transcription, setTranscription] = useState("")
  const [translation, setTranslation] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [mediaId, setMediaId] = useState<number | null>(null)
  const [contentId, setContentId] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  // Audio playback states
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false)
  const [isPlayingTranslated, setIsPlayingTranslated] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)

  // Chat states
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Audio element references
  const originalAudioRef = useRef<HTMLAudioElement | null>(null)
  const translatedAudioRef = useRef<HTMLAudioElement | null>(null)

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      stopAllAudio()
    }
  }, [])

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const selectedFile = files[0]
      setFile(selectedFile)

      // Store the audio blob for playback if it's an audio file
      if (selectedFile.type.startsWith("audio/")) {
        setAudioBlob(selectedFile)
      } else {
        setAudioBlob(null)
      }

      // Reset states when a new file is uploaded
      setTranscription("")
      setTranslation("")
      setMediaId(null)
      setContentId(null)

      // Stop any playing audio
      stopAllAudio()
    }
  }

  const processMedia = async () => {
    if (!file) return

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("targetLanguage", targetLanguage)

      // Process the media file using our server action
      const result = await processMediaFile(formData)

      if (result.success) {
        setMediaId(result.mediaId)
        setTranscription(result.transcription)
        setTranslation(result.translation)

        // Store content ID if provided
        if (result.contentId) {
          setContentId(result.contentId)
        }

        toast({
          title: "Media processed successfully",
          description: "Your media has been transcribed and translated.",
        })
      } else {
        throw new Error("Processing failed")
      }
    } catch (error) {
      console.error("Error processing media:", error)
      toast({
        title: "Error processing media",
        description: "An error occurred while processing your media file.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Stop all audio playback
  const stopAllAudio = () => {
    // Stop original audio if playing
    if (originalAudioRef.current) {
      originalAudioRef.current.pause()
      if (originalAudioRef.current.src) {
        URL.revokeObjectURL(originalAudioRef.current.src)
      }
      originalAudioRef.current = null
    }

    // Stop translated audio if playing
    if (translatedAudioRef.current) {
      translatedAudioRef.current.pause()
      if (translatedAudioRef.current.src) {
        URL.revokeObjectURL(translatedAudioRef.current.src)
      }
      translatedAudioRef.current = null
    }

    // Cancel any ongoing speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    // Reset states
    setIsPlayingOriginal(false)
    setIsPlayingTranslated(false)
    setIsGeneratingAudio(false)
  }

  const playOriginalAudio = async () => {
    if (isPlayingOriginal) {
      stopAllAudio()
      return
    }

    if (!transcription) {
      toast({
        title: "No Transcription Available",
        description: "Process a media file first to get a transcription.",
        variant: "destructive",
      })
      return
    }

    try {
      // Stop any currently playing audio
      stopAllAudio()

      // Set playing state
      setIsPlayingOriginal(true)

      // If we have the original audio file, play it
      if (audioBlob && audioBlob.type.startsWith("audio/")) {
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)

        audio.onended = () => {
          setIsPlayingOriginal(false)
          URL.revokeObjectURL(audioUrl)
          originalAudioRef.current = null
        }

        audio.onerror = (e) => {
          console.error("Error playing original audio:", e)
          setIsPlayingOriginal(false)
          URL.revokeObjectURL(audioUrl)
          originalAudioRef.current = null

          // Fall back to speech synthesis
          speakText(transcription, "en-US")
        }

        originalAudioRef.current = audio
        await audio.play()
        return
      }

      // If we don't have the original audio or it's not an audio file,
      // use speech synthesis to read the transcription
      speakText(transcription, "en-US")
    } catch (error) {
      console.error("Error playing original audio:", error)
      setIsPlayingOriginal(false)

      toast({
        title: "Audio Playback Error",
        description: "Could not play the original audio. Falling back to speech synthesis.",
        variant: "destructive",
      })

      // Try speech synthesis as a fallback
      speakText(transcription, "en-US")
    }
  }

  const playTranslatedAudio = () => {
    if (isPlayingTranslated) {
      stopAllAudio()
      return
    }

    if (!translation) {
      toast({
        title: "No Translation Available",
        description: "Process a media file first to get a translation.",
        variant: "destructive",
      })
      return
    }

    try {
      // Stop any currently playing audio
      stopAllAudio()

      // Set playing state
      setIsPlayingTranslated(true)

      // Map target language to BCP 47 language tag for speech synthesis
      const langMap: Record<string, string> = {
        en: "en-US",
        es: "es-ES",
        fr: "fr-FR",
        de: "de-DE",
        nl: "nl-NL",
        it: "it-IT",
        pt: "pt-PT",
        ru: "ru-RU",
        zh: "zh-CN",
        ja: "ja-JP",
      }

      const langTag = langMap[targetLanguage] || "en-US"

      // Use speech synthesis to read the translation
      speakText(translation, langTag)
    } catch (error) {
      console.error("Error playing translated audio:", error)
      setIsPlayingTranslated(false)

      toast({
        title: "Audio Playback Error",
        description: "Could not play the translated audio.",
        variant: "destructive",
      })
    }
  }

  // Helper function to speak text using the Web Speech API
  const speakText = (text: string, lang: string) => {
    if (!("speechSynthesis" in window)) {
      console.error("Speech synthesis not supported")
      toast({
        title: "Speech Synthesis Not Supported",
        description: "Your browser does not support speech synthesis.",
        variant: "destructive",
      })
      setIsPlayingOriginal(false)
      setIsPlayingTranslated(false)
      return
    }

    try {
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang

      // Set up event handlers
      utterance.onend = () => {
        setIsPlayingOriginal(false)
        setIsPlayingTranslated(false)
      }

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event)
        setIsPlayingOriginal(false)
        setIsPlayingTranslated(false)

        toast({
          title: "Speech Synthesis Error",
          description: "An error occurred while generating speech.",
          variant: "destructive",
        })
      }

      // Start speaking
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error("Error with speech synthesis:", error)
      setIsPlayingOriginal(false)
      setIsPlayingTranslated(false)

      toast({
        title: "Speech Synthesis Error",
        description: "An error occurred while generating speech.",
        variant: "destructive",
      })
    }
  }

  const downloadTranscription = () => {
    if (!transcription) return

    const blob = new Blob([transcription], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transcription_${file?.name || "audio"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadTranslation = () => {
    if (!translation) return

    const blob = new Blob([translation], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `translation_${targetLanguage}_${file?.name || "audio"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Helper function to get language name from code
  const getLanguageName = (code: string): string => {
    const languages: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      nl: "Dutch",
      it: "Italian",
      pt: "Portuguese",
      ru: "Russian",
      zh: "Chinese",
      ja: "Japanese",
    }
    return languages[code] || code
  }

  // Open chat dialog and initialize with system message
  const openChat = () => {
    // Reset chat messages and add initial system message
    setChatMessages([
      {
        role: "assistant",
        content: "I can answer questions about the content and related topics. What would you like to know?",
        id: Date.now().toString(),
      },
    ])
    setIsChatOpen(true)
  }

  // Handle chat input submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!chatInput.trim() || isSendingMessage) return

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
      id: Date.now().toString(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    const currentInput = chatInput
    setChatInput("")
    setIsSendingMessage(true)

    try {
      // Use content ID if available, otherwise use a simplified approach
      let response

      if (contentId) {
        // Use the content ID to reference server-stored content
        response = await fetch("/api/chat-with-id", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: currentInput,
            contentId: contentId,
          }),
        })
      } else {
        // Extract key information - only first 500 chars of each to keep payload small
        const shortTranscription = transcription.substring(0, 500)
        const shortTranslation = translation.substring(0, 500)

        response = await fetch("/api/chat-simple", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: currentInput,
            transcription: shortTranscription,
            translation: shortTranslation,
            language: targetLanguage,
            hasMore: transcription.length > 500 || translation.length > 500,
          }),
        })
      }

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.status}`)
      }

      const data = await response.json()

      // Add assistant response to chat
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content,
          id: (Date.now() + 1).toString(),
        },
      ])
    } catch (error) {
      console.error("Error in chat:", error)

      // Add error message
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error while processing your question. Please try again.",
          id: (Date.now() + 1).toString(),
        },
      ])

      toast({
        title: "Chat Error",
        description: "An error occurred while processing your question.",
        variant: "destructive",
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Media Translation</CardTitle>
        <CardDescription>Upload audio or video files for transcription and translation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload Media File</Label>
          <FileUploader
            id="file-upload"
            onFilesSelected={handleFileChange}
            accept=".mp3,.mp4,.wav,.avi"
            maxSize={100} // 100MB
            multiple={false}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected file: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-language">Target Language</Label>
          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger id="target-language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="nl">Dutch</SelectItem>
              <SelectItem value="it">Italian</SelectItem>
              <SelectItem value="pt">Portuguese</SelectItem>
              <SelectItem value="ru">Russian</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={processMedia} disabled={!file || isProcessing} className="w-full">
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Process Media"
          )}
        </Button>

        {(transcription || translation) && (
          <Tabs defaultValue="transcription" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transcription">Transcription</TabsTrigger>
              <TabsTrigger value="translation">Translation</TabsTrigger>
            </TabsList>

            <TabsContent value="transcription" className="mt-4 space-y-4">
              <Textarea value={transcription} readOnly className="min-h-[200px]" />
              {transcription && (
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={playOriginalAudio} disabled={isPlayingTranslated}>
                    {isPlayingOriginal ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Stop Audio
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Play Transcription
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadTranscription}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Transcription
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="translation" className="mt-4 space-y-4">
              <Textarea value={translation} readOnly className="min-h-[200px]" />
              {translation && (
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={playTranslatedAudio}
                    disabled={isPlayingOriginal || isGeneratingAudio}
                  >
                    {isGeneratingAudio ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Audio...
                      </>
                    ) : isPlayingTranslated ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Stop Audio
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Play Translation
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadTranslation}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Translation
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter>
        {(transcription || translation) && (
          <Button variant="outline" className="w-full" onClick={openChat}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat with this content
          </Button>
        )}
      </CardFooter>

      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chat about Media Content</DialogTitle>
            <DialogDescription>
              Ask questions about the content or related topics. The AI can answer based on the content and its general
              knowledge.
            </DialogDescription>
          </DialogHeader>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4 min-h-[300px] max-h-[400px]">
            {chatMessages.map((message) => (
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
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="flex items-end gap-2 mt-4">
            <Input
              placeholder="Ask anything about the content or related topics..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isSendingMessage}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isSendingMessage || !chatInput.trim()}>
              {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
