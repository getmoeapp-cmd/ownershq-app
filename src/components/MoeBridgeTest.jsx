import { useEffect, useState } from 'react';
import { getInventoryWithPrices } from '../moeAdapter';
export default function MoeBridgeTest() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getInventoryWithPrices('tommys')
      .then(data => setItems(data))
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return (
      <div style={{ padding: 20, background: '#fee', color: '#900', fontFamily: 'monospace' }}>
        <b>MOE Bridge ERROR:</b> {error}
      </div>
    );
  }

  if (!items) {
    return <div style={{ padding: 20 }}>Loading MOE data…</div>;
  }

  return (
    <div style={{ padding: 20, background: '#f5f5f5', borderRadius: 8, margin: 20 }}>
      <h2 style={{ margin: 0, marginBottom: 12 }}>
        ✅ MOE Bridge — {items.length} items loaded
      </h2>
      <div style={{ maxHeight: 400, overflowY: 'auto', background: 'white', borderRadius: 6, padding: 12 }}>
        {items.slice(0, 20).map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
            <span><b>{item.name}</b> <small style={{ color: '#888' }}>({item.section})</small></span>
            <span style={{ fontFamily: 'monospace' }}>
              ${item.pricePerPiece?.toFixed(2) ?? '—'}/pc · ${item.pricePerOrderUnit?.toFixed(2) ?? '—'}/case
            </span>
          </div>
        ))}
        {items.length > 20 && <div style={{ padding: 8, color: '#888' }}>…and {items.length - 20} more</div>}
      </div>
    </div>
  );
}
