import React, { useState } from 'react';
import { CCard, CCardBody, CBadge, CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem } from '@coreui/react';
import { 
  FileText, Image, Music, Video, File as FileIcon, Folder, 
  Download, Eye, Share2, Settings, Search,
  TrendingUp, Calendar, Filter, Upload, Plus, Trash2, Star
} from 'lucide-react';

// File type overview cards (like the first design)
export const FileTypeOverview = ({ files = [] }) => {
  const calculateFileStats = (files) => {
    const stats = {
      documents: { count: 0, size: 0, icon: FileText, color: '#6B7280', bgColor: '#F3F4F6' },
      photos: { count: 0, size: 0, icon: Image, color: '#3B82F6', bgColor: '#DBEAFE' },
      audio: { count: 0, size: 0, icon: Music, color: '#10B981', bgColor: '#D1FAE5' },
      videos: { count: 0, size: 0, icon: Video, color: '#F59E0B', bgColor: '#FEF3C7' }
    };

    files.forEach(file => {
      const type = file.type || '';
      const size = file.size || 0;

      if (type.startsWith('image/')) {
        stats.photos.count++;
        stats.photos.size += size;
      } else if (type.startsWith('audio/')) {
        stats.audio.count++;
        stats.audio.size += size;
      } else if (type.startsWith('video/')) {
        stats.videos.count++;
        stats.videos.size += size;
      } else {
        stats.documents.count++;
        stats.documents.size += size;
      }
    });

    return stats;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const stats = calculateFileStats(files);

  return (
    <div className="row g-3 mb-4">
      {Object.entries(stats).map(([key, stat], index) => {
        const Icon = stat.icon;
        const totalSize = formatSize(stat.size);
        
        return (
          <div key={key} className="col-md-3 col-sm-6">
            <CCard className="h-100 border-0 shadow-sm hover-lift hover-glow scale-in stagger-item" style={{animationDelay: `${index * 150}ms`}}>
              <CCardBody className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div 
                    className="rounded-3 p-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      backgroundColor: stat.bgColor,
                      width: '56px', 
                      height: '56px'
                    }}
                  >
                    <Icon size={24} style={{ color: stat.color }} />
                  </div>
                </div>
                
                <div>
                  <div className="h5 fw-bold mb-1 counter-animate" style={{ color: stat.color }}>
                    Total {totalSize}
                  </div>
                  <div className="text-capitalize fw-semibold mb-0 slide-up">
                    {key}
                  </div>
                  <small className="text-muted fade-in">
                    {stat.count} files
                  </small>
                </div>
              </CCardBody>
            </CCard>
          </div>
        );
      })}
    </div>
  );
};

// Enhanced Recent Files component with thumbnails
export const EnhancedRecentFiles = ({ files = [], onFileClick, onViewAll, onUpload, onFileDelete, onToggleFavorite, isFavorited }) => {
  const recentFiles = files
    .sort((a, b) => new Date(b.uploadDate || b.createdAt) - new Date(a.uploadDate || a.createdAt))
    .slice(0, 6);

  const getFileIcon = (file) => {
    const type = file.type || '';
    if (type.startsWith('image/')) return <Image size={16} className="text-primary" />;
    if (type.includes('pdf')) return <FileText size={16} className="text-danger" />;
    if (type.includes('document')) return <FileText size={16} className="text-primary" />;
    if (type.startsWith('video/')) return <Video size={16} className="text-warning" />;
    if (type.startsWith('audio/')) return <Music size={16} className="text-success" />;
    return <FileIcon size={16} className="text-muted" />;
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(new Date(date));
  };

  return (
    <CCard className="border-0 shadow-sm">
      <CCardBody className="p-0">
        <div className="p-4 border-bottom">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="mb-0 fw-bold">Recent Files</h5>
            <div className="d-flex align-items-center gap-2">
              <button 
                className="btn btn-sm btn-primary hover-lift"
                onClick={onUpload}
                title="Upload Files"
              >
                <Upload size={14} className="me-1" style={{transition: 'transform 0.2s ease'}} onMouseEnter={(e) => e.target.style.transform = 'rotate(10deg)'} onMouseLeave={(e) => e.target.style.transform = 'rotate(0deg)'} />
                Upload
              </button>
              <button className="btn btn-sm btn-outline-secondary">
                <Search size={14} />
              </button>
              <button className="btn btn-sm btn-outline-secondary">
                <Filter size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="row g-3">
            {recentFiles.length === 0 ? (
              <div className="col-12 text-center py-4 text-muted">
                <FileIcon size={32} className="mb-2 opacity-50" />
                <div>No recent files</div>
              </div>
            ) : (
              recentFiles.map((file, index) => (
                <div key={file._id || file.id || index} className="col-md-6 col-lg-4">
                  <CCard 
                    className="border file-preview-card h-100 hover-lift hover-glow scale-in stagger-item"
                    role="button"
                    onClick={() => onFileClick && onFileClick(file)}
                    style={{animationDelay: `${index * 100}ms`}}
                  >
                    <CCardBody className="p-3">
                      {/* File Preview/Thumbnail */}
                      <div 
                        className="rounded-2 mb-3 d-flex align-items-center justify-content-center position-relative"
                        style={{ 
                          height: '120px',
                          backgroundColor: '#f8f9fa'
                        }}
                      >
                        {file.type?.startsWith('image/') && file.url ? (
                          <img 
                            src={file.url} 
                            alt={file.name}
                            className="img-fluid rounded-2"
                            style={{ 
                              maxHeight: '100%',
                              maxWidth: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div className="text-center">
                            {getFileIcon(file)}
                            <div className="mt-2">
                              <small className="text-muted text-uppercase">
                                {file.name?.split('.').pop() || 'FILE'}
                              </small>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="mb-3">
                        <div className="fw-semibold text-truncate mb-1" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-muted small">
                          <span>Last Modified on {formatDate(file.uploadDate || file.createdAt)}</span>
                        </div>
                      </div>
                      
                      {/* Prominent Action Buttons */}
                      <div className="d-flex align-items-center justify-content-between border-top pt-3">
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFileClick && onFileClick(file);
                            }}
                            title="Preview File"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                            title="Download File"
                          >
                            <Download size={14} />
                          </button>
                          <button 
                            className={`btn btn-sm d-flex align-items-center gap-1 ${
                              isFavorited && isFavorited(file) 
                                ? 'btn-warning' 
                                : 'btn-outline-warning'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite && onToggleFavorite(file);
                            }}
                            title={isFavorited && isFavorited(file) ? "Remove from Favorites" : "Add to Favorites"}
                          >
                            <Star 
                              size={14} 
                              fill={isFavorited && isFavorited(file) ? 'currentColor' : 'none'} 
                            />
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFileDelete && onFileDelete(file);
                            }}
                            title="Delete File"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <small className="text-muted">
                          {file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '0 MB'}
                        </small>
                      </div>
                    </CCardBody>
                  </CCard>
                </div>
              ))
            )}
          </div>
        </div>
      </CCardBody>
    </CCard>
  );
};

// Storage Overview with Donut Chart
export const StorageOverviewChart = ({ files = [] }) => {
  const calculateTotalSize = (files) => {
    return files.reduce((total, file) => total + (file.size || 0), 0);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const totalUsed = calculateTotalSize(files);
  const totalAvailable = 20 * 1024 * 1024 * 1024; // 20GB
  const usagePercentage = (totalUsed / totalAvailable) * 100;

  // Calculate file type breakdown
  const breakdown = files.reduce((acc, file) => {
    const type = file.type || '';
    const size = file.size || 0;
    
    if (type.startsWith('video/')) {
      acc.video += size;
    } else if (type.startsWith('audio/')) {
      acc.audio += size;
    } else if (type.startsWith('image/')) {
      acc.photos += size;
    } else {
      acc.documents += size;
    }
    return acc;
  }, { video: 0, audio: 0, photos: 0, documents: 0 });

  return (
    <CCard className="border-0 shadow-sm">
      <CCardBody className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h6 className="mb-1">Storage Usage</h6>
            <CBadge color="success" className="small">
              <div className="d-flex align-items-center gap-1">
                <div className="bg-success rounded-circle" style={{ width: '6px', height: '6px' }}></div>
                Live
              </div>
            </CBadge>
          </div>
          <div className="text-muted small">
            {usagePercentage.toFixed(1)}% of 20GB used
          </div>
        </div>

        {/* Donut Chart Container */}
        <div className="text-center mb-4">
          <div className="position-relative d-inline-block">
            <svg width="200" height="200" className="donut-chart">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="20"
              />
              
              {/* Usage circle */}
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="url(#gradient1)"
                strokeWidth="20"
                strokeDasharray={`${2 * Math.PI * 70 * (usagePercentage / 100)} ${2 * Math.PI * 70}`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />
              
              {/* Gradient definition - Emerald Theme */}
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="50%" stopColor="var(--color-accent)" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center text - Dynamic */}
            <div className="position-absolute top-50 start-50 translate-middle text-center">
              <div className="h5 fw-bold mb-1">{usagePercentage.toFixed(1)}%</div>
              <small className="text-muted">Used</small>
              <div className="mt-1">
                <small className="text-muted">{formatSize(totalUsed)}</small>
              </div>
            </div>
          </div>
        </div>

        {/* Overview section */}
        <div className="mb-4">
          <h6 className="fw-bold mb-3">Overview</h6>
          <div className="row g-2">
            {[
              { label: 'Videos', value: formatSize(breakdown.video), color: 'var(--color-danger)' },
              { label: 'Audio', value: formatSize(breakdown.audio), color: 'var(--color-primary)' },
              { label: 'Photos', value: formatSize(breakdown.photos), color: 'var(--color-accent)' },
              { label: 'Documents', value: formatSize(breakdown.documents), color: 'var(--color-warning)' }
            ].map((item, index) => (
              <div key={index} className="col-6">
                <div className="d-flex align-items-center gap-2">
                  <div 
                    className="rounded-circle"
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: item.color 
                    }}
                  />
                  <div className="flex-grow-1 min-width-0">
                    <small className="text-muted">{item.label}</small>
                    <div className="fw-semibold small">{item.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CCardBody>
    </CCard>
  );
};

// Largest Files component
export const LargestFiles = ({ files = [] }) => {
  const largestFiles = files
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .slice(0, 5);

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getFileIcon = (file) => {
    const type = file.type || '';
    if (type.startsWith('video/')) return <Video size={16} className="text-warning" />;
    if (type.startsWith('image/')) return <Image size={16} className="text-primary" />;
    if (type.startsWith('audio/')) return <Music size={16} className="text-success" />;
    return <FileText size={16} className="text-muted" />;
  };

  return (
    <CCard className="border-0 shadow-sm">
      <CCardBody className="p-0">
        <div className="p-4 border-bottom">
          <div className="d-flex align-items-center justify-content-between">
            <h6 className="mb-0 fw-bold">Largest files</h6>
            <button className="btn btn-sm btn-outline-secondary">
              <Search size={14} />
            </button>
          </div>
        </div>

        <div className="p-4">
          {largestFiles.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <FileIcon size={32} className="mb-2 opacity-50" />
              <div>No files</div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {largestFiles.map((file, index) => (
                <div 
                  key={file._id || file.id || index}
                  className="d-flex align-items-center gap-3 p-2 rounded-2 hover-bg-light"
                  role="button"
                >
                  {getFileIcon(file)}
                  <div className="flex-grow-1 min-width-0">
                    <div className="fw-semibold text-truncate small">{file.name}</div>
                  </div>
                  <div className="text-end">
                    <div className="fw-semibold small">{formatSize(file.size || 0)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CCardBody>
    </CCard>
  );
};