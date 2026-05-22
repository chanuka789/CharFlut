'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<'signin' | 'register'>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Sign in form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  // Register form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)

  useEffect(() => {
    if (session) router.push('/dashboard')
  }, [session, router])

  const getPasswordStrength = (pass: string) => {
    let score = 0
    if (pass.length >= 8) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++
    return score
  }

  const handleRegPasswordChange = (val: string) => {
    setRegPassword(val)
    setPasswordStrength(getPasswordStrength(val))
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError('Invalid email or password. Please try again.')
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/dashboard'), 1800)
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (regPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!agreeTerms) {
      setError('Please agree to the terms and conditions')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${firstName} ${lastName}`, email: regEmail, password: regPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
      } else {
        const result = await signIn('credentials', {
          email: regEmail,
          password: regPassword,
          redirect: false,
        })
        if (result?.error) {
          setError('Account created but sign-in failed. Please sign in manually.')
          setTab('signin')
        } else {
          setSuccess(true)
          setTimeout(() => router.push('/dashboard'), 1800)
        }
      }
    } catch {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const strengthColors = ['', '#FF5C5C', '#FFD32C', '#60A5FA', '#34D399']
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 100px 20px 40px;
        }
        .auth-card {
          width: 100%;
          max-width: 480px;
          border-radius: 28px;
          padding: 40px;
          position: relative;
        }
        .auth-logo {
          text-align: center;
          margin-bottom: 32px;
        }
        .auth-logo-mark {
          width: 48px; height: 48px;
          background: var(--accent-primary);
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
          color: #000;
          margin-bottom: 12px;
        }
        .auth-logo-name {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }
        [data-theme="light"] .auth-logo-name { color: #0a0a0b; }

        .auth-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 28px;
          background: rgba(255,255,255,0.04);
          border-radius: 999px;
          padding: 4px;
          border: 1px solid var(--border);
        }
        .auth-tab {
          flex: 1;
          padding: 10px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: none;
          color: var(--text-muted);
          transition: all 0.25s var(--spring);
          font-family: inherit;
        }
        .auth-tab.active {
          background: var(--accent-primary);
          color: #000;
        }

        .form-group { margin-bottom: 16px; }
        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        [data-theme="light"] .form-label { color: rgba(0,0,0,0.55); }
        .form-input-wrap { position: relative; }
        .form-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255,255,255,0.07);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
          transition: all 0.18s;
        }
        .form-input::placeholder { color: var(--text-muted); }
        .form-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(255,211,44,0.12);
          background: rgba(255,211,44,0.02);
          outline: none;
        }
        [data-theme="light"] .form-input {
          color: #0a0a0b;
          background: rgba(255,255,255,0.70);
          border-color: rgba(0,0,0,0.10);
        }
        [data-theme="light"] .form-input::placeholder { color: rgba(0,0,0,0.35); }

        .pass-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 4px;
          transition: color 0.15s;
        }
        .pass-toggle:hover { color: var(--text-primary); }

        .strength-bar {
          display: flex;
          gap: 4px;
          margin-top: 8px;
        }
        .strength-seg {
          flex: 1;
          height: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,0.1);
          transition: background 0.3s;
        }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .form-extras {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .remember-label { display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-secondary); }
        .remember-label input { accent-color: var(--accent-primary); }
        .forgot-link { color: var(--accent-primary); text-decoration: none; font-size: 13px; }
        [data-theme="light"] .forgot-link { color: #B5901E; }

        .terms-label { display: flex; gap: 10px; align-items: flex-start; cursor: pointer; color: var(--text-secondary); font-size: 13px; line-height: 1.5; margin-bottom: 20px; }
        .terms-label input { accent-color: var(--accent-primary); margin-top: 2px; flex-shrink: 0; }
        .terms-link { color: var(--accent-primary); }
        [data-theme="light"] .terms-link { color: #B5901E; }

        .error-box {
          padding: 12px 16px;
          background: rgba(255,92,92,0.10);
          border: 1px solid rgba(255,92,92,0.25);
          border-radius: 10px;
          color: var(--danger);
          font-size: 13px;
          margin-bottom: 16px;
        }

        .social-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 20px 0;
          color: var(--text-muted);
          font-size: 12px;
        }
        .social-divider::before, .social-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .social-btns { display: flex; flex-direction: column; gap: 10px; }
        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.05);
          color: var(--text-primary);
          transition: all 0.2s;
          font-family: inherit;
          width: 100%;
        }
        .social-btn:hover { background: rgba(255,255,255,0.10); border-color: rgba(255,255,255,0.25); }
        [data-theme="light"] .social-btn { background: rgba(0,0,0,0.03); color: #0a0a0b; border-color: rgba(0,0,0,0.10); }
        [data-theme="light"] .social-btn:hover { background: rgba(0,0,0,0.06); }

        .success-overlay {
          position: absolute;
          inset: 0;
          border-radius: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(10,10,11,0.95);
          backdrop-filter: blur(20px);
          gap: 16px;
          animation: fadeIn 0.3s ease;
          z-index: 10;
        }
        [data-theme="light"] .success-overlay { background: rgba(244,242,238,0.95); }
        .success-spinner {
          width: 56px; height: 56px;
          border: 4px solid rgba(255,211,44,0.2);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @media (max-width: 520px) {
          .auth-card { padding: 28px 20px; }
          .form-row { grid-template-columns: 1fr; }
        }
      ` }} />

      <div className="auth-page">
        <div className="auth-card glass">
          {/* Success overlay */}
          {success && (
            <div className="success-overlay">
              <div className="success-spinner" />
              <div style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: 16 }}>Welcome to CharFlut!</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Redirecting to your dashboard…</div>
            </div>
          )}

          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-mark">CF</div>
            <div className="auth-logo-name">CharFlut</div>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab${tab === 'signin' ? ' active' : ''}`} onClick={() => { setTab('signin'); setError('') }}>
              Sign In
            </button>
            <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setError('') }}>
              Register
            </button>
          </div>

          {/* Error */}
          {error && <div className="error-box">{error}</div>}

          {/* Sign In Form */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="form-input-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                    {showPass ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-extras">
                <label className="remember-label">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  Remember me
                </label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: 15 }}
                disabled={loading}
              >
                {loading ? (
                  <div style={{ width: 20, height: 20, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : 'Sign In'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Jane"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Doe"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="form-input-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Min 8 characters"
                    value={regPassword}
                    onChange={e => handleRegPasswordChange(e.target.value)}
                    required
                    minLength={8}
                    style={{ paddingRight: 44 }}
                    autoComplete="new-password"
                  />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {regPassword && (
                  <>
                    <div className="strength-bar">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="strength-seg"
                          style={{ background: i <= passwordStrength ? strengthColors[passwordStrength] : undefined }}
                        />
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: strengthColors[passwordStrength], marginTop: 4, fontWeight: 600 }}>
                      {strengthLabels[passwordStrength]}
                    </div>
                  </>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="form-input-wrap">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    style={{ paddingRight: 44, borderColor: confirmPassword && confirmPassword !== regPassword ? 'var(--danger)' : undefined }}
                    autoComplete="new-password"
                  />
                  <button type="button" className="pass-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== regPassword && (
                  <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>Passwords don't match</div>
                )}
              </div>

              <label className="terms-label">
                <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} />
                I agree to the <a href="#" className="terms-link">Terms of Service</a> and <a href="#" className="terms-link">Privacy Policy</a>
              </label>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: 15 }}
                disabled={loading}
              >
                {loading ? (
                  <div style={{ width: 20, height: 20, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : 'Create Account'}
              </button>
            </form>
          )}

          {/* Social auth */}
          <div className="social-divider">or continue with</div>
          <div className="social-btns">
            <button
              className="social-btn"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button className="social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
            {tab === 'signin' ? (
              <>Don't have an account? <button onClick={() => setTab('register')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 600, fontSize: 13 }}>Create one</button></>
            ) : (
              <>Already have an account? <button onClick={() => setTab('signin')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 600, fontSize: 13 }}>Sign in</button></>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
