import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Lock, Eye, EyeOff } from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import {sendOtp} from '../lib/sendOtp'
import { verifyOtp } from '../lib/verifyOtp';
import BankPageHeader from '@/components/BankPageHeader';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginOtp, setShowLoginOtp] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: ''
  });
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [userSession, setUserSession] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (email, password) => {
    if (!email || !password) {
      // Handle empty fields
      toast({ description: 'Please fill in all fields', duration: 4000 });
      document.getElementById('login-button').disabled = false;
      document.getElementById('login-button').innerText = 'Log In Securely';
      
      return;
    }
    if (password.length < 8) {
      toast({ description: 'Password must be at least 8 characters long', duration: 4000 });
      document.getElementById('login-button').disabled = false;
      document.getElementById('login-button').innerText = 'Log In Securely';

      return;
    }

    document.getElementById('login-button').disabled = true;

    document.getElementById('login-button').innerText = 'Logging in...';

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    const user = data?.user

    if(user) {
      // User is logged in
      setUser(user);
      // Send OTP for verification
      const otpResponse = await sendOtp(email);
      if (!otpResponse.success) {
        toast({ description: 'Failed to send OTP. Please try again.', duration: 4000 });
        document.getElementById('login-button').disabled = false;
        document.getElementById('login-button').innerText = 'Log In Securely';
        return;
      }
      setOtpValue('');
      setShowLoginOtp(true);
    } else {
      const errorMsg = error?.message || "Unknown error occurred";
      toast({ description: errorMsg, duration: 4000 });
      setErrorMessage(errorMsg);
      if (error.message.includes("User not found")) {
        // Handle user not found error
        setErrorMessage("User not found. Please check your email or phone number.");
        document.getElementById('login-button').disabled = false;
        document.getElementById('login-button').innerText = 'Log In Securely';
        navigate('/open-account');
      } else if (error.message.includes("Invalid login credentials")) {
        setErrorMessage("Invalid login credentials. Please try again.");
        document.getElementById('login-button').disabled = false;
        document.getElementById('login-button').innerText = 'Log In Securely';
        navigate('/login');
      }
    }

    if (error) {
      toast({ description: 'Login failed. Please check your credentials.', duration: 4000 });
      document.getElementById('login-button').disabled = false;
      document.getElementById('login-button').innerText = 'Log In Securely';
      return;
    }

    document.getElementById('login-button').disabled = false;
    document.getElementById('login-button').innerText = 'Log In Securely';

    // const user = data?.user;
    // if (!user) {
    //   toast({ description: 'User not found', duration: 4000 });
    //   return;
    // }

    // Show OTP verification after successful login
    // setShowLoginOtp(true);
  };

  const handleOtpSubmit = async () => {
    if (!otpValue || otpValue.length !== 6) {
      toast({ description: 'Please enter a valid 6-digit OTP', duration: 4000 });
      return;
    }

    if(!user) {
      toast({ description: 'User not found. Please login again.', duration: 4000 });
      setShowLoginOtp(false);
      return;
    }

    try {
      const verificationResponse = await verifyOtp(user.email, otpValue);

      if (!verificationResponse.success) {
        toast({ description: 'Invalid OTP. Please try again.', duration: 4000 });
        return;
      }

      localStorage.setItem('userSession', JSON.stringify(user));
      setUser(user);


      // OTP is valid, proceed to dashboard
      toast({ description: 'Login successful! Redirecting to dashboard...', duration: 4000 });
      setShowLoginOtp(false);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 200);
    } catch (error) {
      toast({ description: 'OTP verification failed. Please try again.', duration: 4000 });
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('userSession');
    if (session) {
      setUserSession(JSON.parse(session));
    }
  }, [])

  return (
    <div className="northline-page">
      <BankPageHeader page="login" />
      <main className="northline-page-content northline-auth-layout">
          <Card className="northline-auth-panel">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-primary">Welcome Back</CardTitle>
              <CardDescription>Sign in to your Northline Bank account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={ (e) => {
                e.preventDefault();
                handleSubmit(formData.emailOrPhone, formData.password);
              }} className="space-y-4">
                <div>
                  <Label htmlFor="emailOrPhone">Email or Phone</Label>
                  <Input
                    id="emailOrPhone"
                    name="emailOrPhone"
                    type="text"
                    required
                    value={formData.emailOrPhone}
                    onChange={handleInputChange}
                    placeholder="Enter your email or phone"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
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

                <div className="northline-security-note flex items-center space-x-2 text-sm text-muted-foreground bg-secondary p-3 rounded-lg">
                  <Lock className="w-4 h-4" />
                  <span>Your connection is encrypted and secure</span>
                </div>

                <Button type="submit" variant="hero" className="northline-primary-button w-full" size="lg" id="login-button">
                  Log In Securely
                </Button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="text-center">
                  <Button variant="link" className="text-sm">
                    Forgot Password?
                  </Button>
                </div>
                
                <div className="text-center border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Don't have an account?
                  </p>
                  <Button 
                    variant="outline" 
                    className="northline-outline-button w-full"
                    onClick={() => navigate('/open-account')}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
      </main>

      {/* Login OTP Modal */}
      <Dialog open={showLoginOtp} onOpenChange={setShowLoginOtp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Login</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Enter the OTP sent to your email to access your dashboard
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
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (!user?.email) {
                    alert('User session not found. Please login again.');
                    return;
                  }
                  try {
                    const res = await sendOtp(user.email);
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
              Verify & Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;