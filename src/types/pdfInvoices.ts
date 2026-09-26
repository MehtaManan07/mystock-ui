export interface PdfInvoiceLine {
  name: string;
  quantity: number;
  unit_price: string;
  tax_rate: string;
  hsn_code: string | null;
}

export interface PdfInvoiceMetadata {
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  customer_gstin: string | null;
  customer_address: string | null;
  customer_phone: string | null;
  subtotal: string;
  cgst: string;
  sgst: string;
  igst: string;
  round_off: string;
  total_amount: string;
  notes: string | null;
  source: 'uploaded' | 'generated';
  line_items: PdfInvoiceLine[] | null;
}

export interface PdfInvoice extends PdfInvoiceMetadata {
  id: number;
  financial_year: string;
  original_filename: string;
  pdf_sha256: string;
  upload_status: 'pending' | 'ready';
  created_at: string;
  created_by_id: number;
}

export interface PdfInvoiceFilters {
  search: string;
  from_date: string;
  to_date: string;
}

export interface PdfInvoicePage {
  items: PdfInvoice[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}
