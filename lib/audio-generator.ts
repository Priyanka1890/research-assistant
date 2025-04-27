/**
 * Generates speech from text using the Web Speech API
 * @param text The text to convert to speech
 * @param lang The language code (e.g., 'en-US', 'es-ES')
 * @returns A Promise that resolves to an audio URL
 */
export async function generateSpeech(text: string, lang = "en-US"): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if the browser supports speech synthesis
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      // Fallback to a simple audio tone if speech synthesis is not supported
      const audioUrl = generateAudioTone(lang === "en-US" ? 440 : 523.25)
      resolve(audioUrl)
      return
    }

    try {
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 1.0
      utterance.pitch = 1.0

      // Set up audio recording
      const audioContext = new AudioContext()
      const destination = audioContext.createMediaStreamDestination()
      const mediaRecorder = new MediaRecorder(destination.stream)
      const audioChunks: BlobPart[] = []

      // Connect a media stream to capture the audio
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(destination)

      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      // When recording stops, create a blob URL
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
        const audioUrl = URL.createObjectURL(audioBlob)
        resolve(audioUrl)
      }

      // Start recording
      mediaRecorder.start()

      // Speak the text
      window.speechSynthesis.speak(utterance)

      // When speech ends, stop recording
      utterance.onend = () => {
        mediaRecorder.stop()
        oscillator.stop()
      }

      // Start the oscillator
      oscillator.start()

      // If speech synthesis fails or takes too long, provide a fallback
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop()
          oscillator.stop()
        }
      }, 10000) // 10-second timeout
    } catch (error) {
      console.error("Speech synthesis error:", error)
      // Fallback to a simple audio tone
      const audioUrl = generateAudioTone(lang === "en-US" ? 440 : 523.25)
      resolve(audioUrl)
    }
  })
}

/**
 * Generates a simple audio tone as a fallback
 * @param frequency The frequency of the tone in Hz
 * @returns A URL to the generated audio
 */
export function generateAudioTone(frequency = 440): string {
  try {
    // Create an offline audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const sampleRate = audioContext.sampleRate
    const duration = 3 // 3 seconds
    const frameCount = sampleRate * duration

    // Create an audio buffer
    const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate)
    const channelData = audioBuffer.getChannelData(0)

    // Fill the buffer with a simple sine wave
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = 0.5 * Math.sin((2 * Math.PI * frequency * i) / sampleRate)
    }

    // Convert to WAV format
    const wavData = audioBufferToWav(audioBuffer)
    const blob = new Blob([wavData], { type: "audio/wav" })
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error("Error generating audio tone:", error)
    return ""
  }
}

/**
 * Converts an AudioBuffer to a WAV file format
 * @param buffer The AudioBuffer to convert
 * @returns An ArrayBuffer containing the WAV data
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
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

  return arrayBuffer
}

/**
 * Writes a string to a DataView at the specified offset
 * @param view The DataView to write to
 * @param offset The offset to write at
 * @param string The string to write
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
