import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Users,
  User,
  Send,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  ShieldCheck,
  Baby
} from 'lucide-react';
import parentApi from '../../../api/parentApi';

interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: 'TEACHER' | 'PARENT';
  content: string;
  sentAt: string;
}

interface ParentThread {
  id: string;
  parentName: string;
  studentName: string;
  className: string;
  phone: string;
  lastMessage: string;
  unreadCount: number;
}

export const TeacherChatTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [chatType, setChatType] = useState<'CLASS_GROUP' | 'PRIVATE'>('CLASS_GROUP');
  const [selectedThreadId, setSelectedThreadId] = useState<string>('thread-1');
  const [inputText, setInputText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Group Messages
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([
    {
      id: 'g-1',
      senderName: 'Cô Lan (Chủ nhiệm)',
      senderRole: 'TEACHER',
      content: 'Chào quý phụ huynh, tuần này lớp mình sẽ có buổi học kỹ năng sống và chăm sóc cây xanh vào sáng thứ Năm nhé ạ!',
      sentAt: '08:15',
    },
    {
      id: 'g-2',
      senderName: 'Mẹ bé Bảo An',
      senderRole: 'PARENT',
      content: 'Dạ vâng cô, phụ huynh đã chuẩn bị sẵn mũ và bình nước cá nhân cho bé rồi ạ.',
      sentAt: '08:22',
    },
    {
      id: 'g-3',
      senderName: 'Bố bé Gia Hưng',
      senderRole: 'PARENT',
      content: 'Cảm ơn cô giáo, các con rất hào hứng với hoạt động trồng cây này.',
      sentAt: '08:45',
    },
  ]);

  // Private Threads
  const [privateThreads, setPrivateThreads] = useState<ParentThread[]>([
    {
      id: 'thread-1',
      parentName: 'Mẹ Trần Thị Mai',
      studentName: 'Trần Bảo An',
      className: 'Lớp Mầm 1',
      phone: '0903 111 222',
      lastMessage: 'Cô xem hộ em trưa nay bé có ăn hết suất không ạ?',
      unreadCount: 1,
    },
    {
      id: 'thread-2',
      parentName: 'Bố Lê Văn Hùng',
      studentName: 'Lê Gia Hưng',
      className: 'Lớp Mầm 1',
      phone: '0912 333 444',
      lastMessage: 'Dạ hôm nay gia đình xin phép đón bé sớm lúc 16:00 cô nhé.',
      unreadCount: 0,
    },
    {
      id: 'thread-3',
      parentName: 'Mẹ Nguyễn Hoàng Yến',
      studentName: 'Nguyễn Minh Khang',
      className: 'Lớp Mầm 1',
      phone: '0988 555 666',
      lastMessage: 'Cô cho em hỏi thứ 6 này trường có tổ chức sinh nhật chung không ạ?',
      unreadCount: 0,
    },
  ]);

  const [privateMessages, setPrivateMessages] = useState<Record<string, ChatMessage[]>>({
    'thread-1': [
      {
        id: 'p-1',
        senderName: 'Mẹ Trần Thị Mai',
        senderRole: 'PARENT',
        content: 'Cô xem hộ em trưa nay bé có ăn hết suất không ạ?',
        sentAt: '12:45',
      },
      {
        id: 'p-2',
        senderName: 'Cô Lan (Chủ nhiệm)',
        senderRole: 'TEACHER',
        content: 'Dạ trưa nay Bảo An ăn rất ngoan và hết sạch suất cơm thịt rim ạ. Bé cũng ngủ trưa ngoan lắm mẹ yên tâm nhé!',
        sentAt: '13:00',
      },
    ],
    'thread-2': [
      {
        id: 'p-3',
        senderName: 'Bố Lê Văn Hùng',
        senderRole: 'PARENT',
        content: 'Dạ hôm nay gia đình xin phép đón bé sớm lúc 16:00 cô nhé.',
        sentAt: '09:10',
      },
      {
        id: 'p-4',
        senderName: 'Cô Lan (Chủ nhiệm)',
        senderRole: 'TEACHER',
        content: 'Dạ vâng cô ghi nhận rồi ạ, trước 16:00 cô sẽ chuẩn bị sẵn balo đồ đạc cho Gia Hưng nhé ba.',
        sentAt: '09:15',
      },
    ],
    'thread-3': [
      {
        id: 'p-5',
        senderName: 'Mẹ Nguyễn Hoàng Yến',
        senderRole: 'PARENT',
        content: 'Cô cho em hỏi thứ 6 này trường có tổ chức sinh nhật chung không ạ?',
        sentAt: '10:30',
      },
    ],
  });

  const activeThread = privateThreads.find((t) => t.id === selectedThreadId) || privateThreads[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const timeNow = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: 'm-' + Date.now(),
      senderName: 'Cô Lan (Chủ nhiệm)',
      senderRole: 'TEACHER',
      content: inputText.trim(),
      sentAt: timeNow,
    };

    if (chatType === 'CLASS_GROUP') {
      setGroupMessages((prev) => [...prev, newMsg]);
    } else {
      setPrivateMessages((prev) => ({
        ...prev,
        [selectedThreadId]: [...(prev[selectedThreadId] || []), newMsg],
      }));
      setPrivateThreads((prev) =>
        prev.map((t) => (t.id === selectedThreadId ? { ...t, lastMessage: inputText.trim() } : t))
      );
    }

    setInputText('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages, privateMessages, selectedThreadId, chatType]);

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E4D40] flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#275A4E]" />
            <span>Kênh Trao Đổi Tin Nhắn Trực Tuyến Với Phụ Huynh</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Giao tiếp bảo mật hai chiều: Phòng chat nhóm toàn lớp và Tin nhắn riêng 1-1 với từng phụ huynh theo học sinh.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setChatType('CLASS_GROUP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              chatType === 'CLASS_GROUP'
                ? 'bg-white text-[#275A4E] shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-[#78C2AD]" />
            <span>Nhóm Chat Lớp Mầm 1</span>
          </button>
          <button
            type="button"
            onClick={() => setChatType('PRIVATE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              chatType === 'PRIVATE'
                ? 'bg-white text-[#275A4E] shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-[#E5A93C]" />
            <span>Tin Nhắn Riêng (1-1)</span>
          </button>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col md:flex-row h-[600px]">
        {/* Left Sidebar if Private Chat */}
        {chatType === 'PRIVATE' && (
          <div className="w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
            <div className="p-4 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Hội Thoại Phụ Huynh ({privateThreads.length})
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {privateThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`w-full p-4 text-left transition flex items-start gap-3 cursor-pointer hover:bg-white ${
                    selectedThreadId === thread.id ? 'bg-white border-l-4 border-[#275A4E] shadow-2xs' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0">
                    <Baby className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 truncate">{thread.parentName}</span>
                      {thread.unreadCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-[#275A4E] font-semibold">Bé: {thread.studentName}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{thread.lastMessage}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50/30">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EBF7F4] text-[#275A4E] font-bold flex items-center justify-center">
                {chatType === 'CLASS_GROUP' ? <Users className="w-5 h-5" /> : <Baby className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#1E4D40]">
                  {chatType === 'CLASS_GROUP'
                    ? 'Phòng Chat Nhóm Lớp Mầm 1 (Toàn bộ Phụ huynh & Giáo viên)'
                    : `${activeThread?.parentName} (Phụ huynh bé ${activeThread?.studentName})`}
                </h3>
                <div className="text-[11px] text-slate-500">
                  {chatType === 'CLASS_GROUP'
                    ? '32 thành viên phụ huynh đang tham gia'
                    : `SĐT: ${activeThread?.phone} • Lớp ${activeThread?.className}`}
                </div>
              </div>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
            {(chatType === 'CLASS_GROUP' ? groupMessages : privateMessages[selectedThreadId] || []).map((msg) => {
              const isTeacher = msg.senderRole === 'TEACHER';
              return (
                <div key={msg.id} className={`flex flex-col ${isTeacher ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-semibold text-slate-400 px-1 mb-1">
                    {msg.senderName} • {msg.sentAt}
                  </span>
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      isTeacher
                        ? 'bg-[#275A4E] text-white rounded-tr-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
            <input
              type="text"
              placeholder={
                chatType === 'CLASS_GROUP'
                  ? 'Gửi thông báo hoặc trao đổi với toàn bộ phụ huynh trong lớp...'
                  : `Nhắn tin riêng cho ${activeThread?.parentName}...`
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs p-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-[#275A4E]/20 cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#78C2AD]" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherChatTab;
