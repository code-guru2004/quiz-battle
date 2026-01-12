import { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { IoCopy } from "react-icons/io5";
import { TbCopyCheckFilled } from "react-icons/tb";
import { MdAddHomeWork } from "react-icons/md";
import { SiCaddy } from "react-icons/si";

import socket from "./socket";

function App() {
  const [mode, setMode] = useState(""); // "", "join", "create"
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joined, setJoined] = useState(false);

  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [time, setTime] = useState(0);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);
  const [players, setPlayers] = useState({});
  const [copied, setCopied] = useState(false);

  const resultRef = useRef(null);
  const mainContentRef = useRef(null);

  // Timer sync (always from backend)
  useEffect(() => {
    if (time <= 0) return;
    const timer = setInterval(() => {
      setTime((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [time]);

  const createRoom = () => {
    if (!username) return alert("Enter your name");
    const newRoom = uuidv4().slice(0, 8);
    setRoomCode(newRoom);
    socket.emit("join-room", { roomCode: newRoom, username });
    setJoined(true);
  };

  const joinRoom = () => {
    if (!username || !roomCode) return alert("Enter name & room code");
    socket.emit("join-room", { roomCode, username });
    setJoined(true);
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
  // Auto-scroll to results when they appear
  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [result]);

  // Auto-scroll to top when question changes
  useEffect(() => {
    if (question && mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [question]);

  useEffect(() => {
    socket.on("players", (data) => setPlayers(data));

    socket.on("new-question", (data) => {
      setQuestion(data.question);
      setOptions(data.options);
      setTime(data.time);
      setSelected("");
      setResult(null);
    });

    socket.on("result", (data) => setResult(data));

    return () => {
      socket.off("players");
      socket.off("new-question");
      socket.off("result");
    };
  }, []);

  const submitAnswer = (opt) => {
    if (selected) setSelected("");
    setSelected(opt);
    socket.emit("submit-answer", { roomCode, answer: opt });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800/90 to-blue-900/90 backdrop-blur-md border-b border-slate-700/30 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            🧠 QuizBattle Pro
          </h1>

          {joined && (
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full text-slate-100 font-semibold text-sm border border-slate-700">
                Room: <span className="font-bold text-cyan-300">{roomCode}</span>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full text-white font-semibold text-sm shadow-lg">
                👤 {username}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main
        ref={mainContentRef}
        className="max-w-7xl mx-auto px-4 py-8 overflow-y-auto max-h-[calc(100vh-80px)]"
      >
        {/* Mode Selection */}
        {!mode && !joined && (
          <div className="max-w-lg mx-auto animate-fade-in">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center border border-slate-700/50">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome to QuizBattle Pro</h2>
              <p className="text-slate-300 mb-8">Challenge your intellect in real-time knowledge battles!</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create Room Button */}
                <button
                  onClick={() => setMode("create")}
                  className="group bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-8 rounded-2xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl border border-emerald-500/20 hover:border-emerald-400/40 flex flex-col items-center"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform "><MdAddHomeWork className="text-center"/></div>
                  <h3 className="text-xl font-bold mb-2">Create Room</h3>
                  <p className="text-emerald-100 text-sm opacity-90">Start a new challenge session</p>
                </button>

                {/* Join Room Button */}
                <button
                  onClick={() => setMode("join")}
                  className="group bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-8 rounded-2xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl border border-indigo-500/20 hover:border-indigo-400/40 flex flex-col items-center"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform"><SiCaddy /></div>
                  <h3 className="text-xl font-bold mb-2">Join Room</h3>
                  <p className="text-blue-100 text-sm opacity-90">Enter an existing session</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Room Form */}
        {mode === "create" && !joined && (
          <div className="max-w-md mx-auto animate-fade-in">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-slate-700/50">
              <button
                onClick={() => setMode("")}
                className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
              >
                <span className="text-xl">←</span> Back to Selection
              </button>

              <h2 className="text-3xl font-bold text-white mb-2">Create New Room</h2>
              <p className="text-slate-300 mb-8">Start a new challenge session and invite participants!</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your display name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-all duration-300 text-white placeholder-slate-400"
                  />
                </div>

                <button
                  onClick={createRoom}
                  disabled={!username}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 ${!username
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-600 to-teal-700 hover:shadow-2xl text-white border border-emerald-500/20"
                    }`}
                >
                  🚀 Create & Start Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Room Form */}
        {mode === "join" && !joined && (
          <div className="max-w-md mx-auto animate-fade-in">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-slate-700/50">
              <button
                onClick={() => setMode("")}
                className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
              >
                <span className="text-xl">←</span> Back to Selection
              </button>

              <h2 className="text-3xl font-bold text-white mb-2">Join Existing Session</h2>
              <p className="text-slate-300 mb-8">Enter the session code to join the challenge!</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your display name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 outline-none transition-all duration-300 text-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Session Code
                  </label>
                  <input
                    type="text"
                    placeholder="Enter session code (e.g., X7B9K2)"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 outline-none transition-all duration-300 font-mono text-center text-lg text-white"
                  />
                </div>

                <button
                  onClick={joinRoom}
                  disabled={!username || !roomCode}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 ${!username || !roomCode
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-blue-700 hover:shadow-2xl text-white border border-indigo-500/20"
                    }`}
                >
                  🔥 Join Challenge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Waiting Room */}
        {joined && !question && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center border border-slate-700/50">
              <div className="w-20 h-20 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin mx-auto mb-8"></div>

              <h2 className="text-2xl font-bold text-white mb-3">Waiting for participants...</h2>
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-2 border-slate-700 rounded-xl p-6 mb-8 backdrop-blur-sm">
                <p className="text-slate-300 mb-3">Share this session code:</p>
                <div className="flex items-center justify-center gap-4">
                  <p className="text-4xl font-bold font-mono text-cyan-300 tracking-wider bg-slate-900/50 py-2 px-6 rounded-lg">
                    {roomCode}
                  </p>
                  <button
                    onClick={copyRoomCode}
                    className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors border border-slate-600"
                  >
                    {copied ? <TbCopyCheckFilled className="text-emerald-400 size-5"/>
                      : <IoCopy className="text-slate-300 size-5"/>}
                  </button>
                </div>
                {
                  copied && <p className="text-sm text-emerald-400 mt-3 font-medium">Code copied to clipboard!</p>
                }
                <p className="text-sm text-slate-400 mt-3">Invite others to join this session</p>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-slate-300 mb-4">Participants in Session</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  {Object.entries(players).map(([id, name]) => (
                    <div
                      key={id}
                      className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-2 border-slate-700 rounded-xl px-6 py-3 font-semibold text-slate-100 flex items-center gap-2 transition-all hover:scale-105 hover:border-cyan-500/30"
                    >
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      👤 {name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Interface */}
        {joined && question && (
          <div className="space-y-8">
            {/* Timer Bar */}
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
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 animate-fade-in border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-8 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full"></div>
                <span className="text-sm font-semibold text-cyan-300 uppercase tracking-wide">Question</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 leading-relaxed">
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
                      className={`
                        relative p-6 rounded-xl border-2 transition-all duration-300 
                        transform hover:-translate-y-1 disabled:cursor-not-allowed
                        ${isSelected
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500/50 shadow-2xl scale-[1.02]' 
                          : isCorrect && result
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500/50'
                            : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:shadow-lg text-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border
                          ${isSelected || isCorrect 
                            ? 'bg-white/20 text-white border-emerald-400' 
                            : 'bg-slate-700/50 text-cyan-300 border-slate-600'
                          }
                        `}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div className="flex-1 text-left font-medium text-lg">
                          {opt}
                        </div>
                        {isSelected && (
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                            ✓
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Card - with ref for auto-scroll */}
            {result && (
              <div
                ref={resultRef}
                className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 animate-fade-in border-4 border-amber-500/30"
              >
                {/* Scroll indicator */}
                <div className="flex justify-center mb-4 animate-bounce">
                  <div className="text-amber-400 text-2xl">📊</div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                    🏆 Round Results
                  </h2>
                  <div className="inline-block bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-3 rounded-full font-bold shadow-lg border border-emerald-400/30">
                    ✅ Correct Answer: <span className="ml-2 bg-white text-emerald-700 px-4 py-1 rounded-full font-mono font-bold">{result.correctAnswer}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-300 mb-6 text-center">
                    🏅 Leaderboard
                  </h3>

                  <div className="space-y-4">
                    {Object.keys(result.scores)
                      .sort((a, b) => result.scores[b] - result.scores[a])
                      .map((id, index) => (
                        <div
                          key={id}
                          className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-2 border-slate-700 rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-x-1 hover:border-cyan-500/30"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg border-2
                                ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white border-amber-400 animate-pulse' :
                                  index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600 text-white border-slate-400' :
                                    index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-white border-amber-700' :
                                      'bg-slate-700 text-slate-300 border-slate-600'}
                              `}>
                                {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                              </div>
                              <div>
                                <div className="text-xl font-bold text-white">
                                  {result.users[id]}
                                </div>
                                <div className="text-slate-400 text-sm">
                                  {index === 0 ? 'Champion' :
                                    index === 1 ? 'Runner-up' :
                                      index === 2 ? 'Third Place' : 'Participant'}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                {result.scores[id]} pts
                              </div>
                              <div className="text-sm text-slate-400">
                                Total Score
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Next round indicator */}
                  <div className="mt-8 pt-6 border-t border-slate-700 text-center">
                    <div className="text-slate-400 font-semibold animate-pulse">
                      ⏳ Next challenge starting soon...
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes subtle-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(6, 182, 212, 0.2);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        .animate-subtle-glow {
          animation: subtle-glow 3s ease-in-out infinite;
        }
        
        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #3b82f6);
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0891b2, #2563eb);
        }
        
        /* Smooth transitions */
        * {
          transition: background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
        }
        
        /* Selection styles */
        ::selection {
          background-color: rgba(6, 182, 212, 0.3);
          color: white;
        }
      `}</style>
    </div>
  );
}

export default App;