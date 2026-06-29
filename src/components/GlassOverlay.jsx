const STATUS_LABELS = {
  idle: 'En reposo',
  listening: 'Escuchando…',
  processing: 'Procesando…',
  responding: 'Respondiendo…'
}

export function GlassOverlay({ state, transcript, response, error }) {
  const hasContent = transcript || response || error

  return (
    <div className={`glass-overlay ${hasContent ? 'glass-overlay--active' : ''}`}>
      <div className="glass-status">
        <span className={`glass-dot glass-dot--${state}`} />
        <span className="glass-status-text">{STATUS_LABELS[state] || 'En reposo'}</span>
      </div>

      {transcript && (
        <div className="glass-transcript">
          <span className="glass-label">Señor dijo</span>
          <p>{transcript}</p>
        </div>
      )}

      {response && (
        <div className="glass-response">
          <p>{response}</p>
        </div>
      )}

      {error && (
        <div className="glass-error">
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
