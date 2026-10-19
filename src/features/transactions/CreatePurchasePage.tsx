import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Check,
  FileStack,
  PackagePlus,
  X,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from 'cn';
import { Combobox } from './components/Combobox';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { useContacts } from '../../hooks/useContacts';
import { useProducts } from '../../hooks/useProducts';
import { useContainers } from '../../hooks/useContainers';
import { useCreatePurchase } from '../../hooks/useTransactions';
import { useDebounce } from '../../hooks/useDebounce';
import { useDrafts, useDeleteDraft, useCompleteDraft } from '../../hooks/useDrafts';
import type { Draft } from '../../api/drafts.api';
import { useDraftAutoSaveServer } from '../../hooks/useDraftAutoSaveServer';
import { CONTACT_TYPES, PAYMENT_METHODS, type PaymentMethod } from '../../constants';
import type { Contact, Product, Container, CreateTransactionDto, CreateTransactionItemDto, TaxType } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import { DraftListDialog } from '../../components/drafts/DraftListDialog';

interface LineItem {
  id: string;
  product: Product | null;
  container: Container | null;
  quantity: number;
  unit_price: number;
  /** Per-line GST %. null means "no rate set" — falls back to the invoice-level GST %. */
  tax_rate: number | null;
}

export const CreatePurchasePage: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS.CASH);
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [taxType, setTaxType] = useState<TaxType>('cgst_sgst');
  const [taxTypeAutoSet, setTaxTypeAutoSet] = useState(false);

  // Draft state
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);

  // For adding new items
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnitPrice, setNewUnitPrice] = useState(0);

  // Product search with debouncing
  const [productSearch, setProductSearch] = useState('');
  const debouncedProductSearch = useDebounce(productSearch, 300);

  // Data fetching
  const { data: contacts, isLoading: contactsLoading } = useContacts({ 
    types: [CONTACT_TYPES.SUPPLIER, CONTACT_TYPES.BOTH] 
  });
  const { data: products, isLoading: productsLoading } = useProducts(debouncedProductSearch);
  const { data: containers, isLoading: containersLoading } = useContainers();
  
  const { data: companySettings } = useSettings();
  const createPurchaseMutation = useCreatePurchase();

  // Draft management - server-based
  const { data: drafts = [] } = useDrafts('purchase');
  const deleteDraftMutation = useDeleteDraft();
  const getCompleteDraft = useCompleteDraft();

  // Auto-save hook - server-based
  const { currentDraftId, deleteDraftOnUnmount } = useDraftAutoSaveServer(
    'purchase',
    {
      transactionDate,
      contactId: selectedContact?.id || null,
      items: items.map(item => ({
        productId: item.product!.id,
        containerId: item.container!.id,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
      taxPercent,
      discountAmount,
      paidAmount,
      paymentMethod: paidAmount > 0 ? paymentMethod : undefined,
      paymentReference: paidAmount > 0 ? paymentReference : undefined,
      notes: notes || undefined,
    },
    isDraftMode
  );

  // Auto-determine tax type when contact changes
  useEffect(() => {
    if (!selectedContact || !companySettings) return;
    const sellerState = companySettings.seller_gstin?.substring(0, 2);
    if (selectedContact.gstin && selectedContact.gstin.length >= 2) {
      const buyerState = selectedContact.gstin.substring(0, 2);
      const newTaxType: TaxType = sellerState === buyerState ? 'cgst_sgst' : 'igst';
      setTaxType(newTaxType);
      setTaxTypeAutoSet(true);
    } else {
      setTaxType('cgst_sgst');
      setTaxTypeAutoSet(false);
    }
  }, [selectedContact, companySettings]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  }, [items]);

  // A line's own GST % wins. If at least one line has one, the bill is taxed line
  // by line and the invoice-level GST % is ignored, so a mixed-slab purchase stays
  // correct instead of being averaged.
  const hasPerLineRates = useMemo(
    () => items.some(item => item.tax_rate !== null && item.tax_rate !== undefined),
    [items]
  );

  const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

  // One entry per distinct GST %, so the summary can show a real slab breakup.
  const rateBreakdown = useMemo(() => {
    const buckets = new Map<number, { taxable: number; tax: number }>();
    if (!hasPerLineRates) return buckets;
    for (const item of items) {
      const rate = item.tax_rate ?? 0;
      const taxable = item.quantity * item.unit_price;
      const bucket = buckets.get(rate) ?? { taxable: 0, tax: 0 };
      bucket.taxable += taxable;
      bucket.tax += round2((taxable * rate) / 100);
      buckets.set(rate, bucket);
    }
    return buckets;
  }, [items, hasPerLineRates]);

  // Calculate tax amount: per line when rates exist, else the invoice-level GST %
  const taxAmount = useMemo(() => {
    if (hasPerLineRates) {
      let total = 0;
      for (const bucket of rateBreakdown.values()) total += bucket.tax;
      return round2(total);
    }
    return subtotal * (taxPercent / 100);
  }, [hasPerLineRates, rateBreakdown, subtotal, taxPercent]);

  const totalAmount = subtotal + taxAmount - discountAmount;

  // Before navigation warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentDraftId || items.length > 0 || selectedContact) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentDraftId, items.length, selectedContact]);

  // Load draft into form
  const handleLoadDraft = async (draft: Draft) => {
    const data = draft.data;
    setTransactionDate(data.transactionDate);
    setTaxPercent(data.taxPercent);
    setDiscountAmount(data.discountAmount);
    setPaidAmount(data.paidAmount);
    if (data.paymentMethod) setPaymentMethod(data.paymentMethod as PaymentMethod);
    if (data.paymentReference) setPaymentReference(data.paymentReference);
    if (data.notes) setNotes(data.notes);

    // Load contact
    if (data.contactId && contacts) {
      const contact = contacts.find(c => c.id === data.contactId);
      if (contact) setSelectedContact(contact);
    }

    // Load items - use optimized endpoint with hydrated data
    if (data.items.length > 0) {
      try {
        // Single API call to get draft with hydrated products and containers
        const completeDraft = await getCompleteDraft(draft.id);
        
        // Map hydrated items directly to LineItem format
        const loadedItems: LineItem[] = completeDraft.items.map(item => ({
          id: `${Date.now()}-${item.productId}-${item.containerId}-${Math.random()}`,
          product: item.product,
          container: item.container,
          quantity: item.quantity,
          unit_price: typeof item.unitPrice === 'string'
            ? parseFloat(item.unitPrice)
            : item.unitPrice,
          tax_rate: item.product.gst_rate ?? null,
        }));

        setItems(loadedItems);
      } catch (error) {
        console.error('Failed to load draft items:', error);
      }
    }

    setShowDraftDialog(false);
    setIsDraftMode(true);
  };

  // Set default price when product changes
  const handleProductChange = (product: Product | null) => {
    setSelectedProduct(product);
    if (product?.default_purchase_price) {
      setNewUnitPrice(product.default_purchase_price);
    } else {
      setNewUnitPrice(0);
    }
  };

  // Add item to list
  const handleAddItem = () => {
    if (!selectedProduct || !selectedContainer) {
      setError('Please select a product and destination container');
      return;
    }
    if (newQuantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (newUnitPrice < 0) {
      setError('Price cannot be negative');
      return;
    }

    // Check if same product-container combo already exists
    const existingIndex = items.findIndex(
      i => i.product?.id === selectedProduct.id && i.container?.id === selectedContainer.id
    );

    if (existingIndex >= 0) {
      // Update existing item
      const updatedItems = [...items];
      const existingItem = updatedItems[existingIndex];
      updatedItems[existingIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + newQuantity,
      };
      setItems(updatedItems);
    } else {
      // Add new item
      setItems([
        ...items,
        {
          id: `${Date.now()}`,
          product: selectedProduct,
          container: selectedContainer,
          quantity: newQuantity,
          unit_price: newUnitPrice,
          tax_rate: selectedProduct.gst_rate ?? null,
        },
      ]);
    }

    // Reset form
    setSelectedProduct(null);
    setSelectedContainer(null);
    setNewQuantity(1);
    setNewUnitPrice(0);
    setError(null);
  };

  // Remove item
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  // Change a single line's GST %. Blank clears it back to the invoice-level rate.
  const handleChangeItemTaxRate = (id: string, raw: string) => {
    const trimmed = raw.trim();
    let nextRate: number | null = null;
    if (trimmed !== '') {
      const parsed = parseFloat(trimmed);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) return;
      nextRate = parsed;
    }
    setItems(items.map(i => (i.id === id ? { ...i, tax_rate: nextRate } : i)));
  };

  // Submit form
  const handleSubmit = async () => {
    if (!selectedContact) {
      setError('Please select a supplier');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    const transactionItems: CreateTransactionItemDto[] = items.map(item => ({
      product_id: item.product!.id,
      container_id: item.container!.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      ...(item.tax_rate !== null && item.tax_rate !== undefined
        ? { tax_rate: item.tax_rate }
        : {}),
    }));

    const data: CreateTransactionDto = {
      transaction_date: transactionDate,
      contact_id: selectedContact.id,
      items: transactionItems,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      paid_amount: paidAmount,
      payment_method: paidAmount > 0 ? paymentMethod : undefined,
      payment_reference: paidAmount > 0 ? paymentReference || undefined : undefined,
      notes: notes || undefined,
      tax_type: taxType,
    };

    try {
      const result = await createPurchaseMutation.mutateAsync(data);

      // Delete draft after successful submission
      if (currentDraftId) {
        deleteDraftOnUnmount();
      }

      navigate(`/transactions/${result.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create purchase';
      setError(errorMessage);
    }
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div>
      <PageHeader
        title="New Purchase"
        subtitle="Create a new purchase transaction"
        breadcrumbs={[
          { label: 'Transactions', path: '/transactions' },
          { label: 'New Purchase' },
        ]}
      />

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <a
              href="/transactions"
              onClick={(e: React.MouseEvent) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  navigate('/transactions');
                }
              }}
            >
              <ArrowLeft />
              Back to Transactions
            </a>
          </Button>

          <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
            <div className="flex items-center gap-2">
              <Switch
                id="purchase-draft-mode"
                checked={isDraftMode}
                onCheckedChange={(checked) => setIsDraftMode(checked)}
              />
              <Label htmlFor="purchase-draft-mode" className="text-sm">
                Auto-save draft
              </Label>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDraftDialog(true)}
            >
              <FileStack />
              Load Draft ({drafts.length})
            </Button>

            {currentDraftId && isDraftMode && (
              <Badge
                variant="outline"
                className="border-success/30 bg-success/10 text-success"
              >
                <Check />
                Draft saved
              </Badge>
            )}
          </div>
        </div>

        {/* Draft Dialog */}
        <DraftListDialog
          open={showDraftDialog}
          drafts={drafts}
          onClose={() => setShowDraftDialog(false)}
          onLoadDraft={handleLoadDraft}
          onDeleteDraft={(id) => deleteDraftMutation.mutate(id)}
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Dismiss error"
              className="absolute top-1.5 right-1.5"
              onClick={() => setError(null)}
            >
              <X />
            </Button>
          </Alert>
        )}

        <div className="grid grid-cols-12 gap-5">
          {/* Left Column - Items */}
          <div className="col-span-12 space-y-5 md:col-span-8">
            {/* Add Item Card */}
            <Card>
              <CardContent>
                <h3 className="mb-2 text-base font-semibold">Add Items</h3>
                <Separator className="mb-4" />

                <div className="grid grid-cols-12 items-start gap-4">
                  <div className="col-span-12 grid gap-2 sm:col-span-4">
                    <Label htmlFor="purchase-product">Product</Label>
                    <Combobox
                      id="purchase-product"
                      value={selectedProduct}
                      onChange={(value) => handleProductChange(value)}
                      onInputChange={(value) => setProductSearch(value)}
                      options={products || []}
                      getOptionKey={(option) => option.id}
                      getOptionLabel={(option) =>
                        option.company_sku
                          ? `${option.company_sku} - ${option.name} (${option.size})`
                          : `${option.name} (${option.size})`
                      }
                      loading={productsLoading}
                      disableFiltering
                      placeholder="Search products..."
                      searchPlaceholder="Search products..."
                      emptyText="No products"
                    />
                  </div>
                  <div className="col-span-12 grid gap-2 sm:col-span-3">
                    <Label htmlFor="purchase-container">Store In</Label>
                    <Combobox
                      id="purchase-container"
                      value={selectedContainer}
                      onChange={(value) => setSelectedContainer(value)}
                      options={containers || []}
                      getOptionKey={(option) => option.id}
                      getOptionLabel={(option) => option.name}
                      loading={containersLoading}
                      placeholder="Select container"
                      searchPlaceholder="Search containers..."
                      emptyText="No containers"
                    />
                    <p className="text-xs text-muted-foreground">Destination container</p>
                  </div>
                  <div className="col-span-6 grid gap-2 sm:col-span-2">
                    <Label htmlFor="purchase-qty">Qty</Label>
                    <Input
                      id="purchase-qty"
                      type="number"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                      min={1}
                      className="tabular-nums"
                    />
                  </div>
                  <div className="col-span-6 grid gap-2 sm:col-span-2">
                    <Label htmlFor="purchase-price">Price</Label>
                    <Input
                      id="purchase-price"
                      type="number"
                      value={newUnitPrice}
                      onChange={(e) => setNewUnitPrice(parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.01}
                      className="tabular-nums"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-1 sm:self-end">
                    <Button
                      aria-label="Add item"
                      onClick={handleAddItem}
                      disabled={!selectedProduct || !selectedContainer}
                      className="w-full px-4 sm:w-auto"
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items List Card */}
            <Card>
              <CardContent>
                <h3 className="mb-2 text-base font-semibold">Items ({items.length})</h3>
                <Separator className="mb-4" />

                {items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Store In</TableHead>
                          <TableHead numeric>Qty</TableHead>
                          <TableHead numeric>Price</TableHead>
                          <TableHead numeric>GST %</TableHead>
                          <TableHead numeric>Total</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="whitespace-normal">
                              <p className="text-sm font-medium">{item.product?.name}</p>
                              <span className="text-xs text-muted-foreground">
                                {item.product?.size} • {item.product?.packing}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-foreground/30">
                                {item.container?.name}
                              </Badge>
                            </TableCell>
                            <TableCell numeric>{item.quantity}</TableCell>
                            <TableCell numeric>{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell numeric>
                              <Input
                                type="number"
                                aria-label="GST %"
                                placeholder="—"
                                value={item.tax_rate ?? ''}
                                onChange={(e) => handleChangeItemTaxRate(item.id, e.target.value)}
                                min={0}
                                max={100}
                                step={0.5}
                                className="ml-auto h-9 w-[84px] text-right tabular-nums"
                              />
                            </TableCell>
                            <TableCell numeric className="font-medium">
                              {formatCurrency(
                                item.quantity * item.unit_price +
                                  (item.tax_rate
                                    ? round2((item.quantity * item.unit_price * item.tax_rate) / 100)
                                    : 0)
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Remove item"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <EmptyState
                    compact
                    icon={<PackagePlus />}
                    title="No items yet"
                    message="Use the form above to add products to this purchase."
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="col-span-12 md:col-span-4">
            <Card>
              <CardContent>
                <h3 className="mb-2 text-base font-semibold">Purchase Details</h3>
                <Separator className="mb-4" />

                <div className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="purchase-date">Date</Label>
                    <Input
                      id="purchase-date"
                      type="date"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="tabular-nums"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="purchase-supplier">Supplier *</Label>
                    <Combobox
                      id="purchase-supplier"
                      value={selectedContact}
                      onChange={(value) => setSelectedContact(value)}
                      options={contacts || []}
                      getOptionKey={(option) => option.id}
                      getOptionLabel={(option) => `${option.name} (${option.phone})`}
                      loading={contactsLoading}
                      placeholder="Select supplier"
                      searchPlaceholder="Search suppliers..."
                      emptyText="No suppliers"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="text-sm tabular-nums">{formatCurrency(subtotal)}</p>
                  </div>

                  {selectedContact && !taxTypeAutoSet && (
                    <div className="grid gap-2">
                      <Label htmlFor="purchase-tax-type">Tax Type</Label>
                      <Select
                        value={taxType}
                        onValueChange={(value) => setTaxType(value as TaxType)}
                      >
                        <SelectTrigger id="purchase-tax-type" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cgst_sgst">Intra-state (CGST + SGST)</SelectItem>
                          <SelectItem value="igst">Inter-state (IGST)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        No GSTIN on contact — select manually
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="grid gap-2">
                      <Label htmlFor="purchase-gst">GST %</Label>
                      <div className="relative">
                        <Input
                          id="purchase-gst"
                          type="number"
                          disabled={hasPerLineRates}
                          value={taxPercent}
                          onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                          min={0}
                          max={100}
                          step={0.5}
                          className="pr-8 tabular-nums"
                        />
                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                      {hasPerLineRates && (
                        <p className="text-xs text-muted-foreground">
                          Each item is taxed at its own GST % (set in the items table)
                        </p>
                      )}
                    </div>
                    {hasPerLineRates ? (
                      <div className="mt-1">
                        {[...rateBreakdown.entries()]
                          .sort((a, b) => b[0] - a[0])
                          .map(([rate, bucket]) => (
                            <span key={rate} className="block text-xs tabular-nums text-muted-foreground">
                              {taxType === 'cgst_sgst'
                                ? `CGST ${(rate / 2).toFixed(2)}% + SGST ${(rate / 2).toFixed(2)}% on ${formatCurrency(bucket.taxable)}: ${formatCurrency(bucket.tax)}`
                                : `IGST ${rate.toFixed(2)}% on ${formatCurrency(bucket.taxable)}: ${formatCurrency(bucket.tax)}`}
                            </span>
                          ))}
                      </div>
                    ) : (
                      taxPercent > 0 && (
                        <span className="mt-1 block text-xs tabular-nums text-muted-foreground">
                          {taxType === 'cgst_sgst'
                            ? `CGST: ${formatCurrency(taxAmount / 2)} + SGST: ${formatCurrency(taxAmount / 2)}`
                            : `IGST: ${formatCurrency(taxAmount)}`}
                        </span>
                      )
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="purchase-discount">Discount Amount</Label>
                    <Input
                      id="purchase-discount"
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.01}
                      className="tabular-nums"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-base font-semibold">Total</p>
                    <p className="text-base font-semibold tabular-nums">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid gap-2">
                    <Label htmlFor="purchase-paid">Amount Paid Now</Label>
                    <Input
                      id="purchase-paid"
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      min={0}
                      max={totalAmount}
                      step={0.01}
                      className="tabular-nums"
                    />
                  </div>

                  {paidAmount > 0 && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="purchase-payment-method">Payment Method</Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                        >
                          <SelectTrigger id="purchase-payment-method" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(PAYMENT_METHODS).map((method) => (
                              <SelectItem key={method} value={method}>
                                {method.replace('_', ' ').toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="purchase-payment-reference">Payment Reference</Label>
                        <Input
                          id="purchase-payment-reference"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="Check #, UPI ID, etc."
                        />
                      </div>
                    </>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="purchase-notes">Notes</Label>
                    <Textarea
                      id="purchase-notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div
                    className={cn(
                      'mt-2 flex items-baseline justify-between gap-4 font-semibold',
                      totalAmount - paidAmount > 0 ? 'text-destructive' : 'text-success'
                    )}
                  >
                    <p>Balance Due</p>
                    <p className="tabular-nums">
                      {formatCurrency(totalAmount - paidAmount)}
                    </p>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={createPurchaseMutation.isPending || items.length === 0 || !selectedContact}
                  >
                    {createPurchaseMutation.isPending ? 'Creating...' : 'Create Purchase'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchasePage;
