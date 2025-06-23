import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  InputAdornment,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  CloudUpload,
  Event,
  LocationOn,
  Chair,
  AttachMoney,
  Description,
  Image,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { useWeb3 } from '../context/Web3Context';

const ListTicket = () => {
  const { account, mintTicket } = useWeb3();

  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: null,
    venue: '',
    seatInfo: '',
    originalPrice: '',
    description: '',
  });
  
  const [ticketImage, setTicketImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [minting, setMinting] = useState(false);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setTicketImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 10485760, // 10MB
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const uploadToIPFS = async (file) => {
    // In a real application, you would use IPFS client
    // For this demo, we'll simulate IPFS upload
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a mock IPFS hash
        const mockHash = `QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG`;
        resolve(mockHash);
      }, 2000);
    });
  };

  const createMetadata = async (imageHash) => {
    const metadata = {
      name: formData.eventName,
      description: formData.description,
      image: `ipfs://${imageHash}`,
      attributes: [
        {
          trait_type: "Event Date",
          value: formData.eventDate.format('YYYY-MM-DD')
        },
        {
          trait_type: "Venue",
          value: formData.venue
        },
        {
          trait_type: "Seat Info",
          value: formData.seatInfo
        },
        {
          trait_type: "Original Price",
          value: `${formData.originalPrice} ETH`
        }
      ]
    };

    // Upload metadata to IPFS
    const metadataHash = await uploadToIPFS(JSON.stringify(metadata));
    return metadataHash;
  };

  const validateForm = () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return false;
    }

    if (!formData.eventName.trim()) {
      toast.error('Event name is required');
      return false;
    }

    if (!formData.eventDate) {
      toast.error('Event date is required');
      return false;
    }

    if (!formData.venue.trim()) {
      toast.error('Venue is required');
      return false;
    }

    if (!formData.seatInfo.trim()) {
      toast.error('Seat information is required');
      return false;
    }

    if (!formData.originalPrice || parseFloat(formData.originalPrice) <= 0) {
      toast.error('Valid price is required');
      return false;
    }

    if (!ticketImage) {
      toast.error('Please upload a ticket image');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setUploading(true);
      
      // Upload image to IPFS
      toast.info('Uploading image to IPFS...');
      const imageHash = await uploadToIPFS(ticketImage);
      
      // Create and upload metadata
      toast.info('Creating metadata...');
      const metadataHash = await createMetadata(imageHash);
      
      setUploading(false);
      setMinting(true);
      
      // Mint the ticket NFT
      toast.info('Minting ticket NFT...');
      
      const ticketData = {
        eventName: formData.eventName,
        eventDate: formData.eventDate.format('YYYY-MM-DD'),
        venue: formData.venue,
        seatInfo: formData.seatInfo,
        originalPrice: formData.originalPrice,
        proofImageHash: imageHash,
        tokenURI: `ipfs://${metadataHash}`
      };

      await mintTicket(ticketData);
      
      toast.success('Ticket listed successfully! Awaiting admin verification.');
      
      // Reset form
      setFormData({
        eventName: '',
        eventDate: null,
        venue: '',
        seatInfo: '',
        originalPrice: '',
        description: '',
      });
      setTicketImage(null);
      setImagePreview(null);
      
    } catch (error) {
      console.error('Error listing ticket:', error);
      toast.error('Failed to list ticket. Please try again.');
    } finally {
      setUploading(false);
      setMinting(false);
    }
  };

  const isProcessing = uploading || minting;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        List Your Ticket
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Create an NFT for your event ticket and list it on the marketplace
      </Typography>

      <Card sx={{ mt: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Event Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Event sx={{ mr: 1 }} />
                    Event Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Event Name"
                    value={formData.eventName}
                    onChange={(e) => handleInputChange('eventName', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Event />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Event Date"
                    value={formData.eventDate}
                    onChange={(newValue) => handleInputChange('eventDate', newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                    minDate={dayjs()}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Venue"
                    value={formData.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Seat Information"
                    value={formData.seatInfo}
                    onChange={(e) => handleInputChange('seatInfo', e.target.value)}
                    placeholder="e.g., Section A, Row 5, Seat 10"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Chair />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Original Price"
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                    required
                    inputProps={{ min: 0, step: 0.001 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney />
                        </InputAdornment>
                      ),
                      endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description (Optional)"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Additional details about the ticket or event..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Description />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Image Upload */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Image sx={{ mr: 1 }} />
                    Ticket Image
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>

                <Grid item xs={12}>
                  <Paper
                    {...getRootProps()}
                    sx={{
                      p: 3,
                      border: '2px dashed',
                      borderColor: isDragActive ? 'primary.main' : 'grey.300',
                      backgroundColor: isDragActive ? 'primary.light' : 'background.paper',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'primary.light',
                      },
                    }}
                  >
                    <input {...getInputProps()} />
                    <Box sx={{ textAlign: 'center' }}>
                      <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        {isDragActive ? 'Drop the image here' : 'Upload Ticket Image'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Drag & drop your ticket image here, or click to select
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Supported formats: JPG, PNG, GIF, WEBP (Max 10MB)
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                {imagePreview && (
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Preview:
                      </Typography>
                      <Box
                        component="img"
                        src={imagePreview}
                        alt="Ticket preview"
                        sx={{
                          maxWidth: 300,
                          maxHeight: 200,
                          width: 'auto',
                          height: 'auto',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.300',
                        }}
                      />
                    </Box>
                  </Grid>
                )}

                {/* Submit Button */}
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Your ticket will be minted as an NFT and submitted for admin verification before appearing on the marketplace.
                  </Alert>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={isProcessing || !account}
                    startIcon={isProcessing && <CircularProgress size={20} />}
                    sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
                  >
                    {!account ? 'Connect Wallet to List Ticket' :
                     uploading ? 'Uploading to IPFS...' :
                     minting ? 'Minting NFT...' :
                     'List Ticket for Verification'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </LocalizationProvider>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ListTicket; 