import MoeBridgeTest from './components/MoeBridgeTest';

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>OwnersHQ</h1>
        <p style={{ margin: '4px 0 0', color: '#666' }}>Restaurant management platform</p>
      </header>

      <MoeBridgeTest />
    </div>
  );
}
