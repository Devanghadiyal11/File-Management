import React from 'react';
import { CCard, CCardBody, CProgress, CProgressBar, CBadge } from '@coreui/react';
import { 
  Image, FileText, Video, Music, Archive, FileIcon, 
  HardDrive, Cloud, Droplets, Users, Eye,
  TrendingUp, Calendar, Clock, User
} from 'lucide-react';

// Storage service cards (Google Drive, Dropbox, OneDrive)
export const StorageServiceCards = ({ onServiceClick }) => {
  const storageServices = [
    {
      id: 'google-drive',
      name: 'Google Drive',
      icon: <HardDrive size={32} />,
      used: 45.5,
      total: 50,
      color: 'google-drive',
      className: 'storage-card google-drive'
    },
    {
      id: 'dropbox',
      name: 'Dropbox',  
      icon: <Droplets size={32} />,
      used: 12,
      total: 50,
      color: 'dropbox',
      className: 'storage-card dropbox'
    },
    {
      id: 'onedrive',
      name: 'OneDrive',
      icon: <Cloud size={32} />,
      used: 2.5,
      total: 50,
      color: 'onedrive',
      className: 'storage-card onedrive'
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {storageServices.map((service) => (
        <div key={service.id} className="col-md-4">
          <CCard 
            className={`${service.className} h-100 cursor-pointer fade-in`}
            role="button"
            onClick={() => onServiceClick && onServiceClick(service.id)}
          >
            <CCardBody className="p-3">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  {service.icon}
                  <div>
                    <h6 className="mb-0 fw-bold">{service.name}</h6>
                  </div>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small">{service.used} GB</span>
                  <span className="small opacity-75">{service.total} GB</span>
                </div>
                <div className="progress-modern">
                  <div 
                    className="progress-bar-modern" 
                    style={{ width: `${(service.used / service.total) * 100}%` }}
                  />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </div>
      ))}
    </div>
  );
};

// Storage analytics breakdown
export const StorageAnalytics = ({ files = [] }) => {
  // Calculate file type statistics
  const calculateStorageStats = (files) => {
    const stats = {
      images: { count: 0, size: 0, icon: Image, color: 'images' },
      documents: { count: 0, size: 0, icon: FileText, color: 'documents' },
      media: { count: 0, size: 0, icon: Video, color: 'media' },
      other: { count: 0, size: 0, icon: Archive, color: 'other' },
      unknown: { count: 0, size: 0, icon: FileIcon, color: 'unknown' }
    };

    files.forEach(file => {
      const type = file.type || '';
      const size = file.size || 0;

      if (type.startsWith('image/')) {
        stats.images.count++;
        stats.images.size += size;
      } else if (type.includes('document') || type.includes('pdf') || type.includes('text')) {
        stats.documents.count++;
        stats.documents.size += size;
      } else if (type.startsWith('video/') || type.startsWith('audio/')) {
        stats.media.count++;
        stats.media.size += size;
      } else if (type) {
        stats.other.count++;
        stats.other.size += size;
      } else {
        stats.unknown.count++;
        stats.unknown.size += size;
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

  const stats = calculateStorageStats(files);
  const totalSize = Object.values(stats).reduce((sum, stat) => sum + stat.size, 0);
  const totalFiles = Object.values(stats).reduce((sum, stat) => sum + stat.count, 0);

  return (
    <div className="storage-analytics slide-up">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="mb-1 fw-bold">Storage Overview</h5>
          <div className="d-flex align-items-center gap-2">
            <span className="h4 mb-0 fw-bold text-primary">{formatSize(totalSize)}</span>
            <span className="text-muted">Used</span>
            <CBadge color="success" className="ms-2">50 GB</CBadge>
            <span className="text-muted small">Upgrade</span>
          </div>
        </div>
        <TrendingUp className="text-success" size={24} />
      </div>

      <div className="mb-4">
        <div className="progress-modern" style={{ height: '8px' }}>
          <div 
            className="progress-bar-modern" 
            style={{ 
              width: `${Math.min((totalSize / (50 * 1024 * 1024 * 1024)) * 100, 100)}%`,
              background: 'var(--gradient-primary)'
            }}
          />
        </div>
      </div>

      <div className="row g-2 mb-4">
        {Object.entries(stats).map(([key, stat]) => {
          const Icon = stat.icon;
          if (stat.count === 0) return null;
          
          return (
            <div key={key} className="col-6">
              <div className="storage-item border rounded-3 p-2">
                <div className="d-flex align-items-center">
                  <div className={`storage-icon ${stat.color} me-2`} style={{ width: '32px', height: '32px' }}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-grow-1 min-width-0">
                    <div className="small fw-semibold text-capitalize">{key}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {stat.count} files • {formatSize(stat.size)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <small className="text-muted">
          {totalFiles} files • Last updated 5 minutes ago
        </small>
      </div>
    </div>
  );
};

// Modern folder card component
export const ModernFolderCard = ({ folder, onClick, onEdit, onDelete, isLocked, hasMembers, fileCount, folderSize, totalItems, subfolderCount, isUnlocked }) => {
  const memberCount = hasMembers ? Math.floor(Math.random() * 10) + 1 : 0;
  
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };
  
  return (
    <CCard className="folder-card h-100 fade-in" role="button" onClick={() => onClick(folder)}>
      <CCardBody className="p-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="storage-icon documents">
              <Archive size={18} />
            </div>
            <div className="flex-grow-1 min-width-0">
              <h6 className="mb-0 fw-semibold text-truncate">
                {folder.name}
                {totalItems > 0 && (
                  <span className="text-muted fw-normal ms-2">
                    ({totalItems} item{totalItems !== 1 ? 's' : ''})
                  </span>
                )}
              </h6>
              <div className="d-flex flex-column">
                {(fileCount > 0 || subfolderCount > 0) && (
                  <small className="text-muted">
                    {fileCount > 0 && `${fileCount} file${fileCount !== 1 ? 's' : ''}`}
                    {fileCount > 0 && subfolderCount > 0 && ' • '}
                    {subfolderCount > 0 && `${subfolderCount} folder${subfolderCount !== 1 ? 's' : ''}`}
                  </small>
                )}
                {folderSize > 0 && (
                  <small className="text-muted fw-semibold" style={{ color: '#059669', fontSize: '0.8rem' }}>
                    📦 {formatSize(folderSize)}
                  </small>
                )}
              </div>
            </div>
          </div>
          {isLocked && (
            <CBadge color="warning" className="small">
              Locked
            </CBadge>
          )}
        </div>

        {memberCount > 0 && (
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-1">
              {/* Member avatars */}
              <div className="d-flex" style={{ marginLeft: '-4px' }}>
                {[...Array(Math.min(memberCount, 3))].map((_, i) => (
                  <div 
                    key={i}
                    className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                    style={{ 
                      width: '24px', 
                      height: '24px', 
                      fontSize: '10px',
                      marginLeft: i > 0 ? '-4px' : '0',
                      zIndex: 3 - i,
                      border: '2px solid white'
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              {memberCount > 3 && (
                <span className="small text-muted ms-1">+{memberCount - 3}</span>
              )}
            </div>
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

// Recent files table component
export const RecentFilesTable = ({ files = [], onFileClick, onViewAll }) => {
  const recentFiles = files
    .sort((a, b) => new Date(b.uploadDate || b.createdAt) - new Date(a.uploadDate || a.createdAt))
    .slice(0, 6);

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <Image size={16} className="text-danger" />;
    if (type?.includes('pdf')) return <FileText size={16} className="text-danger" />;
    if (type?.includes('document') || type?.includes('sheet')) return <FileText size={16} className="text-primary" />;
    if (type?.startsWith('video/')) return <Video size={16} className="text-warning" />;
    if (type?.startsWith('audio/')) return <Music size={16} className="text-info" />;
    return <FileIcon size={16} className="text-muted" />;
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(new Date(date));
  };

  const getMemberText = () => {
    const options = ['Only you', '3 members', '10 members', '5 members', '7 members'];
    return options[Math.floor(Math.random() * options.length)];
  };

  return (
    <div className="recent-files-table slide-up">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0 fw-bold">Recent Files</h5>
        <button 
          className="btn btn-link text-primary p-0 border-0 small fw-semibold"
          onClick={onViewAll}
        >
          View all
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th className="border-0 bg-light small text-uppercase fw-semibold text-muted">Name</th>
              <th className="border-0 bg-light small text-uppercase fw-semibold text-muted">Members</th>
              <th className="border-0 bg-light small text-uppercase fw-semibold text-muted">Last modified</th>
            </tr>
          </thead>
          <tbody>
            {recentFiles.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center text-muted py-4">
                  No recent files
                </td>
              </tr>
            ) : (
              recentFiles.map((file, index) => (
                <tr key={file._id || file.id || index} className="cursor-pointer">
                  <td 
                    className="py-3"
                    role="button"
                    onClick={() => onFileClick && onFileClick(file)}
                  >
                    <div className="d-flex align-items-center gap-3">
                      {getFileIcon(file.type)}
                      <div className="flex-grow-1 min-width-0">
                        <div className="fw-semibold text-truncate">{file.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-muted small">{getMemberText()}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-muted small">{formatDate(file.uploadDate || file.createdAt)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Dashboard header with team info and search
export const DashboardHeader = ({ user, searchQuery, onSearchChange, totalStorage = 50 }) => {
  const usedStorage = 45.5;
  
  return (
    <div className="app-header p-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center text-white"
              style={{ 
                width: '48px', 
                height: '48px',
                background: 'var(--gradient-primary)'
              }}
            >
              <Users size={24} />
            </div>
            <div>
              <h4 className="mb-0 fw-bold">Marketing Team</h4>
              <small className="text-muted">17 members</small>
            </div>
          </div>
        </div>
        
        <div className="d-flex align-items-center gap-3">
          <div className="position-relative">
            <input
              type="text"
              className="search-input"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ width: '280px' }}
            />
          </div>
          
          <div className="text-end">
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="h5 mb-0 fw-bold">{usedStorage} GB</span>
              <span className="text-muted">Used</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">{totalStorage} GB</span>
              <button className="btn btn-sm btn-outline-primary">Upgrade</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="progress-modern">
        <div 
          className="progress-bar-modern" 
          style={{ width: `${(usedStorage / totalStorage) * 100}%` }}
        />
      </div>
    </div>
  );
};

// Upgrade account card
export const UpgradeCard = () => {
  return (
    <div className="upgrade-card">
      <div className="text-center mb-3">
        <div className="mb-3">
          {/* Simple chart representation */}
          <div className="d-inline-block position-relative" style={{ width: '120px', height: '120px' }}>
            <svg width="120" height="120" className="transform-rotate-90">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 50 * 0.7} ${2 * Math.PI * 50}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="position-absolute top-50 start-50 translate-middle text-center">
              <div className="h4 mb-0">70%</div>
              <small>Used</small>
            </div>
          </div>
        </div>
        <h5 className="fw-bold mb-2">Upgrade account!</h5>
        <p className="mb-3 opacity-90">
          5 integrations, 30 team members, advanced features for teams.
        </p>
        <button className="btn btn-light btn-modern">
          Upgrade
        </button>
      </div>
    </div>
  );
};