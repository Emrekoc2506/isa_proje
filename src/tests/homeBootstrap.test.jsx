import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import HomePage from '../pages/HomePage/HomePage';
import { getHomeBootstrap } from '../services/homeApi';
import { useProducts } from '../context/ProductContext';

vi.mock('../context/ProductContext', () => ({
  normalizeProducts: (data) => data,
  useProducts: vi.fn(),
}));

vi.mock('../services/homeApi', () => ({
  getHomeBootstrap: vi.fn(),
}));

vi.mock('../services/blogApi', () => ({
  getBlogArticles: vi.fn(() => Promise.resolve({ items: [] })),
}));

vi.mock('../components/HeroSlider/HeroSlider', () => ({ default: () => null }));
vi.mock('../components/HeroSlider/VideoBannerItem', () => ({ default: () => null }));
vi.mock('../components/CategoryNav/CategoryNav', () => ({ default: () => null }));
vi.mock('../components/SEO/SEO', () => ({ default: () => null }));
vi.mock('../components/BlogSection/BlogSection', () => ({ default: () => null }));
vi.mock('../components/ProductSection/ProductSection', () => ({
  default: ({ title, products }) => <div data-testid={title}>{products.map((product) => product.id).join(',')}</div>,
}));

describe('home bootstrap loading', () => {
  test('loads all home product sections through one bootstrap request', async () => {
    const hydrateHomeData = vi.fn();
    useProducts.mockReturnValue({ products: [], slides: [], hydrateHomeData });
    const bootstrapResponse = {
      banners: [{ id: 'banner-1' }],
      categories: [{ id: 'category-1' }],
      newProducts: [{ id: 'new-1' }],
      saleProducts: [{ id: 'sale-1' }],
      featuredProducts: [{ id: 'featured-1' }],
    };
    getHomeBootstrap.mockResolvedValue(bootstrapResponse);

    render(<HomePage />);

    await waitFor(() => expect(getHomeBootstrap).toHaveBeenCalledTimes(1));
    expect(getHomeBootstrap).toHaveBeenCalledWith();
    expect(hydrateHomeData).toHaveBeenCalledWith(bootstrapResponse);
    expect(screen.getByTestId('Yeni Gelenler')).toHaveTextContent('new-1');
    expect(screen.getByTestId('İndirimdekiler')).toHaveTextContent('sale-1');
    expect(screen.getByTestId('Öne Çıkan Ürünler')).toHaveTextContent('featured-1');
  });
});
