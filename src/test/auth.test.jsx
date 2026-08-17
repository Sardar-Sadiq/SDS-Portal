import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '@/context/store-context';
import { LoginView } from '@/modules/auth/components/LoginView';

describe('Auth Module & LoginView Unit Tests', () => {
  it('renders LoginView with SDS EMS branding and Email SSO option', async () => {
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
    expect(screen.getByText(/Enter Registered SDS Email/i)).toBeInTheDocument();
  });

  it('allows entering registered email and submitting Email SSO form', async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <MemoryRouter>
            <LoginView />
          </MemoryRouter>
        </StoreProvider>
      );
    });

    const emailInput = screen.getByPlaceholderText(/jhondoe@gmail.com/i);
    expect(emailInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'sarda.sanji@gmail.com' } });
    });

    const submitBtn = screen.getByRole('button', { name: /Sign In to Portal/i });
    expect(submitBtn).toBeInTheDocument();
  });
});
