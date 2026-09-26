import api from './axios';
import { API_ENDPOINTS } from '../constants';
import type { PdfInvoice, PdfInvoiceFilters, PdfInvoiceMetadata, PdfInvoicePage } from '../types/pdfInvoices';

export const pdfInvoicesApi = {
  list: async (page: number, filters: PdfInvoiceFilters): Promise<PdfInvoicePage> => {
    const response = await api.get<PdfInvoicePage>(API_ENDPOINTS.PDF_INVOICES.BASE, {
      params: {
        page, page_size: 25,
        search: filters.search || undefined,
        from_date: filters.from_date || undefined,
        to_date: filters.to_date || undefined,
      },
    });
    return response.data;
  },
  upload: async (metadata: PdfInvoiceMetadata, file: File): Promise<PdfInvoice> => {
    const form = new FormData();
    form.append('metadata', JSON.stringify(metadata));
    form.append('file', file);
    const response = await api.post<PdfInvoice>(API_ENDPOINTS.PDF_INVOICES.BASE, form, { timeout: 180000 });
    return response.data;
  },
  file: async (id: number): Promise<Blob> => {
    try {
      const response = await api.get<Blob>(API_ENDPOINTS.PDF_INVOICES.FILE(id), { responseType: 'blob' });
      return response.data;
    } catch (error) {
      const body = responseData(error);
      if (body instanceof Blob && body.type.includes('json')) {
        let data: unknown;
        try {
          data = JSON.parse(await body.text());
        } catch {
          throw error;
        }
        throw new Error(pdfInvoiceError({ response: { data }, message: pdfInvoiceError(error) }));
      }
      throw error;
    }
  },
};

function responseData(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      return response.data;
    }
  }
}

export function pdfInvoiceError(error: unknown): string {
  const data = responseData(error);
  if (typeof data === 'object' && data !== null) {
    if ('detail' in data && typeof data.detail === 'string') return data.detail;
    if ('detail' in data && Array.isArray(data.detail)) {
      const messages = data.detail.map((item: unknown) =>
        typeof item === 'object' && item !== null && 'msg' in item && typeof item.msg === 'string' ? item.msg : ''
      ).filter(Boolean);
      if (messages.length) return messages.join('; ');
    }
    if ('error' in data && typeof data.error === 'object' && data.error !== null
      && 'message' in data.error && typeof data.error.message === 'string') {
      return data.error.message;
    }
  }
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'The request failed. Please retry; if an upload was interrupted, use the same PDF and details.';
}
