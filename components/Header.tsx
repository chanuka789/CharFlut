'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  // Determine active nav
  const getActive = () => {
    if (pathname === '/') return 'home'
    if (pathname.startsWith('/shop') || pathname.startsWith('/products')) return 'shop'
    if (pathname.startsWith('/collections') || pathname.startsWith('/collection')) return 'collections'
    return ''
  }
  const active = getActive()

  useEffect(() => {
    // Load theme
    const stored = localStorage.getItem('cf_theme')
    const detected = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    setTheme(detected)

    const handleThemeChange = () => {
      setTheme(document.documentElement.dataset.theme || 'dark')
    }
    window.addEventListener('themechange', handleThemeChange)

    // Load cart count
    const updateCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cf_cart') || '[]')
        const count = cart.reduce((sum: number, item: any) => sum + (item.qty || 1), 0)
        setCartCount(count)
      } catch {}
    }
    updateCart()
    window.addEventListener('cf-cart-change', updateCart)

    // Scroll listener
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('themechange', handleThemeChange)
      window.removeEventListener('cf-cart-change', updateCart)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
    localStorage.setItem('cf_theme', next)
    setTheme(next)
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }))
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = headerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    el.style.setProperty('--lg-mx', x + '%')
    el.style.setProperty('--lg-my', y + '%')
    el.style.setProperty('--lg-active', '1')
  }

  const handleMouseLeave = () => {
    headerRef.current?.style.setProperty('--lg-active', '0')
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    const el = headerRef.current
    if (!el) return
    const touch = e.touches[0]
    if (!touch) return
    const rect = el.getBoundingClientRect()
    const x = ((touch.clientX - rect.left) / rect.width) * 100
    const y = ((touch.clientY - rect.top) / rect.height) * 100
    el.style.setProperty('--lg-mx', x + '%')
    el.style.setProperty('--lg-my', y + '%')
    el.style.setProperty('--lg-active', '1')
  }

  const handleTouchEnd = () => {
    headerRef.current?.style.setProperty('--lg-active', '0')
  }

  const openSearch = () => {
    setSearchOpen(true)
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  const getUserInitials = () => {
    if (!session?.user?.name) return '?'
    return session.user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
  }

  // Don't render header in admin panel
  if (pathname.startsWith('/admin')) return null

  return (
    <>
      <style>{`
        .lg-header-wrapper {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          width: calc(100% - 24px);
          max-width: 1100px;
        }

        .lg-hdr {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 8px 8px 24px;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.45),
            inset 0 -1px 0 rgba(0,0,0,0.20),
            0 8px 24px -8px rgba(0,0,0,0.45);
          transition: backdrop-filter 0.3s ease, border-color 0.3s ease;
          position: relative;
          isolation: isolate;
        }

        .lg-hdr::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: radial-gradient(circle 200px at var(--lg-mx, 50%) var(--lg-my, 50%),
            rgba(255,255,255,0.18), transparent 55%);
          opacity: var(--lg-active, 0);
          transition: opacity 0.4s ease;
          z-index: 0;
          mix-blend-mode: plus-lighter;
        }

        .lg-hdr > * { position: relative; z-index: 1; }

        .lg-hdr.scrolled {
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
        }

        [data-theme="light"] .lg-hdr {
          background: linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.55) 100%);
          border-color: rgba(0,0,0,0.10);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.95),
            inset 0 -1px 0 rgba(0,0,0,0.05),
            0 6px 20px -6px rgba(0,0,0,0.10);
        }

        [data-theme="light"] .lg-hdr::after {
          background: radial-gradient(circle 200px at var(--lg-mx, 50%) var(--lg-my, 50%),
            rgba(255,255,255,0.6), transparent 55%);
          mix-blend-mode: normal;
        }

        .lg-logo {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary, #fff);
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          margin-right: auto;
        }

        [data-theme="light"] .lg-logo { color: #0a0a0b; }

        .lg-nav {
          display: flex;
          gap: 4px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .lg-nav a {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 999px;
          transition: all 0.2s ease;
        }

        .lg-nav a:hover {
          color: #fff;
          background: rgba(255,255,255,0.06);
        }

        .lg-nav a.active {
          color: #FFD32C;
          background: rgba(255,211,44,0.10);
        }

        [data-theme="light"] .lg-nav a { color: rgba(0,0,0,0.60); }
        [data-theme="light"] .lg-nav a:hover { color: #0a0a0b; background: rgba(0,0,0,0.05); }
        [data-theme="light"] .lg-nav a.active { color: #B5901E; background: rgba(255,211,44,0.20); }

        .lg-right {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
        }

        .lg-ibtn {
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.75);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          text-decoration: none;
          backdrop-filter: blur(12px);
          flex-shrink: 0;
        }

        .lg-ibtn:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,211,44,0.4);
          color: #FFD32C;
          transform: translateY(-1px);
        }

        .lg-ibtn:active { transform: scale(0.94); }

        [data-theme="light"] .lg-ibtn {
          background: rgba(0,0,0,0.04);
          border-color: rgba(0,0,0,0.10);
          color: rgba(0,0,0,0.65);
        }

        [data-theme="light"] .lg-ibtn:hover {
          background: rgba(0,0,0,0.08);
          color: #B5901E;
          border-color: rgba(181,144,30,0.4);
        }

        .lg-cart-count {
          position: absolute;
          top: -3px;
          right: -3px;
          background: #FFD32C;
          color: #0a0a0b;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 999px;
          min-width: 17px;
          text-align: center;
          line-height: 1;
          border: 1.5px solid rgba(10,10,11,0.6);
        }

        [data-theme="light"] .lg-cart-count { border-color: rgba(255,255,255,0.9); }

        .lg-search {
          position: relative;
          display: flex;
          align-items: center;
          height: 36px;
        }

        .lg-search-in {
          width: 0;
          opacity: 0;
          padding: 0;
          height: 36px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 999px;
          color: #fff;
          font-family: inherit;
          font-size: 13px;
          outline: none;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
        }

        .lg-search-in::placeholder { color: rgba(255,255,255,0.4); }

        [data-theme="light"] .lg-search-in {
          background: rgba(0,0,0,0.04);
          border-color: rgba(0,0,0,0.10);
          color: #0a0a0b;
        }

        [data-theme="light"] .lg-search-in::placeholder { color: rgba(0,0,0,0.4); }

        .lg-search.open .lg-search-in {
          width: 220px;
          opacity: 1;
          padding: 0 40px 0 16px;
          pointer-events: all;
        }

        .lg-search.open .lg-ibtn {
          position: absolute;
          right: 0;
          background: transparent !important;
          border-color: transparent !important;
        }

        .lg-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FFD32C, #E6B800);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          color: #000;
          cursor: pointer;
          text-decoration: none;
          border: 2px solid rgba(255,211,44,0.3);
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          flex-shrink: 0;
        }

        .lg-user-avatar:hover {
          transform: scale(1.08);
          border-color: rgba(255,211,44,0.6);
        }

        .lg-theme-btn {
          width: 36px;
          height: 36px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.75);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(12px);
        }

        .lg-theme-btn:hover {
          transform: scale(1.1) rotate(15deg);
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,211,44,0.4);
          color: #FFD32C;
        }

        [data-theme="light"] .lg-theme-btn {
          background: rgba(0,0,0,0.04);
          border-color: rgba(0,0,0,0.12);
          color: rgba(0,0,0,0.65);
        }

        [data-theme="light"] .lg-theme-btn:hover {
          background: rgba(0,0,0,0.08);
          color: #B5901E;
        }

        .lg-menu-btn { display: none; }

        .lg-mobile-menu {
          display: none;
          position: fixed;
          top: 76px;
          left: 12px;
          right: 12px;
          z-index: 999;
          background: linear-gradient(135deg, rgba(20,20,22,0.95), rgba(10,10,11,0.90));
          backdrop-filter: blur(32px) saturate(180%);
          -webkit-backdrop-filter: blur(32px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 24px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
          padding: 12px;
          flex-direction: column;
          gap: 4px;
        }

        [data-theme="light"] .lg-mobile-menu {
          background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(244,242,238,0.88));
          border-color: rgba(0,0,0,0.08);
          box-shadow: 0 16px 40px rgba(0,0,0,0.12);
        }

        @keyframes menuSlideDown {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.97);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .lg-mobile-menu.open {
          display: flex;
          overflow-y: auto;
          max-height: calc(100vh - 90px);
          -webkit-overflow-scrolling: touch;
          animation: menuSlideDown 0.4s var(--spring) forwards;
        }

        .lg-mobile-menu a {
          padding: 14px 18px;
          font-size: 15px;
          font-weight: 500;
          color: #fff;
          text-decoration: none;
          border-radius: 16px;
          transition: background 0.15s;
        }

        [data-theme="light"] .lg-mobile-menu a { color: #0a0a0b; }
        .lg-mobile-menu a:hover { background: rgba(255,255,255,0.06); }
        [data-theme="light"] .lg-mobile-menu a:hover { background: rgba(0,0,0,0.04); }
        .lg-mobile-menu a.active { color: #FFD32C; background: rgba(255,211,44,0.08); }
        [data-theme="light"] .lg-mobile-menu a.active { color: #B5901E; background: rgba(255,211,44,0.18); }

        @media (max-width: 900px) {
          .lg-nav { display: none !important; }
          .lg-menu-btn { display: inline-flex !important; }
        }

        @media (max-width: 520px) {
          .lg-hdr { padding: 6px 6px 6px 14px; gap: 6px; }
          .lg-logo { font-size: 14px; min-width: 0; }
          .lg-search { display: none; }
          .lg-ibtn { width: 32px; height: 32px; }
          .lg-user-avatar { width: 32px; height: 32px; font-size: 11px; }
          .lg-theme-btn { width: 32px; height: 32px; }
        }
        @media (max-width: 360px) {
          .lg-header-wrapper { width: calc(100% - 16px); top: 8px; }
          .lg-hdr { padding: 6px 6px 6px 12px; }
          .lg-logo { font-size: 13px; }
        }
      `}</style>

      <div className="lg-header-wrapper">
        <nav
          ref={headerRef}
          className={`lg-hdr${scrolled ? ' scrolled' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchMove}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Link href="/" className="lg-logo">CharFlut</Link>

          <ul className="lg-nav">
            <li><Link href="/" className={active === 'home' ? 'active' : ''}>Home</Link></li>
            <li><Link href="/shop" className={active === 'shop' ? 'active' : ''}>Shop</Link></li>
            <li><Link href="/collections" className={active === 'collections' ? 'active' : ''}>Collections</Link></li>
            <li><Link href="/#about">About</Link></li>
          </ul>

          <div className="lg-right">
            {/* Theme Toggle */}
            <button
              className="lg-theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Search */}
            <div className={`lg-search${searchOpen ? ' open' : ''}`}>
              <input
                ref={searchInputRef}
                type="text"
                className="lg-search-in"
                placeholder="Search products…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setSearchOpen(false)
                  if (e.key === 'Enter' && searchQuery) {
                    window.location.href = `/shop?q=${encodeURIComponent(searchQuery)}`
                  }
                }}
                onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
                aria-label="Search products"
              />
              <button
                className="lg-ibtn"
                onClick={() => searchOpen && searchQuery ? undefined : openSearch()}
                aria-label="Search"
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            </div>

            {/* Profile */}
            {session?.user ? (
              <Link href="/dashboard" className="lg-user-avatar" title={session.user.name || 'Dashboard'}>
                {getUserInitials()}
              </Link>
            ) : (
              <Link href="/auth/signin" className="lg-ibtn" aria-label="Sign in" title="Sign in">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </Link>
            )}

            {/* Cart */}
            <Link href="/dashboard/wishlist" className="lg-ibtn" style={{ position: 'relative' }} aria-label="Cart">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {cartCount > 0 && <span className="lg-cart-count">{cartCount}</span>}
            </Link>

            {/* Mobile menu button */}
            <button
              className="lg-ibtn lg-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className={`lg-mobile-menu${mobileOpen ? ' open' : ''}`}>
          <Link href="/" className={active === 'home' ? 'active' : ''} onClick={() => setMobileOpen(false)}>Home</Link>
          <Link href="/shop" className={active === 'shop' ? 'active' : ''} onClick={() => setMobileOpen(false)}>Shop</Link>
          <Link href="/collections" className={active === 'collections' ? 'active' : ''} onClick={() => setMobileOpen(false)}>Collections</Link>
          <Link href="/#about" onClick={() => setMobileOpen(false)}>About</Link>
          {session?.user ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>My Account</Link>
              <button onClick={() => { signOut(); setMobileOpen(false) }} style={{ padding: '14px 18px', fontSize: 15, fontWeight: 500, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 16, textAlign: 'left', width: '100%' }}>Sign Out</button>
            </>
          ) : (
            <Link href="/auth/signin" onClick={() => setMobileOpen(false)}>Sign In</Link>
          )}
        </div>
      </div>
    </>
  )
}
