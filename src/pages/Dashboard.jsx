import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import ProfileSection from '@/components/ProfileSection.jsx';
import SupportSection from '@/components/SupportSection';
import { useToast } from '@/hooks/use-toast';
import { Home, CreditCard, ArrowDownToLine, ArrowUpFromLine, Send, User, HelpCircle, LogOut, Bell, Eye, EyeOff, Gift, Settings, Copy, Check, Menu, X, Wallet, ArrowLeftRight, Receipt, PiggyBank, CircleDollarSign, TrendingUp, ChevronRight, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';
import supabase from  '../lib/supabaseClient';
import { data } from 'autoprefixer';
import ChequeDepositForm from '@/components/ChequeDepositForm';
import bankLogo from '@/assets/bank.png';
import './Dashboard.css';
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();
  const [userSession, setUserSession] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositMethod, setDepositMethod] = useState('wire');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [copied, setCopied] = useState('');
  const [showReferralCard, setShowReferralCard] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [showCardApplication, setShowCardApplication] = useState(false);
  const [cardApplicationStep, setCardApplicationStep] = useState(0);
  const [referralCodeCopied, setReferralCodeCopied] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({
    checking: null,
    savings: null
  });
  const [userName, setUserName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    if (location.state?.openSupport) {
      setActiveTab('support');
    }
  }, [location.state]);

  useEffect(() => {
    const fetchBalances = async() => {
      try {
        const session = localStorage.getItem('userSession');
        if (!session) {
          navigate('/login');
          return;
        } else {
          setUserSession(JSON.parse(session));
        }

        const user = JSON.parse(session);
        //  console.log(user);
        const {data, error} = await supabase 
          .from('accounts')
          .select('checking_account_balance, savings_account_balance')
          .eq('email', user?.email)
          // .single()

        // if (!data) {
        //   console.log('No data found');
        //   return;
        // }

        // console.log(data)

        if (data && data.length > 0) {
          setBalance({
            checking_account_balance: data[0].checking_account_balance,
            savings_account_balance: data[0].savings_account_balance
          });
        }

        // console.log(data);
        // console.log(user?.email)
        if(error){
          console.error('Error fetching balances', error.message);
        } else{
          console.log('Balances fetched successfully');
        }
        return data;
      } catch (error) {
        console.error('Error fetching balances', error.message);
        return null;
      } finally {
        setLoading(false);
      }
    };

    const fetchName = async() => {
      try {
        const session = localStorage.getItem('userSession');
        if (!session) {
          navigate('/login');
          return;
        } else {
          setUserSession(JSON.parse(session));
        }

        const user = JSON.parse(session);
        const {data, error} = await supabase
          .from('accounts')
          .select('full_name')
          .eq('email', user?.email)
          .single();

        if (data) {
          setUserName(data.full_name);
        }

        if (error) {
          console.error('Error fetching user name', error.message);
        }
      } catch (error) {
        console.error('Error fetching user name', error.message);
      }
    };

    const fetchAccountNumber = async() => {
      try {
        const session = localStorage.getItem('userSession');
        if (!session) {
          navigate('/login');
          return;
        } else {
          setUserSession(JSON.parse(session));
        }

        const user = JSON.parse(session);
        const {data, error} = await supabase
          .from('accounts')
          .select('account_number')
          .eq('email', user?.email)
          .single();

        if (data) {
          setAccountNumber(data.account_number);
        }

        if (error) {
          console.error('Error fetching account number', error.message);
        }
      } catch (error) {
        console.error('Error fetching account number', error.message);
      }
    };

    const fetchTransactions = async () => {
    try {
      const session = localStorage.getItem('userSession');
      if (!session) return;

      const user = JSON.parse(session);

      const { data, error } = await supabase
        .from('transactions') // your table name
        .select('*')
        .eq('email', user.email)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error.message);
        return;
      }

      if (data) {
        setTransactions(data);
      }
    } catch (err) {
      console.error('Fetch transactions error:', err.message);
    }
    };


    // const fetchTransactions = async () => {
    //   try {
    //     const session = localStorage.getItem('userSession');
    //     if (!session) return;

    //     const user = JSON.parse(session);

    //     const { data, error } = await supabase
    //       .from('transactions')
    //       .select('*')
    //       .or(
    //         `account_id.eq.${user.id},email.eq.${user.email}`
    //       ) 
    //       .order('date', { ascending: false });

    //     if (error) {
    //       console.error('Error fetching transactions:', error.message);
    //       return;
    //     }

    //     if (data && data.length > 0) {
    //       setTransactions(data);
    //     } else {
    //       setTransactions([]); // return empty array instead of null
    //     }
    //   } catch (err) {
    //     console.error('Fetch transactions error:', err.message);
    //   }
    // };


    fetchBalances();
    fetchTransactions();
    setBalance(data[0]);
    fetchName();
    fetchAccountNumber();

    // const sessionData = JSON.parse(session);
    // // Initialize separate account balances if not present
    // if (!sessionData.checkingBalance && !sessionData.savingsBalance) {
    //   sessionData.checkingBalance = sessionData.checkingBalance * 0.7; // 70% in checking
    //   sessionData.savingsBalance = sessionData.savingsBalance * 0.3; // 30% in savings
    //   localStorage.setItem('userSession', JSON.stringify(sessionData));
    // }
    // setUserSession(sessionData);
  }, []);
  const handleLogout = () => {
    localStorage.removeItem('userSession');
    navigate('/');
  };
  const handleDepositClick = () => {
    setActiveTab('deposit');
    setShowDepositModal(true);
  };
  const handleWithdrawClick = () => {
    setActiveTab('withdraw');
    setShowWithdrawModal(true);
  };
  const handleWithdrawSubmit = () => {
    setShowWithdrawModal(false);
    setShowOtpModal(true);
  };
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };
  const handleReferralCodeCopy = () => {
    const referralCode = `REF-${userSession.accountNumber}`;
    navigator.clipboard.writeText(referralCode);
    setReferralCodeCopied(true);
    toast({
      title: "Referral code copied!",
      description: "Share it with friends to earn $5,000 each"
    });
    setTimeout(() => setReferralCodeCopied(false), 2000);
  };
  const bankDetails = {
    accountName: "Smart Digital Bank",
    accountNumber: "3032410090",
    bankName: "BMO Bank",
    routingNumber: "021000021"
  };
  const showDashboardSection = (sectionId) => {
    setActiveTab('home');
    setMobileSidebarOpen(false);
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };
  const sidebarItems = [{ id: 'home', label: 'Dashboard', icon: Home, action: () => { setActiveTab('home'); setMobileSidebarOpen(false); } },
    { id: 'accounts', label: 'Accounts', icon: Wallet, action: () => showDashboardSection('account-summary') },
    { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight, action: () => navigate('/transfer') },
    { id: 'payments', label: 'Payments', icon: Receipt, action: () => navigate('/transfer') },
    { id: 'transactions', label: 'Transactions', icon: CreditCard, action: () => { setActiveTab('transactions'); setMobileSidebarOpen(false); } },
    { id: 'cards', label: 'Cards', icon: CreditCard, action: () => showDashboardSection('card-section') },
    { id: 'savings', label: 'Savings', icon: PiggyBank, action: () => showDashboardSection('account-summary') },
    { id: 'credit-card', label: 'Credit Card', icon: CircleDollarSign, action: () => showDashboardSection('credit-card-offer') },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => { setActiveTab('profile'); setMobileSidebarOpen(false); } }];
  const bottomNavItems = [{
    id: 'home',
    label: 'Home',
    icon: Home
  }, {
    id: 'deposit',
    label: 'Deposit',
    icon: ArrowDownToLine,
    action: handleDepositClick
  }, {
    id: 'withdraw',
    label: 'Withdraw',
    icon: ArrowUpFromLine,
    action: () => navigate('/withdraw')
  }, {
      id: 'transactions',
      label: 'History',
      icon: CreditCard,
      action: () => setActiveTab('transactions')
    } , {
      id: 'profile',
      label: 'Profile',
      icon: User
    }, {
      id: 'support',
      label: 'Support',
      icon: HelpCircle
    }
  ];
  const renderSidebarItems = () => sidebarItems.map(item => (
    <button key={item.id} type="button" className={`dashboard-sidebar-link ${activeTab === item.id ? 'is-active' : ''}`} onClick={item.action}>
      <item.icon aria-hidden="true" />
      <span>{item.label}</span>
    </button>
  ));
  if (!userSession) {
    return <div>Loading...</div>;
  }
  const checkingBalance = Number(balance?.checking_account_balance ?? balance?.checking ?? 0) || 0;
  const savingsBalance = Number(balance?.savings_account_balance ?? balance?.savings ?? 0) || 0;
  const availableBalance = checkingBalance + savingsBalance;
  const formatMoney = (amount) => `$${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const transactionKind = (transaction) => {
    const type = String(transaction.type || '').toLowerCase();
    if (type.includes('transfer')) return 'transfers';
    if (['credit', 'deposit', 'cheque_deposit'].includes(type) || Number(transaction.amount) > 0) return 'income';
    return 'expenses';
  };
  const filteredTransactions = transactions.filter((transaction) => transactionFilter === 'all' || transactionKind(transaction) === transactionFilter);
  const currentMonthTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    const now = new Date();
    return !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const monthlyIncome = currentMonthTransactions.filter((transaction) => transactionKind(transaction) === 'income').reduce((total, transaction) => total + Math.abs(Number(transaction.amount) || 0), 0);
  const monthlySpending = currentMonthTransactions.filter((transaction) => transactionKind(transaction) === 'expenses').reduce((total, transaction) => total + Math.abs(Number(transaction.amount) || 0), 0);
  const savingsShare = availableBalance > 0 ? Math.round((savingsBalance / availableBalance) * 100) : 0;
  const spendingByMerchant = currentMonthTransactions.filter((transaction) => transactionKind(transaction) === 'expenses').reduce((groups, transaction) => {
    const label = transaction.note || 'Other expense';
    groups[label] = (groups[label] || 0) + Math.abs(Number(transaction.amount) || 0);
    return groups;
  }, {});
  const spendingCategories = Object.entries(spendingByMerchant).sort((a, b) => b[1] - a[1]).slice(0, 3);
  // const checking = balance?.checking_account_balance  ?? 0;
  // const savings = balance?.savings_account_balance  ?? 0;
  return(
    <div className="dashboard-shell pb-20 md:pb-0">
      {/* Top Bar */}
        <header className="dashboard-topbar">
          <div className="dashboard-header-leading">
            {/* <Button type="button" variant="ghost" size="icon" className="dashboard-menu-toggle" aria-label={mobileSidebarOpen ? 'Close dashboard menu' : 'Open dashboard menu'} aria-expanded={mobileSidebarOpen} onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
              {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button> */}
            <div className="min-w-0">
              <p className="dashboard-heading-kicker">Personal banking</p>
              <h1 className="dashboard-heading-title">Dashboard</h1>
              <p className="dashboard-heading-meta">Welcome back, {userName.split(' ')[0]} · Account {accountNumber}</p>
            </div>
          </div>

          {/* Profile avatar with preview + change (saves to & retrieves from Supabase) */}
          <details
            className="relative profile-details"
            onToggle={async (e) => {
              try {
              if (!e.currentTarget.open) return;
              // fetch profile image from Supabase when opening
              const session = userSession || JSON.parse(localStorage.getItem('userSession') || 'null');
              if (!session?.email) return;
              const { data, error } = await supabase
                .from('accounts')
                .select('profile_image')
                .eq('email', session.email)
                .single();
              if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile image', error);
                return;
              }
              if (data?.profile_image) {
                localStorage.setItem('profileImage', data.profile_image);
                const thumb = document.getElementById('profile-img');
                const big = document.getElementById('profile-large-img');
                if (thumb) { thumb.src = data.profile_image; thumb.style.display = ''; }
                if (big) { big.src = data.profile_image; big.style.display = ''; }
              } else {
                localStorage.removeItem('profileImage');
                const thumb = document.getElementById('profile-img');
                const big = document.getElementById('profile-large-img');
                if (thumb) { thumb.removeAttribute('src'); thumb.style.display = 'none'; }
                if (big) { big.removeAttribute('src'); big.style.display = 'none'; }
              }
              } catch (err) {
              console.error('Failed to load profile image', err);
              }
            }}
            >
            <summary className="list-none">
              <div className="flex items-center space-x-2">
              <img
                id="profile-img"
                src={typeof window !== 'undefined' ? (localStorage.getItem('profileImage') || '') : ''}
                alt="Profile"
                className="h-10 w-10 rounded-full object-cover cursor-pointer border"
                onError={(e) => {
                e.currentTarget.style.display = 'none';
                }}
              />
              {! (typeof window !== 'undefined' && localStorage.getItem('profileImage')) && (
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                {userName ? userName.split(' ').map(n=>n[0]).slice(0,2).join('') : 'U'}
                </div>
              )}
              </div>
            </summary>

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-card rounded-lg w-full max-w-md p-5 relative">
              <button
                onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
                className="absolute top-3 right-3 text-sm text-muted-foreground"
                aria-label="Close profile"
              >
                Close
              </button>

              <div className="flex flex-col items-center">
                <img
                id="profile-large-img"
                src={typeof window !== 'undefined' ? (localStorage.getItem('profileImage') || '') : ''}
                alt="Large profile"
                className="h-36 w-36 rounded-full object-cover border"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />

                {! (typeof window !== 'undefined' && localStorage.getItem('profileImage')) && (
                <div className="h-36 w-36 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
                  {userName ? userName.split(' ').map(n=>n[0]).slice(0,2).join('') : 'U'}
                </div>
                )}

                <h3 className="mt-4 text-base font-semibold">{userName}</h3>
                <p className="text-xs text-muted-foreground mt-1">Tap Change to upload a new profile picture</p>

                {/* hidden file input */}
                <input
                id="profile-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  try {
                  const f = e.target.files && e.target.files[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = async () => {
                    try {
                    const dataUrl = reader.result;
                    // update Supabase accounts.profile_image column
                    const session = userSession || JSON.parse(localStorage.getItem('userSession') || 'null');
                    if (!session?.email) {
                      console.warn('No session found - cannot save profile image to Supabase');
                    } else {
                      const { error } = await supabase
                      .from('accounts')
                      .update({ profile_image: dataUrl })
                      .eq('email', session.email);
                      if (error) {
                      console.error('Error saving profile image to Supabase', error);
                      }
                    }
                    // persist locally and update UI
                    localStorage.setItem('profileImage', dataUrl);
                    const thumb = document.getElementById('profile-img');
                    const big = document.getElementById('profile-large-img');
                    if (thumb) { thumb.src = dataUrl; thumb.style.display = ''; }
                    if (big) { big.src = dataUrl; big.style.display = ''; }
                    toast?.({ title: 'Profile updated', description: 'Your profile picture was updated.' });
                    } catch (err) {
                    console.error('Profile image save error', err);
                    }
                  };
                  reader.readAsDataURL(f);
                  } catch (err) {
                  console.error('File read/upload error', err);
                  } finally {
                  e.target.value = '';
                  }
                }}
                />

                <div className="mt-4 flex gap-2 w-full">
                <label htmlFor="profile-file" className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-md border cursor-pointer text-sm">
                  Change Photo
                </label>
                <button
                  type="button"
                  onClick={async () => {
                  try {
                    const session = userSession || JSON.parse(localStorage.getItem('userSession') || 'null');
                    if (session?.email) {
                    const { error } = await supabase
                      .from('accounts')
                      .update({ profile_image: null })
                      .eq('email', session.email);
                    if (error) console.error('Error removing profile image from Supabase', error);
                    }
                    localStorage.removeItem('profileImage');
                    const thumb = document.getElementById('profile-img');
                    const big = document.getElementById('profile-large-img');
                    if (thumb) { thumb.removeAttribute('src'); thumb.style.display = 'none'; }
                    if (big) { big.removeAttribute('src'); big.style.display = 'none'; }
                    toast?.({ title: 'Removed', description: 'Profile image removed.' });
                  } catch (err) {
                    console.error('Remove profile image error', err);
                  }
                  }}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-md border text-sm"
                >
                  Remove
                </button>
                </div>
              </div>
              </div>
            </div>
          </details>

          <div className="dashboard-header-actions">
            <Button type="button" variant="ghost" size="icon" className="dashboard-header-icon" aria-label="Notifications" onClick={() => toast({ title: 'Notifications', description: 'Notification history is not available in this view yet.' })}>
              <Bell className="h-5 w-5" />
            </Button>

            {/* Mobile: icon-only logout */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Desktop: full logout with label */}
            <Button variant="ghost" onClick={handleLogout} className="hidden md:flex">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
            </Button>
          </div>
        </header>

        <div className="dashboard-layout">
          {/* Desktop Sidebar */}
        <aside className="dashboard-sidebar hidden md:flex" aria-label="Dashboard sidebar">
          <div ><img src="https://www.bmo.com/dist/images/logos/bmo-blue-on-transparent-en.svg" alt="BMO Bank"  width="100" height="40" /></div>
          <p className="dashboard-sidebar-caption">Banking</p>
          <nav className="dashboard-sidebar-nav" aria-label="Dashboard navigation">{renderSidebarItems()}</nav>
          <div className="dashboard-sidebar-bottom">
            <button type="button" className="dashboard-sidebar-link" onClick={() => setActiveTab('support')}><HelpCircle aria-hidden="true" /><span>Support</span></button>
            <button type="button" className="dashboard-sidebar-link" onClick={handleLogout}><LogOut aria-hidden="true" /><span>Sign out</span></button>
          </div>
        </aside>

        {mobileSidebarOpen && <>
          <button type="button" className="dashboard-mobile-backdrop md:hidden" aria-label="Close dashboard menu" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="dashboard-sidebar dashboard-mobile-sidebar md:hidden" aria-label="Dashboard menu">
            <div className="dashboard-sidebar-brand"><img src={bankLogo} alt="BMO Bank" /><span>BMO Bank</span></div>
            <p className="dashboard-sidebar-caption">Banking</p>
            <nav className="dashboard-sidebar-nav" aria-label="Mobile dashboard navigation">{renderSidebarItems()}</nav>
            <div className="dashboard-sidebar-bottom">
              <button type="button" className="dashboard-sidebar-link" onClick={() => { setActiveTab('support'); setMobileSidebarOpen(false); }}><HelpCircle aria-hidden="true" /><span>Support</span></button>
              <button type="button" className="dashboard-sidebar-link" onClick={handleLogout}><LogOut aria-hidden="true" /><span>Sign out</span></button>
            </div>
          </aside>
        </>}

        {/* Main Content */}
        <main className="dashboard-main max-w-full overflow-x-hidden">
          {activeTab === 'home' && <div className="space-y-4 md:space-y-6">
              {/* Referral Stats */}
              

              {/* Account Balances */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base md:text-lg">
                          Checking Account
                        </CardTitle>
                        <p className="text-sm text-primary font-medium">
                          Referral code copied!
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowBalance(!showBalance)}
                      >
                        {showBalance ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="text-xl md:text-2xl font-bold text-primary">
                      {showBalance
                        ? `$${balance?.checking_account_balance?.toLocaleString() || 0}`
                        : '••••••'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base md:text-lg">Savings Account</CardTitle>
                        <CardDescription className="text-xs md:text-sm">Long-term savings</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setShowBalance(!showBalance)}>
                        {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl md:text-2xl font-bold text-primary">
                      {showBalance ? `$${balance?.savings_account_balance?.toLocaleString() || 0}` : '••••••'}
                    </div>
                  </CardContent>
                </Card>
              </div> */}

              {/* Quick Actions */}
              {/* <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleDepositClick}>
                  <CardContent className="p-3 md:p-6 text-center">
                    <ArrowDownToLine className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-banking-blue" />
                    <h3 className="text-sm md:text-base font-semibold">Deposit</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">Add money</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/withdraw')}>
                  <CardContent className="p-3 md:p-6 text-center">
                    <ArrowUpFromLine className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-banking-orange" />
                    <h3 className="text-sm md:text-base font-semibold">Withdraw</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">Transfer out</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow col-span-2 md:col-span-1" onClick={() => navigate('/transfer')}>
                  <CardContent className="p-3 md:p-6 text-center">
                    <Send className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-primary" />
                    <h3 className="text-sm md:text-base font-semibold">Transfer</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">Send money</p>
                  </CardContent>
                </Card>
              </div> */}

              {/* Virtual Card Display */}
              

              {/* Recent Transactions */}
              {/* <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Recent Transactions</CardTitle>
                <CardDescription className="text-xs md:text-sm">Your latest account activity</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">No transactions yet</div>
                ) : (
                <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                  <TableHead className="text-xs md:text-sm">Description</TableHead>
                  <TableHead className="text-xs md:text-sm">Amount</TableHead>
                  <TableHead className="text-xs md:text-sm hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-xs md:text-sm">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 5).map(transaction => {
                    // normalize type for reliable matching
                    const type = (transaction.type || '').toLowerCase();
                    const positiveTypes = ['credit', 'deposit', 'cheque_deposit'];
                    const negativeTypes = ['debit', 'withdraw', 'withdrawal', 'transfer'];
                    const sign = positiveTypes.includes(type) ? '+' : (negativeTypes.includes(type) ? '-' : (transaction.amount > 0 ? '+' : '-'));
                    const colorClass = sign === '+' ? 'text-banking-blue' : 'text-banking-orange';
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-xs md:text-sm">{transaction.note}</TableCell>
                        <TableCell className={`text-xs md:text-sm ${colorClass}`}>
                        {sign}${Math.abs(transaction.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden md:table-cell">{transaction.date}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'completed' || transaction.status === 'approved' ? 'default' : transaction.status === 'rejected' ? 'destructive' : 'secondary'} className={transaction.status === 'completed' || transaction.status === 'approved' ? 'text-white' : transaction.status === 'rejected' ? '' : 'text-yellow-600'}>
                            {transaction.status === 'completed' ? 'Completed' : transaction.status === 'approved' ? 'Approved' : transaction.status === 'rejected' ? 'Rejected' : 'Pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                </Table>
                </div>
                )}
              </CardContent>
              </Card> */}

              {/* Referral Widget */}
              
              <section id="account-summary" aria-labelledby="account-summary-title">
                {/* <div className="dashboard-section-heading">
                  <div><h2 id="account-summary-title">Financial overview</h2><p>Your balances across connected accounts</p></div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('transactions')}>View activity <ChevronRight className="ml-1 h-4 w-4" /></Button>
                </div> */}
                <div className="dashboard-summary-grid">
                  <article className="dashboard-summary-card dashboard-summary-card-primary">
                    <div className="dashboard-summary-inner">
                      <div className="dashboard-summary-top"><span className="dashboard-summary-label">Available balance</span><button type="button" className="dashboard-balance-visibility" aria-label={showBalance ? 'Hide balances' : 'Show balances'} onClick={() => setShowBalance(!showBalance)}>{showBalance ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
                      <div><p className="dashboard-summary-amount">{showBalance ? formatMoney(availableBalance) : '••••••'}</p><p className="dashboard-summary-caption">Across your connected accounts</p></div>
                    </div>
                  </article>
                  {/* <article className="dashboard-summary-card">
                    <div className="dashboard-summary-inner"><div className="dashboard-summary-top"><span className="dashboard-summary-label">Total savings</span><span className="dashboard-summary-icon"><PiggyBank /></span></div><div><p className="dashboard-summary-amount">{showBalance ? formatMoney(savingsBalance) : '••••••'}</p><p className="dashboard-summary-caption">Long-term savings</p></div></div>
                  </article> */}
                  <article className="dashboard-summary-card">
                    <div className="dashboard-summary-inner"><div className="dashboard-summary-top"><span className="dashboard-summary-label">Current account</span><span className="dashboard-summary-icon"><Wallet /></span></div><div><p className="dashboard-summary-amount">{showBalance ? formatMoney(checkingBalance) : '••••••'}</p><p className="dashboard-summary-caption">Everyday spending</p></div></div>
                  </article>
                  <article className="dashboard-summary-card">
                    <div className="dashboard-summary-inner"><div className="dashboard-summary-top"><span className="dashboard-summary-label">Savings account</span><span className="dashboard-summary-icon"><TrendingUp /></span></div><div><p className="dashboard-summary-amount">{showBalance ? formatMoney(savingsBalance) : '••••••'}</p><p className="dashboard-summary-caption">Available to save</p></div></div>
                  </article>
                </div>
              </section>

              {/* Quick Actions */}
              <section aria-labelledby="quick-actions-title">
                <div className="dashboard-section-heading"><div><h2 id="quick-actions-title">Quick actions</h2><p>Move money and manage your day-to-day banking</p></div></div>
                <div className="dashboard-action-grid">
                  <button type="button" className="dashboard-action-button" onClick={handleDepositClick}><span className="dashboard-action-icon"><ArrowDownToLine /></span><span className="dashboard-action-label">Add money</span></button>
                  <button type="button" className="dashboard-action-button" onClick={() => navigate('/transfer')}><span className="dashboard-action-icon"><Send /></span><span className="dashboard-action-label">Send money</span></button>
                  <button type="button" className="dashboard-action-button" onClick={() => navigate('/withdraw')}><span className="dashboard-action-icon"><ArrowUpFromLine /></span><span className="dashboard-action-label">Cash out / withdraw</span></button>
                </div>
              </section>

              {/* Cards */}
              <section id="card-section" aria-labelledby="card-section-title">
                <div className="dashboard-section-heading"><div><h2 id="card-section-title">Cards</h2><p>Your debit card and credit options</p></div></div>
                <div className="dashboard-feature-grid">
                  {/* <article className="dashboard-debit-card">
                    <div className="dashboard-debit-card-inner">
                      <div className="flex items-start justify-between"><div><p className="text-sm font-semibold">Federal Edge Finance</p><p className="mt-1 text-xs opacity-75">Virtual debit card</p></div><CreditCard className="h-6 w-6 opacity-90" /></div>
                      <div className="dashboard-card-chip" aria-hidden="true" />
                      <div><p className="font-mono text-lg tracking-wider">•••• •••• •••• {accountNumber ? String(accountNumber).slice(-4) : '••••'}</p><div className="mt-4 flex items-end justify-between"><div><p className="text-[10px] uppercase opacity-70">Cardholder</p><p className="mt-1 text-sm font-semibold">{userName.toUpperCase()}</p></div><ShieldCheck className="h-5 w-5 opacity-80" /></div></div>
                    </div>
                  </article> */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base md:text-lg">Your Virtual Card</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gradient-primary p-4 md:p-6 rounded-lg text-white">
                        <div className="flex justify-between items-start mb-6 md:mb-8">
                          <div>
                            <p className="text-sm opacity-80">BMO Bank</p>
                            <p className="text-xs opacity-60">Virtual Debit Card</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">••••</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-base md:text-lg font-mono">•••• •••• •••• {accountNumber ? String(accountNumber).slice(-4) : 'XXXX'}</p>
                          <div className="flex justify-between">
                            <div>
                              <p className="text-xs opacity-60">CARDHOLDER</p>
                              <p className="text-sm md:text-base font-semibold">{userName.toUpperCase()}</p>
                            </div>
                            <div>
                              <p className="text-xs opacity-60">EXPIRES</p>
                              <p className="text-sm md:text-base font-semibold">12/27</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <article id="credit-card-offer" className="dashboard-credit-offer">
                    <div><span className="dashboard-credit-offer-icon"><CreditCard size={23} /></span><h3>Get a Credit Card</h3><p>Apply for a credit card and get flexible access to credit. There is no credit card linked to this profile yet.</p></div>
                    <div className="dashboard-credit-actions"><Button type="button" onClick={() => { setCardApplicationStep(0); setShowCardApplication(true); }}>Apply Now</Button><Button type="button" variant="outline" onClick={() => toast({ title: 'Credit card information', description: 'Credit card details and account servicing are not connected in this demo.' })}>Learn More</Button></div>
                  </article>
                </div>
              </section>
            </div>}

          {activeTab === 'transactions' && <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold">Transaction History</h2>
            <Card>
            {transactions.length === 0 ? (
              <CardContent className="p-4 md:p-6">
              <p className="text-sm text-muted-foreground">No transactions found</p>
              </CardContent>
            ) : (
              <CardContent className="p-4 md:p-6">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                  <TableHead className="text-xs md:text-sm">Date</TableHead>
                  <TableHead className="text-xs md:text-sm">Description</TableHead>
                  <TableHead className="text-xs md:text-sm hidden md:table-cell">Type</TableHead>
                  <TableHead className="text-xs md:text-sm">Amount</TableHead>
                  <TableHead className="text-xs md:text-sm">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(transaction => {
                    const type = (transaction.type || '').toLowerCase();
                    const positiveTypes = ['credit', 'deposit', 'cheque_deposit'];
                    const negativeTypes = ['debit', 'withdraw', 'withdrawal', 'transfer'];
                    const sign = positiveTypes.includes(type) ? '+' : (negativeTypes.includes(type) ? '-' : (transaction.amount > 0 ? '+' : '-'));
                    const colorClass = sign === '+' ? 'text-banking-blue' : 'text-banking-orange';
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="">
                          {transaction.date ? new Date(transaction.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }) : ''}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">{transaction.note}</TableCell>
                        <TableCell className="text-xs md:text-sm hidden md:table-cell">
                          <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'} className="text-xs">
                          {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-xs md:text-sm ${colorClass}`}>
                          {sign}${Math.abs(transaction.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'completed' || transaction.status === 'approved' ? 'default' : transaction.status === 'rejected' ? 'destructive' : 'secondary'} className={transaction.status === 'completed' || transaction.status === 'approved' ? 'text-white' : transaction.status === 'rejected' ? '' : 'text-yellow-600'}>
                            {transaction.status === 'completed' ? 'Completed' : transaction.status === 'approved' ? 'Approved' : transaction.status === 'rejected' ? 'Rejected' : 'Pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                </Table>
              </div>
              </CardContent>
            )}
            </Card>
          </div>}

          {activeTab === 'deposit' && <div className="space-y-4 md:space-y-6">
            <div className="flex items-center space-x-2 mb-4">
            <ArrowDownToLine className="h-5 w-5 md:h-6 md:w-6 text-banking-blue" />
            <h2 className="text-xl md:text-2xl font-bold">Deposit Funds</h2>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-1" role="tablist" aria-label="Deposit method">
              <Button type="button" variant={depositMethod === 'wire' ? 'default' : 'ghost'} onClick={() => setDepositMethod('wire')} role="tab" aria-selected={depositMethod === 'wire'}>Wire Transfer</Button>
              <Button type="button" variant={depositMethod === 'cheque' ? 'default' : 'ghost'} onClick={() => setDepositMethod('cheque')} role="tab" aria-selected={depositMethod === 'cheque'}>Cheque Deposit</Button>
            </div>

            {depositMethod === 'cheque' ? <ChequeDepositForm userName={userName} accountNumber={accountNumber} onSubmitted={(transaction) => setTransactions((current) => [transaction, ...current])} /> : <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Wire Transfer Information</CardTitle>
                <CardDescription className="text-xs md:text-sm">Use the details below to transfer funds to your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex-1"><Label className="text-xs text-muted-foreground uppercase tracking-wide">Account Name</Label><p className="font-semibold text-sm md:text-base">{userName}</p></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleCopy(bankDetails.accountName, 'name')}>{copied === 'name' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex-1"><Label className="text-xs text-muted-foreground uppercase tracking-wide">Account Number</Label><p className="font-semibold text-sm md:text-base font-mono">{accountNumber}</p></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleCopy(bankDetails.accountNumber, 'account')}>{copied === 'account' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex-1"><Label className="text-xs text-muted-foreground uppercase tracking-wide">Bank Name</Label><p className="font-semibold text-sm md:text-base">{bankDetails.bankName}</p></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleCopy(bankDetails.bankName, 'bank')}>{copied === 'bank' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex-1"><Label className="text-xs text-muted-foreground uppercase tracking-wide">Routing Number</Label><p className="font-semibold text-sm md:text-base font-mono">{bankDetails.routingNumber}</p></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleCopy(bankDetails.routingNumber, 'routing')}>{copied === 'routing' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex-1"><Label className="text-xs text-muted-foreground uppercase tracking-wide">SWIFT Code</Label><p className="font-semibold text-sm md:text-base font-mono">FANBUS33</p></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleCopy('FANBUS33', 'swift')}>{copied === 'swift' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}</Button>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20"><Label className="text-xs text-muted-foreground uppercase tracking-wide">Reference Note</Label><p className="font-semibold text-sm md:text-base text-primary">Deposit to Account: {accountNumber}</p><p className="text-xs text-muted-foreground mt-1">Include this reference in your transfer</p></div>
                </div>
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start space-x-2"><div className="w-4 h-4 rounded-full bg-amber-500 mt-0.5 shrink-0" /><div><p className="text-sm font-medium text-amber-800 dark:text-amber-200">Important Instructions</p><p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Transfer funds to the account above and click &quot;I've Sent It&quot; to notify us. Processing typically takes 1-3 business days.</p></div></div>
                </div>
              </CardContent>
            </Card>
            </>}
          </div>}

          {activeTab === 'withdraw' && <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold">Withdraw Funds</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  Use the mobile withdraw option or visit our dedicated withdraw page for a better experience.
                </p>
                <Button onClick={() => navigate('/withdraw')} className="mt-4">
                  Go to Withdraw Page
                </Button>
              </CardContent>
            </Card>
          </div>}

          {activeTab === 'profile' && <ProfileSection userSession={userSession} />}

          {activeTab === 'support' && <SupportSection />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="dashboard-mobile-bottom-nav md:hidden safe-area-pb" aria-label="Mobile bottom navigation">
        <div className="flex items-center justify-around py-2 px-1">
          {bottomNavItems.map(item => <Button key={item.id} variant="ghost" className={`flex flex-col items-center gap-1 h-auto py-2 px-2 min-w-0 flex-1 ${activeTab === item.id ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`} onClick={() => item.action ? item.action() : setActiveTab(item.id)}>
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs leading-tight">{item.label}</span>
            </Button>)}
        </div>
      </nav>

      {/* Deposit Modal */}
      {/* <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Wire Transfer Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Transfer money to the account below and click "I've Sent It" to notify us.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Account Name</Label>
                  <p className="font-medium">{userName}</p> 
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(bankDetails.accountName, 'name')}>
                  {copied === 'name' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Account Number</Label>
                  <p className="font-medium">{bankDetails.accountNumber}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(bankDetails.accountNumber, 'account')}>
                  {copied === 'account' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Bank Name</Label>
                  <p className="font-medium">{bankDetails.bankName}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(bankDetails.bankName, 'bank')}>
                  {copied === 'bank' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Routing Number</Label>
                  <p className="font-medium">{bankDetails.routingNumber}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(bankDetails.routingNumber, 'routing')}>
                  {copied === 'routing' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button className="w-full" onClick={() => setShowDepositModal(false)}>
              I've Sent It
            </Button>
          </div>
        </DialogContent>
      </Dialog> */}

      {/* Withdraw Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input id="amount" placeholder="Enter amount" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="account">Destination Account</Label>
              <Input id="account" placeholder="Enter account number" value={withdrawAccount} onChange={e => setWithdrawAccount(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleWithdrawSubmit}>
              Proceed to Withdraw
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* OTP Modal */}
      <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Enter the OTP sent to your email to confirm withdrawal
            </p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpValue} onChange={value => setOtpValue(value)}>
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
            <Button className="w-full" disabled={otpValue.length !== 6}>
              Submit OTP
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default Dashboard;