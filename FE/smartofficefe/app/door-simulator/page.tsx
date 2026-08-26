'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  DoorOpen,
  DoorClosed,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  UserCheck,
  History,
  Sparkles,
  RefreshCw,
  Info,
  ArrowLeft
} from 'lucide-react';

interface Room {
  _id: string;
  name: string;
  location: string;
  status: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  rfidCardId?: string;
}

interface Booking {
  _id: string;
  userId?: { name: string; email: string; rfidCardId?: string };
  resourceId?: { name: string; location: string };
  startTime: string;
  endTime: string;
  status: string;
}

interface SwipeLog {
  id: string;
  time: string;
  roomName: string;
  userName: string;
  rfidCardId: string;
  doorUnlocked: boolean;
  checkInSuccess: boolean;
  message: string;
}

export default function StandaloneDoorSimulatorPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);

  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedCardCode, setSelectedCardCode] = useState<string>('');
  const [customCardCode, setCustomCardCode] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);
  const [doorState, setDoorState] = useState<'locked' | 'unlocked'>('locked');
  const [lastResult, setLastResult] = useState<any>(null);
  const [logs, setLogs] = useState<SwipeLog[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    return () => clearInterval(timer);
  }, []);

  // Fetch initial simulator data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/access-control/simulator-data');
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms || []);
        setUsers(data.users || []);
        setActiveBookings(data.activeBookings || []);

        if (data.rooms && data.rooms.length > 0 && !selectedRoomId) {
          setSelectedRoomId(data.rooms[0]._id);
        }
        if (data.users && data.users.length > 0 && !selectedCardCode) {
          const emp = data.users.find((u: User) => u.rfidCardId === 'RFID-1004') || data.users[0];
          setSelectedCardCode(emp?.rfidCardId || '');
        }
      }
    } catch (err) {
      console.error('Error fetching simulator data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Audio Beep simulation
  const playBeep = (isSuccess: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + (isSuccess ? 0.2 : 0.3));
    } catch (e) {}
  };

  // Card Swipe Handler
  const handleSwipe = async () => {
    if (!selectedRoomId) {
      alert('Vui lòng chọn phòng họp!');
      return;
    }

    const cardCodeToUse = customCardCode.trim() || selectedCardCode;

    setIsSwiping(true);
    setDoorState('locked');

    try {
      const res = await fetch('http://localhost:5000/api/access-control/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: selectedRoomId,
          cardCode: cardCodeToUse,
        }),
      });

      const result = await res.json();
      setLastResult(result);

      if (result.success) {
        setDoorState('unlocked');
        playBeep(result.checkInSuccess);

        const newLog: SwipeLog = {
          id: Math.random().toString(36).substring(2, 9),
          time: new Date().toLocaleTimeString('vi-VN'),
          roomName: result.roomName || 'Phòng họp',
          userName: result.user ? result.user.name : 'Khách / Vãng lai',
          rfidCardId: cardCodeToUse || 'NONE',
          doorUnlocked: result.doorUnlocked,
          checkInSuccess: result.checkInSuccess,
          message: result.message,
        };

        setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
        fetchData();

        setTimeout(() => {
          setDoorState('locked');
        }, 3500);
      }
    } catch (err) {
      console.error('Swipe error:', err);
      alert('Lỗi hệ thống khi quẹt thẻ');
    } finally {
      setIsSwiping(false);
    }
  };

  const selectedRoomObj = rooms.find((r) => r._id === selectedRoomId);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      {/* Top Standalone Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft size={16} />
              Về Dashboard
            </Link>
            <div className="h-5 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
              </div>
              <span className="text-lg font-bold text-gray-900">SmartOffice</span>
              <span className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full font-medium">
                Mô phỏng máy quẹt thẻ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-mono bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{currentTime || '14:00:00'}</span>
            </div>
            <button
              onClick={fetchData}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-blue-950 space-y-0.5">
            <span className="font-bold text-blue-900">Quy tắc mở cửa & Check-in: </span>
            <span>
              Cửa phòng họp <strong>luôn mở tự do cho mọi thẻ nhân viên/khách</strong>. Nếu thẻ đó thuộc về nhân viên có lịch đặt phòng lúc này ➔ Hệ thống sẽ <strong>tự động nhận diện và Check-in đơn đặt</strong>.
            </span>
          </div>
        </div>

        {/* Main Grid: Control Panel + Door Hardware */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
          {/* Left Panel: Virtual Swiper Control (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Bảng Quẹt Thẻ Cửa Phòng (Virtual Reader)
                </h2>
                <span className="text-xs text-gray-400 font-mono">Simulated Reader #01</span>
              </div>

              {/* 1. Select Room */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  1. Chọn vị trí phòng họp
                </label>
                <div className="relative">
                  <Building2 className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer font-medium"
                  >
                    {rooms.map((room) => (
                      <option key={room._id} value={room._id}>
                        📍 {room.name} ({room.location})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Select User / RFID Card */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  2. Chọn thẻ nhân viên quẹt cửa
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                  {users.map((u) => (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => {
                        setSelectedCardCode(u.rfidCardId || '');
                        setCustomCardCode('');
                      }}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        selectedCardCode === u.rfidCardId && !customCardCode
                          ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{u.name}</div>
                        <div className="text-[11px] text-gray-400 uppercase">{u.role}</div>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-blue-600 font-bold">
                        {u.rfidCardId || 'No Card'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom Card Input */}
                <input
                  type="text"
                  placeholder="Hoặc nhập mã thẻ RFID ngẫu nhiên (Ví dụ: GUEST-999)..."
                  value={customCardCode}
                  onChange={(e) => setCustomCardCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            {/* Big Action Swipe Button */}
            <button
              onClick={handleSwipe}
              disabled={isSwiping}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                isSwiping
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 active:scale-[0.99]'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              {isSwiping ? 'Đang đọc tín hiệu thẻ...' : '💳 CHẠM THẺ VÀO PHÒNG'}
            </button>
          </div>

          {/* Right Panel: Door Hardware Simulation (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between items-center text-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Trạng thái cửa phòng
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  doorState === 'unlocked' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                }`}
              />
            </div>

            {/* Door graphic status */}
            <div className="my-8 flex flex-col items-center">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  doorState === 'unlocked'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600 scale-105 shadow-lg shadow-emerald-100'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                {doorState === 'unlocked' ? (
                  <DoorOpen className="w-12 h-12" />
                ) : (
                  <DoorClosed className="w-12 h-12" />
                )}
              </div>

              <div className="mt-4">
                <div
                  className={`text-lg font-bold transition ${
                    doorState === 'unlocked' ? 'text-emerald-600' : 'text-gray-700'
                  }`}
                >
                  {doorState === 'unlocked' ? '🔓 CỬA ĐÃ MỞ (UNLOCKED)' : '🔒 CỬA KHÓA (LOCKED)'}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedRoomObj ? selectedRoomObj.name : 'Chưa chọn phòng'}
                </p>
              </div>
            </div>

            {/* Response Banner */}
            <div className="w-full">
              {lastResult ? (
                <div
                  className={`p-3.5 rounded-xl border text-left text-xs font-medium ${
                    lastResult.checkInSuccess
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : lastResult.user
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {lastResult.checkInSuccess ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold mb-0.5">
                        {lastResult.checkInSuccess ? '✓ Đã Check-in Tự Động' : 'ⓘ Vào Phòng Tự Do'}
                      </div>
                      <div className="leading-snug">{lastResult.message}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-400">
                  Hãy chọn một thẻ nhân viên và bấm nút quẹt thẻ để kiểm thử!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Grid: Logs & Active Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Logs Table (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              Lịch sử quẹt thẻ vừa diễn ra
            </h3>

            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
                Chưa có lượt quẹt thẻ nào.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                    <tr>
                      <th className="p-2.5">Thời gian</th>
                      <th className="p-2.5">Phòng</th>
                      <th className="p-2.5">Người quẹt</th>
                      <th className="p-2.5 text-center">Cửa</th>
                      <th className="p-2.5 text-right">Check-in</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/60">
                        <td className="p-2.5 font-mono text-gray-400">{log.time}</td>
                        <td className="p-2.5 font-semibold text-gray-900">{log.roomName}</td>
                        <td className="p-2.5">
                          <div className="font-semibold text-gray-900">{log.userName}</div>
                          <div className="text-[10px] font-mono text-gray-400">{log.rfidCardId}</div>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            MỞ CỬA
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          {log.checkInSuccess ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                              ✓ Đã Check-in
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] text-gray-400 bg-gray-100">
                              Tự do
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Bookings Quick Reference (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Danh sách lịch đặt phòng
              </h3>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                {activeBookings.length} Đơn
              </span>
            </div>

            {activeBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
                Chưa có đơn đặt phòng nào trên hệ thống.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {activeBookings.map((b) => (
                  <div
                    key={b._id}
                    className={`p-3 rounded-xl border text-xs transition ${
                      b.status === 'checked_in'
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-gray-900 mb-1">
                      <span>📍 {b.resourceId?.name || 'Phòng họp'}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'checked_in'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {b.status === 'checked_in' ? 'Đã Check-in' : 'Chờ Check-in'}
                      </span>
                    </div>
                    <div className="text-gray-600 flex items-center justify-between text-[11px]">
                      <span>👤 {b.userId?.name || 'Chưa rõ'}</span>
                      <span className="font-mono text-blue-600 font-semibold">
                        {b.userId?.rfidCardId || 'No Card'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
