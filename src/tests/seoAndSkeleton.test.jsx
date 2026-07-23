import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';

import SEO from '../components/SEO/SEO';
import { Skeleton, ProductCardSkeleton, ProductDetailSkeleton } from '../components/Skeleton/Skeleton';

describe('SEO Component Tests', () => {
  test('should render without crashing and update document title', async () => {
    render(
      <HelmetProvider>
        <SEO title="Özel Kolye" description="Şık gümüş kolye modelleri" />
      </HelmetProvider>
    );

    expect(document.title).toContain('Özel Kolye');
  });
});

describe('Skeleton Loader Components Tests', () => {
  test('should render generic Skeleton element', () => {
    const { container } = render(<Skeleton style={{ width: '100px', height: '20px' }} />);
    expect(container.firstChild).toHaveStyle({ width: '100px', height: '20px' });
  });

  test('should render ProductCardSkeleton structure', () => {
    const { container } = render(<ProductCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test('should render ProductDetailSkeleton structure', () => {
    const { container } = render(<ProductDetailSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
