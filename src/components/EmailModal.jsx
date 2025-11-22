import React, { useState } from 'react'
import { queueClubEmail } from '../utils/emailService'
import { useAuth } from '../contexts/AuthContext'

const EmailModal = ({ recipient, onClose }) => {
  const { user } = useAuth()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(null)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setStatus(null)
    try {
      await queueClubEmail({
        to: recipient.email,
        subject,
        message,
        createdBy: user?.id || null
      })
      setStatus({ type: 'success', text: 'Email queued for delivery.' })
      setSubject('')
      setMessage('')
    } catch (error) {
      setStatus({ type: 'error', text: error.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-panel">
        <button className="modal-close" onClick={onClose} aria-label="Close email composer">
          ✕
        </button>
        <h2 className="app-heading-md" style={{ marginBottom: '0.5rem' }}>
          Email {recipient.name}
        </h2>
        <p className="app-text-muted" style={{ marginBottom: '1rem' }}>
          Message will be sent through the club email system.
        </p>
        <form onSubmit={handleSubmit} className="app-page" style={{ gap: '1rem' }}>
          <div>
            <label className="app-text-muted text-sm">Subject</label>
            <input
              type="text"
              className="app-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="app-text-muted text-sm">Message</label>
            <textarea
              className="app-input"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          {status && (
            <p style={{ color: status.type === 'error' ? '#fda4af' : '#86efac' }}>{status.text}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="app-btn app-btn-outline app-btn-pill" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="app-btn app-btn-primary app-btn-pill" disabled={sending}>
              {sending ? 'Sending…' : 'Send Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EmailModal
