import { UserProfile, Role } from '../types';

export const useRoleAccess = (currentUser: UserProfile | null, allowedRoles: Role[]): boolean => {
  if (!currentUser) return false;
  // Owner always has full access
  if (currentUser.role === 'owner') return true;
  return allowedRoles.includes(currentUser.role);
};
