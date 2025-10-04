import type { UserRole } from './definitions';

export function getDashboardTitle(role?: UserRole | null) {
  switch (role) {
    case 'admin':
      return "Admin's Dashboard";
    case 'manager':
      return "Manager's Dashboard";
    case 'employee':
      return "Employee's Dashboard";
    default:
      return 'Dashboard';
  }
}
