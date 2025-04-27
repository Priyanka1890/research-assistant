import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    apiKeyAvailable: !!process.env.OPENAI_API_KEY,
  })
}
