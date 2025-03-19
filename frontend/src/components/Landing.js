import React from 'react';
import { Link } from 'react-router-dom';

function Landing() {
  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero">
        <h1>Welcome to Auction App</h1>
        <p className="hero-subtitle">
          Discover unique items and participate in exciting auctions from anywhere in the world.
        </p>
        <div className="cta-buttons">
          <Link to="/signup" className="cta-button primary">Get Started</Link>
          <Link to="/signin" className="cta-button secondary">Sign In</Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose Our Platform?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Bidding</h3>
            <p>Our platform ensures safe and secure transactions for all users.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Real-time Updates</h3>
            <p>Get instant notifications about your bids and auction status.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Global Reach</h3>
            <p>Connect with buyers and sellers from around the world.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💎</div>
            <h3>Unique Items</h3>
            <p>Find one-of-a-kind items you won't find anywhere else.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create an Account</h3>
            <p>Sign up for free and set up your profile.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Browse Auctions</h3>
            <p>Explore active auctions and find items you love.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Place Your Bid</h3>
            <p>Bid on items and compete with other buyers.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Win & Receive</h3>
            <p>Win auctions and receive your items securely.</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="join-section">
        <div className="join-content">
          <h2>Ready to Start Bidding?</h2>
          <p>Join thousands of users who are already winning great deals on our platform.</p>
          <Link to="/signup" className="cta-button primary">Create Account</Link>
        </div>
      </section>
    </div>
  );
}

export default Landing;
