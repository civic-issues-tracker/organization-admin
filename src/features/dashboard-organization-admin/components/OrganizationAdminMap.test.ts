import { beforeEach, describe, expect, it } from 'vitest';

describe('OrganizationAdminMap performance and helpers', () => {
  let getPinIcon: any;
  let getStatusTone: any;
  let formatStatusLabel: any;
  let iconCache: any;

  beforeEach(async () => {
    const mod = await import('./OrganizationAdminMap');
    getPinIcon = mod.getPinIcon;
    getStatusTone = mod.getStatusTone;
    formatStatusLabel = mod.formatStatusLabel;
    iconCache = mod.iconCache;
    iconCache.clear();
  });

  it('reuses pin icons from cache to prevent garbage collection lag during map re-renders', () => {
    const tone = getStatusTone('in_progress');
    const icon1 = getPinIcon(tone);
    const icon2 = getPinIcon(tone);

    expect(icon1).toBe(icon2);
    expect(iconCache.size).toBe(1);
  });

  it('maps ticket statuses to appropriate status tone colors', () => {
    expect(getStatusTone('resolved')).toBe('#16A34A');
    expect(getStatusTone('in_progress')).toBe('#F59E0B');
    expect(getStatusTone('rejected')).toBe('#DC2626');
    expect(getStatusTone('submitted')).toBe('#2563EB');
  });

  it('formats status labels correctly with fallbacks', () => {
    expect(formatStatusLabel('in_progress')).toBe('In Progress');
    expect(formatStatusLabel('resolved')).toBe('Resolved');
    expect(formatStatusLabel(undefined)).toBe('Submitted');
  });
});
