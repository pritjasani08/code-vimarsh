import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('announcements');
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!isAdmin) {
      navigate('/');
      setMessage({ type: 'error', text: 'Admin access required' });
    }
  }, [user, isAdmin, navigate]);

  if (!user || !isAdmin) {
    return null;
  }

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <p>Manage announcements, team members, events, and tech news</p>
        </div>

        {message.text && (
          <div className={`admin-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="admin-tabs">
          <button
            className={activeTab === 'announcements' ? 'active' : ''}
            onClick={() => setActiveTab('announcements')}
          >
            Announcements
          </button>
          <button
            className={activeTab === 'team' ? 'active' : ''}
            onClick={() => setActiveTab('team')}
          >
            Team Members
          </button>
          <button
            className={activeTab === 'events' ? 'active' : ''}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          <button
            className={activeTab === 'tech-news' ? 'active' : ''}
            onClick={() => setActiveTab('tech-news')}
          >
            Tech News
          </button>
          <button
            className={activeTab === 'gallery' ? 'active' : ''}
            onClick={() => setActiveTab('gallery')}
          >
            Gallery
          </button>
          <button
            className={activeTab === 'resources' ? 'active' : ''}
            onClick={() => setActiveTab('resources')}
          >
            Resources
          </button>
          <button
            className={activeTab === 'concept' ? 'active' : ''}
            onClick={() => setActiveTab('concept')}
          >
            Concept of the Day
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </div>

        <div className="admin-content">
          {activeTab === 'announcements' && (
            <AnnouncementsManager API_URL={API_URL} showMessage={showMessage} />
          )}
          {activeTab === 'team' && (
            <TeamManager API_URL={API_URL} showMessage={showMessage} />
          )}
          {activeTab === 'events' && (
            <EventsManager API_URL={API_URL} showMessage={showMessage} />
          )}
          {activeTab === 'tech-news' && (
            <TechNewsManager API_URL={API_URL} showMessage={showMessage} />
          )}
          {activeTab === 'gallery' && (
            <GalleryManager API_URL={API_URL} showMessage={showMessage} />
          )}
          {activeTab === 'resources' && (
            <ResourcesManager API_URL={API_URL} showMessage={showMessage} />
          )}
          {activeTab === 'concept' && (
            <ConceptManager API_URL={API_URL} showMessage={showMessage} />
          )}
          {activeTab === 'users' && (
            <UsersManager API_URL={API_URL} showMessage={showMessage} />
          )}
        </div>
      </div>
    </div>
  );
};

// Announcements Manager Component
const AnnouncementsManager = ({ API_URL, showMessage }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', content: '', type: 'notice' });
  const [editingId, setEditingId] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/announcements`);
      setAnnouncements(res.data);
    } catch (error) {
      showMessage('error', 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  }, [API_URL, showMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/admin/announcements/${editingId}`, formData);
        showMessage('success', 'Announcement updated successfully');
      } else {
        await axios.post(`${API_URL}/admin/announcements`, formData);
        showMessage('success', 'Announcement created successfully');
      }
      setFormData({ title: '', content: '', type: 'notice' });
      setEditingId(null);
      fetchAnnouncements();
    } catch (error) {
      showMessage('error', 'Failed to save announcement');
    }
  };

  const handleEdit = (ann) => {
    setFormData({ title: ann.title, content: ann.content, type: ann.type });
    setEditingId(ann._id || ann.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await axios.delete(`${API_URL}/admin/announcements/${id}`);
      showMessage('success', 'Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error) {
      showMessage('error', 'Failed to delete announcement');
    }
  };

  return (
    <div className="manager-section">
      <h2>Manage Announcements</h2>
      <form onSubmit={handleSubmit} className="admin-form">
        <input
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
          rows="5"
        />
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        >
          <option value="notice">Notice</option>
          <option value="article">Article</option>
          <option value="update">Update</option>
        </select>
        <button type="submit">{editingId ? 'Update' : 'Create'}</button>
        {editingId && (
          <button type="button" onClick={() => { setFormData({ title: '', content: '', type: 'notice' }); setEditingId(null); }}>
            Cancel
          </button>
        )}
      </form>
      <div className="items-list">
        {loading ? (
          <p>Loading...</p>
        ) : (
          announcements.map((ann) => (
            <div key={ann._id || ann.id} className="item-card">
              <h3>{ann.title}</h3>
              <p className="item-type">{ann.type}</p>
              <p className="item-content">{ann.content.substring(0, 100)}...</p>
              <div className="item-actions">
                <button onClick={() => handleEdit(ann)}>Edit</button>
                <button onClick={() => handleDelete(ann._id || ann.id)} className="delete">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Team Manager Component
const TeamManager = ({ API_URL, showMessage }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', role: '', photo: '', email: '', linkedin: '', github: '' });
  const [editingId, setEditingId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/team`);
      setMembers(res.data);
    } catch (error) {
      showMessage('error', 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  }, [API_URL, showMessage]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, photo: event.target.result });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return formData.photo; // Return existing photo if no new file

    const formDataUpload = new FormData();
    formDataUpload.append('photo', photoFile);

    try {
      const res = await axios.post(`${API_URL}/upload/team-photo`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.photoPath;
    } catch (error) {
      showMessage('error', 'Failed to upload photo');
      return formData.photo;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      // Upload photo if file selected
      let photoPath = formData.photo;
      if (photoFile) {
        photoPath = await uploadPhoto();
      }

      const memberData = { ...formData, photo: photoPath };

      if (editingId) {
        await axios.put(`${API_URL}/admin/team/${editingId}`, memberData);
        showMessage('success', 'Team member updated successfully');
      } else {
        await axios.post(`${API_URL}/admin/team`, memberData);
        showMessage('success', 'Team member added successfully');
      }
      setFormData({ name: '', role: '', photo: '', email: '', linkedin: '', github: '' });
      setPhotoFile(null);
      setEditingId(null);
      fetchMembers();
    } catch (error) {
      showMessage('error', 'Failed to save team member');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (member) => {
    setFormData({
      name: member.name,
      role: member.role,
      photo: member.photo || '',
      email: member.email || '',
      linkedin: member.linkedin || '',
      github: member.github || ''
    });
    setEditingId(member._id || member.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;
    try {
      await axios.delete(`${API_URL}/admin/team/${id}`);
      showMessage('success', 'Team member deleted successfully');
      fetchMembers();
    } catch (error) {
      showMessage('error', 'Failed to delete team member');
    }
  };

  return (
    <div className="manager-section">
      <h2>Manage Team Members</h2>
      <form onSubmit={handleSubmit} className="admin-form">
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          required
        />
        <div className="photo-upload-section">
          <label className="file-upload-label">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
            <span className="file-upload-button">Choose Photo</span>
          </label>
          {formData.photo && (
            <div className="photo-preview">
              <img 
                src={formData.photo.startsWith('http') || formData.photo.startsWith('data:') 
                  ? formData.photo 
                  : `${API_URL.replace('/api', '')}${formData.photo}`} 
                alt="Preview" 
              />
              <button type="button" onClick={() => { setFormData({ ...formData, photo: '' }); setPhotoFile(null); }}>Remove</button>
            </div>
          )}
          <small>Or enter Photo URL:</small>
          <input
            type="text"
            placeholder="Photo URL (optional)"
            value={formData.photo && formData.photo.startsWith('http') ? formData.photo : ''}
            onChange={(e) => { setFormData({ ...formData, photo: e.target.value }); setPhotoFile(null); }}
          />
        </div>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          type="url"
          placeholder="LinkedIn URL"
          value={formData.linkedin}
          onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
        />
        <input
          type="url"
          placeholder="GitHub URL"
          value={formData.github}
          onChange={(e) => setFormData({ ...formData, github: e.target.value })}
        />
        <button type="submit" disabled={uploading}>{uploading ? 'Uploading...' : (editingId ? 'Update' : 'Add')}</button>
        {editingId && (
          <button type="button" onClick={() => { setFormData({ name: '', role: '', photo: '', email: '', linkedin: '', github: '' }); setEditingId(null); }}>
            Cancel
          </button>
        )}
      </form>
      <div className="items-list">
        {loading ? (
          <p>Loading...</p>
        ) : (
          members.map((member) => (
            <div key={member._id || member.id} className="item-card">
              {member.photo && <img src={member.photo} alt={member.name} className="member-photo" />}
              <h3>{member.name}</h3>
              <p className="item-type">{member.role}</p>
              <div className="item-actions">
                <button onClick={() => handleEdit(member)}>Edit</button>
                <button onClick={() => handleDelete(member._id || member.id)} className="delete">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Events Manager Component
const EventsManager = ({ API_URL, showMessage }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', description: '', registrationLink: '', eventDate: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/events`);
      setEvents(res.data);
    } catch (error) {
      showMessage('error', 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [API_URL, showMessage]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/events/${editingId}`, formData);
        showMessage('success', 'Event updated successfully');
      } else {
        await axios.post(`${API_URL}/events`, formData);
        showMessage('success', 'Event created successfully');
      }
      setFormData({ name: '', description: '', registrationLink: '', eventDate: '' });
      setEditingId(null);
      fetchEvents();
    } catch (error) {
      showMessage('error', 'Failed to save event');
    }
  };

  const handleEdit = (event) => {
    setFormData({
      name: event.name,
      description: event.description,
      registrationLink: event.registrationLink || '',
      eventDate: event.eventDate ? event.eventDate.split('T')[0] : ''
    });
    setEditingId(event.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await axios.delete(`${API_URL}/events/${id}`);
      showMessage('success', 'Event deleted successfully');
      fetchEvents();
    } catch (error) {
      showMessage('error', 'Failed to delete event');
    }
  };

  return (
    <div className="manager-section">
      <h2>Manage Events</h2>
      <form onSubmit={handleSubmit} className="admin-form">
        <input
          type="text"
          placeholder="Event Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows="5"
        />
        <input
          type="url"
          placeholder="Registration Link"
          value={formData.registrationLink}
          onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })}
        />
        <input
          type="datetime-local"
          placeholder="Event Date"
          value={formData.eventDate}
          onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
          required
        />
        <button type="submit">{editingId ? 'Update' : 'Create'}</button>
        {editingId && (
          <button type="button" onClick={() => { setFormData({ name: '', description: '', registrationLink: '', eventDate: '' }); setEditingId(null); }}>
            Cancel
          </button>
        )}
      </form>
      <div className="items-list">
        {loading ? (
          <p>Loading...</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="item-card">
              <h3>{event.name}</h3>
              <p className="item-type">{new Date(event.eventDate).toLocaleDateString()}</p>
              <p className="item-content">{event.description.substring(0, 100)}...</p>
              {event.registrationLink && (
                <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="registration-link">
                  Registration Link
                </a>
              )}
              <div className="item-actions">
                <button onClick={() => handleEdit(event)}>Edit</button>
                <button onClick={() => handleDelete(event.id)} className="delete">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Tech News Manager Component
const TechNewsManager = ({ API_URL, showMessage }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', content: '', type: 'tech_news' });
  const [editingId, setEditingId] = useState(null);

  const fetchNews = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/announcements`);
      const techNews = res.data.filter(item => item.type === 'tech_news');
      setNews(techNews);
    } catch (error) {
      showMessage('error', 'Failed to fetch tech news');
    } finally {
      setLoading(false);
    }
  }, [API_URL, showMessage]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/admin/announcements/${editingId}`, formData);
        showMessage('success', 'Tech news updated successfully');
      } else {
        await axios.post(`${API_URL}/admin/announcements`, formData);
        showMessage('success', 'Tech news created successfully');
      }
      setFormData({ title: '', content: '', type: 'tech_news' });
      setEditingId(null);
      fetchNews();
    } catch (error) {
      showMessage('error', 'Failed to save tech news');
    }
  };

  const handleEdit = (item) => {
    setFormData({ title: item.title, content: item.content, type: 'tech_news' });
    setEditingId(item._id || item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tech news?')) return;
    try {
      await axios.delete(`${API_URL}/admin/announcements/${id}`);
      showMessage('success', 'Tech news deleted successfully');
      fetchNews();
    } catch (error) {
      showMessage('error', 'Failed to delete tech news');
    }
  };

  return (
    <div className="manager-section">
      <h2>Manage Tech News</h2>
      <form onSubmit={handleSubmit} className="admin-form">
        <input
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
          rows="5"
        />
        <button type="submit">{editingId ? 'Update' : 'Create'}</button>
        {editingId && (
          <button type="button" onClick={() => { setFormData({ title: '', content: '', type: 'tech_news' }); setEditingId(null); }}>
            Cancel
          </button>
        )}
      </form>
      <div className="items-list">
        {loading ? (
          <p>Loading...</p>
        ) : (
          news.map((item) => (
            <div key={item._id || item.id} className="item-card">
              <h3>{item.title}</h3>
              <p className="item-content">{item.content.substring(0, 100)}...</p>
              <div className="item-actions">
                <button onClick={() => handleEdit(item)}>Edit</button>
                <button onClick={() => handleDelete(item._id || item.id)} className="delete">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Gallery Manager Component
const GalleryManager = ({ API_URL, showMessage }) => {
  const [images, setImages] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventName, setEventName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/upload/gallery/events`);
      setEvents(res.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, [API_URL]);

  const fetchImages = useCallback(async (eventNameFilter = '') => {
    try {
      setLoading(true);
      let url = `${API_URL}/upload/gallery`;
      if (eventNameFilter) {
        url += `?eventName=${encodeURIComponent(eventNameFilter)}`;
      }
      const res = await axios.get(url);
      setImages(res.data);
    } catch (error) {
      showMessage('error', 'Failed to fetch gallery images');
    } finally {
      setLoading(false);
    }
  }, [API_URL, showMessage]);

  const handleFileSelect = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (!eventName.trim()) {
      showMessage('error', 'Please enter event name');
      return;
    }

    if (selectedFiles.length === 0) {
      showMessage('error', 'Please select at least one image');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('eventName', eventName);
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      await axios.post(`${API_URL}/upload/gallery`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showMessage('success', `${selectedFiles.length} image(s) uploaded successfully`);
      setSelectedFiles([]);
      setEventName('');
      fetchEvents();
      fetchImages();
    } catch (error) {
      showMessage('error', 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await axios.delete(`${API_URL}/upload/gallery/${id}`);
      showMessage('success', 'Image deleted successfully');
      fetchImages(selectedEvent || '');
    } catch (error) {
      showMessage('error', 'Failed to delete image');
    }
  };

  const groupedImages = images.reduce((acc, image) => {
    if (!acc[image.event_name]) {
      acc[image.event_name] = [];
    }
    acc[image.event_name].push(image);
    return acc;
  }, {});

  return (
    <div className="manager-section">
      <h2>Manage Gallery</h2>
      
      <div className="gallery-upload-section">
        <h3>Upload New Images</h3>
        <div className="admin-form">
          <input
            type="text"
            placeholder="Event Name (e.g., Hackathon 2024)"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
          />
          <label className="file-upload-label">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <span className="file-upload-button">Choose Images (Multiple)</span>
          </label>
          {selectedFiles.length > 0 && (
            <p className="file-count">{selectedFiles.length} file(s) selected</p>
          )}
          <button type="button" onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
            {uploading ? 'Uploading...' : 'Upload Images'}
          </button>
        </div>
      </div>

      <div className="gallery-filter-section">
        <h3>Filter by Event</h3>
        <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
          <option value="">All Events</option>
          {events.map((event) => (
            <option key={event.event_name} value={event.event_name}>
              {event.event_name} ({event.image_count} images)
            </option>
          ))}
        </select>
      </div>

      <div className="gallery-images-section">
        <h3>Gallery Images</h3>
        {loading ? (
          <p>Loading...</p>
        ) : images.length === 0 ? (
          <p>No images found.</p>
        ) : (
          <div className="gallery-grid">
            {Object.entries(groupedImages).map(([eventName, eventImages]) => (
              <div key={eventName} className="gallery-event-group">
                <h4 className="event-group-title">{eventName}</h4>
                <div className="gallery-images-grid">
                  {eventImages.map((image) => (
                    <div key={image.id} className="gallery-image-card">
                      <img 
                        src={image.image_path.startsWith('http') 
                          ? image.image_path 
                          : `${API_URL.replace('/api', '')}${image.image_path}`} 
                        alt={image.image_name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                        }}
                      />
                      <div className="gallery-image-actions">
                        <button onClick={() => handleDelete(image.id)} className="delete">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Resources Manager Component
const ResourcesManager = ({ API_URL, showMessage }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ mainTopic: '', subtopic: '', link: '', displayOrder: 0 });
  const [editingId, setEditingId] = useState(null);

  const fetchResources = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/resources/list`);
      setResources(res.data);
    } catch (error) {
      showMessage('error', 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  }, [API_URL, showMessage]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/resources/${editingId}`, formData);
        showMessage('success', 'Resource updated successfully');
      } else {
        await axios.post(`${API_URL}/resources`, formData);
        showMessage('success', 'Resource created successfully');
      }
      setFormData({ mainTopic: '', subtopic: '', link: '', displayOrder: 0 });
      setEditingId(null);
      fetchResources();
    } catch (error) {
      showMessage('error', 'Failed to save resource');
    }
  };

  const handleEdit = (resource) => {
    setFormData({
      mainTopic: resource.main_topic,
      subtopic: resource.subtopic,
      link: resource.link,
      displayOrder: resource.display_order
    });
    setEditingId(resource.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await axios.delete(`${API_URL}/resources/${id}`);
      showMessage('success', 'Resource deleted successfully');
      fetchResources();
    } catch (error) {
      showMessage('error', 'Failed to delete resource');
    }
  };

  // Group resources by main topic for display
  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.main_topic]) {
      acc[resource.main_topic] = [];
    }
    acc[resource.main_topic].push(resource);
    return acc;
  }, {});

  return (
    <div className="manager-section">
      <h2>Manage Resources</h2>
      <form onSubmit={handleSubmit} className="admin-form">
        <input
          type="text"
          placeholder="Main Topic (e.g., DSA)"
          value={formData.mainTopic}
          onChange={(e) => setFormData({ ...formData, mainTopic: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Subtopic (e.g., Sorting)"
          value={formData.subtopic}
          onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
          required
        />
        <input
          type="url"
          placeholder="Link (e.g., https://example.com)"
          value={formData.link}
          onChange={(e) => setFormData({ ...formData, link: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Display Order (optional)"
          value={formData.displayOrder}
          onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
          min="0"
        />
        <button type="submit">{editingId ? 'Update' : 'Add'}</button>
        {editingId && (
          <button type="button" onClick={() => { setFormData({ mainTopic: '', subtopic: '', link: '', displayOrder: 0 }); setEditingId(null); }}>
            Cancel
          </button>
        )}
      </form>
      
      <div className="resources-list-section">
        <h3>All Resources</h3>
        {loading ? (
          <p>Loading...</p>
        ) : resources.length === 0 ? (
          <p>No resources added yet.</p>
        ) : (
          <div className="resources-grouped-list">
            {Object.entries(groupedResources).map(([mainTopic, topicResources]) => (
              <div key={mainTopic} className="resource-topic-group">
                <h4 className="resource-main-topic">{mainTopic}</h4>
                <div className="resource-items">
                  {topicResources.map((resource) => (
                    <div key={resource.id} className="resource-item-card">
                      <div className="resource-item-info">
                        <strong>{resource.subtopic}</strong>
                        <a 
                          href={resource.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="resource-item-link"
                        >
                          {resource.link}
                        </a>
                      </div>
                      <div className="item-actions">
                        <button onClick={() => handleEdit(resource)}>Edit</button>
                        <button onClick={() => handleDelete(resource.id)} className="delete">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Concept of the Day Manager Component
const ConceptManager = ({ API_URL, showMessage }) => {
  const [concept, setConcept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ question: '', answer: '' });

  const fetchConcept = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/concept`);
      if (res.data) {
        setConcept(res.data);
        setFormData({ question: res.data.question, answer: res.data.answer });
      } else {
        setConcept(null);
        setFormData({ question: '', answer: '' });
      }
    } catch (error) {
      showMessage('error', 'Failed to fetch concept of the day');
    } finally {
      setLoading(false);
    }
  }, [API_URL, showMessage]);

  useEffect(() => {
    fetchConcept();
  }, [fetchConcept]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/concept`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      showMessage('success', 'Concept of the day updated successfully');
      fetchConcept();
    } catch (error) {
      showMessage('error', 'Failed to save concept of the day');
    }
  };

  return (
    <div className="manager-section">
      <h2>Manage Concept of the Day</h2>
      <p className="admin-info-text">
        Add a new concept question and answer. When you add a new concept, the previous one will be automatically removed.
      </p>
      
      {loading ? (
        <p>Loading...</p>
      ) : concept ? (
        <div className="current-concept-preview">
          <h3>Current Concept of the Day:</h3>
          <div className="concept-preview-card">
            <p className="concept-question"><strong>Q:</strong> {concept.question}</p>
            <p className="concept-answer"><strong>A:</strong> {concept.answer}</p>
            <p className="concept-date">Added: {new Date(concept.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      ) : (
        <p className="no-concept-message">No concept of the day set yet.</p>
      )}

      <form onSubmit={handleSubmit} className="admin-form">
        <input
          type="text"
          placeholder="Question (e.g., What is aggregation?)"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          required
        />
        <textarea
          placeholder="Answer (2-3 lines explaining the concept)"
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          required
          rows="4"
        />
        <button type="submit">{concept ? 'Update Concept' : 'Add Concept'}</button>
      </form>
    </div>
  );
};

// Users Manager Component
const UsersManager = ({ API_URL, showMessage }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/users`);
      setUsers(res.data);
    } catch (error) {
      showMessage('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [API_URL, showMessage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleMakeAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to make this user an admin?')) return;
    try {
      await axios.post(`${API_URL}/users/make-admin`, { userId });
      showMessage('success', 'User promoted to admin successfully');
      fetchUsers();
    } catch (error) {
      showMessage('error', 'Failed to promote user');
    }
  };

  return (
    <div className="manager-section">
      <h2>Manage Users</h2>
      <div className="items-list">
        {loading ? (
          <p>Loading...</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className="item-card">
              <h3>{user.username}</h3>
              <p className="item-type">{user.email}</p>
              <p className="item-content">PRN: {user.prn}</p>
              {!user.isAdmin && (
                <div className="item-actions">
                  <button onClick={() => handleMakeAdmin(user.id)}>Make Admin</button>
                </div>
              )}
              {user.isAdmin && <p className="admin-badge">Admin</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

