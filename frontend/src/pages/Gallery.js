import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Gallery.css';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [events, setEvents] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/upload/gallery/events`);
      setEvents(res.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, [API_URL]);

  const fetchImages = useCallback(async (eventName = '') => {
    try {
      setLoading(true);
      let url = `${API_URL}/upload/gallery`;
      if (eventName) {
        url += `?eventName=${encodeURIComponent(eventName)}`;
      }
      const res = await axios.get(url);
      setImages(res.data);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      // Fallback to placeholder if API fails
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchEvents();
    fetchImages();
  }, [fetchEvents, fetchImages]);

  useEffect(() => {
    if (selectedEvent) {
      fetchImages(selectedEvent);
    } else {
      fetchImages();
    }
  }, [selectedEvent, fetchImages]);

  const getImageUrl = (imagePath) => {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${API_URL.replace('/api', '')}${imagePath}`;
  };

  return (
    <div className="gallery">
      <section className="section">
        <div className="container">
          <h1 className="section-title">Gallery</h1>
          <p className="section-subtitle">
            Moments from our workshops, competitions, and events.
          </p>

          {events.length > 0 && (
            <div className="gallery-filters">
              <select 
                value={selectedEvent} 
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="gallery-filter-select"
              >
                <option value="">All Events</option>
                {events.map((event) => (
                  <option key={event.event_name} value={event.event_name}>
                    {event.event_name} ({event.image_count} images)
                  </option>
                ))}
              </select>
            </div>
          )}

          {loading ? (
            <div className="gallery-loading">
              <p>Loading gallery images...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="gallery-empty">
              <p>No images found. Check back later for event photos!</p>
            </div>
          ) : (
            <div className="gallery-grid">
              {images.map((image) => (
                <div key={image.id} className="gallery-item">
                  <div className="gallery-image-wrapper">
                    <img
                      src={getImageUrl(image.image_path)}
                      alt={image.image_name}
                      className="gallery-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                      }}
                    />
                    <div className="gallery-overlay">
                      <h3 className="gallery-title">{image.event_name}</h3>
                      <p className="gallery-description">{new Date(image.uploaded_at).toLocaleDateString()}</p>
                    </div>
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

export default Gallery;

