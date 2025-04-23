import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const PAGE_SIZE = 20;
const API_URL = 'http://localhost:4000';

function App() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');

  const [skip, setSkip] = useState(0);
  const [more, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(new Set());

  const loadItems = useCallback(async () => {
    if (loading || !more) return;
  
    setLoading(true);
    const res = await axios.get(`${API_URL}/items`, {
      params: { skip, limit: PAGE_SIZE, search },
    });
  
    const newItems = res.data;
  
    setItems((prev) => [...prev, ...res.data]);
  
    setSkip((prev) => prev + newItems.length);
    if (newItems.length < PAGE_SIZE) setHasMore(false);
  
    setLoading(false);
  }, [skip, search, loading, more]);
  
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setItems([]);
    setSkip(0);
    setHasMore(true);
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  useEffect(() => {
    loadItems();
  }, [search]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Express numbers table</h1>

      <input
        type="text"
        value={search}
        onChange={handleSearch}
        placeholder="Поиск..."
        style={{ marginBottom: 20, padding: 8  }}
        />

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ padding: 10, textAlign: 'left', border: '1px solid #ccc' }}>ID</th>
            <th style={{ padding: 10, textAlign: 'left', border: '1px solid #ccc' }}>Value</th>
            <th style={{ padding: 10, textAlign: 'center', border: '1px solid #ccc'  }}>Checked</th>
          </tr>
        </thead>
        
        <tbody>          
          {items.map((item, index) => (
            <tr
              key={item.id}
              style={{
                background: selected.has(item.id) ? '#7dd5f0' : '#fff',
                borderBottom: '1px solid #ccc'
              }}
            >
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{item.id}</td>
              <td style={{ padding: 10, border: '1px solid #ccc' }}>{item.value}</td>
              <td style={{ padding: 10, border: '1px solid #ccc', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {loading && <p>Loading...</p>}
    </div>
  );
}

export default App;
