import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '@/context/store-context';
import { EmployeeDetailsView } from '@/modules/employees/components/EmployeeDetailsView';
import { employeeService } from '@/modules/employees/services/employeeService';
import { supabase } from '@/lib/supabaseClient';

describe('Employee Details View & SDS_Employees Data Mapping Unit Tests', () => {
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

  it('correctly maps joining_date and phone from SDS_Employees database table', async () => {
    const mockSdsEmployees = [
      {
        id: '810710_IN',
        employee_id: '810710_IN',
        email: 'rajeshchinthakunta40@gmail.com',
        full_name: 'C Rajesh',
        role: 'employee',
        department: 'IT',
        designation: 'Java Database Engineer',
        phone: '7396520715',
        joining_date: '2026-03-05',
        is_active: true
      },
      {
        id: '556836_IN',
        employee_id: '556836_IN',
        email: 'sardarsadiq001@gmail.com',
        full_name: 'Sardar Sadiq',
        role: 'admin',
        department: 'IT',
        designation: 'Manager / Frontend Developer',
        phone: '8341583323',
        joining_date: '2026-03-02',
        is_active: true
      }
    ];

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => Promise.resolve({ data: mockSdsEmployees, error: null })
    });

    const result = await employeeService.fetchEmployees();

    expect(result).toHaveLength(2);
    
    const rajesh = result.find(e => e.email === 'rajeshchinthakunta40@gmail.com');
    expect(rajesh).toBeDefined();
    expect(rajesh.phone).toBe('7396520715');
    expect(rajesh.joiningDate).toBe('2026-03-05');

    const sadiq = result.find(e => e.email === 'sardarsadiq001@gmail.com');
    expect(sadiq).toBeDefined();
    expect(sadiq.phone).toBe('8341583323');
    expect(sadiq.joiningDate).toBe('2026-03-02');

    vi.restoreAllMocks();
  });
});
