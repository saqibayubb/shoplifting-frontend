export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0a0f1a',
        color: '#00ffb4',
      }}
    >
      <div
        style={{
          animation: 'spin 1s linear infinite',
          width: '40px',
          height: '40px',
          border: '3px solid rgba(0, 255, 180, 0.2)',
          borderTop: '3px solid #00ffb4',
          borderRadius: '50%',
        }}
      />
    </div>
  );
}
