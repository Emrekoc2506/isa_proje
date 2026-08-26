import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiClock, FiShoppingCart } from "react-icons/fi";
import { getRecentlyViewed } from "../../utils/recentlyViewed";
import { useCart } from "../../context/CartContext";
import { useProducts } from "../../context/ProductContext";
import styles from "./RecentlyViewed.module.css";

export default function RecentlyViewed({ currentProductId }) {
  const [items, setItems] = useState([]);
  const { addToCart } = useCart();
  const { products } = useProducts();

  useEffect(() => {
    const list = getRecentlyViewed();
    // Şu anki ürünü ve canlı ürün listesinde bulunmayan silinmiş ürünleri filtrele
    const filtered = list.filter(item => {
      if (item.id === currentProductId) return false;
      if (Array.isArray(products) && products.length > 0) {
        return products.some(p => p.id === item.id || p.databaseId === item.id || p.slug === item.id);
      }
      return true;
    });
    setItems(filtered);
  }, [currentProductId, products]);

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
                <span className={styles.price}>
                  {typeof prod.price === 'string' && prod.price.includes('₺') ? prod.price : `${prod.price} ₺`}
                </span>
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
