import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ChatBar, ChatPanel } from '../src'
import '../styles/index.css'
import './demo.css'
import { scenes, sceneIds } from './scenes'

function getSceneId(): string {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('scene') || 'collapsed'
  return sceneIds.includes(id) ? id : 'collapsed'
}

function Demo() {
  const sceneId = getSceneId()
  const scene = scenes[sceneId]
  const [open, setOpen] = useState(scene.open)
  const [pending, setPending] = useState(scene.pendingConfirmation ?? null)

  return (
    <div className="demo-shell">
      <header className="demo-shell__header">
        <div className="demo-shell__brand">acme · billing</div>
        <div className="demo-shell__bar">
          <div className="demo-shell__bar-wrap">
            <ChatBar
              onClick={() => setOpen((v) => !v)}
              open={open}
              placeholder="Ask the assistant…"
            />
            {scene.unreadBadge && (
              // Demo-only adornment: the library doesn't yet expose
              // an unread-count prop, so the screenshot scene paints
              // a small badge directly. Tracking adding it as a
              // first-class prop separately.
              <span className="demo-shell__badge" aria-label="1 new message">
                1
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="demo-shell__main">
        <h1>{scene.title}</h1>
        <p className="demo-shell__caption">
          Scene id: <code>{scene.id}</code>
        </p>
        <div className="demo-shell__placeholder">
          <p>Pretend this is the host application.</p>
        </div>
      </main>

      <ChatPanel
        open={open}
        onClose={() => setOpen(false)}
        messages={scene.messages}
        isStreaming={scene.isStreaming ?? false}
        isLoading={scene.isLoading ?? false}
        onSendMessage={() => {
          /* no-op for screenshots */
        }}
        onCancelStream={() => {
          /* no-op for screenshots */
        }}
        pendingConfirmation={pending}
        onResolveConfirmation={() => setPending(null)}
        title="Acme assistant"
      />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
)
