import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { mediaId: string } }) {
  try {
    const mediaId = Number.parseInt(params.mediaId)

    if (isNaN(mediaId)) {
      return NextResponse.json({ error: "Invalid media ID" }, { status: 400 })
    }

    // Get the media file path from the database
    const result = await sql`
      SELECT storage_path, file_type
      FROM media
      WHERE id = ${mediaId}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    const { storage_path, file_type } = result[0]

    // In a real implementation, we would retrieve the file from storage
    // For now, we'll return a mock response

    // Create a simple audio response
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.type = "sine"
    oscillator.frequency.value = 440 // A4 note
    gainNode.gain.value = 0.5

    oscillator.start()

    // Record 3 seconds of audio
    const duration = 3
    const sampleRate = 44100
    const frameCount = sampleRate * duration

    const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate)
    const channelData = audioBuffer.getChannelData(0)

    // Generate a simple sine wave
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5
    }

    // Convert to WAV
    const wavBuffer = audioBufferToWav(audioBuffer)

    // Return the audio file
    return new Response(wavBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": `attachment; filename="original_audio_${mediaId}.wav"`,
      },
    })
  } catch (error) {
    console.error("Error serving original audio:", error)
    return NextResponse.json({ error: "Failed to serve audio" }, { status: 500 })
  }
}

// Helper function to convert AudioBuffer to WAV format
function audioBufferToWav(buffer: AudioBuffer) {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample

  const dataLength = buffer.length * numChannels * bytesPerSample
  const bufferLength = 44 + dataLength

  const arrayBuffer = new ArrayBuffer(bufferLength)
  const view = new DataView(arrayBuffer)

  // RIFF identifier
  writeString(view, 0, "RIFF")
  // RIFF chunk length
  view.setUint32(4, 36 + dataLength, true)
  // RIFF type
  writeString(view, 8, "WAVE")
  // format chunk identifier
  writeString(view, 12, "fmt ")
  // format chunk length
  view.setUint32(16, 16, true)
  // sample format (raw)
  view.setUint16(20, format, true)
  // channel count
  view.setUint16(22, numChannels, true)
  // sample rate
  view.setUint32(24, sampleRate, true)
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true)
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true)
  // bits per sample
  view.setUint16(34, bitDepth, true)
  // data chunk identifier
  writeString(view, 36, "data")
  // data chunk length
  view.setUint32(40, dataLength, true)

  // Write the PCM samples
  const offset = 44
  let pos = 0
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const channel = buffer.getChannelData(i)
    for (let j = 0; j < channel.length; j++) {
      const sample = Math.max(-1, Math.min(1, channel[j]))
      // Scale to 16-bit signed integer
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(offset + pos, value, true)
      pos += 2
    }
  }

  return new Uint8Array(arrayBuffer)
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
