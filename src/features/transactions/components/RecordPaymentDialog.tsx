import React, { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAYMENT_METHODS, type PaymentMethod } from '../../../constants';
import type { CreatePaymentDto } from '../../../types';

interface RecordPaymentDialogProps {
  open: boolean;
  transactionNumber: string;
  balanceDue: number;
  isLoading: boolean;
  onSubmit: (data: CreatePaymentDto) => void;
  onClose: () => void;
}

export const RecordPaymentDialog: React.FC<RecordPaymentDialogProps> = ({
  open,
  transactionNumber,
  balanceDue,
  isLoading,
  onSubmit,
  onClose,
}) => {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(balanceDue);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS.CASH);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setAmount(balanceDue);
      setPaymentMethod(PAYMENT_METHODS.CASH);
      setReferenceNumber('');
      setError(null);
    }
  }, [open, balanceDue]);

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentDate) {
      setError('Payment date is required');
      return;
    }
    if (!amount || amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (amount > balanceDue) {
      setError('Amount cannot exceed balance due');
      return;
    }

    onSubmit({
      payment_date: paymentDate,
      amount,
      payment_method: paymentMethod,
      reference_number: referenceNumber || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Payment for {transactionNumber}</DialogTitle>
          </DialogHeader>

          <div className="mt-4 mb-4">
            <Alert>
              <Info />
              <AlertDescription>
                Balance Due: <strong>{formatCurrency(balanceDue)}</strong>
              </AlertDescription>
            </Alert>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
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

          <div className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="payment-date">Payment Date *</Label>
              <Input
                id="payment-date"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment-amount">Amount *</Label>
              <Input
                id="payment-amount"
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                min={0.01}
                step={0.01}
                max={balanceDue}
                aria-invalid={amount > balanceDue}
              />
              {amount > balanceDue && (
                <p className="text-sm text-destructive">
                  Exceeds balance due ({formatCurrency(balanceDue)})
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment-method">Payment Method *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger id="payment-method" className="w-full">
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
              <Label htmlFor="payment-reference">Reference Number</Label>
              <Input
                id="payment-reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Check #, UPI ID, etc."
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || amount > balanceDue || amount <= 0}
            >
              {isLoading ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordPaymentDialog;
