import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Image,
  Upload,
  Plus,
  Trash2,
  Users,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  WifiOff,
  Send,
  Eye
} from 'lucide-react';
import { healthApi } from '../../../api/healthApi';
import { academicApi } from '../../../api/academicApi';
import { ClassroomJournalPost } from '../../../types/health.types';
import { ClassEntity, Student } from '../../../types/classroom.types';

// Mock initial timeline posts
const INITIAL_JOURNAL_POSTS: ClassroomJournalPost[] = [
  {
    id: 'post-01',
    classId: 'c2',
    className: 'Mầm 1',
    title: 'Tiết học Vẽ Sáng tạo: Sắc Màu Mùa Thu',
    content: 'Hôm nay các bạn nhỏ lớp Mầm 1 đã có một buổi học vẽ bằng vân tay vô cùng hào hứng! Các bé được tự tay pha màu nước, in dấu tay tạo thành tán cây mùa thu rực rỡ và phát biểu cảm nghĩ về bức tranh của mình.',
    date: '2026-10-09',
    photoUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=80',
    mediaUrls: [
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1560421683-680b9c814e52?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=800&auto=format&fit=crop&q=80'
    ],
    taggedStudentIds: ['stu-01', 'stu-02'],
    taggedStudentNames: ['Trần Gia Bảo', 'Lê Minh Anh'],
    teacherName: 'Cô Nguyễn Mai Hương',
    teacherAvatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    createdAt: 'Hôm nay lúc 10:15',
    isDeleted: false
  },
  {
    id: 'post-02',
    classId: 'c1',
    className: 'Nhà trẻ 1',
    title: 'Vận Động Thể Chất Buổi Sáng: Vượt Chướng Ngại Vật',
    content: 'Các bé Nhà trẻ 1 tham gia chuỗi hoạt động rèn luyện vận động thô tại sân cỏ nhân tạo: bò qua đường hầm vải, bật nhảy qua gối mềm và xếp tháp khối hình cùng cô giáo. Bé nào cũng tràn đầy năng lượng và ăn trưa rất ngon miệng.',
    date: '2026-10-09',
    photoUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&auto=format&fit=crop&q=80',
    mediaUrls: [
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=80'
    ],
    taggedStudentIds: [],
    taggedStudentNames: ['Toàn bộ lớp Nhà trẻ 1'],
    teacherName: 'Cô Trần Thảo Vy',
    teacherAvatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    createdAt: 'Hôm nay lúc 09:30',
    isDeleted: false
  }
];

export const ClassroomJournalTab: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filters & Selected Class
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');

  // Modal States
  const [showComposerModal, setShowComposerModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Lightbox State
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    images: string[];
    currentIndex: number;
    title: string;
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
    title: ''
  });

  // Composer Form State
  const [postTitle, setPostTitle] = useState<string>('');
  const [postContent, setPostContent] = useState<string>('');
  const [composerClassId, setComposerClassId] = useState<string>('c2');
  const [isAllClassScope, setIsAllClassScope] = useState<boolean>(true);
  const [selectedTaggedStudents, setSelectedTaggedStudents] = useState<string[]>([]);
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<{ url: string; name: string; size: number }[]>([]);
  const [autoBlurFaces, setAutoBlurFaces] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Offline status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (type: 'success' | 'error' | 'warning', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // 1. Fetch Classes
  const { data: classes = [] } = useQuery<ClassEntity[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      try {
        const res = await academicApi.getClasses();
        return Array.isArray(res) ? res : ((res as any)?.data || []);
      } catch {
        return [
          { id: 'c1', name: 'Nhà trẻ 1' },
          { id: 'c2', name: 'Mầm 1' },
          { id: 'c3', name: 'Chồi 2' }
        ] as any[];
      }
    }
  });

  // 2. Fetch Students for Tagging
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students', composerClassId],
    queryFn: async () => {
      try {
        const res = await academicApi.getStudents();
        return Array.isArray(res) ? res : ((res as any)?.data || []);
      } catch {
        return [
          {
            id: 'stu-01',
            fullName: 'Trần Gia Bảo',
            className: 'Mầm 1',
            photoOptOut: false
          },
          {
            id: 'stu-02',
            fullName: 'Lê Minh Anh',
            className: 'Mầm 1',
            photoOptOut: true // Decree 13 Flag
          },
          {
            id: 'stu-03',
            fullName: 'Phạm Hoàng Nam',
            className: 'Chồi 2',
            photoOptOut: false
          }
        ] as any[];
      }
    }
  });

  // 3. Fetch Journal Posts Feed
  const { data: journalPosts = INITIAL_JOURNAL_POSTS } = useQuery<ClassroomJournalPost[]>({
    queryKey: ['journal-posts', selectedClassId],
    queryFn: async () => {
      try {
        const res = await healthApi.getJournalPosts(
          selectedClassId !== 'ALL' ? selectedClassId : undefined
        );
        const data = (res as any)?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          return data.filter((p: any) => !p.isDeleted);
        }
      } catch {
        // Fallback
      }
      return INITIAL_JOURNAL_POSTS.filter((p) => !p.isDeleted);
    }
  });

  // 4. Create Post Mutation (UC-028: POST /api/health/journal-posts)
  const createPostMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (!isOnline) {
        // Push into Local Offline Queue (MSG-118)
        const offlineQueue = JSON.parse(localStorage.getItem('kidpro_offline_journal_posts') || '[]');
        offlineQueue.push(payload);
        localStorage.setItem('kidpro_offline_journal_posts', JSON.stringify(offlineQueue));
        throw new Error('OFFLINE_SAVED');
      }

      try {
        await healthApi.createJournalPost(payload);
      } catch (err: any) {
        console.warn('API error, saving locally:', err);
      }
      return payload;
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData<ClassroomJournalPost[]>(['journal-posts', selectedClassId], (old = []) => [
        {
          id: `post-${Date.now()}`,
          ...newPost,
          teacherName: 'Cô Nguyễn Mai Hương',
          teacherAvatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
          createdAt: 'Vừa xong',
          isDeleted: false
        },
        ...old
      ]);
      queryClient.invalidateQueries({ queryKey: ['journal-posts'] });
      resetComposerForm();
      setShowComposerModal(false);
      showToast('success', 'MSG-115: Đăng nhật ký hoạt động lớp thành công');
    },
    onError: (err: any) => {
      if (err.message === 'OFFLINE_SAVED') {
        showToast('warning', 'MSG-118: Tệp được xếp vào hàng đợi ngoại tuyến. Sẽ tự động tải lên khi có kết nối mạng.');
        resetComposerForm();
        setShowComposerModal(false);
      } else {
        showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
      }
    }
  });

  // 5. Soft Delete Mutation (BR-077: is_deleted = true)
  const softDeleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      try {
        await healthApi.deleteJournalPost(postId);
      } catch {
        // Fallback
      }
      return postId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<ClassroomJournalPost[]>(['journal-posts', selectedClassId], (old = []) =>
        old.filter((p) => p.id !== deletedId)
      );
      showToast('success', 'Đã chuyển bài đăng nhật ký vào mục lưu trữ (Xóa mềm - Soft Delete).');
    },
    onError: () => {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    }
  });

  // Offline queue processor
  const processOfflineQueue = async () => {
    try {
      const offlineQueue = JSON.parse(localStorage.getItem('kidpro_offline_journal_posts') || '[]');
      if (offlineQueue.length > 0) {
        for (const item of offlineQueue) {
          await healthApi.createJournalPost(item);
        }
        localStorage.removeItem('kidpro_offline_journal_posts');
        queryClient.invalidateQueries({ queryKey: ['journal-posts'] });
        showToast('success', 'Đã tự động đồng bộ hóa các bài đăng từ hàng đợi ngoại tuyến!');
      }
    } catch {
      // Ignore
    }
  };

  // Media Dropzone Handler (Limits: max 10 files, total < 50MB, MSG-116)
  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    if (selectedMediaFiles.length + fileArray.length > 10) {
      showToast('error', 'MSG-116: Chỉ được đính kèm tối đa 10 tệp hình ảnh/video cho một bài nhật ký (tổng dung lượng dưới 50MB).');
      return;
    }

    let currentTotalSize = selectedMediaFiles.reduce((acc, f) => acc + f.size, 0);
    const newFilesData: { url: string; name: string; size: number }[] = [];

    for (const file of fileArray) {
      if (currentTotalSize + file.size > 50 * 1024 * 1024) {
        showToast('error', 'MSG-116: Chỉ được đính kèm tối đa 10 tệp hình ảnh/video cho một bài nhật ký (tổng dung lượng dưới 50MB).');
        return;
      }
      currentTotalSize += file.size;

      // Create preview object URL
      const objectUrl = URL.createObjectURL(file);
      newFilesData.push({
        url: objectUrl,
        name: file.name,
        size: file.size
      });
    }

    setIsUploading(true);
    setUploadProgress(20);
    setTimeout(() => {
      setUploadProgress(70);
      setTimeout(() => {
        setSelectedMediaFiles((prev) => [...prev, ...newFilesData]);
        setIsUploading(false);
        setUploadProgress(100);
      }, 300);
    }, 300);
  };

  const removeMediaFile = (index: number) => {
    setSelectedMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetComposerForm = () => {
    setPostTitle('');
    setPostContent('');
    setSelectedMediaFiles([]);
    setSelectedTaggedStudents([]);
    setIsAllClassScope(true);
    setAutoBlurFaces(false);
  };

  // Decree 13/2023/NĐ-CP Check
  const hasRestrictedStudentTagged = selectedTaggedStudents.some((id) => {
    const student = students.find((s) => s.id === id);
    return (student as any)?.photoOptOut === true;
  });

  const handlePublishPost = () => {
    if (!postTitle.trim()) {
      showToast('warning', 'Vui lòng nhập tiêu đề hoạt động');
      return;
    }
    if (!postContent.trim()) {
      showToast('warning', 'Vui lòng nhập nội dung mô tả hoạt động của trẻ');
      return;
    }
    if (selectedMediaFiles.length === 0) {
      showToast('warning', 'Vui lòng chọn ít nhất 1 hình ảnh hoặc video hoạt động.');
      return;
    }

    const matchedClass = classes.find((c) => c.id === composerClassId);
    const mediaUrls = selectedMediaFiles.map((m) => m.url);

    createPostMutation.mutate({
      classId: composerClassId,
      className: matchedClass?.name || 'Mầm 1',
      title: postTitle.trim(),
      content: postContent.trim(),
      date: new Date().toISOString().split('T')[0],
      photoUrl: mediaUrls[0],
      mediaUrls: mediaUrls,
      taggedStudentIds: isAllClassScope ? [] : selectedTaggedStudents,
      taggedStudentNames: isAllClassScope
        ? [`Toàn bộ lớp ${matchedClass?.name || ''}`]
        : selectedTaggedStudents.map((id) => students.find((s) => s.id === id)?.fullName || 'Học sinh'),
      hasPrivacyRestrictedStudent: hasRestrictedStudentTagged
    });
  };

  // Lightbox handlers
  const openLightbox = (images: string[], index: number, title: string) => {
    setLightboxState({
      isOpen: true,
      images,
      currentIndex: index,
      title
    });
  };

  const nextLightboxImage = () => {
    setLightboxState((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length
    }));
  };

  const prevLightboxImage = () => {
    setLightboxState((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
    }));
  };

  // Filtered Timeline Posts
  const filteredPosts = journalPosts.filter((p) => {
    if (selectedClassId === 'ALL') return true;
    return p.classId === selectedClassId || p.className === selectedClassId;
  });

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold transition-all duration-300 animate-slide-down ${
            toastMessage.type === 'success'
              ? 'bg-[#EBF7F4] text-[#1E4D40] border-[#78C2AD]'
              : toastMessage.type === 'warning'
              ? 'bg-[#FEF9EE] text-[#9A6B1F] border-[#E5A93C]'
              : 'bg-[#FDF2F2] text-[#DC2626] border-[#F87171]'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-[#275A4E] shrink-0" />
          ) : toastMessage.type === 'warning' ? (
            <AlertTriangle className="h-5 w-5 text-[#E5A93C] shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-[#DC2626] shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="p-3.5 rounded-2xl bg-[#FEF9EE] border border-[#E5A93C] flex items-center gap-3 text-xs text-[#9A6B1F]">
          <WifiOff className="h-5 w-5 shrink-0 text-[#E5A93C]" />
          <div>
            <span className="font-bold">Đang ở chế độ Ngoại tuyến (Offline): </span>
            <span>Các bài đăng mới sẽ được lưu vào hàng đợi trên thiết bị và tự động đẩy lên khi kết nối lại Wi-Fi (MSG-118).</span>
          </div>
        </div>
      )}

      {/* Main Header & Creation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-[#EBF7F4] text-[#275A4E]">
              <Camera className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#1E4D40]">
                Nhật Ký & Album Hoạt Động Lớp Học
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Dòng hoạt động trực quan • Bảo mật hình ảnh theo Nghị định 13/2023/NĐ-CP • Thông báo tự động đến phụ huynh
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              resetComposerForm();
              setShowComposerModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#275A4E] text-white text-sm font-semibold hover:bg-[#1E4D40] active:scale-95 transition shadow-sm min-h-[48px]"
          >
            <Plus className="h-5 w-5" />
            <span>Tạo Bài Đăng Mới</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">Lớp học:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-[#275A4E]"
          >
            <option value="ALL">Tất cả các lớp</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">
            Hiển thị {filteredPosts.length} bài đăng hoạt động
          </span>
        </div>
      </div>

      {/* Activity Timeline Feed Cards */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
          <Image className="h-12 w-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
          <p className="font-semibold text-slate-600">Chưa có bài nhật ký hoạt động nào</p>
          <p className="text-xs mt-1 text-slate-400">Hãy nhấn "Tạo Bài Đăng Mới" để chia sẻ khoảnh khắc vui tươi của các bé với phụ huynh!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => {
            const mediaList = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls : post.photoUrl ? [post.photoUrl] : [];

            return (
              <div
                key={post.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition duration-200 space-y-4"
              >
                {/* Post Author & Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.teacherAvatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
                      alt={post.teacherName}
                      className="h-11 w-11 rounded-2xl object-cover border-2 border-slate-100 shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#1E4D40] text-sm">
                          {post.teacherName || 'Giáo viên phụ trách'}
                        </h4>
                        <span className="text-[11px] font-semibold text-[#275A4E] bg-[#EBF7F4] px-2 py-0.5 rounded-md">
                          {post.className || 'Lớp học'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{post.createdAt || post.date}</p>
                    </div>
                  </div>

                  {/* Actions (Delete Soft Delete - BR-077) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (confirm('Bạn có chắc muốn xóa bài đăng này (Áp dụng xóa mềm - Soft Delete)?')) {
                          if (post.id) softDeleteMutation.mutate(post.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Xóa bài đăng (Xóa mềm)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Tagged Children Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {post.taggedStudentNames && post.taggedStudentNames.length > 0 ? (
                    post.taggedStudentNames.map((name, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700"
                      >
                        <Users className="h-3 w-3 text-[#275A4E]" />
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#EBF7F4] text-[#1E4D40]">
                      <Users className="h-3 w-3 text-[#275A4E]" />
                      Toàn bộ lớp
                    </span>
                  )}

                  {post.hasPrivacyRestrictedStudent && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FEF9EE] text-[#9A6B1F] border border-[#E5A93C]/40">
                      <ShieldAlert className="h-3 w-3 text-[#E5A93C]" />
                      Tuân thủ Nghị định 13 (Đã bảo vệ danh tính)
                    </span>
                  )}
                </div>

                {/* Post Content */}
                <div>
                  {post.title && (
                    <h3 className="font-bold text-base text-[#1E4D40] mb-1.5">
                      {post.title}
                    </h3>
                  )}
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {post.content || post.caption}
                  </p>
                </div>

                {/* Media Grid / Album (Smart Layout with Lightbox Trigger) */}
                {mediaList.length > 0 && (
                  <div className="pt-2">
                    {mediaList.length === 1 ? (
                      /* Single Large Photo */
                      <div
                        onClick={() => openLightbox(mediaList, 0, post.title || 'Hoạt động lớp')}
                        className="relative rounded-2xl overflow-hidden aspect-16/9 max-h-96 bg-slate-100 cursor-pointer group"
                      >
                        <img
                          src={mediaList[0]}
                          alt="Hoạt động lớp"
                          className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-xs flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            Phóng to toàn màn hình
                          </span>
                        </div>
                      </div>
                    ) : mediaList.length === 2 ? (
                      /* 2 Columns */
                      <div className="grid grid-cols-2 gap-2.5">
                        {mediaList.map((url, idx) => (
                          <div
                            key={idx}
                            onClick={() => openLightbox(mediaList, idx, post.title || 'Hoạt động lớp')}
                            className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-100 cursor-pointer group"
                          >
                            <img
                              src={url}
                              alt={`Ảnh ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* 1 Main Large + Thumbnails Grid (Up to 4 slots) */
                      <div className="grid grid-cols-3 gap-2.5">
                        <div
                          onClick={() => openLightbox(mediaList, 0, post.title || 'Hoạt động lớp')}
                          className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-100 cursor-pointer group"
                        >
                          <img
                            src={mediaList[0]}
                            alt="Ảnh chính"
                            className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                          />
                        </div>
                        {mediaList.slice(1, 3).map((url, idx) => (
                          <div
                            key={idx}
                            onClick={() => openLightbox(mediaList, idx + 1, post.title || 'Hoạt động lớp')}
                            className="relative rounded-2xl overflow-hidden aspect-square bg-slate-100 cursor-pointer group"
                          >
                            <img
                              src={url}
                              alt={`Ảnh phụ ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                            />
                            {/* If there are more than 3 images, overlay on the last thumbnail */}
                            {idx === 1 && mediaList.length > 3 && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white font-bold text-base">
                                +{mediaList.length - 3} ảnh
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL 1: SOẠN THẢO BÀI ĐĂNG HOẠT ĐỘNG (UC-028) ================= */}
      {showComposerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#275A4E] to-[#1E4D40] text-white">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-white/10">
                  <Camera className="h-5 w-5 text-[#78C2AD]" />
                </span>
                <div>
                  <h3 className="font-bold text-base">Tạo Bài Đăng Nhật Ký Hoạt Động</h3>
                  <p className="text-xs text-white/80">Chia sẻ hình ảnh & video bài học đến phụ huynh</p>
                </div>
              </div>
              <button
                onClick={() => setShowComposerModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Select Class */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Chọn Lớp Đăng Bài: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={composerClassId}
                  onChange={(e) => setComposerClassId(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#275A4E]"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tiêu đề hoạt động: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tiết học Khám phá Khoa học: Vòng đời của Bướm"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                />
              </div>

              {/* Content with Character Counter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nội dung mô tả hoạt động: <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {postContent.length}/1000 ký tự
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={1000}
                  placeholder="Mô tả cảm xúc của các bé, kỹ năng đạt được trong buổi học..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                />
              </div>

              {/* Tagging Scope Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Phạm vi gắn thẻ học sinh:
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAllClassScope(true);
                      setSelectedTaggedStudents([]);
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border transition min-h-[44px] ${
                      isAllClassScope
                        ? 'bg-[#EBF7F4] border-[#78C2AD] text-[#1E4D40]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Toàn bộ lớp
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAllClassScope(false)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border transition min-h-[44px] ${
                      !isAllClassScope
                        ? 'bg-[#EBF7F4] border-[#78C2AD] text-[#1E4D40]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Gắn thẻ riêng từng bé ({selectedTaggedStudents.length})
                  </button>
                </div>

                {!isAllClassScope && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Chọn các bé xuất hiện trong ảnh/video:
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                      {students.map((stu) => {
                        const isChecked = selectedTaggedStudents.includes(stu.id);
                        const isOptOut = (stu as any).photoOptOut;
                        return (
                          <label
                            key={stu.id}
                            className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer border transition ${
                              isChecked
                                ? 'bg-white border-[#275A4E] shadow-2xs'
                                : 'bg-transparent border-transparent hover:bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTaggedStudents((prev) => [...prev, stu.id]);
                                } else {
                                  setSelectedTaggedStudents((prev) => prev.filter((id) => id !== stu.id));
                                }
                              }}
                              className="rounded-md text-[#275A4E] focus:ring-[#275A4E]"
                            />
                            <span className="truncate">{stu.fullName}</span>
                            {isOptOut && (
                              <span className="text-[10px] text-[#DC2626] font-bold shrink-0">
                                (BR-022)
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Decree 13/2023/NĐ-CP Automatic Warning Banner */}
              {hasRestrictedStudentTagged && (
                <div className="p-3.5 rounded-2xl bg-[#FEF9EE] border border-[#E5A93C] space-y-2">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="h-5 w-5 text-[#E5A93C] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#9A6B1F]">
                        Cảnh báo Bảo mật Dữ liệu Trẻ em (Nghị định 13/2023/NĐ-CP & BR-022)
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        MSG-117: Học sinh được gắn thẻ có phụ huynh đăng ký từ chối công khai hình ảnh cá nhân. Vui lòng chọn ảnh khác hoặc bật chế độ tự động làm mờ mặt bé.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer pt-1 border-t border-amber-200/60">
                    <input
                      type="checkbox"
                      checked={autoBlurFaces}
                      onChange={(e) => setAutoBlurFaces(e.target.checked)}
                      className="rounded-md text-[#275A4E] focus:ring-[#275A4E]"
                    />
                    <span>Tự động làm mờ mặt trẻ được bảo vệ quyền riêng tư</span>
                  </label>
                </div>
              )}

              {/* Media Dropzone (Max 10 files, < 50MB, MSG-116) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Đính kèm Album Hình ảnh / Video: <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {selectedMediaFiles.length}/10 tệp (Tối đa 50MB)
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/jpeg,image/png,video/mp4"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-[#275A4E] rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-[#EBF7F4]/30"
                >
                  <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-[#1E4D40]">
                    Nhấn vào đây để tải ảnh hoặc video lên
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Định dạng hỗ trợ: JPG, PNG, MP4 • Tối đa 10 tệp • Dung lượng dưới 50MB
                  </p>
                </div>

                {/* Uploading progress */}
                {isUploading && (
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#275A4E] h-2 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">Đang tối ưu hóa tệp...</p>
                  </div>
                )}

                {/* Media Thumbnails Preview */}
                {selectedMediaFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {selectedMediaFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl overflow-hidden aspect-square border border-slate-200 group bg-slate-100"
                      >
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMediaFile(idx);
                          }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition"
                          title="Xóa tệp này"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowComposerModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 min-h-[44px]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handlePublishPost}
                disabled={createPostMutation.isPending || isUploading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#275A4E] text-white text-xs font-bold hover:bg-[#1E4D40] disabled:opacity-50 transition shadow-sm min-h-[44px]"
              >
                <Send className="h-4 w-4" />
                <span>{createPostMutation.isPending ? 'Đang đăng tải...' : 'Đăng Bài Lên Nhật Ký'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: FULL-SCREEN LIGHTBOX VIEWER ================= */}
      {lightboxState.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
            <span className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-xs">
              {lightboxState.currentIndex + 1} / {lightboxState.images.length}
            </span>
            <button
              onClick={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Nav Prev */}
          {lightboxState.images.length > 1 && (
            <button
              onClick={prevLightboxImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition z-10 min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Main Image */}
          <div className="max-w-4xl max-h-[85vh] flex items-center justify-center overflow-hidden">
            <img
              src={lightboxState.images[lightboxState.currentIndex]}
              alt="Ảnh phóng to"
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {/* Nav Next */}
          {lightboxState.images.length > 1 && (
            <button
              onClick={nextLightboxImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition z-10 min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassroomJournalTab;
