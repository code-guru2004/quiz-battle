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
  const [newQuestionTime, setNewQuestionTime] = useState(0);
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

  useEffect(() => {
    if (newQuestionTime <= 0) return;
    const timer = setInterval(() => {
      setNewQuestionTime((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [newQuestionTime]);

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
      console.log(data);

      setQuestion(data.question);
      setOptions(data.options);
      setTime(data.time);
      setSelected("");
      setResult(null);
    });

    socket.on("result", (data) => {
      console.log(data);

      setResult(data)
      setNewQuestionTime(data.time || 5);
    });

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
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform "><MdAddHomeWork className="text-center" /></div>
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
                    {copied ? <TbCopyCheckFilled className="text-emerald-400 size-5" />
                      : <IoCopy className="text-slate-300 size-5" />}
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
                className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 animate-fade-in border-4 border-amber-500/30 overflow-hidden"
              >
                {/* Top decorative line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

                {/* Scroll indicator - refined */}
                <div className="flex justify-center mb-4 sm:mb-6 animate-bounce">
                  <div className="text-amber-400 text-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-3 rounded-2xl border border-amber-500/20 shadow-lg">
                    📊
                  </div>
                </div>

                {/* Header - refined with better spacing */}
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-slate-800/60 to-slate-900/60 border border-slate-700/50 shadow-inner">
                    <span className="text-amber-400 text-2xl sm:text-3xl">🏆</span>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
                      Round Results
                    </h2>
                  </div>

                  {/* Correct Answer - refined */}
                  <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 bg-gradient-to-r from-emerald-600/90 to-teal-700/90 text-white px-5 py-3 sm:px-7 sm:py-4 rounded-xl font-bold shadow-lg border border-emerald-400/30 relative overflow-hidden">
                    {/* Subtle pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[size:20px_20px]"></div>
                    </div>

                    <div className="flex items-center gap-2 z-10">
                      <div className="w-8 h-8 bg-emerald-400/20 rounded-full flex items-center justify-center">
                        <span className="text-emerald-300">✓</span>
                      </div>
                      <span className="text-sm sm:text-base font-semibold text-emerald-100">Correct Answer:</span>
                    </div>
                    <span className="bg-white/95 text-emerald-800 px-4 py-2 rounded-lg font-mono font-bold text-base sm:text-lg shadow-inner border border-emerald-300/30 z-10">
                      {result.correctAnswer}
                    </span>
                  </div>
                </div>

                {/* Leaderboard Section */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Section Header */}
                  <div className="relative flex items-center justify-center mb-2 sm:mb-4">
                    <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                    <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 px-4 py-2 rounded-lg border border-slate-700/50 shadow-sm">
                      <h3 className="text-base sm:text-xl font-bold text-slate-300 flex items-center gap-2">
                        <span className="text-amber-400">🏅</span>
                        Leaderboard
                      </h3>
                    </div>
                  </div>

                  {/* Leaderboard Items */}
                  <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2">
                    {Object.keys(result.scores)
                      .sort((a, b) => result.scores[b] - result.scores[a])
                      .map((id, index) => (
                        <div
                          key={id}
                          className="group bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-2 border-slate-700 rounded-xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 hover:border-cyan-500/30"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            {/* Left Column - Player Info */}
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                              {/* Rank Badge - refined */}
                              <div className={`
                    relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl shadow-lg border-2
                    ${index === 0
                                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white border-amber-400 animate-pulse'
                                  : index === 1
                                    ? 'bg-gradient-to-br from-slate-400 to-slate-600 text-white border-slate-400'
                                    : index === 2
                                      ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-white border-amber-700'
                                      : 'bg-slate-700 text-slate-300 border-slate-600'
                                }
                  `}>
                                {/* Subtle glow */}
                                <div className={`absolute inset-0 rounded-full opacity-30 blur-sm ${index === 0 ? 'bg-amber-400' :
                                    index === 1 ? 'bg-slate-400' :
                                      index === 2 ? 'bg-amber-600' : 'bg-slate-500'
                                  }`}></div>
                                <span className="relative z-10">
                                  {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                </span>
                              </div>

                              {/* Player Details - refined spacing */}
                              <div className="flex-1 min-w-0">
                                {/* Name and Status */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                                  <h4 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">
                                    {result.users[id]}
                                  </h4>
                                  <div className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit
                        ${index === 0
                                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                      : index === 1
                                        ? 'bg-slate-500/10 text-slate-300 border border-slate-500/30'
                                        : index === 2
                                          ? 'bg-amber-700/10 text-amber-300 border border-amber-700/30'
                                          : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                                    }
                      `}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                                    {index === 0 ? 'Champion' :
                                      index === 1 ? 'Runner-up' :
                                        index === 2 ? 'Third Place' : 'Participant'}
                                  </div>
                                </div>

                                {/* Answer Status - improved layout */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border ${result.playerResults[id].isCorrect
                                      ? 'bg-emerald-500/5 text-emerald-300 border-emerald-500/20'
                                      : 'bg-red-500/5 text-red-300 border-red-500/20'
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full ${result.playerResults[id].isCorrect ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                                      }`}></span>
                                    <span className="font-semibold">
                                      {result.playerResults[id].isCorrect ? 'Correct' : 'Incorrect'}
                                    </span>
                                    <span className="text-xs opacity-80 font-mono bg-slate-800/30 px-1.5 py-0.5 rounded">
                                      {result.playerResults[id].answer? result.playerResults[id].answer : 'No Answer'}
                                    </span>
                                    <span className="ml-1">
                                      {result.playerResults[id].isCorrect ? '✅' : '❌'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Column - Score - refined */}
                            <div className="flex flex-col items-end sm:items-end w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-700/50 sm:border-none">
                              <div className="text-right">
                                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                  {result.scores[id]}
                                </div>
                                <div className="text-xs sm:text-sm text-slate-400 font-medium tracking-wider">
                                  POINTS
                                </div>
                              </div>

                              {/* Score Progress Bar - new addition */}
                              <div className="mt-2 w-24 sm:w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${index === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                      index === 1 ? 'bg-gradient-to-r from-slate-300 to-slate-400' :
                                        index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                                          'bg-gradient-to-r from-cyan-500/70 to-blue-500/70'
                                    }`}
                                  style={{
                                    width: `${Math.min(100, 100 - (index * 20))}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Next Round Indicator - refined */}
                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-700/50">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></div>
                        <div className="text-slate-400 font-semibold text-sm sm:text-base">
                          ⏳ Next round in
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-2 rounded-lg font-mono font-bold text-white text-base sm:text-lg border-2 border-slate-600/50 shadow-inner min-w-[60px] text-center">
                        {newQuestionTime}s
                      </div>
                      <div className="text-xs text-slate-500 italic hidden sm:block">
                        Get ready!
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom decorative line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mt-4"></div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Custom Animations */}
      {/* <style jsx global>{`
        
      `}</style> */}
    </div>
  );
}

export default App;