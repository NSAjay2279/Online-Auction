import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function PostAuction() {
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    startingBid: '',
    closingTime: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/signin', { state: { from: '/post-auction' } });
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    const now = new Date();
    const closingDate = new Date(formData.closingTime);

    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item name is required';
    } else if (formData.itemName.length < 3) {
      newErrors.itemName = 'Item name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.startingBid) {
      newErrors.startingBid = 'Starting bid is required';
    } else if (Number(formData.startingBid) <= 0) {
      newErrors.startingBid = 'Starting bid must be greater than 0';
    }

    if (!formData.closingTime) {
      newErrors.closingTime = 'Closing time is required';
    } else if (closingDate <= now) {
      newErrors.closingTime = 'Closing time must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes in the future
    return now.toISOString().slice(0, 16);
  };

  const handlePostAuction = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('authToken');

    try {
      await axios.post(
        'http://localhost:5001/auction',
        {
          itemName: formData.itemName.trim(),
          description: formData.description.trim(),
          startingBid: Number(formData.startingBid),
          closingTime: formData.closingTime
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate('/dashboard', { 
        state: { 
          message: 'Auction item posted successfully!',
          type: 'success'
        }
      });
    } catch (error) {
      setSubmitError(
        error.response?.data?.message || 
        'Failed to post auction. Please try again.'
      );
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="post-auction">
      <div className="form-header">
        <h2>Post New Auction</h2>
        <p className="form-description">
          Create a new auction by filling out the details below. All fields are required.
        </p>
      </div>

      {submitError && (
        <div className="message error">
          {submitError}
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handlePostAuction} noValidate>
          <div className="form-group">
            <label htmlFor="itemName">Item Name</label>
            <input
              type="text"
              id="itemName"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              className={errors.itemName ? 'error' : ''}
              placeholder="Enter the name of your item"
            />
            {errors.itemName && (
              <span className="error-message">{errors.itemName}</span>
            )}
            <span className="input-hint">
              Choose a clear, descriptive name for your item
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={errors.description ? 'error' : ''}
              placeholder="Describe your item in detail"
              rows="4"
            ></textarea>
            {errors.description && (
              <span className="error-message">{errors.description}</span>
            )}
            <span className="input-hint">
              Include condition, features, and any important details
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="startingBid">Starting Bid ($)</label>
            <input
              type="number"
              id="startingBid"
              name="startingBid"
              value={formData.startingBid}
              onChange={handleChange}
              className={errors.startingBid ? 'error' : ''}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
            {errors.startingBid && (
              <span className="error-message">{errors.startingBid}</span>
            )}
            <span className="input-hint">
              Set a reasonable starting price for your item
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="closingTime">Auction End Time</label>
            <input
              type="datetime-local"
              id="closingTime"
              name="closingTime"
              value={formData.closingTime}
              onChange={handleChange}
              className={errors.closingTime ? 'error' : ''}
              min={getMinDateTime()}
            />
            {errors.closingTime && (
              <span className="error-message">{errors.closingTime}</span>
            )}
            <span className="input-hint">
              Choose when your auction will end (minimum 5 minutes from now)
            </span>
          </div>

          <div className="form-actions">
            <Link to="/dashboard" className="button secondary">
              Cancel
            </Link>
            <button 
              type="submit" 
              className="button primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post Auction'}
            </button>
          </div>
        </form>
      </div>

      <div className="auction-guidelines">
        <h3>Auction Guidelines</h3>
        <ul>
          <li>Provide accurate and detailed information about your item</li>
          <li>Set a reasonable starting bid to attract potential buyers</li>
          <li>Choose an appropriate auction duration</li>
          <li>Be responsive to questions from potential bidders</li>
        </ul>
      </div>
    </div>
  );
}

export default PostAuction;
