export function VoiceButton({ state, onClick }) {
  const isListening = state === 'listening'
  const isResponding = state === 'responding'

  return (
    <button
      className={`voice-btn ${isListening ? 'voice-btn--listening' : ''} ${isResponding ? 'voice-btn--responding' : ''}`}
      onClick={onClick}
      disabled={isResponding}
      aria-label={isListening ? 'Detener escucha' : 'Hablar con Jarvis'}
    >
      {isListening ? (
        // Stop icon when listening
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        // Mic icon
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      )}
    </button>
  )
}
