export const USER_ROLES = ['admin', 'manager', 'employee'] as const;
export type AllowedRole = (typeof USER_ROLES)[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as AllowedRole,
    avatarUrl: user.avatarUrl,
    companyId: user.companyId ?? null,
    managerId: user.managerId ?? null,
  };
}
