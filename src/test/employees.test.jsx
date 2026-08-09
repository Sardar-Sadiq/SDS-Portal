import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '@/context/store-context';
import { EmployeeDetailsView } from '@/modules/employees/components/EmployeeDetailsView';

describe('Employee Details View Unit Tests', () => {
  it('renders employee details safely without throwing TypeError when officeLocation is undefined', async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <MemoryRouter>
            <EmployeeDetailsView employeeId="emp-001" onBack={() => {}} />
          </MemoryRouter>
        </StoreProvider>
      );
    });

    expect(screen.getByText(/Leave Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Attendance Log/i)).toBeInTheDocument();
  });
});
