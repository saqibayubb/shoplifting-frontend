import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0a0f1a',
        color: '#e2e8f0',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '4rem', margin: '0', color: '#00ffb4' }}>404</h1>
      <p style={{ fontSize: '1.25rem', margin: '1rem 0', color: '#64748b' }}>
        Page not found
      </p>
      <Link
        href="/"
        style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          background: '#00ffb4',
          color: '#0a0f1a',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: '600',
        }}
      >
        Go Home
      </Link>
    </div>
  );
}
