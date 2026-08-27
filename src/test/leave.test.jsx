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

  it('renders half day options in ApplyLeaveModal when Half Day is selected', async () => {
    const { ApplyLeaveModal } = await import('@/modules/leave/components/ApplyLeaveModal');
    await act(async () => {
      render(
        <StoreProvider>
          <ApplyLeaveModal isOpen={true} onClose={() => {}} />
        </StoreProvider>
      );
    });

    const halfDayBtn = screen.getByRole('button', { name: /Half Day/i });
    expect(halfDayBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(halfDayBtn);
    });

    expect(screen.getByText(/Select Half-Day Session/i)).toBeInTheDocument();
    expect(screen.getByText(/First Half/i)).toBeInTheDocument();
    expect(screen.getByText(/Second Half/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit Half Day Request \(0.5d\)/i)).toBeInTheDocument();
  });

  it('dynamically calculates remaining leave balances after half-day, full-day, and multi-day leave approval', async () => {
    const { useStore } = await import('@/context/store-context');

    const TestComponent = () => {
      const { calculateEmployeeLeaveBalances, applyLeave, reviewLeave, leaveRequests, setAuthenticatedUser } = useStore();

      React.useEffect(() => {
        setAuthenticatedUser({
          id: 'emp-002',
          employeeId: 'emp-002',
          name: 'Test Employee',
          role: 'ADMIN',
          email: 'test@example.com'
        });
      }, []);

      const balances = calculateEmployeeLeaveBalances('emp-002');

      return (
        <div>
          <span data-testid="casual">{balances.casual}</span>
          <span data-testid="sick">{balances.sick}</span>
          <span data-testid="emergency">{balances.emergency}</span>
          <button
            onClick={() => {
              applyLeave({
                leaveType: 'CASUAL',
                startDate: '2026-09-01',
                endDate: '2026-09-01',
                totalDays: 0.5,
                isHalfDay: true,
                halfDaySlot: 'FIRST_HALF',
                reason: 'Doctor appointment'
              });
            }}
          >
            Apply Half Day Casual
          </button>
          <button
            onClick={() => {
              applyLeave({
                leaveType: 'SICK',
                startDate: '2026-09-02',
                endDate: '2026-09-02',
                totalDays: 1,
                isHalfDay: false,
                reason: 'Fever'
              });
            }}
          >
            Apply 1 Day Sick
          </button>
          <button
            onClick={() => {
              applyLeave({
                leaveType: 'EMERGENCY',
                startDate: '2026-09-10',
                endDate: '2026-09-12',
                totalDays: 3,
                isHalfDay: false,
                reason: 'Family Emergency'
              });
            }}
          >
            Apply 3 Days Emergency
          </button>
          {leaveRequests.map(req => (
            <button
              key={req.id}
              data-testid={`approve-${req.id}`}
              onClick={() => reviewLeave(req.id, 'APPROVED', 'Approved by test')}
            >
              Approve {req.id}
            </button>
          ))}
        </div>
      );
    };

    await act(async () => {
      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      );
    });

    // Initial balances before approval (defaults: Casual 12, Sick 12, Emergency 10)
    expect(screen.getByTestId('casual').textContent).toBe('12');
    expect(screen.getByTestId('sick').textContent).toBe('12');
    expect(screen.getByTestId('emergency').textContent).toBe('10');

    // Apply half-day casual leave (0.5d)
    await act(async () => {
      fireEvent.click(screen.getByText('Apply Half Day Casual'));
    });

    // While PENDING, balance should NOT change
    expect(screen.getByTestId('casual').textContent).toBe('12');

    // Find casual request approval button
    const approveBtns = screen.getAllByRole('button', { name: /Approve leave-/i });
    expect(approveBtns.length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(approveBtns[0]);
    });

    // Casual balance should now be 11.5 (12 - 0.5)
    expect(screen.getByTestId('casual').textContent).toBe('11.5');

    // Apply 1-day sick leave
    await act(async () => {
      fireEvent.click(screen.getByText('Apply 1 Day Sick'));
    });
    const latestBtns = screen.getAllByRole('button', { name: /Approve leave-/i });
    await act(async () => {
      fireEvent.click(latestBtns[0]);
    });

    // Sick balance should now be 11 (12 - 1)
    expect(screen.getByTestId('sick').textContent).toBe('11');

    // Apply 3-days emergency leave
    await act(async () => {
      fireEvent.click(screen.getByText('Apply 3 Days Emergency'));
    });
    const finalBtns = screen.getAllByRole('button', { name: /Approve leave-/i });
    await act(async () => {
      fireEvent.click(finalBtns[0]);
    });

    // Emergency balance should now be 7 (10 - 3)
    expect(screen.getByTestId('emergency').textContent).toBe('7');
  });
});
