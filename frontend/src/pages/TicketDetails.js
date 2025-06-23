import React from 'react';
import { Container, Typography, Alert } from '@mui/material';
import { useParams } from 'react-router-dom';

const TicketDetails = () => {
  const { tokenId } = useParams();

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Ticket Details
      </Typography>
      
      <Alert severity="info">
        Detailed view for ticket #{tokenId}. Implementation pending.
      </Alert>
    </Container>
  );
};

export default TicketDetails; 