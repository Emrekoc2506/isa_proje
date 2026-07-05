import styles from './MainLayout.module.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

export default function MainLayout({ children }) {
  return (
    <div className={styles.layout}>
      <Header />
      {children}
      <Footer />
    </div>
  );
}
