import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import './styles.css';

const PAGE_SIZE = 20;
const API_URL = 'http://localhost:4000';

function App() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');

  const [skip, setSkip] = useState(0);
  const [more, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const observer = useRef();
  const [selected, setSelected] = useState(new Set());

  const isLoadingRef = useRef(false);

  const loadItems = useCallback(async () => {
    if (loading || !more || isLoadingRef.current) return;
  
    isLoadingRef.current = true; 
  
    setLoading(true);
    const res = await axios.get(`${API_URL}/items`, {
      params: { skip, limit: PAGE_SIZE, search },
    });
  
    const newItems = res.data;
  
    setItems((prev) => [...prev, ...res.data]);
  
    setSkip((prev) => prev + newItems.length);
    if (newItems.length < PAGE_SIZE) setHasMore(false);
  
    setLoading(false);
    isLoadingRef.current = false; 
  }, [skip, search, loading, more]);
  
  const lastItemRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && more) {
        loadItems();
      }
    });

    if (node) observer.current.observe(node);

  }, [loading, more, loadItems]);

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

  useEffect(() => {
    const loadState = async () => {
      const res = await axios.get(`${API_URL}/state`);
      const { selected } = res.data;
      setSelected(new Set(selected));
    };
  
    loadState();
  }, []);

  useEffect(() => {
    const saveState = async () => {
      await axios.post(`${API_URL}/save-state`, {
        selected: Array.from(selected),
        order: [],
      });
    };
  
    if (selected.size > 0) {
      saveState();
    }
  }, [selected]);
  
  return (
    <div className='container'>
      <h1>Express numbers table</h1>

      <input
        type="text"
        value={search}
        onChange={handleSearch}
        placeholder="Поиск..."
        />

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Value</th>
            <th>Checked</th>
          </tr>
        </thead>
        
        <tbody>          
          {items.map((item, index) => (
            <tr
              key={item.id}
              ref={index === items.length - 1 ? lastItemRef : null}
              style={{ background: selected.has(item.id) ? '#d7f4fc' : '#fff' }}
            >
              <td>{item.id}</td>
              <td>{item.value}</td>
              <td>
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
