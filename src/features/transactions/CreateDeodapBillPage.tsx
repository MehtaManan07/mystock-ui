import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';
import { useProductLookup } from '../../hooks/useProducts';
import { ExcelUploadCard } from './components/deodap/ExcelUploadCard';
import { BillItemsTable } from './components/deodap/BillItemsTable';
import { parseExcel } from './components/deodap/parseExcel';
import type { DeodapBillRow, ContainerOption } from './components/deodap/types';
import type { Product } from '../../types';

export const CreateDeodapBillPage: React.FC = () => {
  const navigate = useNavigate();
  const { lookupBySku } = useProductLookup();

  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<DeodapBillRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !['xlsx', 'xls', 'csv'].includes(ext)) {
        setParseError('Please upload an Excel file (.xlsx, .xls) or CSV.');
        return;
      }

      setParseError(null);
      setFileName(file.name);
      setIsProcessing(true);
      setRows([]);

      try {
        const excelRows = await parseExcel(file);

        if (excelRows.length === 0) {
          setParseError('No valid rows found. Make sure the file has SKU and quantity columns.');
          setIsProcessing(false);
          return;
        }

        setRows(
          excelRows.map((r) => ({
            sku: r.sku,
            quantity: r.quantity,
            product: null,
            lookupStatus: 'pending',
            selectedContainer: null,
          }))
        );

        const uniqueSkus = [...new Set(excelRows.map((r) => r.sku))];
        const skuProductMap = new Map<string, Product | null>();

        await Promise.all(
          uniqueSkus.map(async (sku) => {
            try {
              skuProductMap.set(sku, await lookupBySku(sku));
            } catch {
              skuProductMap.set(sku, null);
            }
          })
        );

        setRows(
          excelRows.map((r) => {
            const product = skuProductMap.get(r.sku) ?? null;
            return {
              sku: r.sku,
              quantity: r.quantity,
              product,
              lookupStatus: product ? 'found' : 'not_found',
              selectedContainer: null,
            };
          })
        );
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Failed to parse file.');
      } finally {
        setIsProcessing(false);
      }
    },
    [lookupBySku]
  );

  const handleContainerChange = (index: number, container: ContainerOption | null) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selectedContainer: container } : r))
    );
  };

  const foundRows = rows.filter((r) => r.lookupStatus === 'found');
  const allContainersSelected = foundRows.length > 0 && foundRows.every((r) => r.selectedContainer);
  const remainingCount = foundRows.filter((r) => !r.selectedContainer).length;

  const handleProceedToBillDetails = () => {
    const saleItems = foundRows
      .filter((r) => r.selectedContainer)
      .map((r) => ({
        product: r.product!,
        container: {
          id: r.selectedContainer!.id,
          name: r.selectedContainer!.name,
          type: r.selectedContainer!.type,
          quantity: r.selectedContainer!.availableQty,
        },
        quantity: r.quantity,
        unit_price: r.product!.default_sale_price || 0,
      }));

      console.log(saleItems);

    // navigate('/transactions/new-sale', {
    //   state: { prefillItems: saleItems },
    // });
  };

  return (
    <Box>
      <PageHeader
        title="New Deodap Bill"
        subtitle="Upload an Excel file to create a bill"
        breadcrumbs={[
          { label: 'Transactions', path: '/transactions' },
          { label: 'New Deodap Bill' },
        ]}
      />

      <Box sx={{ mb: 2 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/transactions')}>
          Back to Transactions
        </Button>
      </Box>

      <ExcelUploadCard
        fileName={fileName}
        isProcessing={isProcessing}
        parseError={parseError}
        onFile={handleFile}
      />

      {rows.length > 0 && (
        <BillItemsTable rows={rows} onContainerChange={handleContainerChange} />
      )}

      {foundRows.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            disabled={!allContainersSelected}
            onClick={handleProceedToBillDetails}
          >
            {allContainersSelected
              ? 'Proceed to Bill Details'
              : `Assign containers for ${remainingCount} remaining row(s)`}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CreateDeodapBillPage;
