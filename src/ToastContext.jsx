import React, { createContext, useContext, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const MySwal = useMemo(() => withReactContent(Swal), []);

  // Configure SweetAlert2 toasts
  const Toast = useMemo(() => MySwal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  }), [MySwal]);

  const showToast = useCallback((message, { type = 'info', duration = 4000 } = {}) => {
    const icon = type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info';
    Toast.fire({ icon, title: message, timer: duration });
  }, [Toast]);

  // Keep context API stable
  const removeToast = useCallback(() => {}, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.showToast;
};
