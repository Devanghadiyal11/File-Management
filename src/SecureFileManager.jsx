import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from './ToastContext';
import './folder-enhancements.css';
import { Upload, FolderPlus, Lock, Unlock, Download, Trash2, Edit2, Eye, File, Folder, Grid, List, Home, LogOut, Search, Menu, X, AlertCircle, Plus, Share2, Copy, Settings, Star, Clock, Image, Music, Video, FileText, Bell, User, Sun, Camera, Mail, Calendar, Shield, CheckCircle } from 'lucide-react';
import { CContainer, CRow, CCol, CCard, CCardBody, CCardHeader, CForm, CFormInput, CButton, CAlert, CAvatar, CSpinner, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CBadge, CButtonGroup, CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CProgress, CProgressBar } from '@coreui/react';
import { StorageServiceCards, StorageAnalytics, ModernFolderCard, RecentFilesTable, DashboardHeader, UpgradeCard } from './ModernComponents';
import { FileTypeOverview, EnhancedRecentFiles, StorageOverviewChart, LargestFiles } from './EnhancedComponents';
import ProfilePhotoModal from './ProfilePhotoModal';
import ErrorBoundary from './ErrorBoundary';
import WorkerManager from './utils/WorkerManager';
import './utils/cleanupFaceData'; // Auto-cleanup face data

// Authentication hook that talks to the backend API
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('sfm_user');
    const savedToken = sessionStorage.getItem('sfm_token');
    if (savedUser && savedToken) {
      const parsedUser = JSON.parse(savedUser);
      
      // Check for locally stored profile photo
      const userKey = `profilePhoto_${parsedUser?.email || parsedUser?.id || 'default'}`;
      const localProfilePhoto = localStorage.getItem(userKey);
      
      if (localProfilePhoto && !parsedUser.profilePhoto) {
        parsedUser.profilePhoto = localProfilePhoto;
      }
      
      setUser(parsedUser);
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const API = (import.meta.env && import.meta.env.VITE_API_BASE) ? `${import.meta.env.VITE_API_BASE}/auth` : '/api/auth';


  const signIn = async (email, password) => {
    const res = await fetch(`${API}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Sign in failed');
    }
    const data = await res.json();
    sessionStorage.setItem('sfm_user', JSON.stringify(data.user));
    sessionStorage.setItem('sfm_token', data.token);
    setUser(data.user);
    setToken(data.token);
    return data.user;
  };

  const signUp = async (email, password) => {
    const res = await fetch(`${API}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Sign up failed');
    }
    const data = await res.json();
    sessionStorage.setItem('sfm_user', JSON.stringify(data.user));
    sessionStorage.setItem('sfm_token', data.token);
    setUser(data.user);
    setToken(data.token);
    return data.user;
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('sfm_user');
    sessionStorage.removeItem('sfm_token');
  };

  const updateUserProfile = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    sessionStorage.setItem('sfm_user', JSON.stringify(updatedUser));
    
    // If updating profile photo, also store it locally
    if (updates.profilePhoto !== undefined) {
      const userKey = `profilePhoto_${updatedUser?.email || updatedUser?.id || 'default'}`;
      if (updates.profilePhoto) {
        localStorage.setItem(userKey, updates.profilePhoto);
      } else {
        localStorage.removeItem(userKey);
      }
    }
  };

  return { user, token, loading, signIn, signUp, signOut, updateUserProfile };
};

// PIN utilities
const hashPin = (pin) => btoa(`hashed_${pin}_salted`);
const verifyPin = (pin, hash) => hashPin(pin) === hash;

// Auth Component
const AuthScreen = ({ onSignIn, onSignUp }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (email && password) {
      try {
        if (isSignUp) {
          await onSignUp(email, password);
        } else {
          await onSignIn(email, password);
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <CContainer className="min-vh-100 d-flex align-items-center justify-content-center py-4">
      <CRow className="w-100 justify-content-center">
        <CCol xs={12} sm={10} md={8} lg={5} xl={4}>
          <CCard className="shadow-sm">
            <CCardHeader className="text-center py-4">
              <CAvatar color="primary" textColor="white">SFM</CAvatar>
              <h3 className="mt-2 mb-0">Secure File Manager</h3>
              <small className="text-body-secondary">Your files, protected and organized</small>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <CFormInput
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    required
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <CFormInput
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    required
                  />
                </div>
                {error && (
                  <CAlert color="danger" className="text-center py-2">
                    {error}
                  </CAlert>
                )}
                <CButton color="primary" className="w-100 mt-2" size="lg" onClick={handleSubmit}>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </CButton>
                <div className="text-center mt-3">
                  <CButton color="link" className="text-decoration-none" onClick={() => setIsSignUp(!isSignUp)}>
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

// PIN Lock Modal
const PinModal = ({ folder, onClose, onUnlock, user, token }) => {
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle PIN input with 4-digit validation
  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 4) {
      setPin(value);
      setError(''); // Clear error when typing
    }
  };

  const handleSubmit = async () => {
    // Validate PIN length
    if (pin.length !== 4) {
      setError('\u26a0\ufe0f PIN must be exactly 4 digits');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const success = verifyPin(pin, folder.pinHash);
      
      // Log attempt to server
      if (token) {
        await fetch('/api/unlock-attempts', {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ folderId: folder._id || folder.id, success, method: 'pin' }),
        }).catch(() => {});
      }
      
      if (success) {
        onUnlock();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin("");
        
        if (newAttempts >= 5) {
          setError("\u26d4 Too many failed attempts. Access blocked.");
          setTimeout(onClose, 3000);
        } else {
          setError(`\u274c Incorrect PIN. ${5 - newAttempts} attempts remaining`);
        }
      }
    } catch (err) {
      setError('\u274c Unlock failed. Please try again.');
      console.error('PIN unlock error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CModal visible onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle>\ud83d\udd12 Unlock "{folder.name}"</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div className="text-center mb-4">
          <Lock size={48} className="text-primary mb-2" />
          <h5 className="text-primary">Secure Folder Access</h5>
          <p className="text-muted small">Enter your 4-digit PIN to access this protected folder</p>
        </div>
        
        <div className="mb-3">
          <label className="form-label fw-semibold d-flex align-items-center justify-content-center gap-2">
            \ud83d\udd22 Enter 4-Digit PIN
            <small className="text-muted">({pin.length}/4)</small>
          </label>
          <CFormInput
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={handlePinChange}
            onKeyDown={(e) => e.key === 'Enter' && pin.length === 4 && handleSubmit()}
            maxLength={4}
            placeholder="0000"
            className={`text-center fs-4 fw-bold ${
              pin.length === 4 ? 'border-success' : pin.length > 0 ? 'border-warning' : ''
            }`}
            style={{
              letterSpacing: '0.5rem',
              fontFamily: 'monospace'
            }}
            autoFocus
            disabled={isLoading}
          />
          
          {/* PIN indicators */}
          <div className="d-flex justify-content-center gap-2 mt-2">
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i}
                className={`rounded-circle ${
                  i < pin.length ? 'bg-primary' : 'bg-light border'
                }`}
                style={{ width: '12px', height: '12px' }}
              />
            ))}
          </div>
          
          {error && <CAlert color="danger" className="mt-3 py-2 text-center">{error}</CAlert>}
        </div>
        
        <div className="d-grid">
          <CButton 
            color="primary" 
            size="lg" 
            onClick={handleSubmit}
            disabled={pin.length !== 4 || isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status" />
                Unlocking...
              </>
            ) : (
              <>
                <Unlock size={16} className="me-1" />
                Unlock Folder
              </>
            )}
          </CButton>
        </div>
        
        {attempts > 0 && (
          <div className="text-center mt-3">
            <small className="text-warning">
              \u26a0\ufe0f {attempts} failed attempt{attempts > 1 ? 's' : ''} | {5 - attempts} remaining
            </small>
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>
          Cancel
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

// File Preview Modal
const FilePreviewModal = ({ file, onClose }) => {
  const isImage = file.type?.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  const isVideo = file.type?.startsWith('video/');
  const isAudio = file.type?.startsWith('audio/');
  const isTextLike = file.type?.startsWith('text/') || ['application/json', 'application/xml', 'application/xhtml+xml'].includes(file.type || '');

  const fileUrl = file.url?.startsWith('http') ? file.url : (file.url || '');

  const [textContent, setTextContent] = React.useState(null);
  const [textError, setTextError] = React.useState(null);

  React.useEffect(() => {
    let aborted = false;
    const loadText = async () => {
      if (!isTextLike) return;
      try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (!aborted) {
          const max = 200 * 1024; // 200 KB
          setTextContent(text.length > max ? text.slice(0, max) + '\n\n…(truncated)…' : text);
        }
      } catch (e) {
        if (!aborted) setTextError(e.message);
      }
    };
    loadText();
    return () => { aborted = true; };
  }, [fileUrl, isTextLike]);

  const openInNewTab = () => window.open(fileUrl, '_blank');
  const downloadFile = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = file.name || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(fileUrl); } catch (e) { console.error('Copy failed', e); }
  };

  return (
<CModal visible onClose={onClose} size="lg" fullscreen="sm">
      <CModalHeader>
        <CModalTitle>{file.name}</CModalTitle>
      </CModalHeader>
<CModalBody style={{ maxHeight: '80vh', overflow: 'auto' }}>
        <div className="d-flex gap-2 justify-content-end mb-3">
          <CButton color="secondary" variant="outline" size="sm" onClick={openInNewTab}>Open</CButton>
          <CButton color="success" variant="outline" size="sm" onClick={downloadFile}>Download</CButton>
          <CButton color="primary" variant="outline" size="sm" onClick={copyLink}>Copy Link</CButton>
        </div>
{isImage && (<img src={fileUrl} alt={file.name} className="img-fluid rounded" style={{ width: '100%', height: 'auto', maxHeight: '75vh', objectFit: 'contain' }} />)}
{isVideo && (<video src={fileUrl} controls className="w-100 rounded" style={{ width: '100%', height: 'auto', maxHeight: '75vh' }} />)}
        {isAudio && (<audio src={fileUrl} controls className="w-100" />)}
{isPdf && (<iframe src={fileUrl} className="w-100" style={{ height: '75vh' }} title={file.name} />)}
        {isTextLike && (
<div className="border rounded p-3 bg-light" style={{ maxHeight: '75vh', overflow: 'auto' }}>
            {textError ? (
              <div className="text-danger">Failed to load text: {textError}</div>
            ) : (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{textContent ?? 'Loading…'}</pre>
            )}
          </div>
        )}
        {!isImage && !isVideo && !isAudio && !isPdf && !isTextLike && (
          <div className="text-center py-5 text-muted">
            <File size={64} className="mb-3" />
            <div>Preview not available for this file type</div>
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Close</CButton>
      </CModalFooter>
    </CModal>
  );
};

// Edit Folder Modal
const EditFolderModal = ({ folder, onClose, onSave }) => {
  const [folderName, setFolderName] = useState(folder?.name || '');
  const [pin, setPin] = useState('');
  const [removePin, setRemovePin] = useState(!folder?.locked);

  const handleSave = () => {
    onSave({ name: folderName, pin });
    onClose();
  };

  return (
    <CModal visible onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle>Edit Folder</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div className="mb-3">
          <label className="form-label">Folder Name</label>
          <CFormInput
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>
        <div className="mb-2 form-check">
          <input id="removePinChk" className="form-check-input" type="checkbox" checked={removePin} onChange={(e) => setRemovePin(e.target.checked)} />
          <label className="form-check-label" htmlFor="removePinChk">No PIN (unlocked)</label>
        </div>
        {!removePin && (
          <div>
            <label className="form-label">New PIN (4 digits)</label>
            <CFormInput
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="••••"
              maxLength={4}
            />
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>Cancel</CButton>
        <CButton color="primary" onClick={handleSave}>Save</CButton>
      </CModalFooter>
    </CModal>
  );
};

// New Folder Modal
const NewFolderModal = ({ onClose, onCreate }) => {
  const [folderName, setFolderName] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [wantsLock, setWantsLock] = useState(false);

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 4) {
      setPin(value);
      setPinError('');
    }
  };

  const validatePin = () => {
    if (wantsLock && pin.length !== 4) {
      setPinError('PIN must be exactly 4 digits');
      return false;
    }
    setPinError('');
    return true;
  };

  const handleCreate = () => {
    if (!folderName.trim()) {
      return;
    }
    
    if (wantsLock && !validatePin()) {
      return;
    }
    
    onCreate(folderName, wantsLock ? pin : '');
    onClose();
  };

  const isFormValid = folderName.trim() && (!wantsLock || (wantsLock && pin.length === 4));

  return (
    <CModal visible onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle>Create New Folder</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div className="mb-3">
          <label className="form-label">Folder Name</label>
          <CFormInput
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Enter folder name..."
            autoFocus
          />
        </div>
        
        <div className="mb-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="wantsLock"
              checked={wantsLock}
              onChange={(e) => {
                setWantsLock(e.target.checked);
                if (!e.target.checked) {
                  setPin('');
                  setPinError('');
                }
              }}
            />
            <label className="form-check-label" htmlFor="wantsLock">
              🔒 Lock this folder with a PIN
            </label>
          </div>
          <small className="text-muted">Check this to require a 4-digit PIN to access this folder</small>
        </div>
        
        {wantsLock && (
          <div className="fade-in">
            <label className="form-label">4-Digit PIN</label>
            <div className="position-relative">
              <CFormInput
                type="password"
                value={pin}
                onChange={handlePinChange}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                onBlur={validatePin}
                placeholder="Enter 4 digits..."
                maxLength={4}
                className={`pin-input ${pinError ? 'is-invalid' : pin.length === 4 ? 'is-valid' : ''}`}
                style={{
                  fontSize: '1.2rem',
                  letterSpacing: '0.5rem',
                  textAlign: 'center',
                  paddingRight: '2.5rem'
                }}
              />
              <div className="position-absolute" style={{
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}>
                {pin.length === 4 ? (
                  <CheckCircle size={20} className="text-success" />
                ) : wantsLock ? (
                  <Lock size={20} className="text-muted" />
                ) : null}
              </div>
            </div>
            {pinError && (
              <div className="invalid-feedback d-block">
                <AlertCircle size={16} className="me-1" />
                {pinError}
              </div>
            )}
            <div className="form-text mt-2">
              <div className="d-flex align-items-center gap-2">
                <span>PIN strength: </span>
                <div className="flex-grow-1" style={{ maxWidth: '100px' }}>
                  <div className="progress" style={{ height: '4px' }}>
                    <div 
                      className={`progress-bar ${
                        pin.length === 0 ? 'bg-light' :
                        pin.length < 4 ? 'bg-warning' : 'bg-success'
                      }`} 
                      style={{ width: `${(pin.length / 4) * 100}%` }}
                    />
                  </div>
                </div>
                <small className="text-muted">
                  {pin.length}/4
                </small>
              </div>
            </div>
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>Cancel</CButton>
        <CButton 
          color="primary" 
          onClick={handleCreate}
          disabled={!isFormValid}
        >
          Create Folder
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

// Bootstrap-styled confirmation modal
function ConfirmModal({ show, title, message, onCancel, onConfirm }) {
  return (
    <CModal visible={show} onClose={onCancel} alignment="center">
      <CModalHeader>
        <CModalTitle>{title || 'Confirm'}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div className="d-flex align-items-start gap-2">
          <AlertCircle className="text-danger flex-shrink-0" />
          <div>{message || 'Are you sure?'}</div>
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onCancel}>Cancel</CButton>
        <CButton color="danger" onClick={onConfirm}>Delete</CButton>
      </CModalFooter>
    </CModal>
  );
}

// Enhanced delete folder confirmation modal with detailed content warnings
function DeleteFolderModal({ show, folder, contentsAnalysis, onCancel, onConfirm }) {
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };
  
  const getFileTypesText = (fileTypes) => {
    const types = [];
    if (fileTypes.images > 0) types.push(`${fileTypes.images} image${fileTypes.images > 1 ? 's' : ''}`);
    if (fileTypes.documents > 0) types.push(`${fileTypes.documents} document${fileTypes.documents > 1 ? 's' : ''}`);
    if (fileTypes.videos > 0) types.push(`${fileTypes.videos} video${fileTypes.videos > 1 ? 's' : ''}`);
    if (fileTypes.audio > 0) types.push(`${fileTypes.audio} audio file${fileTypes.audio > 1 ? 's' : ''}`);
    if (fileTypes.other > 0) types.push(`${fileTypes.other} other file${fileTypes.other > 1 ? 's' : ''}`);
    return types.join(', ');
  };
  
  if (!show || !folder || !contentsAnalysis) return null;
  
  const { fileCount, subfolderCount, totalSize, fileTypes, isEmpty } = contentsAnalysis;
  
  return (
    <CModal visible={show} onClose={onCancel} alignment="center" size="lg">
      <CModalHeader>
        <CModalTitle className="text-danger">
          <AlertCircle size={20} className="me-2" />
          Delete Folder "{folder.name}"
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {isEmpty ? (
          // Empty folder - simple confirmation
          <div className="text-center py-3">
            <Folder size={48} className="text-muted mb-3 opacity-50" />
            <h5 className="fw-bold mb-2">Delete Empty Folder?</h5>
            <p className="text-muted mb-0">
              This folder is empty and can be safely deleted.
            </p>
          </div>
        ) : (
          // Folder with contents - detailed warning
          <div>
            <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-danger-subtle border border-danger-subtle rounded">
              <AlertCircle size={32} className="text-danger flex-shrink-0" />
              <div>
                <h5 className="fw-bold mb-1 text-danger">⚠️ Warning: This folder contains data!</h5>
                <p className="mb-0 text-danger-emphasis">
                  Deleting this folder will <strong>permanently remove all its contents</strong>. This action cannot be undone.
                </p>
              </div>
            </div>
            
            {/* Contents Summary */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3">📊 Folder Contents Summary:</h6>
              
              <div className="row g-3 mb-3">
                {fileCount > 0 && (
                  <div className="col-md-6">
                    <div className="d-flex align-items-center gap-2 p-2 bg-light rounded">
                      <File size={20} className="text-primary" />
                      <div>
                        <div className="fw-semibold">{fileCount} File{fileCount !== 1 ? 's' : ''}</div>
                        <small className="text-muted">{formatSize(totalSize)}</small>
                      </div>
                    </div>
                  </div>
                )}
                
                {subfolderCount > 0 && (
                  <div className="col-md-6">
                    <div className="d-flex align-items-center gap-2 p-2 bg-light rounded">
                      <Folder size={20} className="text-warning" />
                      <div>
                        <div className="fw-semibold">{subfolderCount} Subfolder{subfolderCount !== 1 ? 's' : ''}</div>
                        <small className="text-muted">May contain additional files</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* File Types Breakdown */}
              {fileCount > 0 && (
                <div className="mb-3">
                  <h6 className="small fw-semibold mb-2">📁 File Types:</h6>
                  <div className="p-2 bg-light rounded">
                    <small className="text-muted">{getFileTypesText(fileTypes)}</small>
                  </div>
                </div>
              )}
            </div>
            
            {/* Final Warning */}
            <CAlert color="danger" className="mb-0">
              <div className="d-flex align-items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-1" />
                <div>
                  <strong>Are you absolutely sure?</strong>
                  <div className="mt-1">
                    This will delete:
                    <ul className="mb-1 mt-1">
                      {fileCount > 0 && <li>{fileCount} file{fileCount !== 1 ? 's' : ''} ({formatSize(totalSize)})</li>}
                      {subfolderCount > 0 && <li>{subfolderCount} subfolder{subfolderCount !== 1 ? 's' : ''} and all their contents</li>}
                    </ul>
                    <strong>This action cannot be undone!</strong>
                  </div>
                </div>
              </div>
            </CAlert>
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onCancel}>
          Cancel
        </CButton>
        <CButton color="danger" onClick={onConfirm}>
          {isEmpty ? 'Delete Empty Folder' : `Delete Folder & All Contents`}
        </CButton>
      </CModalFooter>
    </CModal>
  );
}

// Main App
export default function SecureFileManager() {
  const { user, token, loading, signIn, signUp, signOut, updateUserProfile } = useAuth();

  const [folders, setFolders] = useState([]);
  const [rootFolders, setRootFolders] = useState([]);
  const [files, setFiles] = useState([]);

  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [unlockedFolders, setUnlockedFolders] = useState(new Set());
  const [showPinModal, setShowPinModal] = useState(null);
  const [showPreview, setShowPreview] = useState(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [editFolder, setEditFolder] = useState(null);
  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Sidebar is now static, no toggle needed
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const showToast = useToast();
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);
  const [confirmDlg, setConfirmDlg] = useState({ show: false, title: '', message: '', onConfirm: null });
  
  // New state hooks for dynamic functionality
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteFolderModal, setDeleteFolderModal] = useState({ show: false, folder: null, contentsAnalysis: null });
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'folder', 'favorites'

  // API base: use env VITE_API_BASE or Vite proxy with relative /api
  const API = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '/api';
  
  // Favorites management functions
  const loadFavorites = useCallback(() => {
    if (!user) return;
    try {
      const userKey = `sfm_favorites_${user?.id || user?.email || 'anon'}`;
      const savedFavorites = localStorage.getItem(userKey);
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
      setFavorites([]);
    }
  }, [user]);
  
  const saveFavorites = useCallback((newFavorites) => {
    if (!user) return;
    try {
      const userKey = `sfm_favorites_${user?.id || user?.email || 'anon'}`;
      localStorage.setItem(userKey, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }, [user]);
  
  const toggleFavorite = useCallback((file) => {
    console.log('🌟 [DEBUG] Toggling favorite for file:', file?.name);
    
    const fileId = file._id || file.id;
    const isCurrentlyFavorited = favorites.some(fav => (fav._id || fav.id) === fileId);
    
    let newFavorites;
    if (isCurrentlyFavorited) {
      newFavorites = favorites.filter(fav => (fav._id || fav.id) !== fileId);
      showToast(`Removed "${file.name}" from favorites`, { type: 'info' });
    } else {
      newFavorites = [...favorites, { ...file, favoritedAt: new Date().toISOString() }];
      showToast(`Added "${file.name}" to favorites`, { type: 'success' });
    }
    
    saveFavorites(newFavorites);
    
    // Log activity
    logActivity(isCurrentlyFavorited ? 'FILE_UNFAVORITE' : 'FILE_FAVORITE', {
      fileName: file.name,
      fileId: fileId,
      fileType: file.type || 'unknown'
    });
  }, [favorites, saveFavorites, showToast]);
  
  const isFavorited = useCallback((file) => {
    const fileId = file._id || file.id;
    return favorites.some(fav => (fav._id || fav.id) === fileId);
  }, [favorites]);
  
  // Get total size of a folder (including subfolders recursively)
  const getFolderSize = useCallback((folderId) => {
    if (!folderId || !files || !folders) return 0;
    
    try {
      // Get direct files in this folder
      const directFiles = files.filter(file => 
        file && String(file.folderId) === String(folderId)
      );
      let totalSize = directFiles.reduce((sum, file) => sum + (file.size || 0), 0);
      
      // Get subfolders and add their sizes recursively (but avoid infinite recursion)
      const subfolders = folders.filter(folder => 
        folder && String(folder.parentId) === String(folderId)
      );
      
      // Only recurse if we haven't gone too deep (prevent infinite loops)
      const maxDepth = 10;
      if (subfolders.length > 0 && maxDepth > 0) {
        subfolders.forEach(subfolder => {
          if (subfolder && (subfolder._id || subfolder.id) !== folderId) { // Prevent self-reference
            totalSize += getFolderSize(subfolder._id || subfolder.id);
          }
        });
      }
      
      return totalSize;
    } catch (error) {
      console.warn('Error calculating folder size for:', folderId, error);
      return 0;
    }
  }, [files, folders]);
  
  // Enhanced upload function with progress and multicore file processing
  const uploadFiles = async (filesList) => {
    if (!filesList || filesList.length === 0) return;
    
    setIsUploading(true);
    setBusy(true);
    setUploadProgress(0);
    
    const fileCount = filesList.length;
    const fileNames = Array.from(filesList).map(f => f.name).join(', ');
    
    try {
      showToast(`Processing and uploading ${fileCount} file${fileCount > 1 ? 's' : ''} using multicore processing...`, { type: 'info' });
      
      // Initialize WorkerManager for file processing
      await WorkerManager.initialize();
      
      // Process files in parallel using multiple CPU cores
      const processedFiles = [];
      const processingPromises = [];
      
      // Update progress as files are processed
      let processedCount = 0;
      const updateProgress = () => {
        processedCount++;
        const progressPercent = Math.floor((processedCount / fileCount) * 50); // First 50% for processing
        setUploadProgress(progressPercent);
      };
      
      for (const file of filesList) {
        const processingPromise = (async () => {
          try {
            // Analyze file in background thread
            const analysis = await WorkerManager.processFile('analyze', file, {
              timeout: 15000 // 15 seconds timeout for analysis
            });
            
            // Compress images if they're large (also in background)
            let processedFile = file;
            if (file.type.startsWith('image/') && file.size > 1024 * 1024) { // > 1MB
              try {
                const compressed = await WorkerManager.processFile('compress', file, {
                  quality: 0.8,
                  format: 'webp',
                  timeout: 30000 // 30 seconds for compression
                });
                processedFile = new File([compressed], 
                  file.name.replace(/\.[^/.]+$/, '.webp'), 
                  { type: 'image/webp' }
                );
                console.log(`🗜️ Compressed ${file.name}: ${file.size} → ${processedFile.size} bytes`);
              } catch (compressionError) {
                console.warn('File compression failed, using original:', compressionError);
                // Use original file if compression fails
              }
            }
            
            updateProgress();
            return { original: file, processed: processedFile, analysis };
          } catch (error) {
            console.error('File processing error:', error);
            updateProgress();
            return { original: file, processed: file, analysis: null }; // Use original if processing fails
          }
        })();
        
        processingPromises.push(processingPromise);
      }
      
      // Wait for all files to be processed
      const results = await Promise.all(processingPromises);
      processedFiles.push(...results);
      
      // Start upload phase (second 50% of progress)
      setUploadProgress(50);
      
      const fdata = new FormData();
      for (const result of processedFiles) {
        fdata.append('files', result.processed);
        // Include analysis data if available
        if (result.analysis) {
          fdata.append(`analysis_${result.processed.name}`, JSON.stringify(result.analysis));
        }
      }
      fdata.append('folderId', currentFolderId || '');
      
      // Upload progress tracking
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + 2;
          return next >= 95 ? 95 : next; // Stop at 95%, complete when done
        });
      }, 200);
      
      const response = await fetch(`${API}/files/upload`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` }, 
        body: fdata 
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Upload failed (${response.status})`);
      }
      
      const created = await response.json();
      
      // Update files state with new uploads
      setFiles(prev => [...prev, ...created]);
      
      // Log activity with processing stats
      const originalSize = Array.from(filesList).reduce((sum, f) => sum + f.size, 0);
      const processedSize = processedFiles.reduce((sum, r) => sum + r.processed.size, 0);
      const compressionSavings = originalSize - processedSize;
      
      await logActivity('FILE_UPLOAD', {
        fileCount: fileCount,
        fileNames: fileNames,
        folderId: currentFolderId || 'root',
        folderName: currentFolder?.name || 'Root',
        originalSize: originalSize,
        processedSize: processedSize,
        compressionSavings: compressionSavings,
        multicore: true
      });
      
      // Refresh data to ensure consistency
      await refreshData();
      
      const savingsText = compressionSavings > 0 
        ? ` (saved ${Math.round(compressionSavings / 1024)}KB through optimization)` 
        : '';
      
      showToast(`Successfully uploaded: ${fileNames}${savingsText}`, { type: 'success' });
      
    } catch (err) {
      console.error('Upload failed', err);
      showToast(`Upload failed: ${err.message}`, { type: 'error' });
    } finally {
      setIsUploading(false);
      setBusy(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = (e) => {
    const filesList = e.target.files ? Array.from(e.target.files) : [];
    if (!filesList.length) return;
    const fdata = new FormData();
    for (const f of filesList) fdata.append('files', f);
    fdata.append('folderId', currentFolderId || '');
    setBusy(true);
    fetch(`${API}/files/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fdata })
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(text || `Upload failed (${r.status})`);
        }
        return r.json();
      })
      .then(created => { setFiles(prev => [...prev, ...created]); showToast('Upload successful', { type: 'success' }); })
      .catch(err => { console.error('Upload failed', err); showToast(`Upload failed: ${err.message}`, { type: 'error' }); })
      .finally(() => { setBusy(false); if (e && e.target) e.target.value = null; });
  };

  const onDrop = (acceptedFiles) => {
    uploadFiles(acceptedFiles);
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true, noKeyboard: true, multiple: true });

  const apiFetch = async (path, opts = {}) => {
    const headers = opts.headers || {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (opts.body && !(opts.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${API}${path}`, { ...opts, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed: ${res.status}`);
    }
    return res.json().catch(() => ({}));
  };

  // Helper function to check if item is in trash
  const isItemInTrash = (itemId, itemType = 'file') => {
    const trashItems = JSON.parse(localStorage.getItem('sfm_trash_items') || '[]');
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return trashItems.some(trashItem => {
      const trashItemId = trashItem._id || trashItem.id;
      const isWithinWeek = new Date(trashItem.deletedAt) > oneWeekAgo;
      const isSameType = trashItem.type === itemType;
      const isSameId = String(trashItemId) === String(itemId);
      
      return isSameId && isSameType && isWithinWeek;
    });
  };

  // Activity logging function
  const logActivity = async (action, details = {}) => {
    if (!user || !token) return;
    
    try {
      const activityLog = {
        userId: user.id || user._id,
        userEmail: user.email,
        userName: user.name || user.username,
        action,
        details,
        timestamp: new Date().toISOString(),
        sessionId: sessionStorage.getItem('sfm_session_id') || 'unknown',
        userAgent: navigator.userAgent,
        ipAddress: 'client-side' // Will be filled by server
      };

      // Send to activitylogs collection
      await fetch(`${API}/activity-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(activityLog)
      }).catch(err => {
        console.warn('Failed to log activity:', err);
        // Store locally as backup
        const localLogs = JSON.parse(localStorage.getItem('sfm_activity_logs_backup') || '[]');
        localLogs.push(activityLog);
        if (localLogs.length > 100) localLogs.shift(); // Keep only last 100
        localStorage.setItem('sfm_activity_logs_backup', JSON.stringify(localLogs));
      });
    } catch (error) {
      console.warn('Activity logging error:', error);
    }
  };

  // Refresh data function for real-time updates
  const refreshData = useCallback(async (showToastMessage = false) => {
    if (!user || !token) return;
    
    setIsRefreshing(true);
    
    try {
      if (showToastMessage) {
        showToast('Refreshing data...', { type: 'info' });
      }
      
      // Refresh folders
      const parentId = currentFolderId ? `?parentId=${currentFolderId}` : '';
      const fetchedFolders = await apiFetch(`/folders${parentId}`);
      setFolders(fetchedFolders || []);
      
      // Refresh files
      const filesPath = currentFolderId ? `/files?folderId=${currentFolderId}` : '/files';
      const fetchedFiles = await apiFetch(filesPath);
      setFiles(fetchedFiles || []);
      
      // Refresh root folders if on dashboard
      if (!currentFolderId) {
        const roots = await apiFetch('/folders');
        setRootFolders(roots || []);
      }
      
      if (showToastMessage) {
        showToast('Data refreshed successfully', { type: 'success' });
      }
      
    } catch (err) {
      console.error('Refresh data error', err.message);
      if (showToastMessage) {
        showToast('Failed to refresh data', { type: 'error' });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [user, token, currentFolderId, showToast]);
  
  // Auto-refresh data every 30 seconds for real-time updates
  useEffect(() => {
    if (!user || !token) return;
    
    const interval = setInterval(() => {
      refreshData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [refreshData, user, token]);

  // load root folders once and refresh on auth change
  useEffect(() => {
    if (!user || !token) return;
    
    // Log user login/session start
    logActivity('USER_LOGIN', {
      loginTime: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    
    (async () => {
      try {
        const roots = await apiFetch('/folders'); // parentId defaults to null on backend
        setRootFolders(roots || []);
      } catch (err) {
        console.error('Load root error', err.message);
      }
    })();
  }, [user, token]);

  // load folders/files for current folder
  useEffect(() => {
    if (!user || !token) return;
    
    // Skip loading if we're already loading or if data was pre-loaded
    if (isLoadingFolder) return;

    const load = async () => {
      try {
        console.log('🔄 [DEBUG] Loading data for currentFolderId:', currentFolderId);
        setIsRefreshing(true);
        
        const parentId = currentFolderId ? `?parentId=${currentFolderId}` : '';
        console.log('📂 [DEBUG] Fetching folders with parentId:', parentId);
        const fetchedFolders = await apiFetch(`/folders${parentId}`);
        
        // Validate folders data
        if (!Array.isArray(fetchedFolders)) {
          console.warn('⚠️ [WARN] fetchedFolders is not an array:', fetchedFolders);
        }
        
        setFolders(fetchedFolders || []);
        console.log('✅ [DEBUG] Folders loaded:', (fetchedFolders || []).length, 'folders');

        const filesPath = currentFolderId ? `/files?folderId=${currentFolderId}` : '/files';
        console.log('📄 [DEBUG] Fetching files from path:', filesPath);
        const fetchedFiles = await apiFetch(filesPath);
        
        // Validate files data
        if (!Array.isArray(fetchedFiles)) {
          console.warn('⚠️ [WARN] fetchedFiles is not an array:', fetchedFiles);
        }
        
        setFiles(fetchedFiles || []);
        console.log('✅ [DEBUG] Files loaded:', (fetchedFiles || []).length, 'files');
        
      } catch (err) {
        console.error('❌ [ERROR] Load data failed:', err.message, err);
        showToast(`Failed to load folder contents: ${err.message}`, { type: 'error' });
        
        // Set empty arrays to prevent undefined errors
        setFolders([]);
        setFiles([]);
      } finally {
        setIsRefreshing(false);
      }
    };

    load();
  }, [user, token, currentFolderId, isLoadingFolder]);

  // Calculate dynamic dashboard statistics with detailed breakdown (must be before conditional returns)
  const dashboardStats = useMemo(() => {
    const totalFiles = files.length;
    const totalFolders = folders.filter(f => !f.parentId).length; // Only root folders
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    
    // Recent files (last 24 hours)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentFiles = files.filter(file => {
      const fileDate = new Date(file.uploadDate || file.createdAt || file.dateModified);
      return fileDate > dayAgo;
    }).length;
    
    // File type breakdown
    const fileTypes = {
      images: files.filter(f => f.type?.startsWith('image/')).length,
      documents: files.filter(f => f.type?.includes('pdf') || f.type?.includes('doc') || f.type?.includes('text')).length,
      videos: files.filter(f => f.type?.startsWith('video/')).length,
      audio: files.filter(f => f.type?.startsWith('audio/')).length,
      other: files.filter(f => !f.type || (!f.type.startsWith('image/') && !f.type.startsWith('video/') && !f.type.startsWith('audio/') && !f.type.includes('pdf') && !f.type.includes('doc') && !f.type.includes('text'))).length
    };
    
    // Storage usage (assuming 20GB limit)
    const storageLimit = 20 * 1024 * 1024 * 1024; // 20GB in bytes
    const storageUsed = (totalSize / storageLimit) * 100;
    
    return {
      totalFiles,
      totalFolders,
      totalSize,
      recentFiles,
      fileTypes,
      storageUsed: Math.min(storageUsed, 100), // Cap at 100%
      storageUsedGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
      storageLimitGB: 20,
      lastUpdated: new Date().toLocaleTimeString()
    };
  }, [files, folders]);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <CSpinner color="primary" style={{ width: '3rem', height: '3rem' }} />
        <span className="ms-3 fw-semibold text-primary">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} />;
  }

  const getId = (o) => (o?._id || o?.id || null);
  const currentFolder = folders.find(f => getId(f) === currentFolderId);
  const breadcrumbs = [];
  let temp = currentFolder;
  while (temp) {
    breadcrumbs.unshift(temp);
    // parentId may be null or an id string
    const pid = temp.parentId || null;
    temp = folders.find(f => String(getId(f)) === String(pid));
  }

  const currentFiles = files.filter(f => {
    if (!currentFolderId) return !f.folderId;
    return String(f.folderId) === String(currentFolderId);
  }).filter(f => !isItemInTrash(f._id || f.id, 'file')); // Exclude trashed files
  
  const currentSubfolders = folders.filter(f => {
    if (!currentFolderId) return !f.parentId;
    return String(f.parentId) === String(currentFolderId);
  }).filter(f => !isItemInTrash(f._id || f.id, 'folder')); // Exclude trashed folders

  const filteredFiles = currentFiles.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFolders = currentSubfolders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build Windows-style path, base is user home (configurable)
  const HOME_ROOT = (import.meta.env && (import.meta.env.VITE_HOME_PATH || import.meta.env.VITE_PATH_ROOT)) ? (import.meta.env.VITE_HOME_PATH || import.meta.env.VITE_PATH_ROOT) : 'C\\\\Users\\\\devan\\\\';
  const normRoot = HOME_ROOT.replace(/\\+$/,'') + '\\';
  const winSegments = breadcrumbs.map(b => b.name);
  const windowsPathStr = normRoot + winSegments.join('\\');

  const copyPathToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(windowsPathStr);
      showToast('Path copied', { type: 'success' });
    } catch (e) {
      showToast('Failed to copy path', { type: 'error' });
    }
  };

  // Secure download helper: uses auth token and streams any type
  const secureDownload = async (file) => {
    try {
      const res = await fetch(`${API}/files/${file._id || file.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        if (res.status === 404 && file.url) {
          // Fallback to direct file URL (public uploads) if secure endpoint is unavailable
          const directUrl = file.url.startsWith('http') ? file.url : file.url;
          window.open(directUrl, '_blank');
          return;
        }
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      // Log activity
      await logActivity('FILE_DOWNLOAD', {
        fileName: file.name || 'download',
        fileId: file._id || file.id,
        fileSize: file.size || 0,
        fileType: file.type || 'unknown'
      });
    } catch (e) {
      showToast(`Download failed: ${e.message}`, { type: 'error' });
    }
  };

  const handleFolderClick = (folder) => {
    console.log('🔍 [DEBUG] handleFolderClick called with folder:', folder);
    
    try {
      // Validate folder object
      if (!folder) {
        console.error('❌ [ERROR] handleFolderClick: folder is null/undefined');
        showToast('Invalid folder selected', { type: 'error' });
        return;
      }
      
      const folderId = folder._id || folder.id;
      if (!folderId) {
        console.error('❌ [ERROR] handleFolderClick: folder has no valid ID', folder);
        showToast('Folder ID is missing', { type: 'error' });
        return;
      }
      
      console.log('📁 [DEBUG] Folder ID:', folderId, 'Locked:', folder.locked, 'Unlocked folders:', unlockedFolders);
      
      if (folder.locked && !unlockedFolders.has(folderId)) {
        console.log('🔒 [DEBUG] Folder is locked, showing PIN modal');
        setShowPinModal(folder);
      } else {
        console.log('📂 [DEBUG] Opening folder, setting currentFolderId to:', folderId);
        setIsLoadingFolder(true);
        setCurrentView('folder');
        setCurrentFolderId(folderId);
        
        // Add a brief loading toast for user feedback
        showToast(`Opening folder "${folder.name}"...`, { type: 'info' });
      }
    } catch (error) {
      console.error('❌ [ERROR] handleFolderClick exception:', error);
      showToast(`Failed to open folder: ${error.message}`, { type: 'error' });
    }
  };

  const handleUnlock = async (method = 'PIN') => {
    const folderId = showPinModal?._id || showPinModal?.id;
    const folderName = showPinModal?.name;
    
    try {
    // Add to unlocked folders
    setUnlockedFolders(prev => new Set([...prev, folderId]));
    
    // Log activity
    await logActivity('FOLDER_UNLOCK', {
      folderName: folderName,
      folderId: folderId,
      unlockMethod: method
    });
    
    // Set loading state
    setIsLoadingFolder(true);
    
    // Close modal
    setShowPinModal(null);
      
      // Pre-load folder data while switching views
      const [fetchedFolders, fetchedFiles] = await Promise.all([
        apiFetch(`/folders?parentId=${folderId}`),
        apiFetch(`/files?folderId=${folderId}`)
      ]);
      
      // Set the data before switching views
      setFolders(fetchedFolders || []);
      setFiles(fetchedFiles || []);
      
      // Now switch to folder view
      setCurrentView('folder');
      setCurrentFolderId(folderId);
      
      // Show success toast
      showToast(`🔓 Unlocked "${folderName}" with ${method}`, { type: 'success' });
      
    } catch (err) {
      console.error('Failed to load folder after unlock:', err);
      showToast(`Failed to open folder: ${err.message}`, { type: 'error' });
    } finally {
      setIsLoadingFolder(false);
    }
  };


  const handleCreateFolder = (name, pin) => {
    (async () => {
      try {
        setIsCreatingFolder(true);
        setBusy(true);
        
        // Add loading toast
        showToast('Creating folder...', { type: 'info' });
        
        const body = { name, parentId: currentFolderId || null, locked: !!pin, pinHash: pin ? btoa(`hashed_${pin}_salted`) : null };
        const created = await apiFetch('/folders', { method: 'POST', body: JSON.stringify(body) });
        
        // Update both folders and rootFolders states dynamically
        setFolders(prev => [...prev, created]);
        if (!currentFolderId) {
          setRootFolders(prev => [...prev, created]);
        }
        
        // Log activity
        await logActivity('FOLDER_CREATE', {
          folderName: name,
          isLocked: !!pin,
          parentFolderId: currentFolderId || 'root',
          parentFolderName: currentFolder?.name || 'Root'
        });
        
        // Update dashboard stats in real-time
        showToast(`Folder "${name}" created successfully`, { type: 'success' });
        
        // Refresh data to ensure consistency
        await refreshData();
        
      } catch (err) {
        console.error('Create folder failed', err.message);
        showToast('Failed to create folder: ' + err.message, { type: 'error' });
      } finally { 
        setIsCreatingFolder(false);
        setBusy(false); 
      }
    })();
  };


const handleDeleteFile = (fileId) => {
    // Ensure fileId is a string - handle all possible cases
    let actualFileId;
    if (typeof fileId === 'object' && fileId !== null) {
      actualFileId = fileId._id || fileId.id;
    } else {
      actualFileId = fileId;
    }
    
    // Convert to string if it's not already
    actualFileId = String(actualFileId);
    
    // Validate ObjectId format (24 character hex string)
    if (!/^[0-9a-fA-F]{24}$/.test(actualFileId)) {
      console.error('❌ Invalid ObjectId format:', actualFileId);
      showToast('Invalid file ID format', { type: 'error' });
      return;
    }
    
    console.log('🗑️ [DEBUG] Delete file - Original ID:', fileId, 'Processed ID:', actualFileId);
    
    const file = files.find(f => String(f._id || f.id) === actualFileId);
    const fileName = file?.name || 'this file';
    
    setConfirmDlg({
      show: true,
      title: 'Move to trash',
      message: `Are you sure you want to move "${fileName}" to trash? You can restore it within 7 days.`,
      onConfirm: async () => {
        try {
          setBusy(true);
          showToast('Moving to trash...', { type: 'info' });
          
          // Add file to trash in localStorage
          const trashItems = JSON.parse(localStorage.getItem('sfm_trash_items') || '[]');
          const trashItem = {
            ...file,
            _id: actualFileId, // Ensure we use the correct ID
            id: actualFileId,
            deletedAt: new Date().toISOString(),
            type: 'file',
            originalLocation: currentFolderId ? `folder-${currentFolderId}` : 'root'
          };
          trashItems.push(trashItem);
          localStorage.setItem('sfm_trash_items', JSON.stringify(trashItems));
          
          // Delete from server
          await apiFetch(`/files/${fileId}`, { method: 'DELETE' });
          
          // Update files state immediately
          setFiles(prev => prev.filter(f => (f._id || f.id) !== fileId));
          
          // Log activity
          await logActivity('FILE_DELETE', {
            fileName: fileName,
            fileId: actualFileId,
            fileSize: file.size || 0,
            fileType: file.type || 'unknown',
            folderId: currentFolderId || 'root',
            folderName: currentFolder?.name || 'Root',
            movedToTrash: true
          });
          
          // Delete from server
          await apiFetch(`/files/${actualFileId}`, { method: 'DELETE' });
          
          // Update files state immediately
          setFiles(prev => prev.filter(f => (f._id || f.id) !== actualFileId));
          console.error('Move to trash failed', err.message);
          showToast(`Failed to move file to trash: ${err.message}`, { type: 'error' });
        } finally {
          setBusy(false);
          setConfirmDlg({ show: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  const handleDeleteFolder = (folderId) => {
    // Ensure folderId is a string - handle all possible cases
    let actualFolderId;
    if (typeof folderId === 'object' && folderId !== null) {
      actualFolderId = folderId._id || folderId.id;
    } else {
      actualFolderId = folderId;
    }
    
    // Convert to string if it's not already
    actualFolderId = String(actualFolderId);
    
    // Validate ObjectId format (24 character hex string)
    if (!/^[0-9a-fA-F]{24}$/.test(actualFolderId)) {
      console.error('❌ Invalid ObjectId format:', actualFolderId);
      showToast('Invalid folder ID format', { type: 'error' });
      return;
    }
    
    console.log('🗑️ [DEBUG] Delete folder - Original ID:', folderId, 'Processed ID:', actualFolderId);
    
    const folder = [...folders, ...rootFolders].find(f => String(f._id || f.id) === actualFolderId);
    
    if (!folder) {
      showToast('Folder not found', { type: 'error' });
      return;
    }
    
    // Analyze folder contents before showing delete modal
    const contentsAnalysis = getFolderContentsAnalysis(actualFolderId);
    
    setDeleteFolderModal({
      show: true,
      folder: folder,
      contentsAnalysis: contentsAnalysis
    });
  };
  
  const confirmDeleteFolder = async () => {
    const { folder } = deleteFolderModal;
    // Ensure folderId is a string
    let folderId;
    if (typeof folder === 'object' && folder !== null) {
      folderId = folder._id || folder.id;
    } else {
      folderId = folder;
    }
    folderId = String(folderId);
    
    console.log('🗑️ [DEBUG] Confirm delete folder - Folder:', folder, 'Processed ID:', folderId);
    
    try {
      setBusy(true);
      showToast('Moving folder to trash...', { type: 'info' });
      
      // Add folder to trash in localStorage
      const trashItems = JSON.parse(localStorage.getItem('sfm_trash_items') || '[]');
      const { fileCount, subfolderCount } = deleteFolderModal.contentsAnalysis;
      
      const trashItem = {
        ...folder,
        _id: folderId, // Ensure we use the correct ID
        id: folderId,
        deletedAt: new Date().toISOString(),
        type: 'folder',
        originalLocation: folder.parentId ? `folder-${folder.parentId}` : 'root',
        contentsInfo: {
          fileCount,
          subfolderCount,
          totalItems: fileCount + subfolderCount
        }
      };
      trashItems.push(trashItem);
      localStorage.setItem('sfm_trash_items', JSON.stringify(trashItems));
      
      await apiFetch(`/folders/${folderId}`, { method: 'DELETE' });
      
      // Update all relevant states immediately
      setFolders(prev => prev.filter(f => (f._id || f.id) !== folderId));
      setRootFolders(prev => prev.filter(f => (f._id || f.id) !== folderId));
      setFiles(prev => prev.filter(ff => String(ff.folderId) !== String(folderId)));
      
      // If we're currently in the deleted folder, go back to dashboard
      if (String(currentFolderId) === String(folderId)) {
        setCurrentFolderId(null);
        setCurrentView('dashboard');
      }
      
      // Log activity
      await logActivity('FOLDER_DELETE', {
        folderName: folder.name,
        folderId: folderId,
        isLocked: folder.locked || false,
        parentFolderId: folder.parentId || 'root',
        contentsInfo: {
          fileCount,
          subfolderCount,
          totalItems: fileCount + subfolderCount
        },
        movedToTrash: true
      });
      
      // Refresh data to ensure consistency
      await refreshData();
      
      const contentsSummary = fileCount > 0 || subfolderCount > 0 
        ? ` and all its contents (${fileCount} files, ${subfolderCount} subfolders)`
        : '';
      
      showToast(`Folder "${folder.name}"${contentsSummary} moved to trash`, { type: 'success' });
      
    } catch (err) {
      console.error('Move folder to trash failed', err.message);
      showToast(`Failed to move folder to trash: ${err.message}`, { type: 'error' });
    } finally {
      setBusy(false);
      setDeleteFolderModal({ show: false, folder: null, contentsAnalysis: null });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return Math.round(bytes) + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Get file count for a specific folder
  const getFolderFileCount = (folderId) => {
    if (!folderId || !files) return 0;
    try {
      return files.filter(file => 
        file && String(file.folderId) === String(folderId)
      ).length;
    } catch (error) {
      console.warn('Error getting folder file count:', error);
      return 0;
    }
  };
  
  // Get total items count for a folder (files + direct subfolders)
  const getTotalItemsCount = (folderId) => {
    if (!folderId || !files || !folders) return 0;
    try {
      const fileCount = files.filter(file => 
        file && String(file.folderId) === String(folderId)
      ).length;
      const subfolderCount = folders.filter(folder => 
        folder && String(folder.parentId) === String(folderId)
      ).length;
      return fileCount + subfolderCount;
    } catch (error) {
      console.warn('Error getting total items count:', error);
      return 0;
    }
  };
  
  // Get subfolder count for a specific folder
  const getSubfolderCount = (folderId) => {
    if (!folderId || !folders) return 0;
    try {
      return folders.filter(folder => 
        folder && String(folder.parentId) === String(folderId)
      ).length;
    } catch (error) {
      console.warn('Error getting subfolder count:', error);
      return 0;
    }
  };
  
  // Get detailed folder contents analysis
  const getFolderContentsAnalysis = (folderId) => {
    const folderFiles = files.filter(file => String(file.folderId) === String(folderId));
    const subfolders = folders.filter(folder => String(folder.parentId) === String(folderId));
    
    // Calculate total size of files in folder
    const totalSize = folderFiles.reduce((sum, file) => sum + (file.size || 0), 0);
    
    // Get file type breakdown
    const fileTypes = {
      images: folderFiles.filter(f => f.type?.startsWith('image/')).length,
      documents: folderFiles.filter(f => f.type?.includes('pdf') || f.type?.includes('doc') || f.type?.includes('text')).length,
      videos: folderFiles.filter(f => f.type?.startsWith('video/')).length,
      audio: folderFiles.filter(f => f.type?.startsWith('audio/')).length,
      other: folderFiles.filter(f => !f.type || (!f.type.startsWith('image/') && !f.type.startsWith('video/') && !f.type.startsWith('audio/') && !f.type.includes('pdf') && !f.type.includes('doc') && !f.type.includes('text'))).length
    };
    
    return {
      fileCount: folderFiles.length,
      subfolderCount: subfolders.length,
      totalSize,
      fileTypes,
      isEmpty: folderFiles.length === 0 && subfolders.length === 0
    };
  };

  return (
    <ErrorBoundary>
      <div className="filearlo-container d-flex">
      {/* FileArlo Sidebar - Static */}
      <div className="filearlo-sidebar d-flex flex-column"
        style={{ width: '380px', minWidth: '380px' }}
      >
        {/* Sidebar Header */}
        <div className="p-4">
          <div className="d-flex align-items-center gap-3 mb-5">
            <div className="fw-bold h3 mb-0" style={{ color: 'var(--color-text-primary)' }}>
              FileArlo
            </div>
          </div>
          
          {/* Search */}
          <div className="position-relative mb-0">
            <Search size={16} className="position-absolute" style={{ left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="search-input-enhanced w-100"
              placeholder="Search anything.."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Enhanced Navigation */}
        <div className="flex-grow-1 overflow-auto px-4 py-3">
          {/* Dashboard */}
          <div className="mb-4">
            <button 
              className={`sidebar-nav-item btn w-100 text-start d-flex align-items-center gap-4 px-4 py-3 ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                logActivity('VIEW_CHANGE', { from: currentView, to: 'dashboard' });
                setCurrentView('dashboard');
                setCurrentFolderId(null);
              }}
            >
              <Grid size={20} />
              <span className="fw-semibold" style={{ fontSize: '1rem' }}>Dashboard</span>
            </button>
          </div>

          {/* File Categories */}
          <div className="mb-4">
            <button 
              className={`sidebar-nav-item btn w-100 text-start d-flex align-items-center gap-4 px-4 py-3 ${currentView === 'storage' ? 'active' : ''}`}
              onClick={() => {
                logActivity('VIEW_CHANGE', { from: currentView, to: 'storage' });
                setCurrentView('storage');
                setCurrentFolderId(null);
              }}
            >
              <Folder size={20} />
              <span className="fw-semibold" style={{ fontSize: '1rem' }}>My Storage</span>
              <CBadge color="info" className="ms-auto">
                {(() => {
                  const allFolders = [...(rootFolders || []), ...(folders || [])];
                  const uniqueFolders = allFolders.filter((folder, index, array) => {
                    const isUnique = array.findIndex(f => getId(f) === getId(folder)) === index;
                    const isNotTrashed = !isItemInTrash(getId(folder), 'folder');
                    return isUnique && isNotTrashed;
                  });
                  return uniqueFolders.length;
                })()}
              </CBadge>
            </button>
            <button 
              className={`sidebar-nav-item btn w-100 text-start d-flex align-items-center gap-4 px-4 py-3 ${currentView === 'photos' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('photos');
                setCurrentFolderId(null);
              }}
            >
              <Image size={20} />
              <span className="fw-semibold" style={{ fontSize: '1rem' }}>Photos</span>
              <CBadge color="danger" className="ms-auto">
                {files.filter(f => f.type?.startsWith('image/') && !isItemInTrash(f._id || f.id, 'file')).length}
              </CBadge>
            </button>
            <button 
              className={`sidebar-nav-item btn w-100 text-start d-flex align-items-center gap-4 px-4 py-3 ${currentView === 'audio' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('audio');
                setCurrentFolderId(null);
              }}
            >
              <Music size={20} />
              <span className="fw-semibold" style={{ fontSize: '1rem' }}>Audio</span>
              <CBadge color="info" className="ms-auto">
                {files.filter(f => f.type?.startsWith('audio/') && !isItemInTrash(f._id || f.id, 'file')).length}
              </CBadge>
            </button>
            <button 
              className={`sidebar-nav-item btn w-100 text-start d-flex align-items-center gap-4 px-4 py-3 ${currentView === 'documents' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('documents');
                setCurrentFolderId(null);
              }}
            >
              <FileText size={20} />
              <span className="fw-semibold" style={{ fontSize: '1rem' }}>Documents</span>
              <CBadge color="primary" className="ms-auto">
                {files.filter(f => (f.type?.includes('pdf') || f.type?.includes('doc') || f.type?.includes('text') || f.type?.includes('sheet') || f.type?.includes('presentation')) && !isItemInTrash(f._id || f.id, 'file')).length}
              </CBadge>
            </button>
            <button 
              className={`sidebar-nav-item btn w-100 text-start d-flex align-items-center gap-4 px-4 py-3 ${currentView === 'videos' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('videos');
                setCurrentFolderId(null);
              }}
            >
              <Video size={20} />
              <span className="fw-semibold" style={{ fontSize: '1rem' }}>Videos</span>
              <CBadge color="warning" className="ms-auto">
                {files.filter(f => f.type?.startsWith('video/') && !isItemInTrash(f._id || f.id, 'file')).length}
              </CBadge>
            </button>
          </div>

          {/* Additional Navigation */}
          <div className="mb-4">
            <button className="sidebar-nav-item btn w-100 text-start d-flex align-items-center gap-4 px-4 py-3">
              <Clock size={20} />
              <span className="fw-semibold" style={{ fontSize: '1rem' }}>Recent</span>
            </button>
            <button className="sidebar-nav-item btn w-100 text-start d-flex align-items-center gap-4 px-4 py-3">
              <Share2 size={20} />
              <span className="fw-semibold" style={{ fontSize: '1rem' }}>Shared Link</span>
            </button>
            <button 
              className={`sidebar-nav-item btn w-100 text-start d-flex align-items-center gap-4 px-4 py-3 ${currentView === 'favorites' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('favorites');
                setCurrentFolderId(null);
              }}
            >
              <Star size={20} />
              <span className="fw-semibold" style={{ fontSize: '1rem' }}>Favorites</span>
              <CBadge color="primary" className="ms-auto">{favorites.length}</CBadge>
            </button>
            <button 
              className={`sidebar-nav-item btn w-100 text-start d-flex align-items-center gap-4 px-4 py-3 ${currentView === 'trash' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('trash');
                setCurrentFolderId(null);
              }}
            >
              <Trash2 size={20} />
              <span className="fw-semibold" style={{ fontSize: '1rem' }}>Trash</span>
              <CBadge color="danger" className="ms-auto">
                {(() => {
                  const trashItems = JSON.parse(localStorage.getItem('sfm_trash_items') || '[]');
                  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  return trashItems.filter(item => new Date(item.deletedAt) > oneWeekAgo).length;
                })()}
              </CBadge>
            </button>
          </div>
        </div>

        {/* Storage Info & Upgrade - Dynamic */}
        <div className="p-4 border-top">
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold">Storage</span>
              <span className="small text-muted">{Math.round(dashboardStats.storageUsed)}%</span>
            </div>
            <div className="text-muted small mb-2">
              {dashboardStats.storageUsedGB} GB out of {dashboardStats.storageLimitGB} GB used
            </div>
            <div className="storage-progress">
              <div 
                className="storage-progress-bar" 
                style={{ 
                  width: `${dashboardStats.storageUsed}%`,
                  background: dashboardStats.storageUsed > 80 
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                    : dashboardStats.storageUsed > 60 
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)' 
                    : 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            <div className="d-flex justify-content-between mt-2">
              <small className="text-muted">{dashboardStats.totalFiles} files</small>
              <small className="text-muted">{dashboardStats.totalFolders} folders</small>
            </div>
          </div>
          <button className="btn btn-primary w-100 fw-semibold py-2">Upgrade Now</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* FileArlo Header - Static */}
        <div className="filearlo-header d-flex align-items-center justify-content-between" style={{ padding: '1.5rem 2.5rem' }}>
          <div className="d-flex align-items-center gap-4">
            <h1 className="filearlo-title mb-0">
              {currentView === 'favorites' ? 'My Favorites' : 
               currentView === 'dashboard' ? 'My Storage' : 
               currentView === 'profile' ? 'My Profile' :
               currentView === 'storage' ? 'All Folders' :
               currentView === 'photos' ? 'Photos' :
               currentView === 'audio' ? 'Audio Files' :
               currentView === 'documents' ? 'Documents' :
               currentView === 'videos' ? 'Videos' :
               currentView === 'trash' ? 'Trash' :
               currentFolder?.name || 'Folder'}
            </h1>
            {isRefreshing && (
              <div className="d-flex align-items-center gap-2 text-primary">
                <CSpinner size="sm" />
                <small className="fw-medium">Refreshing...</small>
              </div>
            )}
          </div>
          
          <div className="d-flex align-items-center gap-3">
            
            
            {/* Upload Progress Indicator */}
            {isUploading && (
              <div className="d-flex align-items-center gap-3 me-3">
                <div className="d-flex align-items-center gap-2">
                  <CSpinner size="sm" color="primary" />
                  <span className="small text-primary">Uploading...</span>
                </div>
                <div className="progress" style={{ width: '120px', height: '6px' }}>
                  <div 
                    className="progress-bar bg-primary" 
                    role="progressbar" 
                    style={{ width: `${uploadProgress}%`, transition: 'width 0.3s ease' }}
                    aria-valuenow={uploadProgress} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  />
                </div>
              </div>
            )}
            
            {/* Notifications */}
            <div className="position-relative">
              <button className="btn btn-link p-2">
                <Bell size={20} style={{ color: 'var(--color-text-secondary)' }} />
                <div className="notification-badge">{dashboardStats.recentFiles}</div>
              </button>
            </div>
            
            {/* Profile Display with Dropdown on Image Only */}
            <div className="d-flex align-items-center gap-3">
              <div className="text-end">
                <div className="fw-medium" style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                  {user?.email}
                </div>
                <small className="text-muted">Free Account</small>
              </div>
              <CDropdown alignment="end">
                <CDropdownToggle 
                  caret={false}
                  className="p-0 border-0 bg-transparent" 
                  style={{ position: 'relative' }}
                >
                  <div className="position-relative">
                    {user?.profilePhoto ? (
                      <img 
                        src={user.profilePhoto} 
                        alt="Profile" 
                        className="rounded-circle"
                        style={{
                          width: '56px',
                          height: '56px',
                          objectFit: 'cover',
                          border: '3px solid var(--color-border-glass)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '56px',
                          height: '56px',
                          backgroundColor: 'var(--color-primary)', 
                          color: 'white',
                          border: '3px solid var(--color-border-glass)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                      >
                        <User size={24} />
                      </div>
                    )}
                  </div>
                </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={() => {
                  setCurrentView('profile');
                  setCurrentFolderId(null);
                }}>
                  <User size={16} className="me-2" /> View Profile
                </CDropdownItem>
                <CDropdownItem href="#">
                  <Settings size={16} className="me-2" /> Account Settings
                </CDropdownItem>
                <CDropdownItem href="#">
                  <Bell size={16} className="me-2" /> Notifications
                </CDropdownItem>
                <CDropdownItem divider />
                <CDropdownItem onClick={signOut}>
                  <LogOut size={16} className="me-2" /> Sign Out
                </CDropdownItem>
              </CDropdownMenu>
              </CDropdown>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-grow-1" {...getRootProps()} style={{ backgroundColor: 'var(--color-bg-primary)', padding: '2.5rem' }}>
          <input {...getInputProps()} />
          <input type="file" multiple accept="*/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
          
          {isDragActive && (
            <div className="border border-primary border-2 rounded-3 p-4 text-primary text-center mb-4" style={{ backgroundColor: 'rgba(79, 70, 229, 0.05)' }}>
              <Upload size={32} className="mb-2" />
              <div className="fw-semibold">Drop files to upload</div>
            </div>
          )}

          {/* Loading State for Folder Transitions */}
          {isLoadingFolder ? (
            <div className="d-flex align-items-center justify-content-center py-5">
              <CSpinner color="primary" style={{ width: '2rem', height: '2rem' }} />
              <span className="ms-3 fw-semibold text-primary">Loading folder contents...</span>
            </div>
          ) : currentView === 'favorites' ? (
            // Favorites View
            <div className="fade-in">
              {/* Favorites Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="mb-1 fw-bold">My Favorites</h4>
                  <p className="text-muted mb-0">
                    {favorites.length} favorited files
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-outline-primary btn-modern"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <Upload size={16} className="me-1" /> Upload
                  </button>
                </div>
              </div>

              {/* Favorites Content */}
              {favorites.length === 0 ? (
                <div className="text-center py-5">
                  <CCard className="border-0 shadow-sm">
                    <CCardBody className="text-center py-5">
                      <Star size={48} className="text-muted mb-3 opacity-50" />
                      <h6 className="fw-bold mb-2">No favorites yet</h6>
                      <p className="text-muted mb-4">Star files to add them to your favorites for quick access</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          setCurrentView('dashboard');
                          setCurrentFolderId(null);
                        }}
                      >
                        <Home size={16} className="me-1" />
                        Browse Files
                      </button>
                    </CCardBody>
                  </CCard>
                </div>
              ) : (
                <div className="row g-3">
                  {favorites.map((file, index) => (
                    <div key={file._id || file.id || index} className="col-xl-3 col-lg-4 col-md-6">
                      <CCard 
                        className="border file-preview-card h-100 hover-lift hover-glow scale-in stagger-item"
                        role="button"
                        onClick={() => setShowPreview(file)}
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
                                <File className="text-muted" size={24} />
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
                              <span>Favorited on {new Date(file.favoritedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="d-flex align-items-center justify-content-between border-top pt-3">
                            <div className="d-flex gap-2">
                              <button 
                                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowPreview(file);
                                }}
                                title="Preview File"
                              >
                                <Eye size={14} />
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  secureDownload(file);
                                }}
                                title="Download File"
                              >
                                <Download size={14} />
                              </button>
                              <button 
                                className="btn btn-sm btn-warning d-flex align-items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(file);
                                }}
                                title="Remove from Favorites"
                              >
                                <Star size={14} fill="currentColor" />
                              </button>
                            </div>
                            <small className="text-muted">
                              {file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '0 MB'}
                            </small>
                          </div>
                        </CCardBody>
                      </CCard>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentView === 'profile' ? (
            // Profile View
            <div className="fade-in">
              {/* Profile Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="mb-1 fw-bold">My Profile</h4>
                  <p className="text-muted mb-0">
                    Manage your account settings and personal information
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-outline-primary btn-modern"
                    onClick={() => setCurrentView('dashboard')}
                  >
                    <Home size={16} className="me-1" /> Back to Dashboard
                  </button>
                </div>
              </div>

              {/* Profile Content */}
              <CRow className="g-4">
                {/* Profile Information Card */}
                <CCol lg={4}>
                  <CCard className="border-0 shadow-sm h-100">
                    <CCardHeader className="bg-transparent border-0 pb-0">
                      <h6 className="mb-0 fw-bold">Profile Information</h6>
                    </CCardHeader>
                    <CCardBody className="text-center">
                      {/* Profile Photo Section */}
                      <div className="mb-4">
                        <div className="position-relative d-inline-block">
                          {user?.profilePhoto ? (
                            <img 
                              src={user.profilePhoto} 
                              alt="Profile" 
                              className="rounded-circle border shadow-sm"
                              style={{
                                width: '120px',
                                height: '120px',
                                objectFit: 'cover',
                                border: '4px solid var(--color-border-glass)'
                              }}
                            />
                          ) : (
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center border shadow-sm"
                              style={{ 
                                width: '120px',
                                height: '120px',
                                backgroundColor: 'var(--color-primary)', 
                                color: 'white',
                                border: '4px solid var(--color-border-glass)'
                              }}
                            >
                              <User size={40} />
                            </div>
                          )}
                          <button
                            className="btn btn-primary btn-sm rounded-circle position-absolute"
                            style={{
                              bottom: '0',
                              right: '0',
                              width: '32px',
                              height: '32px',
                              padding: '0'
                            }}
                            onClick={() => setShowProfilePhotoModal(true)}
                            title="Change profile photo"
                          >
                            <Camera size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {/* User Details */}
                      <h5 className="mb-1">{user?.name || 'User Name'}</h5>
                      <p className="text-muted mb-3">{user?.email}</p>
                      
                      <div className="d-flex justify-content-center gap-2 mb-3">
                        <CBadge color="success" className="px-3 py-2">
                          <div className="d-flex align-items-center gap-1">
                            <div className="bg-light rounded-circle" style={{width: '8px', height: '8px'}}></div>
                            Online
                          </div>
                        </CBadge>
                        <CBadge color="info" className="px-3 py-2">Free Account</CBadge>
                      </div>
                      
                      <div className="text-center">
                        <button 
                          className="btn btn-outline-primary btn-sm me-2"
                          onClick={() => setShowProfilePhotoModal(true)}
                        >
                          <Edit2 size={14} className="me-1" />
                          Edit Profile
                        </button>
                        <button className="btn btn-success btn-sm">
                          <Star size={14} className="me-1" />
                          Upgrade to Pro
                        </button>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>

                {/* Account Details Card */}
                <CCol lg={8}>
                  <CCard className="border-0 shadow-sm h-100">
                    <CCardHeader className="bg-transparent border-0 pb-0">
                      <h6 className="mb-0 fw-bold">Account Details</h6>
                    </CCardHeader>
                    <CCardBody>
                      <CRow className="g-3">
                        <CCol md={6}>
                          <div className="border rounded-3 p-3">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <User size={16} className="text-primary" />
                              <span className="fw-semibold small text-uppercase text-muted">Full Name</span>
                            </div>
                            <div className="fw-medium">{user?.name || 'Not set'}</div>
                          </div>
                        </CCol>
                        <CCol md={6}>
                          <div className="border rounded-3 p-3">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <Mail size={16} className="text-primary" />
                              <span className="fw-semibold small text-uppercase text-muted">Email Address</span>
                            </div>
                            <div className="fw-medium d-flex align-items-center gap-2">
                              {user?.email}
                              <CBadge color="success" size="sm">Verified</CBadge>
                            </div>
                          </div>
                        </CCol>
                        <CCol md={6}>
                          <div className="border rounded-3 p-3">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <Calendar size={16} className="text-primary" />
                              <span className="fw-semibold small text-uppercase text-muted">Member Since</span>
                            </div>
                            <div className="fw-medium">{new Date().getFullYear() - 1}</div>
                          </div>
                        </CCol>
                        <CCol md={6}>
                          <div className="border rounded-3 p-3">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <Shield size={16} className="text-primary" />
                              <span className="fw-semibold small text-uppercase text-muted">Account Type</span>
                            </div>
                            <div className="fw-medium">Free Account</div>
                          </div>
                        </CCol>
                      </CRow>
                      
                      {/* Storage Usage */}
                      <div className="mt-4 p-3 bg-light rounded-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <CProgress size="sm" style={{width: '16px', height: '16px'}} />
                            <span className="fw-semibold small text-uppercase text-muted">Storage Usage</span>
                          </div>
                          <span className="small fw-medium">{dashboardStats.storageUsedGB} GB / {dashboardStats.storageLimitGB} GB</span>
                        </div>
                        <CProgress className="mb-2" height={8}>
                          <CProgressBar value={dashboardStats.storageUsed} color={dashboardStats.storageUsed > 80 ? 'danger' : dashboardStats.storageUsed > 60 ? 'warning' : 'primary'} />
                        </CProgress>
                        <div className="d-flex justify-content-between small text-muted">
                          <span>{dashboardStats.totalFiles} files • {dashboardStats.totalFolders} folders</span>
                          <span>{Math.round(dashboardStats.storageUsed)}% used</span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-4">
                        <h6 className="fw-bold mb-3">Quick Actions</h6>
                        <div className="row g-2">
                          <div className="col-md-4">
                            <button className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3">
                              <Settings size={16} />
                              <span className="small fw-semibold">Account Settings</span>
                            </button>
                          </div>
                          <div className="col-md-4">
                            <button className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 py-3">
                              <Bell size={16} />
                              <span className="small fw-semibold">Notifications</span>
                            </button>
                          </div>
                          <div className="col-md-4">
                            <button 
                              className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 py-3"
                              onClick={signOut}
                            >
                              <LogOut size={16} />
                              <span className="small fw-semibold">Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            </div>
          ) : currentView === 'storage' ? (
            // All Folders Storage View
            <div className="fade-in">
              {/* Storage Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="mb-1 fw-bold">All Folders</h4>
                  <p className="text-muted mb-0">
                    {(() => {
                      const allFolders = [...(rootFolders || []), ...(folders || [])];
                      const uniqueFolders = allFolders.filter((folder, index, array) => {
                        const isUnique = array.findIndex(f => getId(f) === getId(folder)) === index;
                        const isNotTrashed = !isItemInTrash(getId(folder), 'folder');
                        return isUnique && isNotTrashed;
                      });
                      return `${uniqueFolders.length} folders • Browse all your folders in one place`;
                    })()}
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-outline-primary btn-modern"
                    onClick={() => setShowNewFolderModal(true)}
                    disabled={isCreatingFolder}
                  >
                    {isCreatingFolder ? (
                      <><CSpinner size="sm" className="me-1" /> Creating...</>
                    ) : (
                      <><FolderPlus size={16} className="me-1" /> New Folder</>
                    )}
                  </button>
                </div>
              </div>

              {/* All Folders Grid */}
              {(() => {
                // Combine all folders and remove duplicates and trashed items
                const allFolders = [...(rootFolders || []), ...(folders || [])];
                const uniqueFolders = allFolders.filter((folder, index, array) => {
                  const isUnique = array.findIndex(f => getId(f) === getId(folder)) === index;
                  const isNotTrashed = !isItemInTrash(getId(folder), 'folder');
                  return isUnique && isNotTrashed;
                });
                
                return uniqueFolders.length === 0 ? (
                  <div className="text-center py-5">
                    <CCard className="border-0 shadow-sm">
                      <CCardBody className="text-center py-5">
                        <Folder size={48} className="text-muted mb-3 opacity-50" />
                        <h6 className="fw-bold mb-2">No folders yet</h6>
                        <p className="text-muted mb-4">Create your first folder to organize your files</p>
                        <button 
                          className="btn btn-primary"
                          onClick={() => setShowNewFolderModal(true)}
                        >
                          <FolderPlus size={16} className="me-1" />
                          Create Your First Folder
                        </button>
                      </CCardBody>
                    </CCard>
                  </div>
                ) : (
                  <div className="row g-3">
                    {uniqueFolders.map((folder, index) => (
                      <div key={getId(folder)} className="col-xl-3 col-lg-4 col-md-6">
                        <div 
                          className="folder-card p-3 rounded-3 border hover-lift hover-glow position-relative scale-in stagger-item"
                          style={{animationDelay: `${index * 50}ms`}}
                        >
                          <div 
                            className="d-flex align-items-center gap-3"
                            role="button"
                            onClick={() => handleFolderClick(folder)}
                          >
                            <div 
                              className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: '#e0e7ff',
                                color: '#4f46e5'
                              }}
                            >
                              <Folder size={24} />
                            </div>
                            <div className="flex-grow-1 min-width-0">
                              <div className="fw-semibold text-truncate mb-1">
                                {folder.name}
                                {(() => {
                                  const itemCount = getTotalItemsCount(getId(folder));
                                  return itemCount > 0 ? (
                                    <span className="text-muted fw-normal ms-2">
                                      ({itemCount} item{itemCount !== 1 ? 's' : ''})
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                              <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex flex-column">
                                  {(() => {
                                    const fileCount = getFolderFileCount(getId(folder));
                                    const folderCount = getSubfolderCount(getId(folder));
                                    return (fileCount > 0 || folderCount > 0) ? (
                                      <small className="text-muted">
                                        {fileCount > 0 && `${fileCount} file${fileCount !== 1 ? 's' : ''}`}
                                        {fileCount > 0 && folderCount > 0 && ' • '}
                                        {folderCount > 0 && `${folderCount} folder${folderCount !== 1 ? 's' : ''}`}
                                      </small>
                                    ) : null;
                                  })()}
                                  {(() => {
                                    const size = getFolderSize(getId(folder));
                                    return size > 0 ? (
                                      <small className="text-muted fw-semibold" style={{ color: '#059669', fontSize: '0.8rem' }}>
                                        📦 {formatFileSize(size)}
                                      </small>
                                    ) : null;
                                  })()}
                                </div>
                                {folder.locked && (
                                  <Lock size={12} className="text-warning" />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Folder Quick Actions */}
                          <div className="folder-actions mt-3 d-flex gap-2 justify-content-center opacity-0">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={(e) => { e.stopPropagation(); handleFolderClick(folder); }}
                              title="Open folder"
                            >
                              <Eye size={12} />
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={(e) => { e.stopPropagation(); setEditFolder(folder); }}
                              title="Edit folder"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={(e) => { e.stopPropagation(); handleDeleteFolder(getId(folder)); }}
                              title="Delete folder"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : currentView === 'photos' ? (
            // Photos View
            <div className="fade-in">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="mb-1 fw-bold">Photos</h4>
                  <p className="text-muted mb-0">
                    {files.filter(f => f.type?.startsWith('image/') && !isItemInTrash(f._id || f.id, 'file')).length} images
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-outline-primary btn-modern"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <Upload size={16} className="me-1" /> Upload Photos
                  </button>
                </div>
              </div>
              
              {files.filter(f => f.type?.startsWith('image/') && !isItemInTrash(f._id || f.id, 'file')).length === 0 ? (
                <div className="text-center py-5">
                  <CCard className="border-0 shadow-sm">
                    <CCardBody className="text-center py-5">
                      <Image size={48} className="text-muted mb-3 opacity-50" />
                      <h6 className="fw-bold mb-2">No photos yet</h6>
                      <p className="text-muted mb-4">Upload your first photos to see them here</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      >
                        <Upload size={16} className="me-1" />Upload Photos
                      </button>
                    </CCardBody>
                  </CCard>
                </div>
              ) : (
                <div className="row g-3">
                  {files.filter(f => f.type?.startsWith('image/') && !isItemInTrash(f._id || f.id, 'file')).map((file, index) => (
                    <div key={file._id || file.id} className="col-xl-3 col-lg-4 col-md-6">
                      <CCard className="border file-preview-card h-100 hover-lift hover-glow scale-in stagger-item" role="button" onClick={() => setShowPreview(file)} style={{animationDelay: `${index * 50}ms`}}>
                        <CCardBody className="p-3">
                          <div className="rounded-2 mb-3 d-flex align-items-center justify-content-center position-relative" style={{ height: '180px', backgroundColor: '#f8f9fa' }}>
                            <img src={file.url} alt={file.name} className="img-fluid rounded-2" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} />
                          </div>
                          <div className="mb-3">
                            <div className="fw-semibold text-truncate mb-1" title={file.name}>{file.name}</div>
                            <div className="text-muted small">{file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '0 MB'}</div>
                          </div>
                          <div className="d-flex align-items-center justify-content-between border-top pt-3">
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={(e) => { e.stopPropagation(); setShowPreview(file); }} title="Preview"><Eye size={14} /></button>
                              <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={(e) => { e.stopPropagation(); secureDownload(file); }} title="Download"><Download size={14} /></button>
                              <button className={`btn btn-sm ${isFavorited(file) ? 'btn-warning' : 'btn-outline-warning'} d-flex align-items-center gap-1`} onClick={(e) => { e.stopPropagation(); toggleFavorite(file); }} title={isFavorited(file) ? "Remove from Favorites" : "Add to Favorites"}><Star size={14} fill={isFavorited(file) ? 'currentColor' : 'none'} /></button>
                              <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={(e) => { e.stopPropagation(); handleDeleteFile(file._id || file.id); }} title="Delete"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        </CCardBody>
                      </CCard>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentView === 'audio' ? (
            // Audio View
            <div className="fade-in">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="mb-1 fw-bold">Audio Files</h4>
                  <p className="text-muted mb-0">
                    {files.filter(f => f.type?.startsWith('audio/') && !isItemInTrash(f._id || f.id, 'file')).length} audio files
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-outline-primary btn-modern" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                    <Upload size={16} className="me-1" /> Upload Audio
                  </button>
                </div>
              </div>
              
              {files.filter(f => f.type?.startsWith('audio/') && !isItemInTrash(f._id || f.id, 'file')).length === 0 ? (
                <div className="text-center py-5">
                  <CCard className="border-0 shadow-sm">
                    <CCardBody className="text-center py-5">
                      <Music size={48} className="text-muted mb-3 opacity-50" />
                      <h6 className="fw-bold mb-2">No audio files yet</h6>
                      <p className="text-muted mb-4">Upload your first audio files to see them here</p>
                      <button className="btn btn-primary" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                        <Upload size={16} className="me-1" />Upload Audio
                      </button>
                    </CCardBody>
                  </CCard>
                </div>
              ) : (
                <div className="row g-3">
                  {files.filter(f => f.type?.startsWith('audio/') && !isItemInTrash(f._id || f.id, 'file')).map((file, index) => (
                    <div key={file._id || file.id} className="col-xl-4 col-lg-6 col-md-6">
                      <CCard className="border file-preview-card h-100 hover-lift hover-glow scale-in stagger-item" role="button" onClick={() => setShowPreview(file)} style={{animationDelay: `${index * 50}ms`}}>
                        <CCardBody className="p-3">
                          <div className="rounded-2 mb-3 d-flex align-items-center justify-content-center position-relative" style={{ height: '120px', backgroundColor: '#f8f9fa' }}>
                            <Music size={32} className="text-primary" />
                          </div>
                          <div className="mb-3">
                            <div className="fw-semibold text-truncate mb-1" title={file.name}>{file.name}</div>
                            <div className="text-muted small">{file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '0 MB'}</div>
                          </div>
                          <div className="d-flex align-items-center justify-content-between border-top pt-3">
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={(e) => { e.stopPropagation(); setShowPreview(file); }} title="Preview"><Eye size={14} /></button>
                              <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={(e) => { e.stopPropagation(); secureDownload(file); }} title="Download"><Download size={14} /></button>
                              <button className={`btn btn-sm ${isFavorited(file) ? 'btn-warning' : 'btn-outline-warning'} d-flex align-items-center gap-1`} onClick={(e) => { e.stopPropagation(); toggleFavorite(file); }} title={isFavorited(file) ? "Remove from Favorites" : "Add to Favorites"}><Star size={14} fill={isFavorited(file) ? 'currentColor' : 'none'} /></button>
                              <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={(e) => { e.stopPropagation(); handleDeleteFile(file._id || file.id); }} title="Delete"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        </CCardBody>
                      </CCard>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentView === 'documents' ? (
            // Documents View
            <div className="fade-in">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="mb-1 fw-bold">Documents</h4>
                  <p className="text-muted mb-0">
                    {files.filter(f => (f.type?.includes('pdf') || f.type?.includes('doc') || f.type?.includes('text') || f.type?.includes('sheet') || f.type?.includes('presentation')) && !isItemInTrash(f._id || f.id, 'file')).length} documents
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-outline-primary btn-modern" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                    <Upload size={16} className="me-1" /> Upload Documents
                  </button>
                </div>
              </div>
              
              {files.filter(f => (f.type?.includes('pdf') || f.type?.includes('doc') || f.type?.includes('text') || f.type?.includes('sheet') || f.type?.includes('presentation')) && !isItemInTrash(f._id || f.id, 'file')).length === 0 ? (
                <div className="text-center py-5">
                  <CCard className="border-0 shadow-sm">
                    <CCardBody className="text-center py-5">
                      <FileText size={48} className="text-muted mb-3 opacity-50" />
                      <h6 className="fw-bold mb-2">No documents yet</h6>
                      <p className="text-muted mb-4">Upload your first documents to see them here</p>
                      <button className="btn btn-primary" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                        <Upload size={16} className="me-1" />Upload Documents
                      </button>
                    </CCardBody>
                  </CCard>
                </div>
              ) : (
                <div className="row g-3">
                  {files.filter(f => (f.type?.includes('pdf') || f.type?.includes('doc') || f.type?.includes('text') || f.type?.includes('sheet') || f.type?.includes('presentation')) && !isItemInTrash(f._id || f.id, 'file')).map((file, index) => (
                    <div key={file._id || file.id} className="col-xl-4 col-lg-6 col-md-6">
                      <CCard className="border file-preview-card h-100 hover-lift hover-glow scale-in stagger-item" role="button" onClick={() => setShowPreview(file)} style={{animationDelay: `${index * 50}ms`}}>
                        <CCardBody className="p-3">
                          <div className="rounded-2 mb-3 d-flex align-items-center justify-content-center position-relative" style={{ height: '120px', backgroundColor: '#f8f9fa' }}>
                            <FileText size={32} className="text-success" />
                            <div className="position-absolute bottom-0 end-0 me-2 mb-2">
                              <small className="badge bg-success text-uppercase">{file.name?.split('.').pop() || 'DOC'}</small>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="fw-semibold text-truncate mb-1" title={file.name}>{file.name}</div>
                            <div className="text-muted small">{file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '0 MB'}</div>
                          </div>
                          <div className="d-flex align-items-center justify-content-between border-top pt-3">
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={(e) => { e.stopPropagation(); setShowPreview(file); }} title="Preview"><Eye size={14} /></button>
                              <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={(e) => { e.stopPropagation(); secureDownload(file); }} title="Download"><Download size={14} /></button>
                              <button className={`btn btn-sm ${isFavorited(file) ? 'btn-warning' : 'btn-outline-warning'} d-flex align-items-center gap-1`} onClick={(e) => { e.stopPropagation(); toggleFavorite(file); }} title={isFavorited(file) ? "Remove from Favorites" : "Add to Favorites"}><Star size={14} fill={isFavorited(file) ? 'currentColor' : 'none'} /></button>
                              <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={(e) => { e.stopPropagation(); handleDeleteFile(file._id || file.id); }} title="Delete"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        </CCardBody>
                      </CCard>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentView === 'videos' ? (
            // Videos View
            <div className="fade-in">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="mb-1 fw-bold">Videos</h4>
                  <p className="text-muted mb-0">
                    {files.filter(f => f.type?.startsWith('video/') && !isItemInTrash(f._id || f.id, 'file')).length} videos
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-outline-primary btn-modern" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                    <Upload size={16} className="me-1" /> Upload Videos
                  </button>
                </div>
              </div>
              
              {files.filter(f => f.type?.startsWith('video/') && !isItemInTrash(f._id || f.id, 'file')).length === 0 ? (
                <div className="text-center py-5">
                  <CCard className="border-0 shadow-sm">
                    <CCardBody className="text-center py-5">
                      <Video size={48} className="text-muted mb-3 opacity-50" />
                      <h6 className="fw-bold mb-2">No videos yet</h6>
                      <p className="text-muted mb-4">Upload your first videos to see them here</p>
                      <button className="btn btn-primary" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                        <Upload size={16} className="me-1" />Upload Videos
                      </button>
                    </CCardBody>
                  </CCard>
                </div>
              ) : (
                <div className="row g-3">
                  {files.filter(f => f.type?.startsWith('video/') && !isItemInTrash(f._id || f.id, 'file')).map((file, index) => (
                    <div key={file._id || file.id} className="col-xl-3 col-lg-4 col-md-6">
                      <CCard className="border file-preview-card h-100 hover-lift hover-glow scale-in stagger-item" role="button" onClick={() => setShowPreview(file)} style={{animationDelay: `${index * 50}ms`}}>
                        <CCardBody className="p-3">
                          <div className="rounded-2 mb-3 d-flex align-items-center justify-content-center position-relative" style={{ height: '180px', backgroundColor: '#000' }}>
                            {file.url ? (
                              <video className="w-100 h-100 rounded-2" style={{ objectFit: 'cover' }} poster={file.thumbnail}>
                                <source src={file.url} type={file.type} />
                              </video>
                            ) : (
                              <Video size={32} className="text-white" />
                            )}
                            <div className="position-absolute top-50 start-50 translate-middle">
                              <div className="bg-white bg-opacity-75 rounded-circle p-2">
                                <Video size={20} className="text-dark" />
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="fw-semibold text-truncate mb-1" title={file.name}>{file.name}</div>
                            <div className="text-muted small">{file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '0 MB'}</div>
                          </div>
                          <div className="d-flex align-items-center justify-content-between border-top pt-3">
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={(e) => { e.stopPropagation(); setShowPreview(file); }} title="Preview"><Eye size={14} /></button>
                              <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={(e) => { e.stopPropagation(); secureDownload(file); }} title="Download"><Download size={14} /></button>
                              <button className={`btn btn-sm ${isFavorited(file) ? 'btn-warning' : 'btn-outline-warning'} d-flex align-items-center gap-1`} onClick={(e) => { e.stopPropagation(); toggleFavorite(file); }} title={isFavorited(file) ? "Remove from Favorites" : "Add to Favorites"}><Star size={14} fill={isFavorited(file) ? 'currentColor' : 'none'} /></button>
                              <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={(e) => { e.stopPropagation(); handleDeleteFile(file._id || file.id); }} title="Delete"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        </CCardBody>
                      </CCard>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentView === 'trash' ? (
            // Trash View
            <div className="fade-in">
              {(() => {
                const trashItems = JSON.parse(localStorage.getItem('sfm_trash_items') || '[]');
                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const recentTrashItems = trashItems.filter(item => new Date(item.deletedAt) > oneWeekAgo);
                
                const restoreItem = (item) => {
                  // Remove from trash
                  const updatedTrash = trashItems.filter(t => t._id !== item._id && t.id !== item.id);
                  localStorage.setItem('sfm_trash_items', JSON.stringify(updatedTrash));
                  
                  // Log activity
                  logActivity('TRASH_RESTORE', {
                    itemName: item.name,
                    itemId: item._id || item.id,
                    itemType: item.type,
                    originalLocation: item.originalLocation
                  });
                  
                  // TODO: Implement server-side restore
                  showToast(`"${item.name}" restored successfully`, { type: 'success' });
                  
                  // Force re-render
                  setCurrentView('trash');
                };
                
                const permanentDelete = (item) => {
                  setConfirmDlg({
                    show: true,
                    title: 'Permanent Delete',
                    message: `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`,
                    onConfirm: () => {
                      const updatedTrash = trashItems.filter(t => t._id !== item._id && t.id !== item.id);
                      localStorage.setItem('sfm_trash_items', JSON.stringify(updatedTrash));
                      
                      // Log activity
                      logActivity('TRASH_PERMANENT_DELETE', {
                        itemName: item.name,
                        itemId: item._id || item.id,
                        itemType: item.type,
                        deletedFromTrash: true
                      });
                      
                      showToast(`"${item.name}" permanently deleted`, { type: 'info' });
                      setCurrentView('trash'); // Force re-render
                      setConfirmDlg({ show: false, title: '', message: '', onConfirm: null });
                    }
                  });
                };
                
                const emptyTrash = () => {
                  setConfirmDlg({
                    show: true,
                    title: 'Empty Trash',
                    message: `Are you sure you want to permanently delete all ${recentTrashItems.length} items? This action cannot be undone.`,
                    onConfirm: () => {
                      // Log activity before emptying
                      logActivity('TRASH_EMPTY', {
                        itemCount: recentTrashItems.length,
                        itemNames: recentTrashItems.map(item => item.name)
                      });
                      
                      localStorage.setItem('sfm_trash_items', '[]');
                      showToast('Trash emptied successfully', { type: 'info' });
                      setCurrentView('trash'); // Force re-render
                      setConfirmDlg({ show: false, title: '', message: '', onConfirm: null });
                    }
                  });
                };
                
                return (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <h4 className="mb-1 fw-bold">Trash</h4>
                        <p className="text-muted mb-0">
                          {recentTrashItems.length} items • Items are automatically deleted after 7 days
                        </p>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {recentTrashItems.length > 0 && (
                          <button 
                            className="btn btn-outline-danger btn-modern"
                            onClick={emptyTrash}
                          >
                            <Trash2 size={16} className="me-1" /> Empty Trash
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {recentTrashItems.length === 0 ? (
                      <div className="text-center py-5">
                        <CCard className="border-0 shadow-sm">
                          <CCardBody className="text-center py-5">
                            <Trash2 size={48} className="text-muted mb-3 opacity-50" />
                            <h6 className="fw-bold mb-2">Trash is empty</h6>
                            <p className="text-muted mb-4">Deleted items will appear here and be automatically removed after 7 days</p>
                          </CCardBody>
                        </CCard>
                      </div>
                    ) : (
                      <div className="row g-3">
                        {recentTrashItems.map((item, index) => {
                          const daysLeft = Math.ceil((7 - (Date.now() - new Date(item.deletedAt)) / (1000 * 60 * 60 * 24)));
                          
                          return (
                            <div key={`${item._id || item.id}-${item.deletedAt}`} className="col-xl-4 col-lg-6 col-md-6">
                              <CCard className="border file-preview-card h-100 hover-lift hover-glow scale-in stagger-item" style={{animationDelay: `${index * 50}ms`}}>
                                <CCardBody className="p-3">
                                  <div className="rounded-2 mb-3 d-flex align-items-center justify-content-center position-relative" style={{ height: '120px', backgroundColor: '#f8f9fa' }}>
                                    {item.type === 'folder' ? (
                                      <Folder size={32} className="text-primary" />
                                    ) : item.type?.startsWith('image/') && item.url ? (
                                      <img src={item.url} alt={item.name} className="img-fluid rounded-2" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <File size={32} className="text-muted" />
                                    )}
                                    <div className="position-absolute top-0 end-0 m-2">
                                      <CBadge color={daysLeft <= 1 ? 'danger' : daysLeft <= 3 ? 'warning' : 'info'} className="small">
                                        {daysLeft}d left
                                      </CBadge>
                                    </div>
                                  </div>
                                  
                                  <div className="mb-3">
                                    <div className="fw-semibold text-truncate mb-1" title={item.name}>
                                      {item.name}
                                      {item.type === 'folder' && item.contentsInfo && (
                                        <small className="text-muted ms-2">
                                          ({item.contentsInfo.totalItems} items)
                                        </small>
                                      )}
                                    </div>
                                    <div className="text-muted small">
                                      <div>Deleted: {new Date(item.deletedAt).toLocaleDateString()}</div>
                                      <div>Type: {item.type === 'folder' ? 'Folder' : 'File'}</div>
                                      {item.type !== 'folder' && item.size && (
                                        <div>Size: {(item.size / (1024 * 1024)).toFixed(1)} MB</div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="d-flex align-items-center justify-content-between border-top pt-3">
                                    <div className="d-flex gap-2">
                                      <button 
                                        className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                                        onClick={() => restoreItem(item)}
                                        title="Restore Item"
                                      >
                                        <Upload size={14} /> Restore
                                      </button>
                                      <button 
                                        className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                                        onClick={() => permanentDelete(item)}
                                        title="Delete Permanently"
                                      >
                                        <Trash2 size={14} /> Delete
                                      </button>
                                    </div>
                                    <small className={`fw-semibold ${
                                      daysLeft <= 1 ? 'text-danger' : 
                                      daysLeft <= 3 ? 'text-warning' : 
                                      'text-muted'
                                    }`}>
                                      {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                                    </small>
                                  </div>
                                </CCardBody>
                              </CCard>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : currentView === 'dashboard' ? (
            // FileArlo Dashboard View
            <div className="fade-in">
              {/* Dynamic Dashboard Header */}
              <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
                <div className="slide-in-left">
                  <h4 className="mb-1 fw-bold">My Storage Dashboard</h4>
                  <p className="text-muted mb-0">
                    {dashboardStats.totalFiles || 0} files • {dashboardStats.totalFolders || 0} folders • 
                    Last updated: {dashboardStats.lastUpdated || 'Loading...'}
                  </p>
                </div>
                <div className="d-flex gap-3 slide-in-right">
                  <div className="text-center hover-lift stagger-item">
                    <div className="h5 fw-bold mb-0 text-primary counter-animate">{dashboardStats.totalFiles || 0}</div>
                    <small className="text-muted">Total Files</small>
                  </div>
                  <div className="text-center hover-lift stagger-item">
                    <div className="h5 fw-bold mb-0 text-success counter-animate">{dashboardStats.totalFolders || 0}</div>
                    <small className="text-muted">Folders</small>
                  </div>
                  <div className="text-center hover-lift stagger-item">
                    <div className="h5 fw-bold mb-0 text-info counter-animate">{dashboardStats.recentFiles || 0}</div>
                    <small className="text-muted">Recent (24h)</small>
                  </div>
                </div>
              </div>

              {/* File Type Overview Cards */}
              <FileTypeOverview files={files || []} />

              {/* Folders Section */}
              {Array.isArray(rootFolders) && rootFolders.length > 0 && (
                <div className="mb-4">
                  <CCard className="border-0 shadow-sm">
                    <CCardBody className="p-0">
                      <div className="p-4 border-bottom">
                        <div className="d-flex align-items-center justify-content-between">
                          <h5 className="mb-0 fw-bold">Folders</h5>
                          <div className="d-flex align-items-center gap-2">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => setShowNewFolderModal(true)}
                              disabled={isCreatingFolder}
                            >
                              {isCreatingFolder ? (
                                <><CSpinner size="sm" className="me-1" /> Creating...</>
                              ) : (
                                <><Plus size={14} className="me-1" /> Create new</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="row g-3">
                          {rootFolders.map((folder, index) => (
                            <div key={getId(folder)} className="col-xl-3 col-lg-4 col-md-6">
                              <div className="folder-card p-3 rounded-3 border hover-lift hover-glow position-relative scale-in stagger-item" style={{animationDelay: `${index * 100}ms`}}>
                                <div 
                                  className="d-flex align-items-center gap-3"
                                  role="button"
                                  onClick={() => handleFolderClick(folder)}
                                >
                                  <div 
                                    className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                                    style={{
                                      width: '48px',
                                      height: '48px',
                                      backgroundColor: '#e0e7ff',
                                      color: '#4f46e5'
                                    }}
                                  >
                                    <Folder size={24} />
                                  </div>
                                  <div className="flex-grow-1 min-width-0">
                                    <div className="fw-semibold text-truncate mb-1">
                                      {folder.name}
                                      {(() => {
                                        const itemCount = getTotalItemsCount(getId(folder));
                                        return itemCount > 0 ? (
                                          <span className="text-muted fw-normal ms-2">
                                            ({itemCount} item{itemCount !== 1 ? 's' : ''})
                                          </span>
                                        ) : null;
                                      })()}
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                      <div className="d-flex flex-column">
                                        {(() => {
                                          const fileCount = getFolderFileCount(getId(folder));
                                          const folderCount = getSubfolderCount(getId(folder));
                                          return (fileCount > 0 || folderCount > 0) ? (
                                            <small className="text-muted">
                                              {fileCount > 0 && `${fileCount} file${fileCount !== 1 ? 's' : ''}`}
                                              {fileCount > 0 && folderCount > 0 && ' • '}
                                              {folderCount > 0 && `${folderCount} folder${folderCount !== 1 ? 's' : ''}`}
                                            </small>
                                          ) : null;
                                        })()}
                                        {(() => {
                                          const size = getFolderSize(getId(folder));
                                          return size > 0 ? (
                                            <small className="text-muted fw-semibold" style={{ color: '#059669', fontSize: '0.8rem' }}>
                                              📦 {formatFileSize(size)}
                                            </small>
                                          ) : null;
                                        })()}
                                      </div>
                                      {folder.locked && (
                                        <Lock size={12} className="text-warning" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Folder Quick Actions */}
                                <div className="folder-actions mt-3 d-flex gap-2 justify-content-center opacity-0">
                                  <button 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={(e) => { e.stopPropagation(); handleFolderClick(folder); }}
                                    title="Open folder"
                                  >
                                    <Eye size={12} />
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={(e) => { e.stopPropagation(); setEditFolder(folder); }}
                                    title="Edit folder"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(getId(folder)); }}
                                    title="Delete folder"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                
                              </div>
                            </div>
                          ))}
                          
                          {/* Add New Folder Card */}
                          <div className="col-xl-3 col-lg-4 col-md-6">
                            <div 
                              className="folder-card add-folder p-3 rounded-3 border d-flex align-items-center justify-content-center hover-lift bounce-in float"
                              role="button"
                              onClick={() => setShowNewFolderModal(true)}
                              style={{ minHeight: '80px', animationDelay: `${rootFolders.length * 100 + 200}ms` }}
                            >
                              <div className="text-center">
                                <Plus size={24} className="text-muted mb-2" />
                                <div className="small text-muted fw-medium">Add Folder</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
                </div>
              )}

              {/* No Folders State */}
              {(!Array.isArray(rootFolders) || rootFolders.length === 0) && (
                <div className="mb-4">
                  <CCard className="border-0 shadow-sm">
                    <CCardBody className="text-center py-5">
                      <Folder size={48} className="text-muted mb-3 opacity-50" />
                      <h6 className="fw-bold mb-2">No folders yet</h6>
                      <p className="text-muted mb-4">Create your first folder to organize your files</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => setShowNewFolderModal(true)}
                      >
                        <FolderPlus size={16} className="me-1" />
                        Create Your First Folder
                      </button>
                    </CCardBody>
                  </CCard>
                </div>
              )}

              {/* Main Dashboard Grid */}
              <div className="row g-4">
                {/* Recent Files */}
                <div className="col-xl-8 col-lg-7">
                  <EnhancedRecentFiles 
                    files={files || []}
                    onFileClick={setShowPreview}
                    onViewAll={() => console.log('View all files')}
                    onUpload={() => fileInputRef.current && fileInputRef.current.click()}
                    onFileDelete={handleDeleteFile}
                    onToggleFavorite={toggleFavorite}
                    isFavorited={isFavorited}
                  />
                </div>
                
                {/* Sidebar Content */}
                <div className="col-xl-4 col-lg-5">
                  <div className="row g-4">
                    {/* Storage Overview */}
                    <div className="col-12">
                      <StorageOverviewChart files={files || []} />
                    </div>
                    
                    {/* Largest Files */}
                    <div className="col-12">
                      <LargestFiles files={files || []} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Folder View
            <div className="fade-in">
              {/* Breadcrumb */}
              <nav className="breadcrumb-modern mb-4">
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-link p-0 text-decoration-none" 
                    onClick={() => setCurrentFolderId(null)}
                  >
                    Home
                  </button>
                  {breadcrumbs.map((b, idx) => (
                    <React.Fragment key={getId(b)}>
                      <span className="text-muted">/</span>
                      <button 
                        className={`btn btn-link p-0 text-decoration-none ${
                          idx === breadcrumbs.length - 1 ? 'text-primary fw-semibold' : ''
                        }`}
                        onClick={() => idx === breadcrumbs.length - 1 ? null : setCurrentFolderId(getId(b))}
                        disabled={idx === breadcrumbs.length - 1}
                      >
                        {b.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </nav>

              {/* Action Bar */}
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center gap-3">
                  <h4 className="mb-0 fw-bold">{currentFolder?.name || 'Folder'}</h4>
                  <span className="text-muted small">({filteredFiles.length + filteredFolders.length} items)</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-outline-primary btn-modern"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <Upload size={16} className="me-1" /> Upload
                  </button>
                  <button 
                    className="btn btn-primary btn-modern"
                    onClick={() => setShowNewFolderModal(true)}
                  >
                    <FolderPlus size={16} className="me-1" /> New Folder
                  </button>
                  <CButtonGroup>
                    <button 
                      className={`btn btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid size={16} />
                    </button>
                    <button 
                      className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      <List size={16} />
                    </button>
                  </CButtonGroup>
                </div>
              </div>

              {/* Folders and Files */}
              {Array.isArray(filteredFolders) && filteredFolders.length > 0 && (
                <div className="mb-5">
                  <h6 className="text-uppercase text-muted small mb-3 fw-semibold">Folders</h6>
                  <div className={viewMode === 'grid' ? 'row g-3' : 'list-group'}>
                    {filteredFolders.map(folder => (
                      <div key={getId(folder)} className={viewMode === 'grid' ? 'col-md-4 col-lg-3' : ''}>
                        <ModernFolderCard 
                          folder={folder}
                          onClick={handleFolderClick}
                          onEdit={(f) => setEditFolder(f)}
                          onDelete={(f) => handleDeleteFolder(getId(f))}
                          isLocked={folder.locked}
                          isUnlocked={unlockedFolders.has(getId(folder))}
                          hasMembers={Math.random() > 0.5}
                          fileCount={getFolderFileCount(getId(folder))}
                          folderSize={getFolderSize(getId(folder))}
                          totalItems={getTotalItemsCount(getId(folder))}
                          subfolderCount={getSubfolderCount(getId(folder))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(filteredFiles) && filteredFiles.length > 0 && (
                <div>
                  <h6 className="text-uppercase text-muted small mb-3 fw-semibold">Files</h6>
                  <div className={viewMode === 'grid' ? 'row g-3' : 'list-group'}>
                    {filteredFiles.map(file => (
                      <div key={file._id || file.id} className={viewMode === 'grid' ? 'col-md-4 col-lg-3' : 'list-group-item'}>
                        <CCard className={`file-card ${viewMode === 'grid' ? 'h-100' : ''}`}>
                          <CCardBody className={viewMode === 'grid' ? 'd-flex flex-column p-3' : 'd-flex align-items-center gap-3 p-3'}>
                            <div className="d-flex align-items-center gap-2 flex-grow-1">
                              <File className="text-muted" size={20} />
                              <div className="flex-grow-1 min-width-0">
                                <div className="fw-semibold text-truncate" title={file.name}>{file.name}</div>
                                <div className="small text-muted">{formatFileSize(file.size || 0)}</div>
                              </div>
                            </div>
                            <div className={viewMode === 'grid' ? 'mt-auto d-flex gap-2' : 'd-flex gap-2'}>
                              <button 
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setShowPreview(file)}
                                title="Preview file"
                              >
                                <Eye size={14} />
                              </button>
                              <button 
                                className="btn btn-outline-success btn-sm"
                                onClick={() => secureDownload(file)}
                                title="Download file"
                              >
                                <Download size={14} />
                              </button>
                              <button 
                                className={`btn btn-sm ${
                                  isFavorited(file) 
                                    ? 'btn-warning' 
                                    : 'btn-outline-warning'
                                }`}
                                onClick={() => toggleFavorite(file)}
                                title={isFavorited(file) ? "Remove from Favorites" : "Add to Favorites"}
                              >
                                <Star 
                                  size={14} 
                                  fill={isFavorited(file) ? 'currentColor' : 'none'} 
                                />
                              </button>
                              <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDeleteFile(file._id || file.id)}
                                title="Delete file"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </CCardBody>
                        </CCard>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredFiles.length === 0 && filteredFolders.length === 0 && (
                <div className="text-center py-5 text-muted">
                  <File size={48} className="mb-3 opacity-50" />
                  <div className="h5">This folder is empty</div>
                  <div>Upload files or create folders to get started</div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showPinModal && (
        <PinModal folder={showPinModal} onUnlock={handleUnlock} onClose={() => setShowPinModal(null)} token={token} user={user} />
      )}
      {showPreview && (
        <FilePreviewModal file={showPreview} onClose={() => setShowPreview(null)} />
      )}
      {showNewFolderModal && (
        <NewFolderModal onClose={() => setShowNewFolderModal(false)} onCreate={handleCreateFolder} />
      )}
      {editFolder && (
        <EditFolderModal
          folder={editFolder}
          onClose={() => setEditFolder(null)}
          onSave={({ name, pin }) => {
            (async () => {
              try {
                setBusy(true);
                const body = { name };
                if (pin && pin.length > 0) {
                  body.pinHash = btoa(`hashed_${pin}_salted`);
                } else {
                  body.pinHash = '';
                }
                const updated = await apiFetch(`/folders/${getId(editFolder)}`, { method: 'PATCH', body: JSON.stringify(body) });
                setFolders(prev => prev.map(f => (getId(f) === getId(editFolder) ? updated : f)));
                showToast('Folder updated', { type: 'success' });
              } catch (err) {
                console.error('Update folder failed', err.message);
                showToast('Update folder failed: ' + err.message, { type: 'error' });
              } finally { setBusy(false); }
            })();
          }}
        />
      )}
      
      {/* Profile Photo Modal */}
      {showProfilePhotoModal && (
        <ProfilePhotoModal 
          user={user}
          token={token}
          onClose={() => setShowProfilePhotoModal(false)}
          onPhotoUpdate={(photoUrl) => {
            updateUserProfile({ profilePhoto: photoUrl });
          }}
          showToast={showToast}
        />
      )}

      {/* Floating Action Button */}
      <div className="fab d-grid gap-2">
        <CDropdown alignment="end" direction="dropup">
          <CDropdownToggle color="primary" className="rounded-circle shadow" style={{ width: 56, height: 56, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus />
          </CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem onClick={() => setShowNewFolderModal(true)}>New Folder</CDropdownItem>
            <CDropdownItem onClick={() => fileInputRef.current && fileInputRef.current.click()}>Upload File</CDropdownItem>
          </CDropdownMenu>
        </CDropdown>
      </div>

      {/* Enhanced Delete Folder Modal */}
      <DeleteFolderModal
        show={deleteFolderModal.show}
        folder={deleteFolderModal.folder}
        contentsAnalysis={deleteFolderModal.contentsAnalysis}
        onCancel={() => setDeleteFolderModal({ show: false, folder: null, contentsAnalysis: null })}
        onConfirm={confirmDeleteFolder}
      />
      
      {/* Global confirm modal */}
      <ConfirmModal
        show={confirmDlg.show}
        title={confirmDlg.title}
        message={confirmDlg.message}
        onCancel={() => setConfirmDlg({ show: false, title: '', message: '', onConfirm: null })}
        onConfirm={() => { const cb = confirmDlg.onConfirm; if (cb) cb(); }}
      />
    </div>
    </ErrorBoundary>
  );
}
