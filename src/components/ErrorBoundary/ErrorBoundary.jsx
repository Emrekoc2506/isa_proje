import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import styles from './ErrorBoundary.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.iconCircle}>
              <FiAlertTriangle size={32} />
            </div>

            <h2 className={styles.title}>
              Üzgünüz, Beklenmeyen Bir Hata Oluştu
            </h2>
            <p className={styles.description}>
              Uygulamada geçici bir aksaklık meydana geldi. Sayfayı yenileyerek veya ana sayfaya dönerek devam edebilirsiniz.
            </p>

            <div className={styles.actions}>
              <button
                onClick={this.handleReset}
                className={styles.btnPrimary}
              >
                <FiRefreshCw size={16} /> Sayfayı Yenile
              </button>
              <button
                onClick={this.handleGoHome}
                className={styles.btnSecondary}
              >
                <FiHome size={16} /> Ana Sayfa
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
