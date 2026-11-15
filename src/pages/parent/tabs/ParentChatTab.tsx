import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Users,
  User,
  Send,
  Loader2,
  Smile,
  Image,
  RefreshCw,
  Clock,
  CheckCircle2,
  Sparkles,
  School,
  Lock
} from 'lucide-react';
import parentApi from '../../../api/parentApi';
import { useAuth } from '../../../contexts/AuthContext';

interface ParentChatTabProps {
  studentId: string;
  studentName: string;
  className?: string;
  classId?: string;
}

export const ParentChatTab: React.FC<ParentChatTabProps> = ({
  studentId,
  studentName,
  className = 'Mầm 1 (3-4 Tuổi)',
  classId = 'class-mam-1',
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chatType, setChatType] = useState<'CLASS' | 'PRIVATE'>('PRIVATE');
  const [inputText, setInputText] = useState('');

  // 1. Fetch Class Chat Messages
  const { data: classMessages = [], refetch: refetchClassMessages, isLoading: isLoadingClass } = useQuery({
    queryKey: ['class-chat-messages', classId],
    queryFn: () => parentApi.getClassChatMessages(classId),
    enabled: chatType === 'CLASS',
    refetchInterval: 5000, // Polling tin nhắn mỗi 5s
  });

  // 2. Fetch Private Chat Messages
  const { data: privateMessages = [], refetch: refetchPrivateMessages, isLoading: isLoadingPrivate } = useQuery({
    queryKey: ['private-chat-messages', studentId],
    queryFn: () => parentApi.getPrivateChatMessages(studentId),
    enabled: chatType === 'PRIVATE',
    refetchInterval: 5000,
  });

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [classMessages, privateMessages, chatType]);

  // Mutation gửi tin nhắn nhóm lớp
  const sendClassMutation = useMutation({
    mutationFn: (content: string) => parentApi.sendClassChatMessage(classId, content),
    onSuccess: () => {
      setInputText('');
      refetchClassMessages();
    },
  });

  // Mutation gửi tin nhắn riêng cho cô giáo
  const sendPrivateMutation = useMutation({
    mutationFn: (content: string) => parentApi.sendPrivateChatMessage(studentId, content),
    onSuccess: () => {
      setInputText('');
      refetchPrivateMessages();
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    if (chatType === 'CLASS') {
      sendClassMutation.mutate(text);
    } else {
      sendPrivateMutation.mutate(text);
    }
  };

  const currentMessages = chatType === 'CLASS' ? classMessages : privateMessages;
  const isSending = sendClassMutation.isPending || sendPrivateMutation.isPending;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[700px]">
      {/* Top Header */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {chatType === 'CLASS' ? 'Nhóm Chat Lớp Học' : 'Nhắn Tin Riêng 1-1'}
            </span>
            <span className="text-xs text-white/60">Bé {studentName} ({className})</span>
          </div>
          <h2 className="text-lg font-black tracking-tight">
            {chatType === 'CLASS' ? `Phòng Chat Lớp ${className}` : `Trao Đổi Riêng Với Giáo Viên Chủ Nhiệm`}
          </h2>
        </div>

        {/* Nút chuyển đổi loại Chat */}
        <div className="flex items-center p-1 bg-white/10 rounded-2xl">
          <button
            onClick={() => setChatType('PRIVATE')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              chatType === 'PRIVATE' ? 'bg-indigo-600 text-white shadow-xs' : 'text-white/70 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Chat Riêng Cô Giáo</span>
          </button>
          <button
            onClick={() => setChatType('CLASS')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              chatType === 'CLASS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-white/70 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Nhóm Chat Cả Lớp</span>
          </button>
        </div>
      </div>

      {/* Thông tin mô tả kênh chat */}
      <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          {chatType === 'CLASS' ? (
            <>
              <School className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kênh trao đổi chung giữa Giáo viên chủ nhiệm và tất cả phụ huynh lớp {className}.</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kênh riêng tư bảo mật giữa Quý phụ huynh và Cô giáo phụ trách bé {studentName}.</span>
            </>
          )}
        </span>
        <button
          onClick={() => (chatType === 'CLASS' ? refetchClassMessages() : refetchPrivateMessages())}
          className="hover:text-indigo-600 flex items-center gap-1 transition"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
        {currentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold">Chưa có tin nhắn nào trong cuộc trò chuyện này.</p>
            <p className="text-[11px] text-slate-400">Hãy gửi tin nhắn đầu tiên để kết nối với cô giáo!</p>
          </div>
        ) : (
          currentMessages.map((msg: any, idx: number) => {
            const isMe = msg.senderRole === 'PARENT' || msg.isSender || msg.senderUsername === (user as any)?.username || msg.senderEmail === user?.email;
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                  <span className="font-bold text-slate-600">
                    {isMe ? 'Bạn (Phụ huynh)' : msg.senderName || 'Cô Giáo Chủ Nhiệm'}
                  </span>
                  <span>•</span>
                  <span>{new Date(msg.sentAt || msg.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <p>{msg.content || msg.message}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Bar */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          placeholder={chatType === 'CLASS' ? `Nhắn tin cho nhóm lớp ${className}...` : `Nhắn riêng cho cô giáo của bé ${studentName}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:border-indigo-600 focus:outline-hidden font-medium"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="h-11 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">Gửi</span>
        </button>
      </form>
    </div>
  );
};
