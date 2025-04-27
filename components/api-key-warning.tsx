"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export function ApiKeyWarning() {
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      // Make a simple request to check if the OpenAI API key is available
      fetch("/api/check-api-key")
        .then((res) => res.json())
        .then((data) => {
          setShowWarning(!data.apiKeyAvailable)
        })
        .catch(() => {
          // If there's an error, assume the API key is not available
          setShowWarning(true)
        })
    }
  }, [])

  if (!showWarning) return null

  return (
    <Alert variant="warning" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>OpenAI API Key Missing</AlertTitle>
      <AlertDescription>
        The OpenAI API key is not configured. The application will use mock responses instead of real AI-generated
        content. To enable full functionality, please add your OpenAI API key to the environment variables.
      </AlertDescription>
    </Alert>
  )
}
