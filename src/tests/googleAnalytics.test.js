import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { trackGoogleEvent, trackPageView, GA_MEASUREMENT_ID } from '../utils/googleAnalytics';

describe('Google Analytics Utility Tests', () => {
  const originalGtag = window.gtag;
  const originalDataLayer = window.dataLayer;

  beforeEach(() => {
    window.dataLayer = [];
    window.gtag = vi.fn();
  });

  afterEach(() => {
    window.gtag = originalGtag;
    window.dataLayer = originalDataLayer;
    vi.restoreAllMocks();
  });

  it('has correct GA_MEASUREMENT_ID', () => {
    expect(GA_MEASUREMENT_ID).toBe('G-VH9GF926SN');
  });

  it('calls window.gtag when available', () => {
    trackGoogleEvent('add_to_cart', { item_id: 'p-1', price: 250 });

    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(window.gtag).toHaveBeenCalledWith('event', 'add_to_cart', { item_id: 'p-1', price: 250 });
  });

  it('falls back to dataLayer when window.gtag is not a function', () => {
    delete window.gtag;

    trackGoogleEvent('purchase', { transaction_id: 't-123', value: 500 });

    expect(window.dataLayer.length).toBe(1);
    expect(window.dataLayer[0]).toEqual({
      event: 'purchase',
      transaction_id: 't-123',
      value: 500,
    });
  });

  it('tracks page views correctly', () => {
    trackPageView('/hakkimizda', 'Hakkımızda | Muhristan');

    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/hakkimizda',
      page_title: 'Hakkımızda | Muhristan',
      send_to: 'G-VH9GF926SN',
    });
  });

  it('does not throw if window or gtag throws an error', () => {
    window.gtag = () => {
      throw new Error('Blocked by adblocker');
    };

    expect(() => {
      trackGoogleEvent('click', {});
    }).not.toThrow();
  });
});
