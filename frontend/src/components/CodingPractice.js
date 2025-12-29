
import React, { useState, useEffect, useCallback } from 'react';

import axios from 'axios';
import './CodingPractice.css';

const CodingPractice = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch questions from API
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/aptitude/questions`, {
        params: {
          amount: 10,
          category: 'all',
          difficulty: 'medium'
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.data.questions && response.data.questions.length > 0) {
        setQuestions(response.data.questions);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setError(null); // Clear any previous errors
      } else {
        // This shouldn't happen as backend always returns questions
        setError('No questions received. Please try again.');
        loadDefaultQuestions();
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      // Backend should always return questions, but if it fails, use default
      // Try to extract questions from error response if available
      if (err.response?.data?.questions && err.response.data.questions.length > 0) {
        setQuestions(err.response.data.questions);
      } else {
        // Use default questions as immediate fallback
        loadDefaultQuestions();
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const loadDefaultQuestions = () => {
    const defaultQuestions = [
      {
        id: 1,
        title: 'Time and Work',
        question: 'A can do a piece of work in 10 days and B can do it in 15 days. In how many days will they complete the work if they work together?',
        options: ['5 days', '6 days', '7 days', '8 days'],
        correctAnswer: 1,
        explanation: 'A\'s 1 day work = 1/10, B\'s 1 day work = 1/15. Together: 1/10 + 1/15 = 3/30 + 2/30 = 5/30 = 1/6. So they will complete in 6 days.',
        category: 'Quantitative Aptitude'
      },
      {
        id: 2,
        title: 'Percentage',
        question: 'If the price of a product is increased by 20% and then decreased by 20%, what is the net change in price?',
        options: ['No change', '4% increase', '4% decrease', '8% decrease'],
        correctAnswer: 2,
        explanation: 'Let original price = 100. After 20% increase: 120. After 20% decrease: 120 - (20% of 120) = 120 - 24 = 96. Net change = (100-96)/100 = 4% decrease.',
        category: 'Quantitative Aptitude'
      }
    ];
    setQuestions(defaultQuestions);
  };

  const handleSkip = () => {
    if (questions.length === 0) return;
    
    const next = (currentQuestion + 1) % questions.length;
    setCurrentQuestion(next);
    setSelectedAnswer(null);
    setShowResult(false);
    
    // Load more questions if we're near the end
    if (next >= questions.length - 2) {
      fetchMoreQuestions();
    }
  };

  const fetchMoreQuestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/aptitude/questions`, {
        params: {
          amount: 5,
          category: 'all',
          difficulty: 'medium'
        },
        timeout: 10000
      });

      if (response.data.questions && response.data.questions.length > 0) {
        // Add new questions, avoiding duplicates
        const newQuestions = response.data.questions.filter(
          newQ => !questions.some(existingQ => existingQ.id === newQ.id)
        );
        if (newQuestions.length > 0) {
          setQuestions(prev => [...prev, ...newQuestions]);
        }
      }
    } catch (err) {
      console.error('Error fetching more questions:', err);
      // Silently fail - user can still continue with existing questions
    }
  };

  const handleAnswerSelect = (index) => {
    if (!showResult) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) {
      alert('Please select an answer before submitting.');
      return;
    }
    
    setShowResult(true);
    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    const next = (currentQuestion + 1) % questions.length;
    setCurrentQuestion(next);
    setSelectedAnswer(null);
    setShowResult(false);
    
    // Load more questions if needed
    if (next >= questions.length - 2) {
      fetchMoreQuestions();
    }
  };

  if (loading) {
    return (
      <div className="coding-practice-container">
        <div className="loading-state">
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="coding-practice-container">
        <div className="error-state">
          <p>No questions available. Please try again.</p>
          <button onClick={fetchQuestions} className="btn-retry">Retry</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="coding-practice-container">
      <div className="practice-header">
        <h2>Aptitude Practice</h2>
        <div className="header-actions">
          <span className="score-badge">Score: {score}/{questions.length}</span>
          <button onClick={handleSkip} className="btn-skip">Skip</button>
          <button onClick={fetchQuestions} className="btn-refresh" title="Load new questions">
            🔄
          </button>
        </div>
      </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <div className="problem-content">
        <div className="problem-info">
          <div className="problem-title-row">
            <h3>{currentQ.title}</h3>
            <div className="badges">
              <span className={`difficulty-badge ${currentQ.category === 'Quantitative Aptitude' ? 'quantitative' : 'logical'}`}>
                {currentQ.category}
              </span>
              <span className="question-number">Question {currentQuestion + 1}/{questions.length}+</span>
            </div>
          </div>
          <p className="problem-description">{currentQ.question}</p>
          
          <div className="options-container">
            {currentQ.options.map((option, index) => (
              <div
                key={index}
                className={`option-item ${
                  showResult
                    ? index === currentQ.correctAnswer
                      ? 'correct'
                      : selectedAnswer === index && index !== currentQ.correctAnswer
                      ? 'incorrect'
                      : ''
                    : selectedAnswer === index
                    ? 'selected'
                    : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="option-label">{String.fromCharCode(65 + index)}.</span>
                <span className="option-text">{option}</span>
                {showResult && index === currentQ.correctAnswer && (
                  <span className="correct-mark">✓</span>
                )}
                {showResult && selectedAnswer === index && index !== currentQ.correctAnswer && (
                  <span className="incorrect-mark">✗</span>
                )}
              </div>
            ))}
          </div>

          {showResult && (
            <div className={`explanation ${selectedAnswer === currentQ.correctAnswer ? 'correct-explanation' : 'incorrect-explanation'}`}>
              <strong>{selectedAnswer === currentQ.correctAnswer ? '✓ Correct!' : '✗ Incorrect'}</strong>
              <p>{currentQ.explanation}</p>
            </div>
          )}
        </div>
        
        <div className="solution-input">
          {!showResult ? (
            <button onClick={handleSubmit} className="btn-submit" disabled={selectedAnswer === null}>
              Submit Answer
            </button>
          ) : (
            <button onClick={handleNext} className="btn-submit">
              Next Question →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodingPractice;
