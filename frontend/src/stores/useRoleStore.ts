import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role } from '@/lib/types';

interface RoleState {
  role: Role;
  setRole: (role: Role) => void;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      role: 'rider',
      setRole: (role) => set({ role }),
    }),
    {
      name: 'lastmile-role',
    }
  )
);
