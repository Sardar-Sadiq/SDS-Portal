import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { EmployeeAvatar } from '@/modules/profile/components/EmployeeAvatar';
import { profileService, SUPPORTED_AVATAR_STYLES } from '@/modules/profile/services/profileService';

describe('EmployeeAvatar Unit Tests', () => {
  it('generates a stable DiceBear v10 URL from style and seed', () => {
    const url = profileService.getDiceBearUrl('notionists', 'user-seed-123');
    expect(url).toBe('https://api.dicebear.com/10.x/notionists/svg?seed=user-seed-123');
  });

  it('renders an img tag with the constructed DiceBear SVG URL when seed is provided', () => {
    render(
      <EmployeeAvatar
        style="bottts"
        seed="emp-999"
        name="Alex Smith"
        size={48}
      />
    );

    const img = screen.getByAltText("Alex Smith's profile avatar");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://api.dicebear.com/10.x/bottts/svg?seed=emp-999');
    expect(img).toHaveAttribute('width', '48');
    expect(img).toHaveAttribute('height', '48');
  });

  it('supports male and female specific avatar seeds correctly', () => {
    const maleUrl = profileService.getDiceBearUrl('adventurer', 'male_alex_992');
    expect(maleUrl).toContain('male_alex_992');

    const femaleUrl = profileService.getDiceBearUrl('lorelei', 'female_sarah_104');
    expect(femaleUrl).toContain('female_sarah_104');
  });

  it('supports standard professional enterprise avatar styles', () => {
    const styleIds = SUPPORTED_AVATAR_STYLES.map(s => s.id);
    expect(styleIds).toContain('lorelei');
    expect(styleIds).toContain('notionists');
    expect(styleIds).toContain('micah');
    expect(styleIds).toContain('bottts');
    expect(styleIds).toContain('shapes');
    expect(styleIds).toContain('identicon');
  });
});
