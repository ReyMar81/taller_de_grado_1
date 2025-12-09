/**
 * Componente Header reutilizable - Diseño DUBSS 2025
 */
import { Box, Typography, IconButton, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export default function PageHeader({ 
  title, 
  subtitle, 
  showBackButton = true, 
  backUrl = '/dashboard'
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
      {showBackButton && (
        <IconButton 
          onClick={() => router.push(backUrl)}
          sx={{ 
            bgcolor: 'white', 
            '&:hover': { bgcolor: '#F5F5F5' },
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <ArrowBack />
        </IconButton>
      )}
      <Box>
        <Typography variant="h4" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
