import styles from './Skeleton.module.css';

export function Skeleton({ className = '', style = {}, light = false }) {
  return (
    <div
      className={`${light ? styles.lightSkeleton : styles.skeleton} ${className}`}
      style={style}
    />
  );
}

export function ProductCardSkeleton({ light = false }) {
  return (
    <div className={styles.cardSkeleton}>
      <Skeleton className={styles.cardImage} light={light} />
      <div className={styles.cardBody}>
        <Skeleton className={styles.titleLine} light={light} />
        <Skeleton className={styles.subLine} light={light} />
        <Skeleton className={styles.priceLine} light={light} />
        <Skeleton className={styles.buttonLine} light={light} />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton({ light = false }) {
  return (
    <div className={styles.detailGrid}>
      <Skeleton className={styles.detailGallery} light={light} />
      <div className={styles.detailInfo}>
        <Skeleton style={{ height: '36px', width: '75%' }} light={light} />
        <Skeleton style={{ height: '20px', width: '40%' }} light={light} />
        <Skeleton style={{ height: '30px', width: '30%' }} light={light} />
        <Skeleton style={{ height: '80px', width: '100%' }} light={light} />
        <Skeleton style={{ height: '50px', width: '100%', borderRadius: '12px' }} light={light} />
      </div>
    </div>
  );
}
