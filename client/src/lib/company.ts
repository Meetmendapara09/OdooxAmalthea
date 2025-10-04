import type { User } from './definitions';

export function getTeamMembers(users: User[], currentUserId?: string | null) {
  return users.filter(user => user.id !== currentUserId);
}
