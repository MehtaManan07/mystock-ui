import React, { useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ImageOutlined as ImageIcon,
} from '@mui/icons-material';
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

const THUMB_SIZE = 72;
const MAIN_IMAGE_MAX_HEIGHT = 420;

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
    <Card variant="outlined" sx={{ overflow: 'hidden' }}>
      <CardContent sx={{ '&:last-child': { pb: 3 } }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Product images
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                if (files.length) onUpload(files);
              }}
            />
            <Button
              size="small"
              variant="contained"
              startIcon={uploadPending ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPending || !canAddMore}
            >
              {uploadPending ? 'Uploading…' : 'Add images'}
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={copyPending ? <CircularProgress size={16} color="inherit" /> : <CopyIcon />}
              onClick={onCopyFromClick}
              disabled={copyPending || !canAddMore}
            >
              {copyPending ? 'Copying…' : 'Copy from product'}
            </Button>
            {images.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {images.length} / 15
              </Typography>
            )}
          </Box>
        </Box>

        {images.length > 0 ? (
          <Box>
            {/* Main image with nav */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxHeight: MAIN_IMAGE_MAX_HEIGHT,
                minHeight: 280,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.50',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                mb: 2,
              }}
            >
              <img
                src={selectedImage?.url}
                alt={`Image ${selectedImageIndex + 1} of ${images.length}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: MAIN_IMAGE_MAX_HEIGHT,
                  objectFit: 'contain',
                }}
              />
              {images.length > 1 && (
                <>
                  <IconButton
                    size="small"
                    onClick={() => onSelectImage((selectedImageIndex - 1 + images.length) % images.length)}
                    sx={{
                      position: 'absolute',
                      left: 8,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'white' },
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onSelectImage((selectedImageIndex + 1) % images.length)}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'white' },
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </>
              )}
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                {selectedImageIndex + 1} / {images.length}
              </Typography>
            </Box>

            {/* Thumbnails */}
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {images.map((img, idx) => (
                <Box
                  key={img.id}
                  onClick={() => onSelectImage(idx)}
                  sx={{
                    position: 'relative',
                    width: THUMB_SIZE,
                    height: THUMB_SIZE,
                    flexShrink: 0,
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    border: 2,
                    borderColor: selectedImageIndex === idx ? 'primary.main' : 'transparent',
                    cursor: 'pointer',
                    bgcolor: 'grey.100',
                    transition: 'border-color 0.2s, transform 0.15s',
                    '&:hover': {
                      borderColor: selectedImageIndex === idx ? 'primary.main' : 'grey.400',
                      '& .thumb-delete': { opacity: 1 },
                    },
                  }}
                >
                  <img
                    src={img.thumb_url || img.url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <IconButton
                    className="thumb-delete"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      opacity: 0,
                      bgcolor: 'error.main',
                      color: 'white',
                      width: 24,
                      height: 24,
                      '&:hover': { bgcolor: 'error.dark' },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteImage(img.id);
                    }}
                    disabled={deletePending}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              py: 6,
              px: 3,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: 'grey.50',
              transition: 'border-color 0.2s, bgcolor 0.2s',
              '&:hover': {
                borderColor: 'primary.light',
                bgcolor: 'grey.100',
              },
            }}
          >
            <ImageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              No images yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Click to upload or use “Copy from product” for the same item in another size/color
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
