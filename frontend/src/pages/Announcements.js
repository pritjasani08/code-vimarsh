import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Announcements.css';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/announcements`);
      // Filter out tech_news type announcements (they appear in Home page)
      const filteredAnnouncements = response.data.filter(
        announcement => announcement.type !== 'tech_news'
      );
      setAnnouncements(filteredAnnouncements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="announcements">
        <section className="section">
          <div className="container">
            <p>Loading announcements...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="announcements">
      <section className="section">
        <div className="container">
          <h1 className="section-title">Announcements</h1>
          <p className="section-subtitle">
            Stay updated with the latest news, events, and updates from Code Vimarsh.
          </p>

          {announcements.length === 0 ? (
            <div className="no-announcements">
              <p>No announcements at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="announcements-list">
              {announcements.map((announcement) => (
                <div key={announcement._id} className="announcement-card">
                  <div className="announcement-header">
                    <h2 className="announcement-title">{announcement.title}</h2>
                    <span className="announcement-date">
                      {formatDate(announcement.date)}
                    </span>
                  </div>
                  <div className="announcement-type">
                    {announcement.type}
                  </div>
                  <div className="announcement-content">
                    {announcement.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Announcements;

