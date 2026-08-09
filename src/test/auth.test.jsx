import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '@/context/store-context';
import { LoginView } from '@/modules/auth/components/LoginView';

describe('Auth Module & LoginView Unit Tests', () => {
  it('renders LoginView with SDS EMS branding and Single Sign-On options', async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <MemoryRouter>
            <LoginView />
          </MemoryRouter>
        </StoreProvider>
      );
    });

    expect(screen.getByText(/SDS EMS/i)).toBeInTheDocument();
    expect(screen.getByText(/Spirit Data Solutions Employee Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/Internal Single Sign-On \(SSO\)/i)).toBeInTheDocument();
  });

  it('switches between Email SSO and Google OAuth login tabs', async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <MemoryRouter>
            <LoginView />
          </MemoryRouter>
        </StoreProvider>
      );
    });

    const googleTab = screen.getByRole('button', { name: /Google OAuth/i });
    await act(async () => {
      fireEvent.click(googleTab);
    });

    expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();

    const emailTab = screen.getByRole('button', { name: /Email SSO/i });
    await act(async () => {
      fireEvent.click(emailTab);
    });

    expect(screen.getByText(/Enter Registered SDS Email/i)).toBeInTheDocument();
  });
});
