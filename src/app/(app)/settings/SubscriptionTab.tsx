'use client';

import { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  Stack, 
  CircularProgress,
  alpha,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { 
  Star as StarIcon, 
  History as HistoryIcon, 
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { getActivePlan, listUserSubscriptions } from '@/lib/subscriptions';
import { getCurrentUser } from '@/lib/appwrite';
import type { Subscription, Users } from '@/types/appwrite';

export function SubscriptionTab() {
  const [user, setUser] = useState<Users | null>(null);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          const plan = await getActivePlan(currentUser.$id);
          setActivePlan(plan);
          const subs = await listUserSubscriptions(currentUser.$id);
          setSubscriptions(subs.documents as Subscription[]);
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#00F5FF' }} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Please log in to view your subscription details.
        </Typography>
      </Box>
    );
  }

  return (
    <Card 
      sx={{ 
        bgcolor: 'rgba(255, 255, 255, 0.03)', 
        backdropFilter: 'blur(25px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        color: 'white'
      }}
    >
      <CardHeader 
        title={
          <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)' }}>
            Subscription
          </Typography>
        }
        subheader={
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            Manage your subscription plan and view your usage.
          </Typography>
        }
        sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', p: 3 }}
      />
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={4}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <StarIcon sx={{ color: '#00F5FF' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Current Plan</Typography>
            </Box>
            {activePlan ? (
              <Box 
                sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(0, 245, 255, 0.05)', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(0, 245, 255, 0.1)' 
                }}
              >
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#00F5FF', textTransform: 'uppercase' }}>
                      {activePlan.plan}
                    </Typography>
                    <Chip 
                      label={activePlan.status} 
                      size="small" 
                      sx={{ 
                        bgcolor: activePlan.status === 'active' ? alpha('#00F5FF', 0.2) : 'rgba(255, 255, 255, 0.1)',
                        color: activePlan.status === 'active' ? '#00F5FF' : 'white',
                        fontWeight: 700
                      }} 
                    />
                  </Box>
                  {activePlan.periodEnd && (
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Renews on: <strong>{new Date(activePlan.periodEnd).toLocaleDateString()}</strong>
                    </Typography>
                  )}
                </Stack>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                No active plan found.
              </Typography>
            )}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PaymentIcon sx={{ color: '#00F5FF' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Manage Subscription</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 3 }}>
              To upgrade or change your plan, please visit our pricing page.
            </Typography>
            <Button 
              variant="contained"
              sx={{
                bgcolor: '#00F5FF',
                color: '#000',
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: alpha('#00F5FF', 0.8) }
              }}
            >
              Go to Pricing
            </Button>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <HistoryIcon sx={{ color: '#00F5FF' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Subscription History</Typography>
            </Box>
            {subscriptions.length > 0 ? (
              <List sx={{ p: 0 }}>
                {subscriptions.map((sub) => (
                  <ListItem 
                    key={sub.$id} 
                    sx={{ 
                      px: 0, 
                      py: 2, 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      '&:last-child': { borderBottom: 'none' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{sub.plan}</Typography>
                          <Chip label={sub.status} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)' }} />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                          {sub.currentPeriodStart && new Date(sub.currentPeriodStart).toLocaleDateString()} 
                          {sub.currentPeriodEnd && ` - ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                No subscription history found.
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
