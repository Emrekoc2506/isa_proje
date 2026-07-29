import styles from './MainLayout.module.css';
import { useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

export default function MainLayout({ children }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className={styles.layout}>
      <Header />
      <div className={isHomePage ? styles.homeContent : styles.pageContent}>
        {children}
      </div>
      <Footer />
    </div>
  );
}
