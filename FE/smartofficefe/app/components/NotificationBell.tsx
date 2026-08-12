'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Clock, Calendar, CheckCircle2, XCircle, Sparkles, X } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types/api';
import { useSocket } from '../hooks/useSocket';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toast, setToast] = useState<{ title: string; message: string; type: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load initial notifications
  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications(1, 15);
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Socket listener for real-time notifications
  useSocket({
    onNotification: (data) => {
      // Play soft chime or update state
      setToast({
        title: data.title || 'Thông báo mới',
        message: data.message || '',
        type: data.type || 'info',
      });

      // Refetch or prepend notification
      fetchNotifications();

      // Auto dismiss toast after 5s
      setTimeout(() => {
        setToast(null);
      }, 5000);
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'booking_approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
      case 'booking_rejected':
        return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
      case 'booking_created':
        return <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100 focus:outline-none cursor-pointer"
        aria-label="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Real-time Toast Popup */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-white border border-blue-100 shadow-2xl rounded-2xl p-4 max-w-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Bell className="w-6 h-6 text-blue-600 animate-bounce" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900">{toast.title}</h4>
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <CheckCheck size={14} />
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  className={`p-4 flex items-start gap-3 transition-colors ${
                    !item.isRead ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-gray-50'
                  }`}
                >
                  {getIconForType(item.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-bold ${!item.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(item._id, e)}
                          title="Đánh dấu đã đọc"
                          className="w-2 h-2 rounded-full bg-blue-600 hover:scale-125 transition-transform flex-shrink-0 cursor-pointer"
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.message}</p>
                    <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
