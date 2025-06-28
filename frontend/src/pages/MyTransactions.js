import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Chip,
  CircularProgress,
  Box
} from '@mui/material';
import { useWeb3 } from '../context/Web3Context';

const MyTransactions = () => {
  const { account, contracts, formatEther, formatAddress } = useWeb3();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contracts.marketplace && contracts.ticketNFT && account) {
      loadMyTransactions();
    }
  }, [contracts, account]);

  const loadMyTransactions = async () => {
    try {
      setLoading(true);
      const tokenIds = await contracts.marketplace.getActiveEscrows();
      const txs = [];

      for (const tokenId of tokenIds) {
        try {
          const escrow = await contracts.marketplace.escrowTransactions(tokenId);
          if (
            escrow.buyer.toLowerCase() === account.toLowerCase() ||
            escrow.seller.toLowerCase() === account.toLowerCase()
          ) {
            const ticketInfo = await contracts.ticketNFT.getTicketInfo(tokenId);

            txs.push({
              tokenId: tokenId.toString(),
              escrow,
              ticketInfo,
            });
          }
        } catch (err) {
          console.warn(`Error loading transaction ${tokenId}:`, err);
        }
      }

      setTransactions(txs);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (escrow) => {
    if (escrow.completed) return <Chip label="Completed" color="success" size="small" />;
    if (escrow.disputed) return <Chip label="Disputed" color="error" size="small" />;
    return <Chip label="In Progress" color="warning" size="small" />;
  };

  if (!account) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="warning">Please connect your wallet to view your transactions.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        My Transactions
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : transactions.length === 0 ? (
        <Alert severity="info">No transactions found for your wallet.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Token ID</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>Buyer</TableCell>
                <TableCell>Seller</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Dispute Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.tokenId}>
                  <TableCell>#{tx.tokenId}</TableCell>
                  <TableCell>{tx.ticketInfo.eventName}</TableCell>
                  <TableCell>
                    <Chip
                      label={formatAddress(tx.escrow.buyer)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatAddress(tx.escrow.seller)}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatEther(tx.escrow.price)} ETH</TableCell>
                  <TableCell>{getStatusChip(tx.escrow)}</TableCell>
                  <TableCell>{tx.escrow.disputeReason || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default MyTransactions;
