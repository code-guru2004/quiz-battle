import { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { IoCopy } from "react-icons/io5";
import { TbCopyCheckFilled } from "react-icons/tb";
import { MdAddHomeWork } from "react-icons/md";
import { SiCaddy } from "react-icons/si";
import { FaPlay, FaTrophy, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaUsers, FaComment, FaQuestionCircle, FaBell } from "react-icons/fa";
import { IoSend } from "react-icons/io5";

import socket from "./socket";

function App() {
  const [mode, setMode] = useState("");
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joined, setJoined] = useState(false);

  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [time, setTime] = useState(0);
  const [newQuestionTime, setNewQuestionTime] = useState(0);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);
  const [players, setPlayers] = useState({});
  const [playerCount, setPlayerCount] = useState(0);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState("");
  const [quizStarted, setQuizStarted] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [autoStartCountdown, setAutoStartCountdown] = useState(null);
  const [error, setError] = useState(null);
  const [roomDestroyed, setRoomDestroyed] = useState(false);
  const [quizPaused, setQuizPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showStartButton, setShowStartButton] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(true);
  const [allScores, setAllScores] = useState({});
  const [roundHistory, setRoundHistory] = useState([]);
  
  // New state for tabs and chat
  const [activeTab, setActiveTab] = useState("questions"); // questions, users, chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadMessages, setUnreadMessages] = useState({ questions: 0, users: 0, chat: 0 });
  const [notification, setNotification] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const resultRef = useRef(null);
  const mainContentRef = useRef(null);
  const countdownRef = useRef(null);
  const autoStartIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === "chat" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // Show notification
  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Timer sync
  useEffect(() => {
    if (time <= 0) return;
    const timer = setInterval(() => {
      setTime((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [time]);

  useEffect(() => {
    if (newQuestionTime <= 0) return;
    const timer = setInterval(() => {
      setNewQuestionTime((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [newQuestionTime]);

  // Auto-start countdown display
  useEffect(() => {
    if (autoStartCountdown && autoStartCountdown > 0) {
      if (autoStartIntervalRef.current) clearInterval(autoStartIntervalRef.current);
      
      autoStartIntervalRef.current = setInterval(() => {
        setAutoStartCountdown((c) => {
          if (c <= 1) {
            clearInterval(autoStartIntervalRef.current);
            return null;
          }
          return c - 1;
        });
      }, 1000);
      
      return () => {
        if (autoStartIntervalRef.current) clearInterval(autoStartIntervalRef.current);
      };
    }
  }, [autoStartCountdown]);

  const createRoom = () => {
    if (!username) return alert("Enter your name");
    if (!subject) return alert("Please select a subject");
    
    const newRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(newRoom);
    socket.emit("join-room", { roomCode: newRoom.toLowerCase(), username, subject });
    setJoined(true);
    setWaitingForPlayers(true);
    setIsCreator(true);
    setError(null);
  };

  const joinRoom = () => {
    if (!username || !roomCode) return alert("Enter name & room code");
    socket.emit("join-room", { roomCode: roomCode.toLowerCase(), username });
    setJoined(true);
    setWaitingForPlayers(true);
    setError(null);
  };

  const startQuizManually = () => {
    if (!roomCode) return;
    socket.emit("start-quiz-manual", { roomCode: roomCode.toLowerCase() });
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Failed to copy!");
    }
  };

  const resetAndGoHome = () => {
    setMode("");
    setJoined(false);
    setRoomDestroyed(false);
    setQuizPaused(false);
    setQuizStarted(false);
    setQuestion(null);
    setResult(null);
    setPlayers({});
    setPlayerCount(0);
    setError(null);
    setCountdown(null);
    setAutoStartCountdown(null);
    setWaitingForPlayers(false);
    setSelected("");
    setIsSubmitting(false);
    setIsCreator(false);
    setShowStartButton(false);
    setAllScores({});
    setRoundHistory([]);
    setMessages([]);
    setActiveTab("questions");
    if (roomCode) {
      socket.emit("leave-room", { roomCode: roomCode.toLowerCase() });
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    socket.emit("send-message", {
      roomCode: roomCode.toLowerCase(),
      message: newMessage.trim()
    });
    setNewMessage("");
  };

  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
      setAllScores(result.scores);
      setRoundHistory(prev => [...prev, {
        round: result.round,
        question: result.question,
        correctAnswer: result.correctAnswer,
        playerResults: result.playerResults
      }]);
    }
  }, [result]);

  useEffect(() => {
    if (question && mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [question]);

  useEffect(() => {
    socket.on("players", (data) => {
      if (data.players) {
        setPlayers(data.players);
        setPlayerCount(data.count);
        setMaxPlayers(data.maxPlayers);
      } else {
        setPlayers(data);
        setPlayerCount(Object.keys(data).length);
      }
    });

    socket.on("room-info", (data) => {
      setPlayers(data.players);
      setPlayerCount(data.currentPlayerCount);
      setMaxPlayers(data.maxPlayers);
      setQuizStarted(data.quizStarted);
      setIsCreator(data.isCreator || false);
      
      if (!data.quizStarted && data.currentPlayerCount >= 2) {
        setShowStartButton(true);
        setWaitingForPlayers(false);
      }
    });

    socket.on("auto-start-countdown", (data) => {
      setAutoStartCountdown(data.timeLeft);
      if (data.timeLeft <= 0) {
        setAutoStartCountdown(null);
      }
    });

    socket.on("new-question", (data) => {
      setQuestion(data.question);
      setOptions(data.options);
      setTime(data.time);
      setSelected("");
      setResult(null);
      setQuizStarted(true);
      setQuizPaused(false);
      setIsSubmitting(false);
      setShowStartButton(false);
      setAutoStartCountdown(null);
      setActiveTab("questions");
      showNotification("New question arrived!", "info");
    });

    socket.on("result", (data) => {
      setResult({ ...data, round: data.round });
      setNewQuestionTime(data.time || 5);
      showNotification(`Round ${data.round} results are in!`, "success");
    });

    socket.on("room-full", (data) => {
      setError(data.message);
      setJoined(false);
      setMode("");
      setTimeout(() => setError(null), 3000);
    });

    socket.on("username-taken", (data) => {
      setError(data.message);
      setJoined(false);
      setTimeout(() => setError(null), 3000);
    });

    socket.on("room-destroyed", (data) => {
      setRoomDestroyed(true);
      setQuizStarted(false);
      setQuestion(null);
      setResult(null);
      setError(data.message);
      setTimeout(() => {
        resetAndGoHome();
      }, 5000);
    });

    socket.on("quiz-paused", (data) => {
      setQuizPaused(true);
      setQuizStarted(false);
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    socket.on("quiz-started", (data) => {
      setQuizStarted(true);
      setQuizPaused(false);
      setWaitingForPlayers(false);
      setShowStartButton(false);
      setAutoStartCountdown(null);
      showNotification("Quiz has started! Good luck!", "success");
    });

    socket.on("player-left", (data) => {
      setPlayers(data.players);
      setPlayerCount(data.remainingPlayers);
      if (data.remainingPlayers < 2 && quizStarted) {
        setQuizPaused(true);
        setQuizStarted(false);
      }
    });

    socket.on("error", (data) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    socket.on("answer-submitted", (data) => {
      if (data.success) {
        setIsSubmitting(true);
        showNotification("Answer submitted!", "success");
      }
    });

    // Chat events
    socket.on("new-message", (message) => {
      setMessages(prev => [...prev, message]);
      
      // Show notification and increment unread count if not on chat tab
      if (activeTab !== "chat") {
        setUnreadMessages(prev => ({ ...prev, chat: prev.chat + 1 }));
        showNotification(`${message.username}: ${message.message}`, "message");
      }
    });

    socket.on("chat-history", (history) => {
      setMessages(history);
    });

    return () => {
      socket.off("players");
      socket.off("new-question");
      socket.off("result");
      socket.off("room-info");
      socket.off("room-full");
      socket.off("username-taken");
      socket.off("room-destroyed");
      socket.off("quiz-paused");
      socket.off("ready-to-start");
      socket.off("quiz-started");
      socket.off("player-left");
      socket.off("error");
      socket.off("answer-submitted");
      socket.off("auto-start-countdown");
      socket.off("new-message");
      socket.off("chat-history");
    };
  }, [quizStarted, activeTab]);

  const submitAnswer = (opt) => {
    if (selected || isSubmitting || !quizStarted || quizPaused) return;
    setSelected(opt);
    socket.emit("submit-answer", { roomCode: roomCode.toLowerCase(), answer: opt });
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getHighestScore = () => {
    if (Object.keys(allScores).length === 0) return 0;
    return Math.max(...Object.values(allScores));
  };

  const getScoreRanking = () => {
    return Object.entries(allScores)
      .sort((a, b) => b[1] - a[1])
      .map(([id, score], index) => ({
        id,
        name: players[id] || result?.users[id] || "Unknown",
        score,
        rank: index + 1
      }));
  };

  const getAnswerStatus = (playerId, currentResult = result) => {
    if (!currentResult || !currentResult.playerResults) return null;
    const playerResult = currentResult.playerResults[playerId];
    if (!playerResult) return "not-answered";
    return playerResult.isCorrect ? "correct" : "incorrect";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 font-sans">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl border ${
            notification.type === "success" ? "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400/30" :
            notification.type === "message" ? "bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400/30" :
            "bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400/30"
          }`}>
            <FaBell className="text-white" />
            <p className="text-white font-semibold">{notification.message}</p>
          </div>
        </div>
      )}

     

      <main ref={mainContentRef} className="h-full mx-auto px-4 py-8 overflow-y-auto ">
        {error && (
          <div className="fixed top-20 right-4 z-50 animate-slide-in">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl shadow-2xl border border-red-400/30">
              <p className="font-semibold">{error}</p>
            </div>
          </div>
        )}

        {roomDestroyed && (
          <div className="max-w-lg mx-auto animate-fade-in">
            <div className="bg-gradient-to-br from-red-900/90 to-red-950/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center border border-red-700/50">
              <div className="text-6xl mb-4">⏰</div>
              <h2 className="text-2xl font-bold text-white mb-3">Room Destroyed</h2>
              <p className="text-red-200 mb-6">This room has been destroyed after 10 minutes of inactivity.</p>
              <button onClick={resetAndGoHome} className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-2xl transition-all">
                Go Home
              </button>
            </div>
          </div>
        )}

        {/* Mode Selection UI */}
        {!mode && !joined && !roomDestroyed && (
          <div className="max-w-lg mx-auto animate-fade-in">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center border border-slate-700/50">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome to QuizBattle Pro</h2>
              <p className="text-slate-300 mb-8">Challenge your intellect in real-time knowledge battles!</p>
              <p className="text-slate-400 text-sm mb-6">⚡ Supports up to 10 players per room</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => setMode("create")} className="group bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-8 rounded-2xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl border border-emerald-500/20 hover:border-emerald-400/40 flex flex-col items-center">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform "><MdAddHomeWork className="text-center" /></div>
                  <h3 className="text-xl font-bold mb-2">Create Room</h3>
                  <p className="text-emerald-100 text-sm opacity-90">Start a new challenge session</p>
                </button>

                <button onClick={() => setMode("join")} className="group bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-8 rounded-2xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl border border-indigo-500/20 hover:border-indigo-400/40 flex flex-col items-center">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform"><SiCaddy /></div>
                  <h3 className="text-xl font-bold mb-2">Join Room</h3>
                  <p className="text-blue-100 text-sm opacity-90">Enter an existing session</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Room Form */}
        {mode === "create" && !joined && !roomDestroyed && (
          <div className="max-w-md mx-auto animate-fade-in">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-slate-700/50">
              <button onClick={() => setMode("")} className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors">
                <span className="text-xl">←</span> Back to Selection
              </button>

              <h2 className="text-3xl font-bold text-white mb-2">Create New Room</h2>
              <p className="text-slate-300 mb-8">Start a new challenge session and invite participants!</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Your Name</label>
                  <input type="text" placeholder="Enter your display name" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-all duration-300 text-white placeholder-slate-400" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Select Subject</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-all duration-300 text-white">
                    <option value="" disabled className="text-slate-400">Choose a subject</option>
                    <option value="aptitude">Aptitude</option>
                    <option value="profit_loss">🧠 Profit-loss</option>
                    <option value="reasoning">Reasoning</option>
                    <option value="english">English</option>
                    <option value="gk">General Knowledge</option>
                    <option value="programming">Programming</option>
                  </select>
                </div>
                
                <button onClick={createRoom} disabled={!username || !subject} className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 ${!username || !subject ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-emerald-600 to-teal-700 hover:shadow-2xl text-white border border-emerald-500/20"}`}>
                  🚀 Create & Start Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Room Form */}
        {mode === "join" && !joined && !roomDestroyed && (
          <div className="max-w-md mx-auto animate-fade-in">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-slate-700/50">
              <button onClick={() => setMode("")} className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors">
                <span className="text-xl">←</span> Back to Selection
              </button>

              <h2 className="text-3xl font-bold text-white mb-2">Join Existing Session</h2>
              <p className="text-slate-300 mb-8">Enter the session code to join the challenge!</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Your Name</label>
                  <input type="text" placeholder="Enter your display name" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 outline-none transition-all duration-300 text-white placeholder-slate-400" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Session Code</label>
                  <input type="text" placeholder="Enter session code (e.g., X7B9K2)" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 outline-none transition-all duration-300 font-mono text-center text-lg text-white" />
                </div>

                <button onClick={joinRoom} disabled={!username || !roomCode} className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 ${!username || !roomCode ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 to-blue-700 hover:shadow-2xl text-white border border-indigo-500/20"}`}>
                  🔥 Join Challenge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Waiting Room */}
        {joined && !question && !roomDestroyed && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center border border-slate-700/50">
              {!quizStarted && !quizPaused && waitingForPlayers && (
                <>
                  <div className="w-20 h-20 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin mx-auto mb-8"></div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                    {playerCount < 2 ? "Waiting for participants..." : "Ready to Start!"}
                  </h2>
                  
                  {playerCount < 2 ? (
                    <p className="text-slate-300 mb-2">Need at least 2 players to start the quiz! ({playerCount}/2)</p>
                  ) : (
                    <>
                      {autoStartCountdown !== null && autoStartCountdown > 0 && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-xl border border-cyan-500/30">
                          <p className="text-cyan-300 text-sm font-semibold mb-2">⏰ Auto-Start Countdown</p>
                          <p className="text-4xl font-bold text-cyan-400 font-mono">{formatTime(autoStartCountdown)}</p>
                          <p className="text-slate-400 text-xs mt-2">Quiz will start automatically when timer reaches zero</p>
                        </div>
                      )}
                      
                      {isCreator && !quizStarted && playerCount >= 2 && (
                        <button onClick={startQuizManually} className="mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-3 mx-auto">
                          <FaPlay className="text-xl" />
                          Start Quiz Now
                        </button>
                      )}
                      
                      {!isCreator && !quizStarted && (
                        <div className="mb-6 p-4 bg-slate-700/30 rounded-xl">
                          <p className="text-slate-300">
                            Waiting for the room creator to start the quiz...
                            {autoStartCountdown > 0 && " Or it will start automatically in " + formatTime(autoStartCountdown)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {quizPaused && (
                <>
                  <div className="w-20 h-20 border-4 border-slate-600 border-t-amber-400 rounded-full animate-pulse mx-auto mb-8"></div>
                  <h2 className="text-2xl font-bold text-amber-400 mb-3">Quiz Paused</h2>
                  <p className="text-slate-300 mb-2">Waiting for more players to join...</p>
                  <p className="text-slate-400 text-sm">Minimum 2 players required to continue ({playerCount}/2)</p>
                </>
              )}

              <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-2 border-slate-700 rounded-xl p-6 mb-8 backdrop-blur-sm">
                <p className="text-slate-300 mb-3">Share this session code:</p>
                <div className="flex items-center justify-center gap-4">
                  <p className="text-4xl font-bold font-mono text-cyan-300 tracking-wider bg-slate-900/50 py-2 px-6 rounded-lg">
                    {roomCode}
                  </p>
                  <button onClick={copyRoomCode} className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors border border-slate-600">
                    {copied ? <TbCopyCheckFilled className="text-emerald-400 size-5" /> : <IoCopy className="text-slate-300 size-5" />}
                  </button>
                </div>
                {copied && <p className="text-sm text-emerald-400 mt-3 font-medium">Code copied to clipboard!</p>}
                <p className="text-sm text-slate-400 mt-3">Invite others to join this session (Max {maxPlayers} players)</p>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Interface with Tabs */}
        {joined && question && !roomDestroyed && (
          <div className="space-y-6">
            {/* Timer and Stats Bar */}
            <div className="bg-gradient-to-r from-slate-800/70 to-blue-900/70 backdrop-blur-md rounded-2xl p-6 flex justify-between items-center animate-slide-down border border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500/20 p-3 rounded-xl border border-cyan-500/30">
                  <span className="text-2xl text-cyan-300">⏱️</span>
                </div>
                <div>
                  <div className="text-slate-300 text-sm font-semibold">TIME REMAINING</div>
                  <div className={`text-3xl font-bold ${time <= 10 ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>
                    {time}s
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-slate-300 text-sm font-semibold">SESSION</div>
                <div className="text-cyan-200 font-bold font-mono">{roomCode}</div>
                <div className="text-slate-400 text-xs mt-1">👥 {playerCount} players</div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
              <div className="flex border-b border-slate-700/50">
                <button
                  onClick={() => {
                    setActiveTab("questions");
                    setUnreadMessages(prev => ({ ...prev, questions: 0 }));
                  }}
                  className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === "questions"
                      ? "bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-300 border-b-2 border-cyan-500"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <FaQuestionCircle />
                  Questions
                  {unreadMessages.questions > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                      {unreadMessages.questions}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("users");
                    setUnreadMessages(prev => ({ ...prev, users: 0 }));
                  }}
                  className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === "users"
                      ? "bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-300 border-b-2 border-cyan-500"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <FaUsers />
                  Users ({playerCount})
                  {unreadMessages.users > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                      {unreadMessages.users}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("chat");
                    setUnreadMessages(prev => ({ ...prev, chat: 0 }));
                  }}
                  className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === "chat"
                      ? "bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-300 border-b-2 border-cyan-500"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <FaComment />
                  Chat
                  {unreadMessages.chat > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                      {unreadMessages.chat}
                    </span>
                  )}
                </button>
              </div>

              {/* Questions Tab Content */}
              {activeTab === "questions" && (
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-8 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full"></div>
                    <span className="text-sm font-semibold text-cyan-300 uppercase tracking-wide">Current Question</span>
                  </div>
                  <h2 className="lg:text-xl text-sm md:text-3xl font-thin font-sans lg:font-semibold text-white mb-8 leading-relaxed">
                    {question}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {options.map((opt, i) => {
                      const isSelected = selected === opt;
                      const isCorrect = result && opt === result.correctAnswer;

                      return (
                        <button
                          key={i}
                          onClick={() => submitAnswer(opt)}
                          disabled={!!selected || isSubmitting || !quizStarted || quizPaused}
                          className={`relative p-2 lg:p-6 rounded-xl border-2 transition-all duration-300 transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 ${isSelected ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500/50 shadow-2xl scale-[1.02]' : isCorrect && result ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:shadow-lg text-white'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-7 h-7 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold lg:text-lg border ${isSelected || isCorrect ? 'bg-white/20 text-white border-emerald-400' : 'bg-slate-700/50 text-cyan-300 border-slate-600'}`}>
                              {String.fromCharCode(65 + i)}
                            </div>
                            <div className="flex-1 text-left font-medium lg:text-lg">{opt}</div>
                            {isSelected && <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Live Leaderboard */}
                  {Object.keys(allScores).length > 0 && (
                    <div className="mt-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50">
                      <button 
                        onClick={() => setLeaderboardOpen(!leaderboardOpen)}
                        className="w-full px-6 py-4 bg-gradient-to-r from-amber-600/20 to-orange-600/20 hover:from-amber-600/30 hover:to-orange-600/30 transition-all flex justify-between items-center"
                      >
                        <div className="flex items-center gap-3">
                          <FaTrophy className="text-amber-400 text-xl" />
                          <h3 className="text-lg font-bold text-white">Live Leaderboard</h3>
                          {getHighestScore() > 0 && (
                            <div className="px-2 py-1 bg-amber-500/20 rounded-lg">
                              <span className="text-amber-300 text-sm">🏆 Highest: {getHighestScore()} pts</span>
                            </div>
                          )}
                        </div>
                        <span className="text-slate-400">{leaderboardOpen ? '▼' : '▲'}</span>
                      </button>
                      
                      {leaderboardOpen && (
                        <div className="p-6">
                          <div className="space-y-3">
                            {getScoreRanking().map((player) => (
                              <div key={player.id} className={`bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-2 rounded-xl p-4 transition-all ${player.rank === 1 ? 'border-amber-500/50 shadow-lg' : 'border-slate-700'}`}>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${player.rank === 1 ? 'bg-amber-500 text-white' : player.rank === 2 ? 'bg-slate-400 text-white' : player.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                      {player.rank}
                                    </div>
                                    <div>
                                      <div className="font-bold text-white">{player.name}</div>
                                      {result && (
                                        <div className="flex items-center gap-1 mt-1">
                                          {getAnswerStatus(player.id) === "correct" && (
                                            <span className="text-xs text-emerald-400 flex items-center gap-1"><FaCheckCircle /> Correct this round</span>
                                          )}
                                          {getAnswerStatus(player.id) === "incorrect" && (
                                            <span className="text-xs text-red-400 flex items-center gap-1"><FaTimesCircle /> Incorrect this round</span>
                                          )}
                                          {getAnswerStatus(player.id) === "not-answered" && (
                                            <span className="text-xs text-yellow-400 flex items-center gap-1"><FaHourglassHalf /> Not answered</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                      {player.score}
                                    </div>
                                    <div className="text-xs text-slate-400">points</div>
                                  </div>
                                </div>
                                <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                                    style={{ width: `${(player.score / getHighestScore()) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Results Card */}
                  {result && (
                    <div ref={resultRef} className="mt-8 relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 animate-fade-in border-4 border-amber-500/30 overflow-hidden">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                      
                      <div className="flex justify-center mb-4 sm:mb-6">
                        <div className="text-amber-400 text-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-3 rounded-2xl border border-amber-500/20 shadow-lg animate-bounce">📊</div>
                      </div>

                      <div className="text-center mb-6 sm:mb-8">
                        <div className="inline-flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-slate-800/60 to-slate-900/60 border border-slate-700/50 shadow-inner">
                          <span className="text-amber-400 text-2xl sm:text-3xl">🏆</span>
                          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">Round Results</h2>
                        </div>

                        <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 bg-gradient-to-r from-emerald-600/90 to-teal-700/90 text-white px-5 py-3 sm:px-7 sm:py-4 rounded-xl font-bold shadow-lg border border-emerald-400/30 relative overflow-hidden">
                          <div className="absolute inset-0 opacity-5"><div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[size:20px_20px]"></div></div>
                          <div className="flex items-center gap-2 z-10"><div className="w-8 h-8 bg-emerald-400/20 rounded-full flex items-center justify-center"><span className="text-emerald-300">✓</span></div><span className="text-sm sm:text-base font-semibold text-emerald-100">Correct Answer:</span></div>
                          <span className="bg-white/95 text-emerald-800 px-4 py-2 rounded-lg font-mono font-bold text-base sm:text-lg shadow-inner border border-emerald-300/30 z-10">{result.correctAnswer}</span>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <span>📋</span> Player Performance
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-slate-700/50 rounded-lg">
                              <tr className="text-left">
                                <th className="px-4 py-3 text-slate-300 font-semibold">Player</th>
                                <th className="px-4 py-3 text-slate-300 font-semibold">Answer</th>
                                <th className="px-4 py-3 text-slate-300 font-semibold">Status</th>
                                <th className="px-4 py-3 text-slate-300 font-semibold">Points</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(result.playerResults).map(([id, playerResult]) => (
                                <tr key={id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                  <td className="px-4 py-3 text-white font-medium">{playerResult.username}</td>
                                  <td className="px-4 py-3 text-slate-300 font-mono text-sm">{playerResult.answer}</td>
                                  <td className="px-4 py-3">
                                    {playerResult.isCorrect ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm">
                                        <FaCheckCircle /> Correct
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-300 rounded-lg text-sm">
                                        <FaTimesCircle /> Incorrect
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`font-bold ${playerResult.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {playerResult.scoreChange > 0 ? `+${playerResult.scoreChange}` : '+0'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-xl p-4 text-center border border-emerald-500/20">
                          <div className="text-2xl font-bold text-emerald-400">{result.summary.correctPlayers.length}</div>
                          <div className="text-xs text-slate-400">Correct Answers</div>
                        </div>
                        <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-xl p-4 text-center border border-red-500/20">
                          <div className="text-2xl font-bold text-red-400">{result.summary.incorrectPlayers.length}</div>
                          <div className="text-xs text-slate-400">Incorrect Answers</div>
                        </div>
                      </div>

                      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-700/50">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></div>
                            <div className="text-slate-400 font-semibold text-sm sm:text-base">⏳ Next round in</div>
                          </div>
                          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-2 rounded-lg font-mono font-bold text-white text-base sm:text-lg border-2 border-slate-600/50 shadow-inner min-w-[60px] text-center">
                            {newQuestionTime}s
                          </div>
                          <div className="text-xs text-slate-500 italic hidden sm:block">Get ready!</div>
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mt-4"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Users Tab Content */}
              {activeTab === "users" && (
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <FaUsers className="text-cyan-400" />
                    Players in Room ({playerCount}/{maxPlayers})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(players).map(([id, name]) => (
                      <div key={id} className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-2 border-slate-700 rounded-xl p-4 transition-all hover:scale-105 hover:border-cyan-500/30">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-800 animate-pulse"></div>
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-white text-lg">{name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {isCreator && id === Object.keys(players)[0] && (
                                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  👑 Creator
                                </span>
                              )}
                              <span className="text-xs text-slate-400">Online</span>
                            </div>
                          </div>
                          {allScores[id] !== undefined && (
                            <div className="text-right">
                              <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                {allScores[id]}
                              </div>
                              <div className="text-xs text-slate-400">points</div>
                            </div>
                          )}
                        </div>
                        {result && result.playerResults[id] && (
                          <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Last round:</span>
                              {result.playerResults[id].isCorrect ? (
                                <span className="text-emerald-400 flex items-center gap-1"><FaCheckCircle /> Correct</span>
                              ) : (
                                <span className="text-red-400 flex items-center gap-1"><FaTimesCircle /> Incorrect</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Answered: {result.playerResults[id].answer}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Tab Content */}
              {activeTab === "chat" && (
                <div className="flex flex-col h-[600px]">
                  <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center text-slate-400 mt-8">
                        <FaComment className="text-4xl mx-auto mb-3 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm mt-2">Be the first to say something! 💬</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}
                        >
                          <div className={`max-w-[80%] ${msg.isSystem ? 'bg-gradient-to-r from-slate-700/50 to-slate-800/50' : msg.username === username ? 'bg-gradient-to-r from-cyan-600/80 to-blue-600/80' : 'bg-slate-700/80'} rounded-2xl px-4 py-2 shadow-md`}>
                            {!msg.isSystem && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold flex items-center gap-1">
                                  {msg.username === username ? (
                                    <span className="text-cyan-300">{msg.username}</span>
                                  ) : (
                                    <span className="text-emerald-300">{msg.username}</span>
                                  )}
                                  {msg.isCreator && <FaTrophy className="text-amber-400 text-xs" />}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                            <p className={`text-sm break-words ${msg.isSystem ? 'text-slate-300 italic' : 'text-white'}`}>
                              {msg.isSystem ? `ℹ️ ${msg.message}` : msg.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  <form onSubmit={sendMessage} className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50 outline-none transition-all text-white placeholder-slate-400 text-sm"
                        maxLength={200}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IoSend className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right mt-1">
                      <span className="text-xs text-slate-500">{newMessage.length}/200</span>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-slide-down { animation: slide-down 0.5s ease-out; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}

export default App;