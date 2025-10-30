import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TakeTest.css';

function TakeTest({ user }) {
  const { userid, testid } = useParams();
  const navigate = useNavigate();
  
  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch test data and questions
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const res = await fetch(`/api/test/${testid}/details`, {
          credentials: 'include'
        });
        
        const data = await res.json();
        
        if (data.success) {
          setTestData(data.data.test);
          setQuestions(data.data.questions);
          
          // Initialize submissions array
          const initialSubmissions = new Array(data.data.questions.length).fill('');
          setSubmissions(initialSubmissions);
          
          // Calculate time left
          const now = new Date();
          const startTime = new Date(data.data.test.startTime);
          const endTime = new Date(startTime.getTime() + data.data.test.duration * 60000);
          const timeLeftMs = endTime - now;
          
          // Check if there's saved time in localStorage
          const savedTimeLeft = localStorage.getItem(`test_${testid}_timeLeft`);
          
          if (timeLeftMs > 0) {
            const calculatedTimeLeft = Math.floor(timeLeftMs / 1000);
            
            // Use saved time if it exists and is less than calculated time (to prevent cheating)
            if (savedTimeLeft) {
              const savedTime = parseInt(savedTimeLeft);
              setTimeLeft(Math.min(savedTime, calculatedTimeLeft));
            } else {
              setTimeLeft(calculatedTimeLeft);
            }
          } else {
            setError('Test time has expired');
          }
        } else {
          setError('Failed to load test data');
        }
      } catch (err) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    if (testid) {
      fetchTestData();
    }
  }, [testid]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  // Save progress to localStorage
  useEffect(() => {
    if (testid && submissions.length > 0) {
      localStorage.setItem(`test_${testid}_submissions`, JSON.stringify(submissions));
      localStorage.setItem(`test_${testid}_current`, currentQuestion.toString());
      localStorage.setItem(`test_${testid}_timeLeft`, timeLeft.toString());
    }
  }, [submissions, currentQuestion, timeLeft, testid]);

  // Load progress from localStorage
  useEffect(() => {
    if (testid && questions.length > 0) {
      const savedSubmissions = localStorage.getItem(`test_${testid}_submissions`);
      const savedCurrent = localStorage.getItem(`test_${testid}_current`);
      
      if (savedSubmissions) {
        const parsedSubmissions = JSON.parse(savedSubmissions);
        // Ensure the saved submissions array matches the current questions length
        if (parsedSubmissions.length === questions.length) {
          setSubmissions(parsedSubmissions);
        }
      }
      if (savedCurrent) {
        const savedIndex = parseInt(savedCurrent);
        if (savedIndex >= 0 && savedIndex < questions.length) {
          setCurrentQuestion(savedIndex);
        }
      }
    }
  }, [testid, questions.length]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (optionLetter) => {
    const newSubmissions = [...submissions];
    newSubmissions[currentQuestion] = optionLetter;
    setSubmissions(newSubmissions);
  };

  const handleClearResponse = () => {
    const newSubmissions = [...submissions];
    newSubmissions[currentQuestion] = '';
    setSubmissions(newSubmissions);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleQuestionNavigation = (index) => {
    setCurrentQuestion(index);
  };

  const handleSubmit = useCallback(async () => {
    try {
      console.log('Submitting with submissions:', submissions);
      
      const res = await fetch(`/api/submission/${testid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          submissions: submissions
        })
      });

      const responseData = await res.json();
      console.log('Submission response:', responseData);

      if (res.ok) {
        // Clear localStorage
        localStorage.removeItem(`test_${testid}_submissions`);
        localStorage.removeItem(`test_${testid}_current`);
        localStorage.removeItem(`test_${testid}_timeLeft`);
        
        // Navigate to submission page
        navigate(`/submission/${testid}`);
      } else {
        console.error('Submission failed:', responseData);
        setError(`Failed to submit test: ${responseData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Error submitting test: ' + err.message);
    }
  }, [submissions, testid, navigate]);

  const getAttemptedCount = () => {
    return submissions.filter(sub => sub !== '').length;
  };

  const getUnattemptedCount = () => {
    return submissions.filter(sub => sub === '').length;
  };

  if (loading) {
    return (
      <div className="take-test-loading">
        <div className="loading-spinner"></div>
        <p>Loading Test...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="take-test-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/test')}>Back to Tests</button>
      </div>
    );
  }

  if (!testData || questions.length === 0) {
    return (
      <div className="take-test-error">
        <h2>No Test Data</h2>
        <p>Unable to load test questions</p>
        <button onClick={() => navigate('/test')}>Back to Tests</button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="take-test-page">
      {/* Header */}
      <div className="test-header">
        <div className="test-info">
          <h1>{testData.testName}</h1>
          <div className="test-meta">
            <span>Duration: {testData.duration} mins</span>
            <span>•</span>
            <span>Start: {new Date(testData.startTime).toLocaleString()}</span>
            <span>•</span>
            <span>End: {new Date(new Date(testData.startTime).getTime() + testData.duration * 60000).toLocaleString()}</span>
            <span>•</span>
            <span>Marks per Question: {testData.eachQuesMarks}</span>
          </div>
        </div>
      </div>

      <div className="test-content">
        {/* Main Question Area */}
        <div className="question-area">
          <div className="question-card">
            <div className="question-header">
              <h2>Question {currentQuestion + 1} of {questions.length}</h2>
            </div>
            
            <div className="question-text">
              <p>{currentQ.question}</p>
            </div>

            <div className="options">
              {['option1', 'option2', 'option3', 'option4'].map((optionKey, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                return (
                  <div 
                    key={index}
                    className={`option ${submissions[currentQuestion] === optionLetter ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(optionLetter)}
                  >
                    <div className="option-radio">
                      <input 
                        type="radio" 
                        name="answer" 
                        checked={submissions[currentQuestion] === optionLetter}
                        onChange={() => handleAnswerSelect(optionLetter)}
                      />
                    </div>
                    <div className="option-text">
                      {optionLetter}. {currentQ[optionKey]}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="question-actions">
              <button 
                className="clear-btn"
                onClick={handleClearResponse}
                disabled={!submissions[currentQuestion]}
              >
                Clear Response
              </button>
              
              <div className="navigation-buttons">
                <button 
                  className="nav-btn prev-btn"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </button>
                <button 
                  className="nav-btn next-btn"
                  onClick={handleNext}
                  disabled={currentQuestion === questions.length - 1}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="test-sidebar">
          {/* Timer */}
          <div className="timer-card">
            <h3>Time Remaining</h3>
            <div className={`timer ${timeLeft < 300 ? 'warning' : ''}`}>
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Progress */}
          <div className="progress-card">
            <h3>Progress</h3>
            <div className="progress-stats">
              <div className="stat">
                <span className="stat-number">{getAttemptedCount()}</span>
                <span className="stat-label">Attempted</span>
              </div>
              <div className="stat">
                <span className="stat-number">{getUnattemptedCount()}</span>
                <span className="stat-label">Unattempted</span>
              </div>
            </div>
          </div>

          {/* Question Navigation */}
          <div className="navigation-card">
            <h3>Questions</h3>
            <div className="question-grid">
              {questions.map((_, index) => (
                <button
                  key={index}
                  className={`question-nav-btn ${
                    index === currentQuestion ? 'current' : ''
                  } ${
                    submissions[index] ? 'attempted' : 'unattempted'
                  }`}
                  onClick={() => handleQuestionNavigation(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="submit-card">
            <button 
              className="submit-btn"
              onClick={handleSubmit}
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TakeTest;