import axiosClient from './axiosClient';

export interface AnnouncementDto {
  announcementId: number;
  authorStaffId?: string;
  authorName: string;
  title: string;
  content: string;
  targetAudience: string;
  scope?: string;
  scopeLabel?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  createdAt: string;
  viewCount: number;
  message?: string;
}

export interface AnnouncementCreateRequestDto {
  staffId?: string;
  title: string;
  content: string;
  targetAudience: 'ALL' | 'PARENTS_ONLY' | 'STAFF_ONLY';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  isDraft?: boolean;
}

export const announcementApi = {
  getAnnouncements: async (): Promise<AnnouncementDto[]> => {
    const res: any = await axiosClient.get('/bgh/announcements');
    
    // Robust extraction whether response is raw array, { data: [...] }, or paginated { data: { content: [...] } }
    let rawList: any[] = [];
    if (Array.isArray(res)) {
      rawList = res;
    } else if (Array.isArray(res?.data?.content)) {
      rawList = res.data.content;
    } else if (Array.isArray(res?.content)) {
      rawList = res.content;
    } else if (Array.isArray(res?.data)) {
      rawList = res.data;
    }

    return rawList.map((item: any) => ({
      announcementId: Number(item.announcementId || item.id || 0),
      authorStaffId: item.authorStaffId,
      authorName: item.authorName || 'Ban Giám Hiệu',
      title: item.title || '',
      content: item.content || '',
      targetAudience: item.scope === 'ALL_SCHOOL' ? 'ALL' : (item.targetAudience || item.scope || 'ALL'),
      scope: item.scope,
      scopeLabel: item.scopeLabel,
      attachmentUrl: item.attachmentUrl || item.attachments?.[0]?.fileUrl,
      attachmentName: item.attachmentName || item.attachments?.[0]?.fileName,
      attachmentSize: item.attachmentSize || item.attachments?.[0]?.fileSize,
      createdAt: item.createdAt || item.publishedAt || new Date().toISOString(),
      viewCount: item.viewCount || item.viewsCount || 0,
      message: item.message,
    }));
  },

  getAnnouncementById: async (id: number): Promise<AnnouncementDto> => {
    const res: any = await axiosClient.get(`/bgh/announcements/${id}`);
    const item = res?.data || res;
    return {
      announcementId: Number(item.announcementId || item.id || 0),
      authorStaffId: item.authorStaffId,
      authorName: item.authorName || 'Ban Giám Hiệu',
      title: item.title || '',
      content: item.content || '',
      targetAudience: item.scope === 'ALL_SCHOOL' ? 'ALL' : (item.targetAudience || item.scope || 'ALL'),
      scope: item.scope,
      scopeLabel: item.scopeLabel,
      attachmentUrl: item.attachmentUrl || item.attachments?.[0]?.fileUrl,
      attachmentName: item.attachmentName || item.attachments?.[0]?.fileName,
      attachmentSize: item.attachmentSize || item.attachments?.[0]?.fileSize,
      createdAt: item.createdAt || item.publishedAt || new Date().toISOString(),
      viewCount: item.viewCount || item.viewsCount || 0,
      message: item.message,
    };
  },

  uploadAttachment: async (file: File): Promise<{ fileName: string; fileUrl: string; fileSize: number; fileType: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res: any = await axiosClient.post('/bgh/announcements/upload-attachment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res?.data || res;
  },

  createAnnouncement: async (payload: AnnouncementCreateRequestDto) => {
    const body = {
      title: payload.title,
      content: payload.content,
      scope: payload.targetAudience === 'PARENTS_ONLY' ? 'SPECIFIC_GRADES' : 'ALL_SCHOOL',
      targetGrades: payload.targetAudience === 'PARENTS_ONLY' ? ['PARENTS'] : ['ALL'],
      isDraft: Boolean(payload.isDraft),
      attachments: payload.attachmentName ? [{
        fileName: payload.attachmentName,
        fileUrl: payload.attachmentUrl || '',
        fileType: 'DOCUMENT',
        fileSize: payload.attachmentSize || 0
      }] : []
    };
    return axiosClient.post('/bgh/announcements', body);
  },

  deleteAnnouncement: async (id: number) => {
    try {
      return await axiosClient.delete<{ message: string }>(`/bgh/announcements/${id}`);
    } catch (err) {
      return await axiosClient.delete<{ message: string }>(`/announcements/${id}`);
    }
  },
};

export default announcementApi;
