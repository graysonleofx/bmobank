import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import BankPageHeader from '@/components/BankPageHeader';
import supabase from '../lib/supabaseClient';
import {useToast} from '@/hooks/use-toast';

const OpenAccount = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationalId: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });
  const [accountCreated, setAccountCreated] = useState(false);
  const [generatedAccountNumber, setGeneratedAccountNumber] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateAccountNumber = () => {
    return '3032' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Password validations
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (formData.password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    // Required fields
    if (!formData.fullName || !formData.email || !formData.phone || !formData.dateOfBirth) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    document.getElementById('openAccountButton').disabled = true;
    document.getElementById('openAccountButton').innerText = 'Creating Account...';

    try {
      // Create Supabase Auth user
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.confirmPassword
      });

      if (authError) {
        console.error('Exception:', authError.message);
        if (authError?.error) console.error('Inner error:', JSON.stringify(authError.error, null, 2));
        if (authError.message.includes('already registered')) {
          throw new Error('Email is already registered');
        } else {
          console.error('Auth error:', authError);
          throw new Error('Failed to create account');
        }
      };

      const user = data?.user;
      if (!user) throw new Error('User not returned from Supabase auth');

      // Generate account number and default balances
      const accountNumber = generateAccountNumber();
      setGeneratedAccountNumber(accountNumber);

      const checkingBalance = parseFloat(formData.checking_account_balance) || 0;
      const savingsBalance = parseFloat(formData.savings_account_balance) || 0;

      // Insert into accounts table
      const { error: accountError } = await supabase.from('accounts').insert([{
        id: user.id, // ensure column type is uuid or text
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        national_id: formData.nationalId || null,
        account_number: accountNumber,
        referral_code: formData.referralCode || null,
        checking_account_balance: checkingBalance,
        savings_account_balance: savingsBalance,
        balance: checkingBalance + savingsBalance
      }]);

      if (accountError) throw accountError;

      // Store referral info if provided
      if (formData.referralCode) {
        localStorage.setItem('referralUsed', formData.referralCode);
      }

      setAccountCreated(true);
    } catch (err) {
      console.error('Exception:', err);
      if (err?.error) console.error('Inner error:', JSON.stringify(err.error, null, 2));
      toast({
        title: "Error",
        description: err.message || 'Database error saving new user',
        variant: "destructive"
      });
    } finally {
      document.getElementById('openAccountButton').disabled = false;
      document.getElementById('openAccountButton').innerText = 'Open Account';
    }
  };  


  const proceedToDashboard = () => {
    const user = supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
        return;
      } 

        // Store user session data locally
      localStorage.setItem('userSession', JSON.stringify({
        id: user.id,                      // 🔥 MOST IMPORTANT
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        address: "",
        occupation: "",
        accountNumber: generatedAccountNumber,
        checking_account_balance: 0,
        savings_account_balance: 0
      }));
      navigate('/dashboard');
    });

  };

  // const proceedToDashboard = async () => {
  //   const { data: profile, error } = await supabase
  //     .from('accounts')
  //     .select('*')
  //     .eq('id', user.id)
  //     .single();

  //   if (!error && profile) {
  //     localStorage.setItem('userSession', JSON.stringify(profile));
  //   }

  //   navigate('/dashboard');
  // };

  if (accountCreated) {
    return (
      <div className="northline-page">
        <BankPageHeader page="signup" />
        <main className="northline-page-content northline-auth-layout">
            <Card className="northline-success-panel text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-primary">Welcome, {formData.fullName.split(' ')[0]}!</CardTitle>
                <CardDescription>Your account has been successfully created</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Your Account Number</p>
                  <p className="text-2xl font-bold text-primary">{generatedAccountNumber}</p>
                </div>
                <Button onClick={proceedToDashboard} className="w-full" size="lg">
                  Proceed to Dashboard
                </Button>
              </CardContent>
            </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="northline-page">
      <BankPageHeader page="signup" />
      <main className="northline-page-content northline-auth-layout">
          <Card className="northline-auth-panel">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-primary">Open Your Free Digital Account</CardTitle>
              <CardDescription>Join thousands of users banking smart with us</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>

                {/* <div>
                  <Label htmlFor="nationalId">SSN</Label>
                  <Input
                    id="nationalId"
                    name="nationalId"
                    type="text"
                    value={formData.nationalId}
                    onChange={handleInputChange}
                    placeholder="Enter your SSN"
                  />
                </div>

                <div>
                  <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                  <Input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    value={formData.referralCode}
                    onChange={handleInputChange}
                    placeholder="Enter referral code (e.g., REF-3032123456)"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Have a referral code? Enter it and both you and your referrer get $5,000!
                  </p>
                </div> */}

                <div>
                  <Label htmlFor="password">Create Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a strong password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="northline-security-note flex items-center space-x-2 text-sm text-muted-foreground bg-secondary p-3 rounded-lg">
                  <Lock className="w-4 h-4" />
                  <span>Your details are encrypted and secure</span>
                </div>

                <Button type="submit" className="northline-primary-button w-full" size="lg" id="openAccountButton">
                  Open Account
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Button variant="link" className="p-0" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
      </main>
    </div>
  );
};

export default OpenAccount;