import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useLocation } from 'react-router-dom';
import Signup from './components/Signup';
import Signin from './components/Signin';
import Dashboard from './components/Dashboard';
import AuctionItem from './components/AuctionItem';
import PostAuction from './components/PostAuction';
import Landing from './components/Landing';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

// Navigation Link Component
const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`nav-link ${isActive ? 'active' : ''}`}
    >
      {children}
    </Link>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUsername = localStorage.getItem('username');
    setIsAuthenticated(!!token);
    setUsername(storedUsername || '');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
  };

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <Link to="/" className="logo-link">
              <h1>Auction App</h1>
            </Link>
            <nav className="main-nav">
              {!isAuthenticated ? (
                <>
                  <NavLink to="/signup">Sign Up</NavLink>
                  <NavLink to="/signin">Sign In</NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/dashboard">Dashboard</NavLink>
                  <NavLink to="/post-auction">Post Auction</NavLink>
                  <span className="username-display">Welcome, {username}!</span>
                  <button 
                    onClick={handleLogout} 
                    className="logout-button"
                  >
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route 
              path="/signup" 
              element={
                isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Signup setIsAuthenticated={setIsAuthenticated} setUsername={setUsername} />
              } 
            />
            <Route 
              path="/signin" 
              element={
                isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Signin setIsAuthenticated={setIsAuthenticated} setUsername={setUsername} />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/auction/:id" 
              element={
                <ProtectedRoute>
                  <AuctionItem />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/post-auction" 
              element={
                <ProtectedRoute>
                  <PostAuction />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="footer-content">
            <p className="copyright">&copy; {new Date().getFullYear()} Auction App. All rights reserved.</p>
            <p className="tagline">Welcome to the best place to buy and sell items through auctions!</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
