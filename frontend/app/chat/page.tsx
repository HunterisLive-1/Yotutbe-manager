"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, MessageSquare, Trash2, Send } from "lucide-react";

interface Session {
  session_id: string;
  created: string;
  title: string;
  message_count: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
}

interface ChatHistory {
  session_id: string;
  title: string;
  messages: Message[];
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [model, setModel] = useState("gemini");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/chat/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions");
    }
  };

  const createNewChat = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/chat/new", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setActiveSessionId(data.session_id);
        fetchSessions();
      }
    } catch (err) {
      console.error("Failed to create chat");
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/chat/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (err) {
      console.error("Failed to load session");
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:8000/api/chat/${sessionId}`, { method: "DELETE" });
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setChatHistory(null);
      }
      fetchSessions();
    } catch (err) {
      console.error("Failed to delete session");
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeSessionId) return;

    const newMessage: Message = {
      role: "user",
      content: inputMessage,
      time: new Date().toISOString()
    };

    setChatHistory(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMessage]
    } : null);
    
    setInputMessage("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: activeSessionId,
          message: newMessage.content,
          model: model
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessage: Message = {
          role: "assistant",
          content: data.reply,
          time: new Date().toISOString()
        };
        setChatHistory(prev => prev ? {
          ...prev,
          messages: [...prev.messages, assistantMessage]
        } : null);
        fetchSessions(); // update titles/counts
      }
    } catch (err) {
      console.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      sendMessage();
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadSession(activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory?.messages, loading]);

  return (
    <div className="flex h-[calc(100vh-64px)] gap-8 animate-[fade-in_0.5s_ease-out]">
      {/* Sidebar */}
      <div className="w-[300px] glass-panel rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#6366f1]/20 rounded-full blur-[50px] -z-10"></div>
        <div className="p-6 border-b border-[#ffffff0a]">
          <button 
            onClick={createNewChat}
            className="group w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white py-3.5 rounded-2xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300"
          >
            <div className="bg-white/20 p-1 rounded-full group-hover:scale-110 transition-transform">
              <Plus size={16} />
            </div>
            New Session
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center p-8 opacity-50">
              <MessageSquare size={32} className="mx-auto mb-3 text-[#64748b]" />
              <p className="text-sm font-medium text-[#94a3b8]">No active sessions</p>
            </div>
          ) : sessions.map(session => (
            <div 
              key={session.session_id}
              onClick={() => setActiveSessionId(session.session_id)}
              className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                activeSessionId === session.session_id 
                  ? "bg-[#6366f1]/10 border-[#6366f1]/30 shadow-inner" 
                  : "bg-transparent border-transparent hover:bg-[#1a1a24] hover:border-[#ffffff0a]"
              }`}
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className={`p-2 rounded-xl transition-colors ${activeSessionId === session.session_id ? 'bg-[#6366f1]/20 text-[#818cf8]' : 'bg-[#1e1e2e] text-[#64748b]'}`}>
                  <MessageSquare size={16} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate w-32 ${activeSessionId === session.session_id ? 'text-white' : 'text-[#cbd5e1]'}`}>{session.title}</p>
                  <p className="text-[11px] font-medium text-[#64748b] tracking-wider uppercase mt-0.5">{new Date(session.created).toLocaleDateString()}</p>
                </div>
              </div>
              <button 
                onClick={(e) => deleteSession(session.session_id, e)}
                className={`transition-all p-2 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 ${activeSessionId === session.session_id ? 'opacity-100 text-[#64748b]' : 'opacity-0 group-hover:opacity-100 text-[#64748b]'}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#22d3ee]/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
        {!activeSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1] to-[#22d3ee] blur-3xl opacity-20 rounded-full"></div>
              <div className="relative bg-[#111118]/80 backdrop-blur-xl border border-[#ffffff0a] p-6 rounded-3xl">
                <MessageSquare size={64} className="text-[#818cf8]" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#cbd5e1] mb-3">AI Intelligence Hub</h2>
            <p className="text-[#94a3b8] max-w-sm mb-8 font-medium">Connect with Gemini or Claude for data-driven insights tailored to your channel.</p>
            <button 
              onClick={createNewChat}
              className="bg-[#e2e8f0] text-[#0a0a0f] px-8 py-3.5 rounded-xl font-bold hover:bg-white hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300"
            >
              Initialize Session
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {chatHistory?.messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === "user" 
                      ? "bg-[#6366f1] text-white rounded-br-none" 
                      : "bg-[#1e1e2e] text-[#e2e8f0] border border-[#2d2d3f] rounded-bl-none"
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  <span className="text-xs text-[#64748b] mt-2 px-2">
                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {loading && (
                <div className="flex flex-col items-start">
                  <div className="max-w-[80%] bg-[#1e1e2e] text-[#e2e8f0] border border-[#2d2d3f] rounded-2xl rounded-bl-none p-4 flex gap-2">
                    <div className="w-2 h-2 bg-[#64748b] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#64748b] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-[#64748b] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-[#1e1e2e] bg-[#0a0a0f]">
              <div className="flex items-end gap-4 max-w-4xl mx-auto">
                <select 
                  value={model} 
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-[#111118] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] outline-none h-[42px]"
                >
                  <option value="gemini">Gemini 2.0</option>
                  <option value="claude">Claude Sonnet</option>
                </select>
                
                <div className="flex-1 relative">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message... (Ctrl + Enter to send)"
                    className="w-full bg-[#111118] border border-[#1e1e2e] rounded-lg pl-4 pr-12 py-3 text-[#e2e8f0] outline-none focus:border-[#6366f1] transition resize-none"
                    rows={1}
                    style={{ minHeight: "42px", maxHeight: "120px" }}
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || loading}
                    className="absolute right-2 bottom-2 p-2 bg-[#6366f1] text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4f46e5] transition"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
