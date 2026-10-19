import React, { useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from 'cn';
import type { ProductImage } from '../../../types';

export interface ProductImagesCardProps {
  images: ProductImage[];
  selectedImageIndex: number;
  onSelectImage: (index: number) => void;
  onUpload: (files: File[]) => void;
  onCopyFromClick: () => void;
  onDeleteImage: (imageId: number) => void;
  uploadPending: boolean;
  copyPending: boolean;
  deletePending: boolean;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const ProductImagesCard: React.FC<ProductImagesCardProps> = ({
  images,
  selectedImageIndex,
  onSelectImage,
  onUpload,
  onCopyFromClick,
  onDeleteImage,
  uploadPending,
  copyPending,
  deletePending,
  fileInputRef: fileInputRefProp,
}) => {
  const internalRef = useRef<HTMLInputElement>(null);
  const fileInputRef = fileInputRefProp ?? internalRef;

  const selectedImage = images[selectedImageIndex];
  const canAddMore = images.length < 15;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70 pb-5 max-sm:grid-cols-1">
        <CardTitle className="text-base font-semibold">Product images</CardTitle>
        <CardAction className="flex flex-wrap items-center gap-2 max-sm:col-start-1 max-sm:row-start-2 max-sm:justify-self-start">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              if (files.length) onUpload(files);
            }}
          />
          {images.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {images.length} / 15
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onCopyFromClick}
            disabled={copyPending || !canAddMore}
          >
            {copyPending ? <Loader2 className="animate-spin" /> : <Copy />}
            {copyPending ? 'Copying…' : 'Copy from product'}
          </Button>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadPending || !canAddMore}
          >
            {uploadPending ? <Loader2 className="animate-spin" /> : <Plus />}
            {uploadPending ? 'Uploading…' : 'Add images'}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {images.length > 0 ? (
          <div>
            {/* Main image with nav */}
            <div className="relative mb-4 flex max-h-[420px] min-h-[280px] w-full items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-muted/40">
              <img
                src={selectedImage?.url}
                alt={`Image ${selectedImageIndex + 1} of ${images.length}`}
                className="max-h-[420px] max-w-full object-contain"
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Previous image"
                    onClick={() =>
                      onSelectImage((selectedImageIndex - 1 + images.length) % images.length)
                    }
                    className="absolute left-2 rounded-full border border-border/70 bg-card/90 shadow-xs hover:bg-card"
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Next image"
                    onClick={() => onSelectImage((selectedImageIndex + 1) % images.length)}
                    className="absolute right-2 rounded-full border border-border/70 bg-card/90 shadow-xs hover:bg-card"
                  >
                    <ChevronRight />
                  </Button>
                </>
              )}
              <span className="absolute right-2 bottom-2 rounded-md bg-foreground/70 px-2 py-1 text-xs text-background tabular-nums">
                {selectedImageIndex + 1} / {images.length}
              </span>
            </div>

            {/* Thumbnails */}
            <div className="flex flex-wrap items-center gap-3">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  onClick={() => onSelectImage(idx)}
                  className={cn(
                    'group relative size-[72px] shrink-0 cursor-pointer overflow-hidden rounded-md border-2 bg-muted transition-colors',
                    selectedImageIndex === idx
                      ? 'border-primary'
                      : 'border-border/70 hover:border-primary/40'
                  )}
                >
                  <img
                    src={img.thumb_url || img.url}
                    alt=""
                    className="size-full object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Delete image"
                    className="absolute top-1 right-1 rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/90 hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteImage(img.id);
                    }}
                    disabled={deletePending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
          >
            <ImageIcon
              className="mx-auto mb-3 size-10 text-muted-foreground/60"
              strokeWidth={1.5}
            />
            <p className="text-[15px] font-semibold tracking-tight">No images yet</p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Click to upload, or use “Copy from product” for the same item in another
              size or colour.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
