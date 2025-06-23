import React from 'react';
import { Box, Container, Typography, Link, Grid } from '@mui/material';
import { GitHub, Twitter, Telegram } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'primary.main',
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              EventNFT
            </Typography>
            <Typography variant="body2">
              Decentralized event ticket marketplace with NFT technology and escrow protection.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Features
            </Typography>
            <Link href="/marketplace" color="inherit" display="block">
              Marketplace
            </Link>
            <Link href="/list-ticket" color="inherit" display="block">
              List Tickets
            </Link>
            <Link href="/my-tickets" color="inherit" display="block">
              My Tickets
            </Link>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Support
            </Typography>
            <Link href="#" color="inherit" display="block">
              Help Center
            </Link>
            <Link href="#" color="inherit" display="block">
              Contact Us
            </Link>
            <Link href="#" color="inherit" display="block">
              FAQ
            </Link>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Connect
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <GitHub />
              <Twitter />
              <Telegram />
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', mt: 4, pt: 4 }}>
          <Typography variant="body2" align="center">
            © 2024 EventNFT. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 