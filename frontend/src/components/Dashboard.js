import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, closed
  const [sort, setSort] = useState('closing'); // closing, price
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      nav('/signin');
      return;
    }

    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`http://localhost:5001/auctions?active=${filter === 'active'}`);
        setItems(res.data);
      } catch (error) {
        console.error('Error fetching auctions:', error);
        setError('Failed to load auctions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [filter]);

  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      if (sort === 'closing') {
        return new Date(a.closingTime) - new Date(b.closingTime);
      }
      if (sort === 'price') {
        return b.currentBid - a.currentBid;
      }
      return 0;
    });
  };

  const getTimeLeft = (closingTime) => {
    const now = new Date();
    const closing = new Date(closingTime);
    const diff = closing - now;

    if (diff <= 0) return 'Auction ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const filteredItems = items.filter(item => {
    if (filter === 'active') return !item.isClosed;
    if (filter === 'closed') return item.isClosed;
    return true;
  });

  const sortedItems = sortItems(filteredItems);

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="message error">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Auction Dashboard</h2>
        <div className="dashboard-controls">
          <div className="control-group">
            <label>Filter:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="select-control"
            >
              <option value="all">All Auctions</option>
              <option value="active">Active Only</option>
              <option value="closed">Closed Only</option>
            </select>
          </div>
          <div className="control-group">
            <label>Sort by:</label>
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              className="select-control"
            >
              <option value="closing">Time Left</option>
              <option value="price">Highest Bid</option>
            </select>
          </div>
          <Link to="/post-auction" className="button primary">
            Post New Auction
          </Link>
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <div className="no-items">
          <p>No auctions found. {filter !== 'all' && 'Try changing your filters or '} 
            <Link to="/post-auction">create a new auction</Link>.
          </p>
        </div>
      ) : (
        <div className="items-grid">
          {sortedItems.map((item) => (
            <Link to={`/auction/${item._id}`} key={item._id} className="item-card">
              <div className="item-status">
                {item.isClosed ? (
                  <span className="status closed">Closed</span>
                ) : (
                  <span className="status active">Active</span>
                )}
                <span className="time-left">{getTimeLeft(item.closingTime)}</span>
              </div>
              <h3>{item.itemName}</h3>
              <p className="item-description">{item.description}</p>
              <div className="item-details">
                <div className="bid-info">
                  <span className="label">Current Bid:</span>
                  <span className="value">${item.currentBid.toFixed(2)}</span>
                </div>
                {item.highestBidder && (
                  <div className="bidder-info">
                    <span className="label">Highest Bidder:</span>
                    <span className="value">{item.highestBidder}</span>
                  </div>
                )}
                {item.seller && (
                  <div className="seller-info">
                    <span className="label">Seller:</span>
                    <span className="value">{item.seller}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
