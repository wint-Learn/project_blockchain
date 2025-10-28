import { Chip } from '@mui/material';

interface StatusChipProps {
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'active' | 'inactive' | 'blacklisted';
  label?: string;
}

const statusConfig = {
  pending: { color: 'warning' as const, label: 'Chờ duyệt' },
  approved: { color: 'success' as const, label: 'Đã duyệt' },
  rejected: { color: 'error' as const, label: 'Đã từ chối' },
  completed: { color: 'success' as const, label: 'Hoàn tất' },
  active: { color: 'success' as const, label: 'Hoạt động' },
  inactive: { color: 'default' as const, label: 'Không hoạt động' },
  blacklisted: { color: 'error' as const, label: 'Đã khóa' },
};

const StatusChip = ({ status, label }: StatusChipProps) => {
  const config = statusConfig[status];
  
  return (
    <Chip
      label={label || config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
};

export default StatusChip;
