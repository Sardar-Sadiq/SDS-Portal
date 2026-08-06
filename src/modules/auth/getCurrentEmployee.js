import { useStore } from '@/context/store-context';

/**
 * Reads verified current employee information from store context.
 * Useful for non-hook environments or when context is passed directly.
 * 
 * @param {Object} storeContext - The object returned by useStore()
 * @returns {{ id: string, email: string, role: string, full_name: string, department?: string } | null}
 */
export const getCurrentEmployee = (storeContext) => {
  if (!storeContext || !storeContext.currentUser) {
    return null;
  }

  const { currentUser, activeRole } = storeContext;

  return {
    id: currentUser.id || currentUser.employeeId,
    auth_id: currentUser.auth_id || currentUser.id,
    email: currentUser.email,
    role: (activeRole || currentUser.role || 'employee').toLowerCase(),
    full_name: currentUser.full_name || currentUser.name || '',
    department: currentUser.department || ''
  };
};

/**
 * React hook to get current verified employee from StoreContext.
 * 
 * @returns {{ id: string, email: string, role: string, full_name: string, department?: string } | null}
 */
export const useCurrentEmployee = () => {
  const store = useStore();
  return getCurrentEmployee(store);
};

export default getCurrentEmployee;
