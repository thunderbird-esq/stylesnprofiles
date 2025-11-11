import React, { useState, useEffect } from 'react';
import { getSavedItems, saveSearch } from '../../services/nasaApi';

export default function ResourceNavigatorApp() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchItems = () => {
    setLoading(true);
    getSavedItems()
      .then(res => {
        setItems(res.data);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to fetch saved items:", err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      // Log the search to the database
      saveSearch(search).catch(err => console.error("Failed to save search:", err));

      // NOTE: This is a placeholder.
      // The "Path 1" to-do list includes "Advanced search functionality".
      // This would be where you filter items or make a new API call.
      alert(`Search functionality for "${search}" is not yet implemented.`);
    }
  };

  if (loading) return <div className="nasa-loading">Loading saved resources...</div>;
  if (error) return <div className="nasa-error">Error: {error}</div>;

  return (
    <div className="nasa-data-section">
      <div className="nasa-data-title">Resource Navigator</div>

      {/* Search Form using System.css classes */}
      <form onSubmit={handleSearch} className="mt-2 mb-2">
        <div className="field-row" style={{ justifyContent: 'flex-start' }}>
          <label htmlFor="search" className="modeless-text">Search:</label>
          <input
            id="search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '250px' }}
            placeholder="Search all resources..."
          />
        </div>
        <div className="field-row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={() => setSearch('')}>
            Clear
          </button>
          <button type="submit" className="btn nasa-btn-primary" style={{ width: '95px' }}>
            Search
          </button>
        </div>
      </form>

      {/* Saved Items List */}
      <div className="nasa-data-title mb-1">My Saved Items</div>
      <div style={{
        height: '200px',
        overflowY: 'auto',
        border: '1px solid var(--secondary)',
        padding: '8px',
        backgroundColor: 'var(--primary)'
      }}>
        {items.length > 0 ? (
          items.map(item => (
            <div key={item.id} style={{
              borderBottom: '1px solid var(--tertiary)',
              paddingBottom: '8px',
              marginBottom: '8px'
            }}>
              <div className="nasa-data-title">
                {item.title}
                <small style={{ display: 'block', opacity: 0.7 }}>
                  ({item.type})
                </small>
              </div>
              <div className="nasa-data-content">
                <small>
                  {item.description || 'No description'}
                </small>
              </div>
              <div style={{ marginTop: '4px' }}>
                <small style={{ opacity: 0.6 }}>
                  Saved: {new Date(item.saved_at).toLocaleDateString()}
                </small>
              </div>
            </div>
          ))
        ) : (
          <div className="nasa-data-content text-center">
            You have no saved items.<br/>
            <small>Use APOD and NEO apps to save items!</small>
          </div>
        )}
      </div>
    </div>
  );
}