import { MainChat } from "@/components/features/main-chat"
import { MediaProcessor } from "@/components/features/media-processor"
import { DocumentChat } from "@/components/features/document-chat"
import { WebsiteChat } from "@/components/features/website-chat"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiKeyWarning } from "@/components/api-key-warning"

export default function Home() {
  return (
    <main className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">UMG Research Assistant</h1>

      <ApiKeyWarning />

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="chat">General Chat</TabsTrigger>
          <TabsTrigger value="media">Media Translation</TabsTrigger>
          <TabsTrigger value="documents">Document Chat</TabsTrigger>
          <TabsTrigger value="website">Website Knowledge</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-0">
          <MainChat />
        </TabsContent>

        <TabsContent value="media" className="mt-0">
          <MediaProcessor />
        </TabsContent>

        <TabsContent value="documents" className="mt-0">
          <DocumentChat />
        </TabsContent>

        <TabsContent value="website" className="mt-0">
          <WebsiteChat />
        </TabsContent>
      </Tabs>
    </main>
  )
}
