import React from 'react';
import { Container, Typography, Alert } from '@mui/material';

const MyTickets = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        My Tickets
      </Typography>
      
      <Alert severity="info">
        This page will show tickets owned by the connected wallet. Implementation pending.
      </Alert>
    </Container>
  );
};

export default MyTickets; 