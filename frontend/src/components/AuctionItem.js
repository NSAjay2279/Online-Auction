import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

function AuctionItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [bid, setBid] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/signin', { state: { from: `/auction/${id}` } });
      return;
    }

    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`http://localhost:5001/auctions/${id}`);
        setItem(res.data);
      } catch (error) {
        setError(error.response?.data?.message || 'Error fetching auction item');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
    const interval = setInterval(fetchItem, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [id, navigate]);

  useEffect(() => {
    if (!item) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const closing = new Date(item.closingTime);
      const diff = closing - now;

      if (diff <= 0) {
        setTimeLeft('Auction ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s left`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s left`);
      }
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [item]);

  const handleBid = async (e) => {
    e.preventDefault();
    setBidError('');
    setBidSuccess('');

    if (!bid || isNaN(bid) || Number(bid) <= 0) {
      setBidError('Please enter a valid bid amount');
      return;
    }

    const bidAmount = Number(bid);
    if (bidAmount <= item.currentBid) {
      setBidError(`Bid must be higher than the current bid of $${item.currentBid}`);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/signin');
      return;
    }

    try {
      setBidding(true);
      const res = await axios.post(
        `http://localhost:5001/bid/${id}`,
        { bid: bidAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBidSuccess(res.data.message);
      setBid('');
      setItem(res.data.item);
    } catch (error) {
      setBidError(error.response?.data?.message || 'Error placing bid');
    } finally {
      setBidding(false);
    }
  };

  if (loading) {
    return (
      <div className="auction-item loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auction-item">
        <div className="message error">{error}</div>
        <Link to="/dashboard" className="button secondary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="auction-item">
        <div className="message error">Auction not found</div>
        <Link to="/dashboard" className="button secondary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isEnded = new Date(item.closingTime) <= new Date() || item.isClosed;

  return (
    <div className="auction-item">
      <div className="auction-header">
        <Link to="/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>
        <div className="auction-status">
          {isEnded ? (
            <span className="status closed">Closed</span>
          ) : (
            <span className="status active">Active</span>
          )}
          <span className="time-left">{timeLeft}</span>
        </div>
      </div>

      <div className="auction-content">
        <h2>{item.itemName}</h2>
        <p className="description">{item.description}</p>

        <div className="auction-details">
          <div className="bid-details">
            <h3>Current Bid</h3>
            <div className="current-bid">${item.currentBid.toFixed(2)}</div>
            {item.highestBidder && (
              <p className="highest-bidder">
                Highest Bidder: <span>{item.highestBidder}</span>
              </p>
            )}
          </div>

          <div className="seller-details">
            <h3>Seller Information</h3>
            <p className="seller">Listed by: {item.seller}</p>
          </div>
        </div>

        {!isEnded && (
          <div className="bid-section">
            <h3>Place Your Bid</h3>
            <form onSubmit={handleBid} className="bid-form">
              <div className="form-group">
                <label htmlFor="bid">Your Bid Amount ($)</label>
                <input
                  type="number"
                  id="bid"
                  value={bid}
                  onChange={(e) => setBid(e.target.value)}
                  min={0}
                  step="0.01"
                  placeholder={`Min bid: $${(item.currentBid + 0.01).toFixed(2)}`}
                  className={bidError ? 'error' : ''}
                  disabled={bidding}
                />
                {bidError && <span className="error-message">{bidError}</span>}
                {bidSuccess && <span className="success-message">{bidSuccess}</span>}
              </div>
              <button 
                type="submit" 
                className="button primary" 
                disabled={bidding}
              >
                {bidding ? 'Placing Bid...' : 'Place Bid'}
              </button>
            </form>
          </div>
        )}

        {isEnded && (
          <div className="auction-ended">
            <h3>Auction Ended</h3>
            <p>
              {item.highestBidder
                ? `Won by ${item.highestBidder} with a bid of $${item.currentBid.toFixed(2)}`
                : 'No bids were placed on this item'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuctionItem;
