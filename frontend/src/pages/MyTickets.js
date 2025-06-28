import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Box,
  Button,
} from '@mui/material';
import { useWeb3 } from '../context/Web3Context';

const MyTickets = () => {
  const { account, contracts, formatEther, formatAddress } = useWeb3();

  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contracts.ticketNFT && account) {
      loadMyTickets();
    }
  }, [contracts, account]);

  const loadMyTickets = async () => {
    try {
      setLoading(true);
      const totalSupply = await contracts.ticketNFT.totalSupply();
      const owned = [];

      for (let i = 0; i < totalSupply; i++) {
        try {
          const owner = await contracts.ticketNFT.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            const ticketInfo = await contracts.ticketNFT.getTicketInfo(i);
            // console.log("Ticket Info for Token", i, ticketInfo);
            // console.log("Status (raw):", ticketInfo.status);
            // console.log("Status (by index):", ticketInfo[6]);  // Adjust index if needed
            const tokenURI = await contracts.ticketNFT.tokenURI(i);
            owned.push({ tokenId: i, ticketInfo, tokenURI });
          }
        } catch (err) {
          console.warn(`Skipping token ${i}:`, err);
        }
      }

      setMyTickets(owned);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!account) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="warning">Please connect your wallet to view your tickets.</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        My Tickets
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : myTickets.length === 0 ? (
        <Alert severity="info">You don't own any tickets yet.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Token ID</TableCell>
                <TableCell>Event Name</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Seat</TableCell>
                <TableCell>Original Price</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myTickets.map((ticket) => (
                <TableRow key={ticket.tokenId}>
                  <TableCell>#{ticket.tokenId}</TableCell>
                  <TableCell>{ticket.ticketInfo.eventName}</TableCell>
                  <TableCell>{ticket.ticketInfo.venue}</TableCell>
                  <TableCell>{ticket.ticketInfo.eventDate}</TableCell>
                  <TableCell>{ticket.ticketInfo.seatInfo}</TableCell>
                  <TableCell>{formatEther(ticket.ticketInfo.originalPrice)} ETH</TableCell>
                  <TableCell>
                    <Chip
                      label={
                        Number(ticket.ticketInfo.status) === 0
                          ? 'Pending'
                          : Number(ticket.ticketInfo.status) === 1
                          ? 'Verified'
                          : Number(ticket.ticketInfo.status) === 2
                          ? 'Locked'
                          : Number(ticket.ticketInfo.status) === 3
                          ? 'Unlocked'
                          : Number(ticket.ticketInfo.status) === 4
                          ? 'Disputed'
                          : '-'
                      }
                      color={
                        Number(ticket.ticketInfo.status) === 1 ? 'success' :
                        Number(ticket.ticketInfo.status) === 2 ? 'warning' :
                        Number(ticket.ticketInfo.status) === 4 ? 'error' :
                        'default'
                      }
                      size="small"
                    />

                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default MyTickets;
