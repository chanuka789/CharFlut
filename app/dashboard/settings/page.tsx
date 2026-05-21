'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [toast, setToast] = useState('')
  const [notifications, setNotifications] = useState({
    orders: true,
    promotions: false,
    wishlist: true,
    newsletter: false,
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const [profile, setProfile] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    bio: '',
  })

  return (
    <>
      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Account Settings</h1>
      </div>

      {/* Profile */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <span className="panel-title">Profile Information</span>
        </div>
        <div className="panel-body">
          <div className="f-row">
            <div className="f-group">
              <label className="f-label">Full Name</label>
              <input
                className="f-input"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
            <div className="f-group">
              <label className="f-label">Email Address</label>
              <input
                className="f-input"
                value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
                type="email"
              />
            </div>
          </div>
          <div className="f-group">
            <label className="f-label">Phone Number</label>
            <input
              className="f-input"
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder="+1 (555) 000-0000"
              type="tel"
            />
          </div>
          <div className="f-group">
            <label className="f-label">Bio (optional)</label>
            <textarea
              className="f-textarea"
              value={profile.bio}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              placeholder="Tell us a bit about yourself..."
              rows={3}
            />
          </div>
          <button className="btn-p" onClick={() => showToast('Profile updated successfully!')}>
            Save Changes
          </button>
        </div>
      </div>

      {/* Password change */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <span className="panel-title">Change Password</span>
        </div>
        <div className="panel-body">
          <div className="f-group">
            <label className="f-label">Current Password</label>
            <input className="f-input" type="password" placeholder="••••••••" />
          </div>
          <div className="f-row">
            <div className="f-group">
              <label className="f-label">New Password</label>
              <input className="f-input" type="password" placeholder="Min 8 characters" />
            </div>
            <div className="f-group">
              <label className="f-label">Confirm New Password</label>
              <input className="f-input" type="password" placeholder="Repeat password" />
            </div>
          </div>
          <button className="btn-p" onClick={() => showToast('Password updated!')}>
            Update Password
          </button>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <span className="panel-title">Notification Preferences</span>
        </div>
        <div className="panel-body">
          {[
            { key: 'orders', label: 'Order Updates', desc: 'Get notified about your order status changes' },
            { key: 'promotions', label: 'Promotions & Deals', desc: 'Receive exclusive offers and discount codes' },
            { key: 'wishlist', label: 'Wishlist Alerts', desc: 'Know when wishlist items go on sale' },
            { key: 'newsletter', label: 'Newsletter', desc: 'Weekly curated picks and style guides' },
          ].map(item => (
            <div key={item.key} className="toggle-row">
              <div className="toggle-info">
                <span className="toggle-name">{item.label}</span>
                <span className="toggle-desc">{item.desc}</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications[item.key as keyof typeof notifications]}
                  onChange={e => setNotifications(n => ({ ...n, [item.key]: e.target.checked }))}
                />
                <div className="toggle-track" />
                <div className="toggle-thumb" style={{ transform: notifications[item.key as keyof typeof notifications] ? 'translateX(16px)' : undefined, background: notifications[item.key as keyof typeof notifications] ? 'var(--accent)' : undefined }} />
              </label>
            </div>
          ))}
          <button className="btn-p" style={{ marginTop: 16 }} onClick={() => showToast('Preferences saved!')}>
            Save Preferences
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="panel" style={{ border: '1px solid rgba(255,92,92,0.15)' }}>
        <div className="panel-header">
          <span className="panel-title" style={{ color: 'var(--danger)' }}>Danger Zone</span>
        </div>
        <div className="panel-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Delete Account</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Permanently delete your account and all data. This cannot be undone.</div>
            </div>
            <button className="btn-d">Delete Account</button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast toast-success">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast}
        </div>
      )}
    </>
  )
}
