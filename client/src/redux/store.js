import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import alertReducer from './slices/alertSlice';
import influencerReducer from './slices/influencerSlice';
import advertiserReducer from './slices/advertiserSlice';
import rentalReducer from './slices/rentalSlice';
import messageReducer from './slices/messageSlice';
import reviewReducer from './slices/reviewSlice';
import paymentReducer from './slices/paymentSlice';
import payoutReducer from './slices/payoutSlice';
import notificationReducer from './slices/notificationSlice';
import subscriptionTierReducer from './slices/subscriptionTierSlice';
import verificationReducer from './slices/verificationSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    alert: alertReducer,
    influencer: influencerReducer,
    advertiser: advertiserReducer,
    rental: rentalReducer,
    message: messageReducer,
    review: reviewReducer,
    payment: paymentReducer,
    payout: payoutReducer,
    notification: notificationReducer,
    subscriptionTier: subscriptionTierReducer,
    verification: verificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
