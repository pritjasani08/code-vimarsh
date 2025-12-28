import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/events`;
      if (filter !== 'all') {
        url += `?type=${filter}`;
      }
      const res = await axios.get(url);
      setEvents(res.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (eventDate) => {
    return new Date(eventDate) > new Date();
  };

  return (
    <div className="events-page">
      <div className="events-container">
        <div className="events-header">
          <h1>Events</h1>
          <p>Stay updated with our upcoming events and past activities</p>
        </div>

        <div className="events-filters">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All Events
          </button>
          <button
            className={filter === 'upcoming' ? 'active' : ''}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={filter === 'past' ? 'active' : ''}
            onClick={() => setFilter('past')}
          >
            Past Events
          </button>
        </div>

        {loading ? (
          <div className="events-loading">
            <p>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="events-empty">
            <p>No events found.</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <div key={event.id} className={`event-card ${isUpcoming(event.eventDate) ? 'upcoming' : 'past'}`}>
                <div className="event-badge">
                  {isUpcoming(event.eventDate) ? 'Upcoming' : 'Past Event'}
                </div>
                <h2>{event.name}</h2>
                <div className="event-date">
                  <span className="date-icon">📅</span>
                  {formatDate(event.eventDate)}
                </div>
                <p className="event-description">{event.description}</p>
                {event.registrationLink && isUpcoming(event.eventDate) && (
                  <a
                    href={event.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-register-btn"
                  >
                    Register Now →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;

