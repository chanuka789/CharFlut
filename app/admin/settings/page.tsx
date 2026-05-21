'use client'

export default function AdminSettingsPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Settings</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Store configuration</p>
        </div>
      </div>

      <div className="panel" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
        <p style={{ fontSize: 15, marginBottom: 8 }}>Settings coming soon</p>
        <p style={{ fontSize: 13 }}>Store name, currency, shipping rules, tax rates, and more.</p>
      </div>
    </>
  )
}
