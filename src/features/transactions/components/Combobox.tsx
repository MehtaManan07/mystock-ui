import React, { useState } from 'react';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from 'cn';

interface ComboboxProps<T> {
  value: T | null;
  onChange: (value: T | null) => void;
  options: T[];
  getOptionLabel: (option: T) => string;
  getOptionKey: (option: T) => string | number;
  renderOption?: (option: T) => React.ReactNode;
  /** Fired as the user types, mirroring MUI's `onInputChange`. */
  onInputChange?: (value: string) => void;
  /** Set when the option list is already filtered server-side. */
  disableFiltering?: boolean;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  invalid?: boolean;
  id?: string;
  className?: string;
  contentClassName?: string;
  clearable?: boolean;
}

/**
 * Replacement for MUI's `Autocomplete` in the transaction forms: a popover with
 * a cmdk list. Filtering is client-side unless `disableFiltering` is set, which
 * is what the server-searched product pickers use.
 */
export function Combobox<T>({
  value,
  onChange,
  options,
  getOptionLabel,
  getOptionKey,
  renderOption,
  onInputChange,
  disableFiltering = false,
  loading = false,
  disabled = false,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No options',
  invalid = false,
  id,
  className,
  contentClassName,
  clearable = true,
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);

  const selectedLabel = value !== null ? getOptionLabel(value) : '';
  const showClear = clearable && value !== null && !disabled;

  return (
    <div className={cn('relative w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={invalid}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal',
              !selectedLabel && 'text-muted-foreground',
              showClear && 'pr-12'
            )}
          >
            <span className="truncate">{selectedLabel || placeholder}</span>
            {loading ? (
              <Loader2 className="animate-spin opacity-50" />
            ) : (
              <ChevronsUpDown className="opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn(
            'w-(--radix-popover-trigger-width) min-w-[220px] p-0',
            contentClassName
          )}
        >
          <Command shouldFilter={!disableFiltering}>
            <CommandInput
              placeholder={searchPlaceholder}
              onValueChange={onInputChange}
            />
            <CommandList>
              <CommandEmpty>{loading ? 'Loading...' : emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const key = getOptionKey(option);
                  return (
                    <CommandItem
                      key={key}
                      // cmdk keys its list by value, so the option id keeps
                      // same-label options individually selectable.
                      value={`${getOptionLabel(option)}__${key}`}
                      onSelect={() => {
                        onChange(option);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-1 size-4',
                          value !== null && getOptionKey(value) === key
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      {renderOption ? (
                        renderOption(option)
                      ) : (
                        <span className="truncate">{getOptionLabel(option)}</span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showClear && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Clear selection"
          className="absolute top-1/2 right-7 -translate-y-1/2"
          onClick={() => onChange(null)}
        >
          <X />
        </Button>
      )}
    </div>
  );
}

export default Combobox;
