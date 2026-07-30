import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import './index.css';
import App from './App';

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Unhandled React Error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('sipk_garut_data');
    } catch (e) {
      console.error(e);
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '24px'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
              Terjadi Kesalahan Sistem
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
              Aplikasi mengalami kendala saat merender komponen. Hal ini biasa terjadi jika ada data lokal yang tidak cocok.
            </p>
            
            <div style={{
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '12px',
              color: '#475569',
              fontFamily: 'monospace',
              textAlign: 'left',
              marginBottom: '24px',
              maxHeight: '140px',
              overflowY: 'auto',
              wordBreak: 'break-word'
            }}>
              {this.state.error ? this.state.error.toString() : 'Unknown Error'}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Reset Data & Refresh
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Muat Ulang Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  </StrictMode>
);
