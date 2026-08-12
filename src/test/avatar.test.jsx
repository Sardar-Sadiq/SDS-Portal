import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { EmployeeAvatar } from '@/modules/profile/components/EmployeeAvatar';
import { profileService, SUPPORTED_AVATAR_STYLES } from '@/modules/profile/services/profileService';

describe('EmployeeAvatar Unit Tests', () => {
  it('generates a stable DiceBear v10 URL with bottts as default style', () => {
    const url = profileService.getDiceBearUrl(undefined, 'user-seed-123');
    expect(url).toBe('https://api.dicebear.com/10.x/bottts/svg?seed=user-seed-123');
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
    const maleUrl = profileService.getDiceBearUrl('bottts', 'male_alex_992');
    expect(maleUrl).toContain('male_alex_992');

    const femaleUrl = profileService.getDiceBearUrl('bottts', 'female_sarah_104');
    expect(femaleUrl).toContain('female_sarah_104');
  });

  it('supports only Tech Robot, Minimalistic Shape, Abstract Geometric, Modern Work, and Security Hash avatar styles', () => {
    const styleIds = SUPPORTED_AVATAR_STYLES.map(s => s.id);
    expect(styleIds).toEqual(['bottts', 'notionists', 'shapes', 'micah', 'identicon']);
    expect(styleIds).not.toContain('lorelei');
    expect(styleIds).not.toContain('adventurer');
    expect(styleIds).not.toContain('avataaars');
    expect(styleIds).not.toContain('personas');
  });
});
