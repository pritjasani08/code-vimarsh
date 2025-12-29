import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Resources.css';

const Resources = () => {
  const [resources, setResources] = useState({});
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchResources = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/resources`);
      setResources(response.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources({});
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  if (loading) {
    return (
      <div className="resources">
        <section className="section">
          <div className="container">
            <p>Loading resources...</p>
          </div>
        </section>
      </div>
    );
  }

  const mainTopics = Object.keys(resources);

  return (
    <div className="resources">
      <section className="section">
        <div className="container">
          <h1 className="section-title">Resources</h1>
          <p className="section-subtitle">
            Curated collection of learning resources to help you on your coding journey.
          </p>

          {mainTopics.length === 0 ? (
            <div className="no-resources">
              <p>Resources will be added soon. Check back later!</p>
            </div>
          ) : (
            <div className="resources-grid">
              {mainTopics.map((mainTopic, index) => (
                <div key={index} className="resource-category">
                  <h2 className="category-title">{mainTopic}</h2>
                  <ul className="resource-links">
                    {resources[mainTopic].map((resource) => (
                      <li key={resource.id}>
                        <a
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="resource-link"
                        >
                          {resource.subtopic}
                          <span className="external-icon">↗</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Resources;

