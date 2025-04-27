import { type NextRequest, NextResponse } from "next/server"
import { indexWebsite } from "@/app/actions"

// Adjust maxDuration to comply with hobby plan limits (max 60 seconds)
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const result = await indexWebsite(formData)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error indexing website:", error)
    return NextResponse.json({ error: "Failed to index website" }, { status: 500 })
  }
}
