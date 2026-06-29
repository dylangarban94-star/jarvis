import { useState, useCallback, useEffect } from 'react'
import { NeuralSphere } from './components/NeuralSphere'
import { VoiceButton } from './components/VoiceButton'
import { GlassOverlay } from './components/GlassOverlay'
import { useVoice } from './hooks/useVoice'
import { useAudio } from './hooks/useAudio'
import { useObsidian } from './hooks/useObsidian'
import { askClaude } from './services/claude'
import './App.css'

export default function App() {
  const [state, setState] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [error, setError] = useState('')

  const { isListening, transcript: liveTranscript, voiceLevel, startListening, stopListening } = useVoice()
  const { isSpeaking, audioLevel, playAudio } = useAudio()
  const { fetchContext } = useObsidian()

  // Sync sphere state with audio/voice activity
  const sphereState = isSpeaking ? 'responding' : state

  // If recognition ends without a result (timeout / silence), reset to idle
  useEffect(() => {
    if (!isListening && state === 'listening') {
      setState('idle')
    }
  }, [isListening, state])

  const handleVoiceResult = useCallback(async (text) => {
    setTranscript(text)
    setResponse('')
    setError('')
    setState('processing')

    try {
      const context = await fetchContext(text)
      const reply = await askClaude(text, context)
      setResponse(reply)

      await playAudio(reply)
    } catch (err) {
      console.error('Pipeline error:', err)
      setError('Hubo un error en el sistema. Intente de nuevo, Señor.')
    } finally {
      setState('idle')
    }
  }, [fetchContext, playAudio])

  const handleButtonClick = useCallback(() => {
    if (state === 'idle') {
      setTranscript('')
      setResponse('')
      setError('')
      setState('listening')
      startListening(handleVoiceResult)
    } else if (state === 'listening') {
      stopListening()
      setState('idle')
    }
    // 'responding' → button is disabled
  }, [state, startListening, stopListening, handleVoiceResult])

  // Show live transcript while listening
  const displayTranscript = state === 'listening' ? liveTranscript : transcript

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">J</span>
        <span className="app-title">JARVIS</span>
      </header>

      <main className="app-main">
        <div className="sphere-wrapper">
          <NeuralSphere
            state={sphereState}
            audioLevel={audioLevel}
            voiceLevel={voiceLevel}
          />
        </div>

        <GlassOverlay
          state={sphereState}
          transcript={displayTranscript}
          response={response}
          error={error}
        />
      </main>

      <footer className="app-footer">
        <VoiceButton state={state} onClick={handleButtonClick} />
      </footer>
    </div>
  )
}
