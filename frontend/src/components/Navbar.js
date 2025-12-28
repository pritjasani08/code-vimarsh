import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">Code Vimarsh</span>
        </Link>
        
        <button
          className="navbar-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <li><Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
          <li><Link to="/events" onClick={() => setIsMenuOpen(false)}>Events</Link></li>
          <li><Link to="/resources" onClick={() => setIsMenuOpen(false)}>Resources</Link></li>
          <li><Link to="/gallery" onClick={() => setIsMenuOpen(false)}>Gallery</Link></li>
          <li><Link to="/team" onClick={() => setIsMenuOpen(false)}>Team</Link></li>
          <li><Link to="/announcements" onClick={() => setIsMenuOpen(false)}>Announcements</Link></li>
          <li><Link to="/contact" onClick={() => setIsMenuOpen(false)}>Contact</Link></li>
          {isAuthenticated ? (
            <>
              {isAdmin && <li><Link to="/admin" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link></li>}
              <li><Link to="/profile" onClick={() => setIsMenuOpen(false)}>Profile</Link></li>
              <li><button onClick={handleLogout} className="nav-logout">Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link></li>
              <li><Link to="/signup" onClick={() => setIsMenuOpen(false)} className="nav-signup">Signup</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

