import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import socket from "./socket";

function App() {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joined, setJoined] = useState(false);

  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [time, setTime] = useState(0);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);
  const [players, setPlayers] = useState({});

  useEffect(() => {
    if (time <= 0) return;
    const timer = setInterval(() => {
      setTime((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [time]);

  const joinRoom = () => {
    if (!username || !roomCode) return alert("Enter username & room code");
    socket.emit("join-room", { roomCode, username });
    setJoined(true);
  };

  useEffect(() => {
    socket.on("players", (data) => {
      setPlayers(data);
    });

    socket.on("new-question", (data) => {
      setQuestion(data.question);
      setOptions(data.options);
      setTime(data.time);
      setSelected("");
      setResult(null);
    });

    socket.on("result", (data) => {
      setResult(data);
    });

    return () => {
      socket.off("players");
      socket.off("new-question");
      socket.off("result");
    };
  }, []);

  const submitAnswer = (opt) => {
    setSelected(opt);
    socket.emit("submit-answer", {
      roomCode,
      answer: opt
    });
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">QuizBattle</h1>
        {joined && (
          <div className="room-info">
            <span className="room-badge">Room: {roomCode}</span>
            <span className="user-badge">{username}</span>
          </div>
        )}
      </header>

      <main className="main-content">
        {!joined ? (
          <div className="join-container">
            <div className="card">
              <h2 className="card-title">Join Quiz Battle</h2>
              <p className="card-subtitle">Test your knowledge in real-time!</p>
              
              <div className="input-group">
                <label htmlFor="username">Your Name</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label htmlFor="roomCode">Room Code</label>
                <input
                  id="roomCode"
                  type="text"
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="input-field"
                />
              </div>

              <button 
                onClick={joinRoom}
                className="btn-primary"
                disabled={!username || !roomCode}
              >
                Join Battle
              </button>
            </div>
          </div>
        ) : !question ? (
          <div className="waiting-container">
            <div className="card">
              <div className="spinner"></div>
              <h2 className="waiting-title">Waiting for opponent...</h2>
              <p className="waiting-subtitle">Share the room code: <strong>{roomCode}</strong></p>
              
              <div className="players-list">
                <h3>Players in Room:</h3>
                <div className="players-grid">
                  {Object.entries(players).map(([id, name]) => (
                    <div key={id} className="player-chip">
                      👤 {name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="quiz-container">
            <div className="quiz-header">
              <div className="timer">
                ⏱️ Time: <span className="time-count">{time}s</span>
              </div>
              <div className="question-counter">Question in progress...</div>
            </div>
            <div className="result-section">
                  {result && (
                <div className="result-container">
                  <div className="card result-card">
                    <div className="result-header">
                      <h2>🎯 Round Results</h2>
                      <div className="correct-answer">
                        Correct Answer: <span className="answer-highlight">{result.correctAnswer}</span>
                      </div>
                    </div>

                    <div className="scores-section">
                      <h3 className="scores-title">Leaderboard</h3>
                      <div className="scores-list">
                        {Object.keys(result.scores)
                          .sort((a, b) => result.scores[b] - result.scores[a])
                          .map((id, index) => (
                            <div key={id} className="score-item">
                              <div className="player-rank">
                                <span className={`rank-badge ${
                                  index === 0 ? "gold" : 
                                  index === 1 ? "silver" : 
                                  index === 2 ? "bronze" : ""
                                }`}>
                                  {index + 1}
                                </span>
                                <span className="player-name">{result.users[id]}</span>
                              </div>
                              <div className="player-score">
                                {result.scores[id]} pts
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card question-card">
              <h2 className="question-text">{question}</h2>
              
              <div className="options-grid">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    
                    onClick={() => submitAnswer(opt)}
                    className={`option-button ${
                      selected === opt ? "selected" : ""
                    } ${result && opt === result.correctAnswer ? "correct" : ""}`}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="option-text">{opt}</span>
                    {selected === opt && (
                      <span className="option-status">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      
      </main>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .header {
          padding: 1.5rem 2rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .logo {
          color: white;
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(45deg, #ff6b6b, #feca57);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .room-info {
          display: flex;
          gap: 1rem;
        }

        .room-badge, .user-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .room-badge {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .user-badge {
          background: #10b981;
          color: white;
        }

        .main-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .card-title {
          font-size: 2rem;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .card-subtitle {
          color: #666;
          margin-bottom: 2rem;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-group label {
          display: block;
          color: #555;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .input-field {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .input-field:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .btn-primary {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .waiting-container {
          text-align: center;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #e2e8f0;
          border-top-color: #667eea;
          border-radius: 50%;
          margin: 0 auto 2rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .waiting-title {
          font-size: 1.8rem;
          color: #333;
          margin-bottom: 1rem;
        }

        .waiting-subtitle {
          color: #666;
          margin-bottom: 2rem;
        }

        .players-list {
          margin-top: 2rem;
          text-align: left;
        }

        .players-list h3 {
          color: #555;
          margin-bottom: 1rem;
        }

        .players-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
        }

        .player-chip {
          background: #f8fafc;
          padding: 0.8rem;
          border-radius: 10px;
          border: 2px solid #e2e8f0;
          font-weight: 600;
          color: #4a5568;
        }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.9);
          padding: 1rem 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          backdrop-filter: blur(10px);
        }

        .timer {
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
        }

        .time-count {
          color: #ef4444;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .question-counter {
          color: #666;
          font-weight: 500;
        }

        .question-card {
          text-align: center;
        }

        .question-text {
          font-size: 1.5rem;
          color: #333;
          margin-bottom: 2rem;
          line-height: 1.4;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .option-button {
          padding: 1.5rem;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          color: #4a5568;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s;
          position: relative;
        }

        .option-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          border-color: #667eea;
          background: white;
        }

        .option-button:disabled {
          cursor: not-allowed;
        }

        .option-button.selected {
          background: linear-gradient(45deg, #10b981, #34d399);
          color: white;
          border-color: #10b981;
        }

        .option-button.correct {
          background: linear-gradient(45deg, #10b981, #34d399);
          color: white;
          border-color: #10b981;
        }

        .option-letter {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .option-text {
          flex: 1;
          text-align: left;
        }

        .option-status {
          font-size: 1.5rem;
          font-weight: bold;
        }

        .result-container {
          margin-top: 2rem;
        }

        .result-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .correct-answer {
          font-size: 1.1rem;
          color: #666;
          margin-top: 1rem;
        }

        .answer-highlight {
          background: #10b981;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
        }

        .scores-section {
          margin-top: 2rem;
        }

        .scores-title {
          color: #333;
          margin-bottom: 1.5rem;
          font-size: 1.3rem;
          text-align: center;
        }

        .scores-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .score-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 10px;
          transition: transform 0.2s;
        }

        .score-item:hover {
          transform: translateX(5px);
          background: white;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }

        .player-rank {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .rank-badge {
          width: 36px;
          height: 36px;
          background: #e2e8f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #4a5568;
        }

        .rank-badge.gold {
          background: linear-gradient(45deg, #fbbf24, #f59e0b);
          color: white;
        }

        .rank-badge.silver {
          background: linear-gradient(45deg, #94a3b8, #64748b);
          color: white;
        }

        .rank-badge.bronze {
          background: linear-gradient(45deg, #d97706, #b45309);
          color: white;
        }

        .player-name {
          font-weight: 600;
          color: #333;
          font-size: 1.1rem;
        }

        .player-score {
          font-size: 1.2rem;
          font-weight: 700;
          color: #667eea;
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            gap: 1rem;
          }

          .options-grid {
            grid-template-columns: 1fr;
          }

          .main-content {
            padding: 1rem;
          }

          .card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default App;