import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { EmployeeAvatar } from '@/modules/profile/components/EmployeeAvatar';

describe('EmployeeAvatar Unit Tests', () => {
  it('renders an img tag with the provided card_image src URL', () => {
    const cardImg = 'https://ucmakihckbofasskirst.supabase.co/storage/v1/object/sign/card_textures/SADIQ.jpg';
    render(
      <EmployeeAvatar
        src={cardImg}
        name="Sardar Sadiq"
        size={48}
      />
    );

    const img = screen.getByAltText("Sardar Sadiq's profile avatar");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', cardImg);
    expect(img).toHaveAttribute('width', '48');
    expect(img).toHaveAttribute('height', '48');
  });

  it('renders fallback avatar URL when no src is provided', () => {
    render(
      <EmployeeAvatar
        name="Jordan Lee"
        size={40}
      />
    );

    const img = screen.getByAltText("Jordan Lee's profile avatar");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('ui-avatars.com');
  });

  it('renders initials when image loading fails', () => {
    render(
      <EmployeeAvatar
        src="invalid-image-url.jpg"
        name="Alex Smith"
        size={40}
      />
    );

    const img = screen.getByAltText("Alex Smith's profile avatar");
    act(() => {
      fireEvent.error(img);
    });

    expect(screen.getByText('AS')).toBeInTheDocument();
  });
});


