import React, { useState } from 'react';
import { Container, Typography, Box, Button, Paper, Divider } from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentMethodForm from '../../components/payment/PaymentMethodForm';
import PaymentMethodList from '../../components/payment/PaymentMethodList';

// Initialize Stripe with your publishable key
// In a real app, this would come from an environment variable
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key');

const PaymentMethodsPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddSuccess = () => {
    setShowAddForm(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Payment Methods
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Typography variant="body1" paragraph>
          Manage your payment methods for API key rentals. You can add, edit, or remove payment methods.
        </Typography>
      </Paper>

      {/* Payment Method List */}
      <PaymentMethodList onAddNew={() => setShowAddForm(true)} />

      {/* Add Payment Method Form */}
      {showAddForm && (
        <Elements stripe={stripePromise}>
          <PaymentMethodForm onSuccess={handleAddSuccess} />
        </Elements>
      )}

      {/* Show/Hide Form Button */}
      {!showAddForm ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowAddForm(true)}
          >
            Add New Payment Method
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setShowAddForm(false)}
          >
            Cancel
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default PaymentMethodsPage;
