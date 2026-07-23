import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiClock, FiShoppingCart } from "react-icons/fi";
import { getRecentlyViewed } from "../../utils/recentlyViewed";
import { useCart } from "../../context/CartContext";
import styles from "./RecentlyViewed.module.css";

export default function RecentlyViewed({ currentProductId }) {
  const [items, setItems] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    const list = getRecentlyViewed();
    // Exclude currently viewed product from list
    const filtered = list.filter(item => item.id !== currentProductId);
    setItems(filtered);
  }, [currentProductId]);

  if (items.length === 0) return null;

  return (
    <section className={styles.container}>
      <h3 className={styles.heading}>
        <FiClock className={styles.icon} />
        Son İnceledikleriniz
      </h3>

      <div className={styles.grid}>
        {items.map((prod) => (
          <Link key={prod.id} to={`/urun/${prod.id}`} className={styles.card}>
            <div className={styles.imageWrapper}>
              <img
                src={prod.imageUrl || "/ornek resim.jpg"}
                alt={prod.name}
                className={styles.image}
                loading="lazy"
                onError={(e) => {
                  e.target.src = "/ornek resim.jpg";
                }}
              />
            </div>
            <div className={styles.content}>
              <h4 className={styles.title}>{prod.name}</h4>
              <div className={styles.priceRow}>
                <span className={styles.price}>{prod.price} ₺</span>
                <button
                  type="button"
                  className={styles.quickAddBtn}
                  title="Sepete Ekle"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addToCart(prod, 1);
                  }}
                >
                  <FiShoppingCart size={15} />
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
