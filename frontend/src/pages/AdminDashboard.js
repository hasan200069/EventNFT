import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
} from '@mui/material';
import {
  AdminPanelSettings,
  Verified,
  Gavel,
  Warning,
  CheckCircle,
  Cancel,
  Visibility,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useWeb3 } from '../context/Web3Context';

const AdminDashboard = () => {
  const {
    account,
    contracts,
    verifyTicket,
    resolveDispute,
    formatEther,
    formatAddress,
  } = useWeb3();

  const [tabValue, setTabValue] = useState(0);
  const [pendingTickets, setPendingTickets] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (contracts.ticketNFT && contracts.marketplace) {
      loadDashboardData();
    }
  }, [contracts]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPendingTickets(),
        loadDisputes(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingTickets = async () => {
    try {
      // Get all tickets and filter for pending ones
      const totalSupply = await contracts.ticketNFT.totalSupply();
      const pending = [];

      for (let i = 0; i < totalSupply; i++) {
        try {
          const ticketInfo = await contracts.ticketNFT.getTicketInfo(i);
          if (ticketInfo.status === 0) { // PENDING
            const owner = await contracts.ticketNFT.ownerOf(i);
            const tokenURI = await contracts.ticketNFT.tokenURI(i);
            
            pending.push({
              tokenId: i,
              ticketInfo,
              owner,
              tokenURI,
            });
          }
        } catch (error) {
          console.error(`Error loading ticket ${i}:`, error);
        }
      }

      setPendingTickets(pending);
    } catch (error) {
      console.error('Error loading pending tickets:', error);
    }
  };

  const loadDisputes = async () => {
    try {
      const activeEscrows = await contracts.marketplace.getActiveEscrows();
      const disputedTransactions = [];

      for (const tokenId of activeEscrows) {
        try {
          const escrow = await contracts.marketplace.escrowTransactions(tokenId);
          if (escrow.disputed && !escrow.completed) {
            const ticketInfo = await contracts.ticketNFT.getTicketInfo(tokenId);
            
            disputedTransactions.push({
              tokenId: tokenId.toString(),
              escrow,
              ticketInfo,
            });
          }
        } catch (error) {
          console.error(`Error loading dispute ${tokenId}:`, error);
        }
      }

      setDisputes(disputedTransactions);
    } catch (error) {
      console.error('Error loading disputes:', error);
    }
  };

  const handleVerifyTicket = async (tokenId) => {
    try {
      setVerifying(true);
      await verifyTicket(tokenId);
      toast.success('Ticket verified successfully!');
      await loadPendingTickets();
    } catch (error) {
      console.error('Error verifying ticket:', error);
      toast.error('Failed to verify ticket');
    } finally {
      setVerifying(false);
    }
  };

  const handleResolveDispute = async (tokenId, sellerWins) => {
    try {
      setResolving(true);
      await resolveDispute(tokenId, sellerWins);
      toast.success('Dispute resolved successfully!');
      await loadDisputes();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error('Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  const openTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    setDetailsDialog(true);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!account) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please connect your wallet to access the admin dashboard.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <AdminPanelSettings sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
            Admin Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage ticket verification and dispute resolution
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {pendingTickets.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Verification
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <Gavel />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {disputes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Disputes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<Warning />}
            label={`Pending Verification (${pendingTickets.length})`}
            iconPosition="start"
          />
          <Tab
            icon={<Gavel />}
            label={`Disputes (${disputes.length})`}
            iconPosition="start"
          />
        </Tabs>

        <CardContent sx={{ p: 0 }}>
          {/* Pending Tickets Tab */}
          {tabValue === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Token ID</TableCell>
                    <TableCell>Event Name</TableCell>
                    <TableCell>Venue</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Listed Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingTickets.map((ticket) => (
                    <TableRow key={ticket.tokenId}>
                      <TableCell>#{ticket.tokenId}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {ticket.ticketInfo.eventName}
                        </Typography>
                      </TableCell>
                      <TableCell>{ticket.ticketInfo.venue}</TableCell>
                      <TableCell>{ticket.ticketInfo.eventDate}</TableCell>
                      <TableCell>
                        <Chip
                          label={formatAddress(ticket.owner)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(ticket.ticketInfo.listingTimestamp)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => openTicketDetails(ticket)}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleVerifyTicket(ticket.tokenId)}
                            disabled={verifying}
                          >
                            Verify
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pendingTickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No pending tickets for verification
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Disputes Tab */}
          {tabValue === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Token ID</TableCell>
                    <TableCell>Event Name</TableCell>
                    <TableCell>Buyer</TableCell>
                    <TableCell>Seller</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disputes.map((dispute) => (
                    <TableRow key={dispute.tokenId}>
                      <TableCell>#{dispute.tokenId}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {dispute.ticketInfo.eventName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatAddress(dispute.escrow.buyer)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatAddress(dispute.escrow.seller)}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {formatEther(dispute.escrow.price)} ETH
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {dispute.escrow.disputeReason || 'No reason provided'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleResolveDispute(dispute.tokenId, true)}
                            disabled={resolving}
                          >
                            Seller Wins
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleResolveDispute(dispute.tokenId, false)}
                            disabled={resolving}
                          >
                            Buyer Wins
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {disputes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No active disputes
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ticket Details</DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box
                  component="img"
                  src={selectedTicket.tokenURI.includes('ipfs://') 
                    ? `https://ipfs.io/ipfs/${selectedTicket.tokenURI.replace('ipfs://', '')}`
                    : selectedTicket.tokenURI
                  }
                  alt="Ticket"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.300',
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  {selectedTicket.ticketInfo.eventName}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" gutterBottom>
                  <strong>Venue:</strong> {selectedTicket.ticketInfo.venue}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Date:</strong> {selectedTicket.ticketInfo.eventDate}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Seat:</strong> {selectedTicket.ticketInfo.seatInfo}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Original Price:</strong> {formatEther(selectedTicket.ticketInfo.originalPrice)} ETH
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Owner:</strong> {formatAddress(selectedTicket.owner)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Listed:</strong> {formatDate(selectedTicket.ticketInfo.listingTimestamp)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
          {selectedTicket && selectedTicket.ticketInfo.status === 0 && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => {
                handleVerifyTicket(selectedTicket.tokenId);
                setDetailsDialog(false);
              }}
              disabled={verifying}
            >
              Verify Ticket
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard; 