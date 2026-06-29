export async function textToSpeech(text) {
  const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.80,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`ElevenLabs API error ${response.status}`)
  }

  const blob = await response.blob()
  return URL.createObjectURL(blob)
}
