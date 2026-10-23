'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  Calendar, 
  Users, 
  MapPin, 
  CheckCircle, 
  ArrowRight, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { aiService, RecommendedRoom } from '../services/aiService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  recommendedRooms?: RecommendedRoom[];
  searchParams?: {
    date: string;
    startTime: string;
    endTime: string;
  };
}

export default function AIAssistantWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý Đặt phòng Thông minh SmartOffice AI. Bạn muốn tìm phòng họp hoặc thiết bị vào khung giờ nào?',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chỉ hiển thị widget khi người dùng đã đăng nhập (có token)
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isLoggedIn) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: prompt,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await aiService.sendSmartBookingPrompt(prompt);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.data.message || 'Đã tìm thấy phòng phù hợp cho bạn.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        recommendedRooms: res.data.recommendedRooms,
        searchParams: res.data.searchParams,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: error.response?.data?.message || 'Rất tiếc, đã có lỗi kết nối với máy chủ AI. Vui lòng thử lại sau ít phút.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookNow = (room: RecommendedRoom, params?: { date: string; startTime: string; endTime: string }) => {
    // Chuyển hướng người dùng sang trang đặt phòng với các tham số đã trích xuất
    if (params) {
      router.push(`/dashboard/resources?roomId=${room.id}&date=${params.date}&startTime=${params.startTime}&endTime=${params.endTime}`);
    } else {
      router.push(`/dashboard/resources?roomId=${room.id}`);
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 1. Nút bong bóng AI Widget */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-indigo-500/30"
          title="Trợ lý AI Đặt phòng Thông minh"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 absolute -top-1.5 -right-1.5 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <span className="font-semibold text-sm tracking-wide pr-1 hidden sm:inline-block">AI Smart Booking</span>
        </button>
      )}

      {/* 2. Khung Chat Modal */}
      {isOpen && (
        <div className="flex flex-col w-[360px] sm:w-[420px] h-[580px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  SmartOffice AI
                  <span className="text-[10px] bg-emerald-500/80 text-white px-2 py-0.5 rounded-full font-medium">Online</span>
                </h3>
                <p className="text-[11px] text-indigo-100">Tìm kiếm & Đặt phòng thông minh</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Danh sách phòng họp gợi ý */}
                  {msg.recommendedRooms && msg.recommendedRooms.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <p className="font-semibold text-[11px] text-indigo-600 dark:text-indigo-400">
                        ✨ Danh sách phòng họp còn trống:
                      </p>
                      {msg.recommendedRooms.map((room) => (
                        <div
                          key={room.id}
                          className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl hover:border-indigo-400 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">{room.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                              Sẵn sàng
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-indigo-500" /> {room.capacity} người
                            </span>
                            {room.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-500" /> {room.location}
                              </span>
                            )}
                          </div>
                          {room.description && (
                            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 italic">
                              {room.description}
                            </p>
                          )}
                          <button
                            onClick={() => handleBookNow(room, msg.searchParams)}
                            className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-medium transition-colors"
                          >
                            <span>Chọn phòng này</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 px-1 mt-1">{msg.time}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs py-2 px-3 bg-white dark:bg-slate-800 rounded-xl w-fit border border-indigo-100 dark:border-slate-700 shadow-sm animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>AI đang tìm kiếm phòng họp còn trống...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Gợi ý câu hỏi mẫu */}
          <div className="px-3 py-2 bg-slate-100/70 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleSendMessage('Tìm phòng họp 8 người chiều nay lúc 14:00')}
              className="whitespace-nowrap px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:border-indigo-400 text-slate-700 dark:text-slate-300 transition-colors"
            >
              💡 Phòng 8 người chiều nay 14h
            </button>
            <button
              onClick={() => handleSendMessage('Có phòng nào có máy chiếu sáng mai lúc 09:00 không?')}
              className="whitespace-nowrap px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:border-indigo-400 text-slate-700 dark:text-slate-300 transition-colors"
            >
              💡 Phòng có máy chiếu sáng mai 9h
            </button>
          </div>

          {/* Input Chat */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Nhập yêu cầu: Ví dụ tìm phòng 10 người..."
              className="flex-1 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputPrompt.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
