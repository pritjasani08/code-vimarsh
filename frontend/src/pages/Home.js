import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CodeEditor from '../components/CodeEditor';
import CodingPractice from '../components/CodingPractice';
import './Home.css';

const Home = () => {
  const [techNews, setTechNews] = useState([]);
  const [concept, setConcept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conceptLoading, setConceptLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchTechNews = useCallback(async () => {
    try {
      // Fetch only tech_news type announcements from backend
      const response = await axios.get(`${API_URL}/announcements?type=tech_news`);
      setTechNews(response.data);
    } catch (error) {
      console.error('Error fetching tech news:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const fetchConcept = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/concept`);
      if (response.data && response.data !== null) {
        setConcept(response.data);
      } else {
        setConcept(null);
      }
    } catch (error) {
      console.error('Error fetching concept of the day:', error);
      setConcept(null);
    } finally {
      setConceptLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchTechNews();
    fetchConcept();
  }, [fetchTechNews, fetchConcept]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="home">
      <div className="home-container">
        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="hero-title">Welcome to Code Vimarsh</h1>
          <p className="hero-subtitle">Empowering coders, one line at a time</p>
        </div>

        {/* What is Code Vimarsh Section */}
        <section className="about-section">
          <h2 className="section-title">What is Code Vimarsh?</h2>
          <div className="section-content">
            <p>
              Code Vimarsh is a vibrant coding community dedicated to fostering programming excellence 
              and collaborative learning. We provide a platform where students and coding enthusiasts 
              can come together to share knowledge, solve problems, and grow their technical skills.
            </p>
            <p>
              Our mission is to create an inclusive environment that encourages innovation, 
              critical thinking, and continuous learning in the field of computer science and 
              software development.
            </p>
          </div>
        </section>

        {/* Why Join Us Section */}
        <section className="join-section">
          <h2 className="section-title">Why Join Us?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">💡</div>
              <h3>Learn & Grow</h3>
              <p>Access curated resources, coding challenges, and expert guidance to accelerate your learning journey.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🤝</div>
              <h3>Collaborate</h3>
              <p>Work on projects with like-minded peers, participate in coding competitions, and build your network.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🚀</div>
              <h3>Stay Updated</h3>
              <p>Get the latest tech news, industry trends, and updates about upcoming events and workshops.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎯</div>
              <h3>Practice</h3>
              <p>Sharpen your coding skills with our interactive code editor and practice problems.</p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="home-main">
          <div className="home-left">
            <CodeEditor />
            <div className="concept-section">
              <h2>Concept of the Day</h2>
              {conceptLoading ? (
                <div className="concept-card">
                  <div className="concept-placeholder">
                    <p>Loading concept of the day...</p>
                  </div>
                </div>
              ) : concept ? (
                <div className="concept-card">
                  <div className="concept-question">
                    <strong>Q:</strong> {concept.question}
                  </div>
                  <div className="concept-answer">
                    <strong>A:</strong> {concept.answer}
                  </div>
                </div>
              ) : (
                <div className="concept-card">
                  <div className="concept-placeholder">
                    <p>No concept of the day set yet.</p>
                    <p className="news-note">Check back soon for daily programming concepts!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="home-right">
            <CodingPractice />
            <div className="tech-news-section">
              <h2>Tech News Feed</h2>
              {loading ? (
                <div className="news-card">
                  <div className="news-placeholder">
                    <p>Loading tech news...</p>
                  </div>
                </div>
              ) : techNews.length === 0 ? (
                <div className="news-card">
                  <div className="news-placeholder">
                    <p>Stay updated with the latest tech news and updates from Code Vimarsh!</p>
                    <p className="news-note">No tech news at the moment. Check back soon!</p>
                  </div>
                </div>
              ) : (
                <div className="tech-news-list">
                  {techNews.map((news) => (
                    <div key={news._id} className="news-card">
                      <div className="news-header">
                        <h3 className="news-title">{news.title}</h3>
                        <span className="news-date">{formatDate(news.date)}</span>
                      </div>
                      <div className="news-content">
                        {news.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
