"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MediaProcessor } from "@/components/features/media-processor"
import { DocumentChat } from "@/components/features/document-chat"
import { WebsiteChat } from "@/components/features/website-chat"
import { MainChat } from "@/components/features/main-chat"
import { Header } from "@/components/header"

export function MainDashboard() {
  const [activeTab, setActiveTab] = useState("chat")

  return (
    <div className="container mx-auto px-4 py-6">
      <Header />

      <Tabs defaultValue="chat" className="mt-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">Chat Assistant</TabsTrigger>
          <TabsTrigger value="media">Media Translation</TabsTrigger>
          <TabsTrigger value="documents">Document Chat</TabsTrigger>
          <TabsTrigger value="website">Website Knowledge</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <MainChat />
        </TabsContent>

        <TabsContent value="media" className="mt-6">
          <MediaProcessor />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentChat />
        </TabsContent>

        <TabsContent value="website" className="mt-6">
          <WebsiteChat />
        </TabsContent>
      </Tabs>
    </div>
  )
}
