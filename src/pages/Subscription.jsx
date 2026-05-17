import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { Check, Crown, Star, Zap, X, CreditCard, QrCode, Receipt, Download, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';

const Subscription = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  
  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Card payment states
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  
  // QR payment states
  const [qrCode, setQrCode] = useState(null);
  const [qrPaymentId, setQrPaymentId] = useState(null);
  const [qrPolling, setQrPolling] = useState(false);
  
  // Receipt states
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [showReceiptsModal, setShowReceiptsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, statusRes] = await Promise.all([
        axiosInstance.get('/subscription/plans'),
        axiosInstance.get('/subscription/status'),
      ]);
      setPlans(plansRes.data.plans);
      setCurrentSubscription(statusRes.data);
    } catch (error) {
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan) => {
    if (plan.price === 0) {
      // Free plan - direct subscription
      handleFreeSubscription(plan.id);
    } else {
      // Paid plan - show payment modal
      setSelectedPlan(plan);
      setShowPaymentModal(true);
    }
  };

  const handleFreeSubscription = async (planId) => {
    setSubscribing(planId);
    
    try {
      await axiosInstance.post('/subscription/subscribe', {
        planId,
        paymentMethod: 'free'
      });
      
      toast.success('Successfully switched to Free plan!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Subscription failed');
    } finally {
      setSubscribing(null);
    }
  };

  const handleCardPayment = async () => {
    setPaymentLoading(true);
    
    try {
      const response = await axiosInstance.post('/subscription/payment/card', {
        planId: selectedPlan.id,
        duration: selectedDuration,
        cardDetails
      });

      if (response.data.success) {
        toast.success('Payment successful!');
        setReceiptData(response.data.receipt);
        setShowPaymentModal(false);
        setShowReceiptModal(true);
        fetchData();
        resetPaymentForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleQRGeneration = async () => {
    setPaymentLoading(true);
    
    try {
      const response = await axiosInstance.post('/subscription/payment/qr-generate', {
        planId: selectedPlan.id,
        duration: selectedDuration
      });

      if (response.data.success) {
        setQrCode(response.data.qrCode);
        setQrPaymentId(response.data.paymentId);
        startQRPolling(response.data.paymentId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate QR code');
    } finally {
      setPaymentLoading(false);
    }
  };

  const startQRPolling = (paymentId) => {
    setQrPolling(true);
    const pollInterval = setInterval(async () => {
      try {
        const response = await axiosInstance.post('/subscription/payment/qr-confirm', {
          paymentId
        });

        if (response.data.success) {
          clearInterval(pollInterval);
          setQrPolling(false);
          toast.success('QR payment confirmed!');
          setReceiptData(response.data.receipt);
          setShowPaymentModal(false);
          setShowReceiptModal(true);
          fetchData();
          resetPaymentForm();
        }
      } catch (error) {
        // Continue polling unless it's a permanent error
        if (error.response?.status === 404) {
          clearInterval(pollInterval);
          setQrPolling(false);
          toast.error('Payment session expired');
        }
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 15 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setQrPolling(false);
      toast.warning('QR code expired. Please try again.');
    }, 15 * 60 * 1000);
  };

  const resetPaymentForm = () => {
    setCardDetails({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardholderName: ''
    });
    setQrCode(null);
    setQrPaymentId(null);
    setSelectedPlan(null);
    setPaymentMethod('card');
  };

  const fetchReceipts = async () => {
    try {
      const response = await axiosInstance.get('/subscription/receipts');
      if (response.data.success) {
        setReceipts(response.data.receipts);
      }
    } catch (error) {
      toast.error('Failed to load receipts');
    }
  };

  const handleViewReceipt = async (receiptToken) => {
    try {
      const response = await axiosInstance.get(`/subscription/receipt/${receiptToken}`);
      if (response.data.success) {
        setReceiptData(response.data.receipt);
        setShowReceiptModal(true);
      }
    } catch (error) {
      toast.error('Failed to load receipt');
    }
  };

  const handleDownloadReceipt = async (receiptToken, receiptNumber) => {
    try {
      const response = await axiosInstance.get(`/subscription/receipt/${receiptToken}/download`);
      
      // Create and download file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receiptNumber}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      toast.error('Failed to download receipt');
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      await axiosInstance.delete('/subscription/cancel');
      toast.success('Subscription cancelled');
      fetchData();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'free': return <Star className="w-8 h-8" />;
      case 'premium': return <Crown className="w-8 h-8" />;
      case 'pro': return <Zap className="w-8 h-8" />;
      default: return <Star className="w-8 h-8" />;
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'free': return 'from-gray-500 to-gray-600';
      case 'premium': return 'from-blue-500 to-purple-600';
      case 'pro': return 'from-purple-600 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Unlock the full potential of Digital Health Care System with our premium features
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && currentSubscription.plan !== 'free' && (
        <div className="card bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Current Plan: {currentSubscription.plan.charAt(0).toUpperCase() + currentSubscription.plan.slice(1)}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {currentSubscription.isActive ? 'Active' : 'Expired'} • 
                Expires: {new Date(currentSubscription.expiryDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  fetchReceipts();
                  setShowReceiptsModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                <Receipt className="w-4 h-4" />
                View Receipts
              </button>
              <button
                onClick={handleCancelSubscription}
                className="text-red-600 hover:text-red-700 text-sm px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {currentSubscription && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <h4 className="text-sm text-gray-600 dark:text-gray-400">Health Records</h4>
            <p className="text-2xl font-bold text-primary-600">
              {currentSubscription.currentUsage?.healthRecords || 0}
            </p>
            <p className="text-xs text-gray-500">
              {currentSubscription.remaining?.healthRecords === 'unlimited' 
                ? 'Unlimited' 
                : `${currentSubscription.remaining?.healthRecords} remaining`}
            </p>
          </div>
          <div className="card text-center">
            <h4 className="text-sm text-gray-600 dark:text-gray-400">Fitness Entries</h4>
            <p className="text-2xl font-bold text-primary-600">
              {currentSubscription.currentUsage?.fitnessEntries || 0}
            </p>
            <p className="text-xs text-gray-500">This month</p>
          </div>
          <div className="card text-center">
            <h4 className="text-sm text-gray-600 dark:text-gray-400">Diet Plans</h4>
            <p className="text-2xl font-bold text-primary-600">
              {currentSubscription.currentUsage?.dietPlans || 0}
            </p>
            <p className="text-xs text-gray-500">This month</p>
          </div>
          <div className="card text-center">
            <h4 className="text-sm text-gray-600 dark:text-gray-400">AI Messages</h4>
            <p className="text-2xl font-bold text-primary-600">
              {currentSubscription.currentUsage?.aiMessages || 0}
            </p>
            <p className="text-xs text-gray-500">
              {currentSubscription.remaining?.aiMessages === 'unlimited' 
                ? 'Unlimited' 
                : `${currentSubscription.remaining?.aiMessages} remaining`}
            </p>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative card hover:shadow-xl transition-all duration-300 ${
              plan.id === 'premium' ? 'ring-2 ring-primary-500 scale-105' : ''
            }`}
          >
            {plan.id === 'premium' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-r ${getPlanColor(plan.id)} text-white mb-4`}>
                {getPlanIcon(plan.id)}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  ${plan.price}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {plan.price > 0 ? '/month' : ''}
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">
                  {plan.features.healthRecords === 'unlimited' 
                    ? 'Unlimited health records' 
                    : `${plan.features.healthRecords} health records`}
                </span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">
                  {plan.features.fitnessEntries === 'unlimited' 
                    ? 'Unlimited fitness tracking' 
                    : `${plan.features.fitnessEntries} fitness entries/month`}
                </span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">
                  {plan.features.aiMessages === 'unlimited' 
                    ? 'Unlimited AI coaching' 
                    : plan.features.aiMessages > 0
                    ? `${plan.features.aiMessages} AI messages/month`
                    : 'No AI coaching'}
                </span>
              </div>
              <div className="flex items-center">
                {plan.features.communityAccess === 'full' ? (
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                ) : (
                  <X className="w-5 h-5 text-gray-400 mr-3" />
                )}
                <span className="text-gray-700 dark:text-gray-300">
                  {plan.features.communityAccess === 'full' 
                    ? 'Full community access' 
                    : 'Read-only community'}
                </span>
              </div>
              <div className="flex items-center">
                {plan.features.advancedAnalytics ? (
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                ) : (
                  <X className="w-5 h-5 text-gray-400 mr-3" />
                )}
                <span className="text-gray-700 dark:text-gray-300">
                  Advanced analytics
                </span>
              </div>
              {plan.features.dataExport && (
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Data export
                  </span>
                </div>
              )}
              {plan.features.prioritySupport && (
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Priority support
                  </span>
                </div>
              )}
            </div>

            {/* Pricing Options */}
            {plan.price > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Choose Duration:
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 border rounded-lg">
                    <span className="text-sm">Monthly</span>
                    <span className="font-medium">${plan.pricing?.monthly || plan.price}/mo</span>
                  </div>
                  {plan.pricing?.quarterly && (
                    <div className="flex justify-between items-center p-2 border rounded-lg bg-green-50 dark:bg-green-900/20">
                      <span className="text-sm">Quarterly <span className="text-green-600 text-xs">(10% off)</span></span>
                      <span className="font-medium">${plan.pricing.quarterly}/3mo</span>
                    </div>
                  )}
                  {plan.pricing?.yearly && (
                    <div className="flex justify-between items-center p-2 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <span className="text-sm">Yearly <span className="text-blue-600 text-xs">(20% off)</span></span>
                      <span className="font-medium">${plan.pricing.yearly}/year</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={() => handleSubscribe(plan)}
              disabled={subscribing === plan.id || currentSubscription?.plan === plan.id}
              className={`w-full py-3 px-6 rounded-lg font-medium transition ${
                currentSubscription?.plan === plan.id
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : plan.popular
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white'
              }`}
            >
              {subscribing === plan.id ? (
                'Processing...'
              ) : currentSubscription?.plan === plan.id ? (
                'Current Plan'
              ) : plan.price === 0 ? (
                'Switch to Free'
              ) : (
                `Subscribe to ${plan.name}`
              )}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Can I change my plan anytime?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              What happens to my data if I cancel?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your data remains safe. You'll have read-only access to your data even on the free plan.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Is there a free trial?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              The free plan gives you access to basic features. You can upgrade anytime to unlock premium features.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Subscribe to {selectedPlan.name}
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    resetPaymentForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Duration Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Duration
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="duration"
                      value="monthly"
                      checked={selectedDuration === 'monthly'}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span>Monthly</span>
                        <span className="font-medium">${selectedPlan.pricing?.monthly || selectedPlan.price}</span>
                      </div>
                    </div>
                  </label>
                  {selectedPlan.pricing?.quarterly && (
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="duration"
                        value="quarterly"
                        checked={selectedDuration === 'quarterly'}
                        onChange={(e) => setSelectedDuration(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span>Quarterly <span className="text-green-600 text-xs">(10% off)</span></span>
                          <span className="font-medium">${selectedPlan.pricing.quarterly}</span>
                        </div>
                      </div>
                    </label>
                  )}
                  {selectedPlan.pricing?.yearly && (
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="duration"
                        value="yearly"
                        checked={selectedDuration === 'yearly'}
                        onChange={(e) => setSelectedDuration(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span>Yearly <span className="text-blue-600 text-xs">(20% off)</span></span>
                          <span className="font-medium">${selectedPlan.pricing.yearly}</span>
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Payment Method
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg transition ${
                      paymentMethod === 'card'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod('qr')}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg transition ${
                      paymentMethod === 'qr'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    QR Code
                  </button>
                </div>
              </div>

              {/* Card Payment Form */}
              {paymentMethod === 'card' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardDetails.cardholderName}
                      onChange={(e) => setCardDetails({...cardDetails, cardholderName: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Month
                      </label>
                      <select
                        value={cardDetails.expiryMonth}
                        onChange={(e) => setCardDetails({...cardDetails, expiryMonth: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">MM</option>
                        {Array.from({length: 12}, (_, i) => (
                          <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Year
                      </label>
                      <select
                        value={cardDetails.expiryYear}
                        onChange={(e) => setCardDetails({...cardDetails, expiryYear: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">YYYY</option>
                        {Array.from({length: 10}, (_, i) => (
                          <option key={i} value={new Date().getFullYear() + i}>
                            {new Date().getFullYear() + i}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '')})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="123"
                        maxLength="4"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code Payment */}
              {paymentMethod === 'qr' && (
                <div className="mb-6">
                  {!qrCode ? (
                    <div className="text-center">
                      <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Click the button below to generate a QR code for payment
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <img src={qrCode} alt="Payment QR Code" className="mx-auto mb-4 border rounded-lg" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Scan this QR code with your mobile payment app
                      </p>
                      {qrPolling && (
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">Waiting for payment confirmation...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Payment Button */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    resetPaymentForm();
                  }}
                  className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={paymentMethod === 'card' ? handleCardPayment : handleQRGeneration}
                  disabled={paymentLoading}
                  className="flex-1 py-3 px-6 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {paymentLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : paymentMethod === 'card' ? (
                    `Pay $${selectedPlan.pricing?.[selectedDuration] || selectedPlan.price}`
                  ) : qrCode ? (
                    'Waiting for Payment'
                  ) : (
                    'Generate QR Code'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Payment Receipt
                </h3>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    Payment Successful!
                  </h4>
                  <p className="text-green-600 dark:text-green-300">
                    Receipt Token: {receiptData.receiptToken}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">Receipt Number:</dt>
                      <dd className="font-medium">{receiptData.receiptNumber}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">Plan:</dt>
                      <dd className="font-medium">{receiptData.subscription?.planName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">Amount:</dt>
                      <dd className="font-medium">{receiptData.payment?.amount}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">Payment Method:</dt>
                      <dd className="font-medium">{receiptData.payment?.methodDisplay}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">Date:</dt>
                      <dd className="font-medium">{receiptData.issueDate}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowReceiptModal(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDownloadReceipt(receiptData.receiptToken, receiptData.receiptNumber)}
                    className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipts Modal */}
      {showReceiptsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Payment Receipts
                </h3>
                <button
                  onClick={() => setShowReceiptsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {receipts.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No receipts found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receipts.map((receipt) => (
                    <div key={receipt.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {receipt.planName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Receipt #{receipt.receiptNumber}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {receipt.date} • {receipt.paymentMethod}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {receipt.amount}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleViewReceipt(receipt.receiptToken)}
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDownloadReceipt(receipt.receiptToken, receipt.receiptNumber)}
                              className="text-sm text-gray-600 hover:text-gray-700"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
