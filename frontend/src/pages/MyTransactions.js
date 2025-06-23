import React from 'react';
import { Container, Typography, Alert } from '@mui/material';

const MyTransactions = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        My Transactions
      </Typography>
      
      <Alert severity="info">
        This page will show transaction history and escrow status. Implementation pending.
      </Alert>
    </Container>
  );
};

export default MyTransactions; 