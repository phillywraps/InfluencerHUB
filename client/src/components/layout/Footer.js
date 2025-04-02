import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Grid, Typography, Link, Divider } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      id="footer"
      role="contentinfo"
      aria-label="Footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              InfluencerAPI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connect influencers with advertisers for API key rentals. Our platform makes it easy to
              monetize your social media presence or find the right influencer for your marketing
              campaigns.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Quick Links
            </Typography>
            <nav aria-label="Footer navigation">
              <Link component={RouterLink} to="/" color="inherit" display="block" gutterBottom>
                Home
              </Link>
              <Link component={RouterLink} to="/influencers" color="inherit" display="block" gutterBottom>
                Browse Influencers
              </Link>
              <Link component={RouterLink} to="/login" color="inherit" display="block" gutterBottom>
                Login
              </Link>
              <Link component={RouterLink} to="/register" color="inherit" display="block" gutterBottom>
                Register
              </Link>
            </nav>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Resources
            </Typography>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>
                <Link href="#" color="inherit" display="block" gutterBottom>
                  API Documentation
                </Link>
              </li>
              <li>
                <Link href="#" color="inherit" display="block" gutterBottom>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" color="inherit" display="block" gutterBottom>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" color="inherit" display="block" gutterBottom>
                  Contact Us
                </Link>
              </li>
            </ul>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary" align="center">
          {'Copyright © '}
          <Link color="inherit" component={RouterLink} to="/">
            InfluencerAPI
          </Link>{' '}
          {new Date().getFullYear()}
          {'.'}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
