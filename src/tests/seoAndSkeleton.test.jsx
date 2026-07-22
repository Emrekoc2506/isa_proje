import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';

import SEO from '../components/SEO/SEO';
import { Skeleton, ProductCardSkeleton, ProductDetailSkeleton } from '../components/Skeleton/Skeleton';

describe('SEO Component Tests', () => {
  test('should render without crashing and update title tag', async () => {
    const helmetContext = {};
    render(
      <HelmetProvider context={helmetContext}>
        <SEO title="Özel Kolye | mysticvelora" description="Şık gümüş kolye modelleri" />
      </HelmetProvider>
    );

    expect(helmetContext.helmet).toBeDefined();
    expect(helmetContext.helmet.title).toBeDefined();
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
