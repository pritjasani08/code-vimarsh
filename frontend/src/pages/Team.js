import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Team.css';

const Team = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get(`${API_URL}/team`);
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching team members:', error);
      // Fallback to placeholder data if API fails
      setMembers([
        { name: 'Team Member 1', role: 'President' },
        { name: 'Team Member 2', role: 'Vice President' },
        { name: 'Team Member 3', role: 'Secretary' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    // If it's already a full URL (http/https), return as is
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    // If it's a local file path, construct the full URL
    if (photo.startsWith('/uploads/')) {
      return `${API_URL.replace('/api', '')}${photo}`;
    }
    // If it starts with uploads without leading slash
    if (photo.startsWith('uploads/')) {
      return `${API_URL.replace('/api', '')}/${photo}`;
    }
    return photo;
  };

  if (loading) {
    return (
      <div className="team">
        <section className="section">
          <div className="container">
            <p>Loading team members...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="team">
      <section className="section">
        <div className="container">
          <h1 className="section-title">Our Team</h1>
          <p className="section-subtitle">
            Meet the passionate individuals who make Code Vimarsh possible.
          </p>

          {members.length === 0 ? (
            <div className="no-members">
              <p>Team information will be updated soon.</p>
            </div>
          ) : (
            <div className="team-grid">
              {members.map((member, index) => (
                <div key={index} className="team-card">
                  <div className="team-photo">
                    {member.photo ? (
                      <img 
                        src={getPhotoUrl(member.photo)} 
                        alt={member.name}
                        onError={(e) => {
                          // If image fails to load, show placeholder
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="team-photo-placeholder" 
                      style={{ display: member.photo ? 'none' : 'flex' }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <h3 className="team-name">{member.name}</h3>
                  <p className="team-role">{member.role}</p>
                  {(member.email || member.linkedin || member.github) && (
                    <div className="team-social">
                      {member.email && (
                        <a href={`mailto:${member.email}`} aria-label="Email">
                          ✉
                        </a>
                      )}
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="LinkedIn"
                        >
                          in
                        </a>
                      )}
                      {member.github && (
                        <a
                          href={member.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="GitHub"
                        >
                          ⚡
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Team;

