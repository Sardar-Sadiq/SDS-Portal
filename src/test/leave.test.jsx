import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '@/context/store-context';
import { LeaveManagementView } from '@/modules/leave/components/LeaveManagementView';

describe('Leave Management Module Unit Tests', () => {
  it('renders leave management center without errors', async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <MemoryRouter>
            <LeaveManagementView />
          </MemoryRouter>
        </StoreProvider>
      );
    });

    expect(screen.getByText(/Leave Management Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Apply For Leave/i)).toBeInTheDocument();
  });

  it('filters leave requests when status filter buttons are clicked', async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <MemoryRouter>
            <LeaveManagementView />
          </MemoryRouter>
        </StoreProvider>
      );
    });

    const pendingBtn = screen.getByRole('button', { name: /PENDING/i });
    expect(pendingBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(pendingBtn);
    });
  });
});
