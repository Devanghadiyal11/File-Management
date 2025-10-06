import React from 'react';
import { CAlert, CButton, CCard, CCardBody } from '@coreui/react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;
      
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
          <CCard className="shadow-sm" style={{ maxWidth: '500px', width: '100%' }}>
            <CCardBody className="text-center p-4">
              <div className="mb-4">
                <AlertTriangle size={64} className="text-warning mb-3" />
                <h3 className="text-danger mb-2">Oops! Something went wrong</h3>
                <p className="text-muted">
                  We encountered an unexpected error. This usually happens when there's a problem 
                  loading data or rendering the interface.
                </p>
              </div>

              {isDevelopment && this.state.error && (
                <CAlert color="danger" className="text-start mb-4">
                  <h6>Error Details (Development Mode):</h6>
                  <pre style={{ fontSize: '0.8rem', overflow: 'auto', maxHeight: '200px' }}>
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </CAlert>
              )}

              <div className="d-flex gap-2 justify-content-center">
                <CButton 
                  color="primary" 
                  onClick={this.handleReset}
                  className="d-flex align-items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Try Again
                </CButton>
                <CButton 
                  color="outline-secondary" 
                  onClick={() => window.location.reload()}
                  className="d-flex align-items-center gap-2"
                >
                  <Home size={16} />
                  Reload Page
                </CButton>
              </div>

              <div className="mt-4">
                <small className="text-muted">
                  If this problem persists, try refreshing the page or clearing your browser cache.
                </small>
              </div>
            </CCardBody>
          </CCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;