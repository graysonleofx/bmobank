import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TransactionProgress from '@/components/TransactionProgress';
import PendingTransactionReceipt from '@/components/PenndingTransactionReceipt.jsx';
import TransactionReceipt from '@/components/TransactionReceipt.jsx';
import { ArrowLeft, Send } from 'lucide-react';
import  supabase from '@/lib/supabaseClient';
import { sendOtp } from '../lib/sendOtp';
import { verifyOtp } from '../lib/verifyOtp';

const Transfer = () => {
  const navigate = useNavigate();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [userSession, setUserSession] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [userAccount, setUserAccount] = useState(null);
  const [showPendingReceipt, setShowPendingReceipt] = useState(false);
  const [pendingTxId, setPendingTxId] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    swiftCode: '',
    amount: '',
    bankName: '',
    note: '',
    fromAccount: ''
  });
  const [balance, setBalance] = useState({ checking: null, savings: null });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('userSession');
    if (session) {
      setUserSession(JSON.parse(session));
    }

    const fetchBalances = async () => {
      if (session) {
        const user = JSON.parse(session);
        const { data, error } = await supabase 
        .from('accounts')
        .select('checking_account_balance, savings_account_balance,status, id')
        .eq('email', user?.email)
        // .single()

        // console.log(data)

        if(data && data.length > 0) {
          setBalance({
            checking: data[0].checking_account_balance,
            savings: data[0].savings_account_balance
          });
          setUserAccount({id: data[0].id, status: data[0].status});
        } else {
          setBalance({ checking: 0, savings: 0 });
          setUserAccount(null);
        }
        if (error) {
          console.error('Error fetching balances:', error);
        }
    }
  };

  fetchBalances();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    if (parseFloat(formData.amount) <= 0) return;

    const proceedBtn = document.getElementById('proceedTransferBtn');
    // Disable button to prevent multiple clicks
    if (proceedBtn) {
      proceedBtn.disabled = true;
      proceedBtn.textContent = 'Processing...';
    }

    // Validate balance
    const amount = parseFloat(formData.amount);
    if (
      (selectedAccount === 'checking' && amount > balance.checking) ||
      (selectedAccount === 'savings' && amount > balance.savings)
    ) {
      alert('Insufficient funds in the selected account.');
      document.getElementById('amount').style.borderColor = 'red';
      document.getElementById('amount').style.borderWidth = '2px';
      setShowOtpModal(false);
      setShowProgress(false);
      setShowReceipt(false);
      return;
    } else if (amount < 10) {
      alert('Minimum transfer amount is $10.');
      document.getElementById('amount').style.borderColor = 'red';
      document.getElementById('amount').style.borderWidth = '2px';
      setShowOtpModal(false);
      setShowProgress(false);
      setShowReceipt(false);
      return;
    } else {
      // Clear any previous error styles
      document.getElementById('amount').style.borderColor = '';
      document.getElementById('amount').style.borderWidth = '';

      setOtpValue('');
      openConfirmModal();


      // setShowOtpModal(true);
    }

  }

  {/* // Confirm Transfer modal + handlers */}

  const openConfirmModal = () => {
    // enable the confirm modal and re-enable button states if needed
    setShowConfirmModal(true);
    // ensure OTP modal is closed until user confirms
    setShowOtpModal(false);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    // re-enable the proceed button if it was disabled
    const btn = document.getElementById('proceedTransferBtn');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Proceed to Transfer';
    }
  };

  const handleConfirmAndSendOtp = async () => {
    if (!userSession?.email) {
      alert('User session not found. Please login again.');
      return;
    }
    const confirmBtn = document.getElementById('confirmAndSendOtpBtn');

    // basic re-validation (amount/account) before sending OTP
    const amount = parseFloat(formData.amount);
    if (!selectedAccount || isNaN(amount) || amount <= 0) {
      alert('Please select an account and enter a valid amount.');
      closeConfirmModal();
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm and Send OTP';
      }
      return;
    }
    // disable confirm button to prevent multiple clicks
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Sending OTP...';
    }

    try {
      const sendRes = await sendOtp(userSession.email);
      if (!sendRes?.success) {
        alert(sendRes?.message || 'Failed to send OTP. Please try again.');

        // re-enable confirm button
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Confirm and Send OTP';
        }
        return;
      }

      // open OTP modal after successful send
      setOtpValue('');
      setShowConfirmModal(false);
      setShowOtpModal(true);
    } catch (err) {
      console.error('Error sending OTP:', err);
      alert('Failed to send OTP. Please try again.');
    }
  };

  // inject a small script so the existing form submit opens the confirm modal
  // Replace the form submission behavior to show confirmation first.
  useEffect(() => {
    const form = document.querySelector('form');
    if (!form) return;
    const onSubmit = (e) => {
      // Prevent the current submit handler from immediately sending OTP
      e.preventDefault();

      // Basic client-side validations
      if (!selectedAccount) {
        alert('Please select an account to transfer from.');
        return;
      }
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount.');
        document.getElementById('amount').style.borderColor = 'red';
        document.getElementById('amount').style.borderWidth = '2px';
        return;
      }
      // show confirmation modal
      openConfirmModal();
    };

    form.addEventListener('submit', onSubmit);
    return () => form.removeEventListener('submit', onSubmit);
  }, [formData, selectedAccount, balance, userSession]);

  const handleOtpSubmit = async () => {
   if (otpValue.length !== 6) {
      alert('Please enter a valid 6-digit OTP.');
      return;
    }

    if (!userSession?.email) {
      alert('User session not found. Please login again.');
      return;
    }

    try {
      const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authenticatedUser) {
        throw new Error('Your sign-in session has expired. Please log in again.');
      }

      if (!userSession.id || authenticatedUser.id !== userSession.id) {
        await supabase.auth.signOut();
        localStorage.removeItem('userSession');
        setUserSession(null);
        alert('Your signed-in account does not match this profile. Please log in again before transferring.');
        navigate('/login', { replace: true });
        return;
      }

      const verifyRes = await verifyOtp(userSession.email, otpValue);

      if (!verifyRes.success) {
        alert(verifyRes.message || 'OTP verification failed. Please try again.');
        return;
      }

      const amount = parseFloat(formData.amount);

      // If the account is blocked or pending by an admin, do not write
      // a pending transaction or shift balances. Show a locked-account support dialog instead.
      if (userAccount?.status === 'blocked' || userAccount?.status === 'pending') {
        setShowOtpModal(false);
        setShowProgress(false);
        setShowReceipt(false);
        setShowPendingReceipt(false);
        setShowLockedModal(true);
        return;
      }

      const { error: transferError } = await supabase.rpc('process_transfer', {
        p_from_account: selectedAccount,
        p_amount: amount,
        p_account_name: formData.accountName,
        p_account_number: formData.accountNumber?.trim(),
        p_routing_number: formData.routingNumber?.trim(),
        p_swift_code: formData.swiftCode?.trim(),
        p_bank_name: formData.bankName,
        p_note: formData.note,
      });
      if (transferError) throw transferError;

      const newBalance = {
        ...balance,
        [selectedAccount]: balance[selectedAccount] - amount,
      };

      setBalance(newBalance);

      setReceiptData({
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        routingNumber: formData.routingNumber,
        swiftCode: formData.swiftCode,
        amount: amount,
        note: formData.note,
        fromAccount: selectedAccount
      });

      setFormData({
        accountName: '',
        accountNumber: '',
        routingNumber: '',
        swiftCode: '',
        bankName: '',
        amount: '',
        note: '',
        fromAccount: ''
      });

      setSelectedAccount('');

      proceedToProgress();
      setTimeout(() => {
        setShowOtpModal(false);
        setShowProgress(true);
      }, 3000);
    } catch (error) {
      console.error('Error processing transfer:', error);
      alert(error?.message || 'Failed to process transfer. Please try again.');
    }
  }

  const proceedToProgress = () => {
    setShowOtpModal(false);
    setShowProgress(true);
  };

  const handleProgressComplete = () => {
    setShowProgress(false);
    setShowReceipt(true);
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-4 py-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-3 text-lg font-semibold text-foreground">Transfer Money</h1>
      </header>

      {/* Form */}
      <div className="p-4 pb-24">
        {showProgress ? (
          <TransactionProgress type="transfer" onComplete={handleProgressComplete} />
        ) : showReceipt ? (
           <TransactionReceipt 
            type="transfer" 
            formData={receiptData} 
            onClose={handleReceiptClose}
          />
        ) : (showPendingReceipt ? (
          <PendingTransactionReceipt 
            type="transfer" 
            formData={receiptData} 
            transactionId={pendingTxId}
            onClose={() => {
              setShowPendingReceipt(false);
              navigate('/dashboard');
            }}
          />
        ) : (
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Send Money
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    placeholder="Recipient's full name"
                    value={formData.accountName}
                    onChange={(e) => handleInputChange('accountName', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="1234567890"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="Bank name"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="routingNumber">Routing Number</Label>
                    <Input
                      id="routingNumber"
                      placeholder="021000021"
                      value={formData.routingNumber}
                      onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="swiftCode">SWIFT Code</Label>
                    <Input
                      id="swiftCode"
                      placeholder="ABCDUS33"
                      value={formData.swiftCode}
                      onChange={(e) => handleInputChange('swiftCode', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fromAccount">Transfer From</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">
                        Checking Account - ${balance?.checking?.toLocaleString() || '0'}
                      </SelectItem>
                      <SelectItem value="savings">
                        Savings Account - ${balance?.savings?.toLocaleString() || '0'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    required
                  />
                  {selectedAccount && (
                    <p className="text-xs text-muted-foreground mt-1  selected-acc-bal">
                      Available: ${selectedAccount === 'checking' 
                        ? balance?.checking?.toLocaleString() 
                        : balance?.savings?.toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Payment description..."
                    value={formData.note}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={!selectedAccount} id="proceedTransferBtn">
                Proceed to Transfer
              </Button>
            </form>
          </CardContent>
        </Card>
      ) )} 
      </div>

      {/* Confirm Transfer Details  */}
      {/* // Confirm dialog UI */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Transfer Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Review the transfer details below before confirming. An OTP will be sent to your email.
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">From</span>
                <span className="font-medium">{selectedAccount === 'checking' ? 'Checking Account' : 'Savings Account'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Available Balance</span>
                <span className="font-medium">
                  ${selectedAccount === 'checking' ? (balance?.checking ?? 0).toLocaleString() : (balance?.savings ?? 0).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Recipient</span>
                <span className="font-medium">{formData.accountName || '-'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Account Number</span>
                <span className="font-medium">{formData.accountNumber || '-'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Bank</span>
                <span className="font-medium">{formData.bankName || '-'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Routing / SWIFT</span>
                <span className="font-medium">{formData.routingNumber || '-'} {formData.swiftCode ? `/ ${formData.swiftCode}` : ''}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Amount</span>
                <span className="font-semibold">${(parseFloat(formData.amount || 0)).toFixed(2)}</span>
              </div>

              {formData.note && (
                <div>
                  <span className="text-xs text-muted-foreground">Note</span>
                  <div className="mt-1 text-sm">{formData.note}</div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="w-full" onClick={closeConfirmModal}>
                Cancel
              </Button>
              <Button className="w-full" onClick={handleConfirmAndSendOtp} id="confirmAndSendOtpBtn">
                Confirm & Send OTP
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* OTP Modal */}
      <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Enter the OTP sent to your email to confirm this transfer
            </p>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={(value) => setOtpValue(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Didn't receive the email?</p>
              <Button
                className="text-sm hover:underline hover:bg-secondary hover:text-primary"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (!userSession?.email) {
                    alert('User session not found. Please login again.');
                    return;
                  }
                  try {
                    const res = await sendOtp(userSession.email);
                    if (res?.success) {
                      setOtpValue('');
                      alert('OTP resent to your email.');
                    } else {
                      alert(res?.message || 'Failed to resend OTP. Please try again.');
                    }
                  } catch (err) {
                    console.error('Resend OTP error:', err);
                    alert('Failed to resend OTP. Please try again.');
                  }
                }}
              >
                Resend OTP
              </Button>
            </div>
            <Button 
              className="w-full" 
              disabled={otpValue.length !== 6}
              onClick={handleOtpSubmit}
            >
              Confirm Transfer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLockedModal} onOpenChange={setShowLockedModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Account Locked</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-lg font-semibold text-foreground">
                Your account has been locked.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Please contact support and report this issue.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setShowLockedModal(false);
                navigate('/dashboard', { state: { openSupport: true } });
              }}
            >
              Contact Support
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transfer;