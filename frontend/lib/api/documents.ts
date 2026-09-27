import { http, isBackendConfigured } from './httpClient';
import { MOCK_DOCUMENTS } from '@/lib/mock';
import type { DocumentRecord } from '@/types';

export const documentsApi = {
  getDocuments: async (params?: { projectId?: string; parcelId?: string; status?: string }): Promise<DocumentRecord[]> => {
    if (!isBackendConfigured()) {
      let result = [...MOCK_DOCUMENTS];
      if (params?.parcelId) {
        result = result.filter((d) => d.parcelId === params.parcelId);
      }
      return result;
    }
    const query = new URLSearchParams();
    if (params?.projectId) query.append('project_id', params.projectId);
    if (params?.parcelId) query.append('parcel_id', params.parcelId);
    if (params?.status) query.append('status_filter', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return http.get<DocumentRecord[]>(`/api/v1/documents${qs}`);
  },

  getDocument: async (id: string): Promise<DocumentRecord | undefined> => {
    if (!isBackendConfigured()) {
      return MOCK_DOCUMENTS.find((d) => d.id === id);
    }
    return http.get<DocumentRecord>(`/api/v1/documents/${id}`);
  },

  createDocument: async (document: Partial<DocumentRecord>): Promise<DocumentRecord> => {
    if (!isBackendConfigured()) {
      return {
        ...MOCK_DOCUMENTS[0],
        ...document,
        id: document.id ?? `DOC-${Date.now().toString().slice(-4)}`,
      } as DocumentRecord;
    }
    return http.post<DocumentRecord>('/api/v1/documents', {
      id: document.id,
      parcel_id: document.parcelId,
      project_id: document.projectId,
      type: document.type,
      status: document.status,
      file_size: document.fileSize,
      ocr: document.ocr,
    });
  },

  updateDocument: async (id: string, document: Partial<DocumentRecord>): Promise<DocumentRecord> => {
    if (!isBackendConfigured()) {
      const existing = MOCK_DOCUMENTS.find((d) => d.id === id) || MOCK_DOCUMENTS[0];
      return { ...existing, ...document };
    }
    return http.put<DocumentRecord>(`/api/v1/documents/${id}`, {
      status: document.status,
      ocr: document.ocr,
    });
  },
};
