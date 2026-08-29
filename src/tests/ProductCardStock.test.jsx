import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ProductCard from '../components/ProductCard/ProductCard';

vi.mock('../context/CartContext', () => ({
  useCart: () => ({ addToCart: vi.fn() }),
}));

vi.mock('../context/WishlistContext', () => ({
  useWishlist: () => ({ toggleWishlist: vi.fn(), isInWishlist: () => false }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => children,
  motion: {
    article: 'article',
    button: 'button',
    span: 'span',
  },
}));

const product = {
  id: 'product-1',
  name: 'Test product',
  price: '₺10,00',
  image: '/product.jpg',
};

describe('ProductCard stock state', () => {
  test('keeps add-to-cart active when stock is unknown', () => {
    render(<ProductCard product={{ ...product, stockQuantity: null }} />);

    const button = screen.getByRole('button', { name: /sepete ekle/i });
    expect(button).toBeEnabled();
    expect(screen.queryByText('Tükendi')).not.toBeInTheDocument();
  });

  test('shows sold out only when explicit stock is zero', () => {
    render(<ProductCard product={{ ...product, availableStock: 0 }} />);

    expect(screen.getByRole('button', { name: /sepete ekle/i })).toBeEnabled();
    expect(screen.getAllByText('Tükendi')).toHaveLength(2);
  });

  test('keeps add-to-cart active when explicit stock is available', () => {
    render(<ProductCard product={{ ...product, stockQuantity: 50, availableStock: 47 }} />);

    expect(screen.getByRole('button', { name: /sepete ekle/i })).toBeEnabled();
    expect(screen.queryByText('Tükendi')).not.toBeInTheDocument();
  });
});
