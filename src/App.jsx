import { useState } from 'react'
import PCSim from './PCSim.jsx'
import MobileSim from './MobileSim.jsx'

export default function App() {
  const [mode, setMode] = useState(() => window.innerWidth < 768 ? 'sp' : 'pc')

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* mode switcher */}
      <div style={{
        position: 'fixed', bottom: 16, right: 16, zIndex: 10000,
        display: 'flex', gap: 6, background: '#1B3F6B',
        borderRadius: 24, padding: '6px 10px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
      }}>
        {[{k:'pc',l:'💻 PC版'},{k:'sp',l:'📱 SP版'}].map(t => (
          <button key={t.k} onClick={() => setMode(t.k)} style={{
            padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 16,
            border: 'none', cursor: 'pointer',
            background: mode === t.k ? '#2E75B6' : 'transparent',
            color: '#fff',
          }}>{t.l}</button>
        ))}
      </div>

      {mode === 'pc' ? <PCSim /> : <MobileSim />}
    </div>
  )
}
