import React from 'react';
import { Container, Typography, Card, CardContent, Box, Chip } from '@mui/material';
import { Person, AccountBalanceWallet } from '@mui/icons-material';
import { useWeb3 } from '../context/Web3Context';

const Profile = () => {
  const { account, chainId, getNetworkName, formatAddress } = useWeb3();

  if (!account) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4">Please connect your wallet</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Person sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
          Profile
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Wallet Information
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AccountBalanceWallet sx={{ mr: 1 }} />
            <Typography>Address: {account}</Typography>
          </Box>
          {chainId && (
            <Chip 
              label={`Network: ${getNetworkName(chainId)}`}
              color="primary"
              variant="outlined"
            />
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile; 