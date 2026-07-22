import { useState, useEffect } from "react";
import { FiStar, FiCheckCircle, FiEdit3, FiThumbsUp, FiMessageSquare } from "react-icons/fi";
import { getReviewsByProduct, addReview } from "../../services/reviewApi";
import { useAuth } from "../../context/AuthContext";
import styles from "./ProductReviews.module.css";

export default function ProductReviews({ productId }) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState(user?.fullName || "");

  useEffect(() => {
    if (!productId) return;
    loadReviews();
  }, [productId]);

  useEffect(() => {
    if (user?.fullName) {
      setUserName(user.fullName);
    }
  }, [user]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await getReviewsByProduct(productId);
      setReviews(data || []);
    } catch (e) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const newRev = await addReview(productId, {
        rating,
        title: title.trim(),
        comment: comment.trim(),
        userName: userName.trim() || (isAuthenticated ? user?.fullName : "Misafir")
      });

      setReviews(prev => [newRev, ...prev]);
      setShowForm(false);
      setTitle("");
      setComment("");
      setRating(5);
    } catch (err) {
      // Handled in reviewApi
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1)
    : "0.0";

  const getStarPercentage = (starNum) => {
    if (totalReviews === 0) return 0;
    const count = reviews.filter(r => Math.round(r.rating) === starNum).length;
    return Math.round((count / totalReviews) * 100);
  };

  const renderStars = (score) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FiStar
          key={i}
          className={i <= score ? styles.starFilled : styles.starEmpty}
        />
      );
    }
    return stars;
  };

  return (
    <section className={styles.container}>
      <h3 className={styles.heading}>
        <FiMessageSquare className={styles.headerIcon} />
        Müşteri Değerlendirmeleri ({totalReviews})
      </h3>

      {/* Summary Card & Breakdown */}
      <div className={styles.summaryGrid}>
        <div className={styles.overallCard}>
          <span className={styles.averageScore}>{averageRating}</span>
          <div className={styles.starsRow}>{renderStars(Math.round(Number(averageRating)))}</div>
          <span className={styles.reviewCountText}>{totalReviews} değerlendirme baz alındı</span>
        </div>

        <div className={styles.breakdownList}>
          {[5, 4, 3, 2, 1].map((starNum) => {
            const pct = getStarPercentage(starNum);
            return (
              <div key={starNum} className={styles.breakdownRow}>
                <span className={styles.starLabel}>{starNum} Yıldız</span>
                <div className={styles.progressBarBg}>
                  <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.rowCount}>%{pct}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Bar */}
      <div className={styles.actionHeader}>
        <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>Değerlendirmeler</h4>
        {!showForm && (
          <button className={styles.writeBtn} onClick={() => setShowForm(true)}>
            <FiEdit3 /> Yorum Yap
          </button>
        )}
      </div>

      {/* Write Review Form */}
      {showForm && (
        <form className={styles.formContainer} onSubmit={handleFormSubmit}>
          <h4 className={styles.formTitle}>Ürün Değerlendirmesi Ekle</h4>

          <div className={styles.starPicker}>
            <span className={styles.label} style={{ marginBottom: 0 }}>Puanınız:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className={styles.pickerStarBtn}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <FiStar
                  className={(hoverRating || rating) >= star ? styles.starFilled : styles.starEmpty}
                />
              </button>
            ))}
          </div>

          {!isAuthenticated && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Adınız / Soyadınız</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Örn: Ayşe Yılmaz"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Başlık (Opsiyonel)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Örn: Ürün kalitesi harika"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Yorumunuz</label>
            <textarea
              className={styles.textarea}
              placeholder="Ürün hakkındaki deneyimlerinizi paylaşın..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              İptal
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? "Gönderiliyor..." : "Yorumu Gönder"}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <p className={styles.emptyState}>Değerlendirmeler yükleniyor...</p>
      ) : reviews.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Henüz değerlendirme yapılmamış. İlk yorumu siz yapın!</p>
        </div>
      ) : (
        <div className={styles.reviewsList}>
          {reviews.map((rev) => (
            <div key={rev.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>
                    {(rev.userName || "K")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.userNameRow}>
                      <span className={styles.userName}>{rev.userName || "Kullanıcı"}</span>
                      {rev.isVerified && (
                        <span className={styles.verifiedBadge}>
                          <FiCheckCircle size={12} /> Onaylı Alıcı
                        </span>
                      )}
                    </div>
                    <div className={styles.starsRow}>{renderStars(rev.rating)}</div>
                  </div>
                </div>
                <span className={styles.date}>
                  {new Date(rev.createdAt).toLocaleDateString("tr-TR")}
                </span>
              </div>

              {rev.title && <h5 className={styles.reviewTitle}>{rev.title}</h5>}
              <p className={styles.commentBody}>{rev.comment}</p>

              <div className={styles.helpfulRow}>
                <span>Bu yorum yardımcı oldu mu?</span>
                <button
                  type="button"
                  className={styles.helpfulBtn}
                  onClick={(e) => {
                    e.currentTarget.classList.add(styles.helpfulActive);
                  }}
                >
                  <FiThumbsUp /> Evet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
