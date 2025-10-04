import { Badge } from '@/components/ui/badge';
import type { ExpenseStatus } from '@/lib/definitions';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ExpenseStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn({
        'text-yellow-600 border-yellow-600/50 bg-yellow-500/10': status === 'pending',
        'text-green-600 border-green-600/50 bg-green-500/10': status === 'approved',
        'text-red-600 border-red-600/50 bg-red-500/10': status === 'rejected',
      })}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
