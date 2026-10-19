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
import { Card, CardContent } from '@/components/ui/card';
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
      <CardContent>
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-base font-semibold">Product images</h3>
          <div className="flex items-center gap-3">
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
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPending || !canAddMore}
            >
              {uploadPending ? <Loader2 className="animate-spin" /> : <Plus />}
              {uploadPending ? 'Uploading…' : 'Add images'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCopyFromClick}
              disabled={copyPending || !canAddMore}
            >
              {copyPending ? <Loader2 className="animate-spin" /> : <Copy />}
              {copyPending ? 'Copying…' : 'Copy from product'}
            </Button>
            {images.length > 0 && (
              <span className="text-xs text-muted-foreground">{images.length} / 15</span>
            )}
          </div>
        </div>

        {images.length > 0 ? (
          <div>
            {/* Main image with nav */}
            <div className="relative mb-4 flex max-h-[420px] min-h-[280px] w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/50">
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
                    className="absolute left-2 rounded-full bg-white/90 shadow-sm hover:bg-white"
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Next image"
                    onClick={() => onSelectImage((selectedImageIndex + 1) % images.length)}
                    className="absolute right-2 rounded-full bg-white/90 shadow-sm hover:bg-white"
                  >
                    <ChevronRight />
                  </Button>
                </>
              )}
              <span className="absolute right-2 bottom-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
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
                    'group relative size-[72px] shrink-0 cursor-pointer overflow-hidden rounded-md border-2 bg-muted transition-[border-color,transform] duration-200',
                    selectedImageIndex === idx
                      ? 'border-primary'
                      : 'border-transparent hover:border-muted-foreground/40'
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
                    className="absolute top-1 right-1 rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/90 hover:text-white"
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
            className="cursor-pointer rounded-lg border-2 border-dashed bg-muted/50 px-6 py-12 text-center transition-colors duration-200 hover:border-primary/60 hover:bg-muted"
          >
            <ImageIcon
              className="mx-auto mb-2 size-12 text-muted-foreground/50"
              strokeWidth={1.5}
            />
            <p className="mb-1 text-sm text-muted-foreground">No images yet</p>
            <span className="text-xs text-muted-foreground">
              Click to upload or use “Copy from product” for the same item in another size/color
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
