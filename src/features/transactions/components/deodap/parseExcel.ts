import * as XLSX from 'xlsx';
import type { ExcelRow } from './types';

/**
 * Deodap SKUs in the Excel arrive prefixed with two underscore-delimited segments
 * (e.g. "FOO_BAR_ACTUAL-SKU").  Strip the first two segments so we get the company SKU.
 */
function stripSkuPrefix(raw: string): string {
  return raw.split('_').slice(2).join('_').trim();
}

/**
 * Reads the first sheet of an Excel / CSV file and extracts SKU + quantity rows.
 * Header row is auto-detected by looking for common keyword patterns;
 * falls back to column 0 = SKU, column 1 = quantity if no headers are recognised.
 */
export function parseExcel(file: File): Promise<ExcelRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (rows.length < 2) {
          resolve([]);
          return;
        }

        const headerRow = (rows[0] as string[]).map((h) => String(h).toLowerCase().trim());
        const skuColIdx = headerRow.findIndex((h) =>
          h.includes('sku') || h.includes('item') || h.includes('code') || h.includes('product')
        );
        const qtyColIdx = headerRow.findIndex((h) =>
          h.includes('qty') || h.includes('quantity') || h.includes('pcs') || h.includes('count')
        );

        const skuCol = skuColIdx >= 0 ? skuColIdx : 0;
        const qtyCol = qtyColIdx >= 0 ? qtyColIdx : 1;
        const dataRows = skuColIdx >= 0 || qtyColIdx >= 0 ? rows.slice(1) : rows;

        const parsed: ExcelRow[] = dataRows
          .map((row) => ({
            sku: stripSkuPrefix(String((row as unknown[])[skuCol] ?? '').trim()),
            quantity: Number((row as unknown[])[qtyCol]) || 0,
          }))
          .filter((r) => r.sku && r.quantity > 0);

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
