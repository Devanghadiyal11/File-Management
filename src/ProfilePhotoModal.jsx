import React, { useState, useRef, useCallback } from 'react';
import { 
  CModal, 
  CModalHeader, 
  CModalTitle, 
  CModalBody, 
  CModalFooter, 
  CButton, 
  CAlert,
  CSpinner 
} from '@coreui/react';
import { Upload, Camera, Trash2, Edit3, User, X } from 'lucide-react';

const ProfilePhotoModal = ({ 
  user, 
  onClose, 
  onPhotoUpdate, 
  showToast, 
  token 
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profilePhoto || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // API base URL
  const API = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '/api';

  // Handle file selection
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - check both MIME type and file extension
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/heic', 'image/heif'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif'];
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    
    const isValidType = file.type && validImageTypes.includes(file.type.toLowerCase());
    const isValidExtension = validExtensions.includes(fileExtension);
    
    if (!isValidType && !isValidExtension) {
      setError(`Please select a valid image file (${validExtensions.join(', ')})`);
      console.log('File validation failed:', {
        fileName: file.name,
        fileType: file.type,
        fileExtension,
        isValidType,
        isValidExtension
      });
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('Image size must be less than 20MB');
      return;
    }

    setError('');
    setSelectedImage(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Use the same validation logic as file selection
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/heic', 'image/heif'];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif'];
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
      
      const isValidType = file.type && validImageTypes.includes(file.type.toLowerCase());
      const isValidExtension = validExtensions.includes(fileExtension);
      
      if (isValidType || isValidExtension) {
        handleFileSelect({ target: { files: [file] } });
      } else {
        setError(`Please drop a valid image file (${validExtensions.join(', ')})`);
      }
    }
  }, [handleFileSelect]);

  // Upload profile photo
  const handleUpload = async () => {
    if (!selectedImage && !previewUrl) {
      setError('Please select an image first');
      return;
    }

    setUploading(true);
    setError('');

    try {
      let photoDataUrl = previewUrl;
      
      if (selectedImage) {
        // Process image and convert to data URL
        const processedImage = await processImage(selectedImage);
        photoDataUrl = await convertBlobToDataURL(processedImage);
      }

      // Try to upload to backend API first
      try {
        const formData = new FormData();
        if (selectedImage) {
          const processedImage = await processImage(selectedImage);
          formData.append('profilePhoto', processedImage);
        }

        const response = await fetch(`${API}/auth/profile-photo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          // Update user profile photo in parent component
          if (onPhotoUpdate) {
            onPhotoUpdate(data.profilePhoto);
          }
          showToast?.('Profile photo updated successfully!', { type: 'success' });
          onClose();
          return;
        }
      } catch (apiError) {
        console.warn('API upload failed, using local storage fallback:', apiError);
      }

      // Fallback: Store profile photo locally
      const userKey = `profilePhoto_${user?.email || user?.id || 'default'}`;
      localStorage.setItem(userKey, photoDataUrl);
      
      // Update user profile photo in parent component
      if (onPhotoUpdate) {
        onPhotoUpdate(photoDataUrl);
      }

      showToast?.('Profile photo updated successfully! (Stored locally)', { type: 'success' });
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload profile photo');
      showToast?.(`Upload failed: ${err.message}`, { type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // Helper function to convert blob to data URL
  const convertBlobToDataURL = (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(blob);
    });
  };

  // Delete profile photo
  const handleDelete = async () => {
    setUploading(true);
    setError('');

    try {
      // Try to delete from backend API first
      try {
        const response = await fetch(`${API}/auth/profile-photo`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          // Update user profile photo in parent component
          if (onPhotoUpdate) {
            onPhotoUpdate(null);
          }
          showToast?.('Profile photo deleted successfully!', { type: 'success' });
          onClose();
          return;
        }
      } catch (apiError) {
        console.warn('API delete failed, using local storage fallback:', apiError);
      }

      // Fallback: Remove profile photo from localStorage
      const userKey = `profilePhoto_${user?.email || user?.id || 'default'}`;
      localStorage.removeItem(userKey);
      
      // Update user profile photo in parent component
      if (onPhotoUpdate) {
        onPhotoUpdate(null);
      }

      showToast?.('Profile photo deleted successfully! (Removed locally)', { type: 'success' });
      onClose();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete profile photo');
      showToast?.(`Delete failed: ${err.message}`, { type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // Process image (high quality, minimal compression)
  const processImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set maximum dimensions for full HD quality
        const maxSize = 1024; // Increased from 400 to 1024 for better quality
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        // Set canvas size with device pixel ratio for crisp images
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        // Scale context for high DPI displays
        ctx.scale(devicePixelRatio, devicePixelRatio);
        
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image with high quality
        ctx.drawImage(img, 0, 0, width, height);
        
        // Use higher quality compression (0.95 instead of 0.8)
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Reset selection
  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(user?.profilePhoto || null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <CModal visible onClose={onClose} alignment="center" size="lg">
      <CModalHeader>
        <CModalTitle className="d-flex align-items-center gap-2">
          <Camera size={20} />
          Profile Photo
        </CModalTitle>
      </CModalHeader>
      
      <CModalBody>
        <div className="text-center">
          {/* Current/Preview Photo */}
          <div className="mb-4">
            <div className="position-relative d-inline-block">
              {previewUrl ? (
                <div className="position-relative">
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="rounded-circle border"
                    style={{
                      width: '180px',
                      height: '180px',
                      objectFit: 'cover',
                      border: '3px solid var(--color-border-glass)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                      imageRendering: 'high-quality'
                    }}
                  />
                  {selectedImage && (
                    <div className="position-absolute top-0 end-0">
                      <button
                        type="button"
                        className="btn btn-sm btn-danger rounded-circle p-1"
                        onClick={handleReset}
                        style={{ width: '24px', height: '24px' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="rounded-circle border d-flex align-items-center justify-content-center bg-light"
                  style={{
                    width: '180px',
                    height: '180px',
                    border: '3px solid var(--color-border-glass)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <User size={72} className="text-muted" />
                </div>
              )}
            </div>
          </div>

          {/* Upload Area */}
          <div 
            className="border-2 border-dashed rounded-3 p-4 mb-3 text-center"
            style={{ 
              borderColor: selectedImage ? 'var(--color-primary)' : 'var(--color-border)',
              backgroundColor: selectedImage ? 'rgba(102, 126, 234, 0.05)' : 'var(--color-bg-light)'
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleFileSelect}
              className="d-none"
            />
            
            <Upload size={32} className="text-muted mb-2" />
            <div className="h6 mb-2">
              {selectedImage ? 'New photo selected' : 'Choose a profile photo'}
            </div>
            <div className="text-muted small mb-3">
              Drag and drop an image here, or click to browse
            </div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={16} className="me-1" />
              Browse Files
            </button>
            <div className="text-muted small mt-2">
              Supports JPG, JPEG, PNG, GIF, WebP, BMP, HEIC, HEIF. Max size 20MB.
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <CAlert color="danger" className="py-2 text-start">
              {error}
            </CAlert>
          )}

          {/* Action Buttons */}
          <div className="d-flex gap-2 justify-content-center">
            {selectedImage && (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <CSpinner size="sm" className="me-1" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="me-1" />
                    Upload Photo
                  </>
                )}
              </button>
            )}
            
            {previewUrl && user?.profilePhoto && !selectedImage && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Edit3 size={16} className="me-1" />
                  Change Photo
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={handleDelete}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <CSpinner size="sm" className="me-1" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} className="me-1" />
                      Delete Photo
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Info Text */}
          <div className="text-muted small mt-3">
            Your profile photo will be visible to other team members and in shared folders.
          </div>
        </div>
      </CModalBody>
      
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>
          Cancel
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default ProfilePhotoModal;