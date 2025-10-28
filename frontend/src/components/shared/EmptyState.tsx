import { Alert, Box, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';

interface EmptyStateProps {
  message: string;
  type?: 'info' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState = ({ message, type = 'info', action }: EmptyStateProps) => {
  return (
    <Box sx={{ py: 4 }}>
      <Alert severity={type} sx={{ mb: action ? 2 : 0 }}>
        {message}
      </Alert>
      {action && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default EmptyState;
