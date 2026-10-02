import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminSidebar from '@/components/AdminSidebar';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  UserX, 
  UserCheck,
  Search,
  Menu
} from 'lucide-react';
import supabase from '@/lib/supabaseClient';


const AdminUsers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    checking_account_balance: '',
    savings_account_balance: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      toast({
        title: 'Failed to load users',
        description: error.message,
      });
      return;
    }

    // Map DB rows to local shape expected by UI
    const mapped = (data || []).map((u) => ({
      id: u.id?.toString(),
      full_name: u.full_name || '',
      email: u.email || '',
      accountNumber: u.account_number || '',
      checking_account_balance: Number(u.checking_account_balance) || 0,
      savings_account_balance: Number(u.savings_account_balance) || 0,
      status: u.status || 'active',
      createdAt: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : ''
    }));

    setUsers(mapped);
  };

  // const fetchUsers = async () => {
  //   setLoading(true);
  //   const { data, error } = await supabase
  //     .from('accounts')
  //     .select('*')
  //     .order('created_at', { ascending: false });
  //   setLoading(false);

  //   if (error) {
  //     toast({ title: 'Failed to load users', description: error.message });
  //     return;
  //   }

  //   setUsers(data.map(u => ({
  //     id: u.id,
  //     full_name: u.full_name,
  //     email: u.email,
  //     accountNumber: u.account_number,
  //     checking_account_balance: Number(u.checking_account_balance) || 0,
  //     savings_account_balance: Number(u.savings_account_balance) || 0,
  //     status: u.status || 'active',
  //     createdAt: u.created_at
  //   })));
  // };


  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.accountNumber.includes(searchTerm)
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleBlockUnblock = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = user.status === 'active' ? 'blocked' : 'active';

    const { error } = await supabase
      .from('accounts')
      .update({ status: newStatus })
      .eq('id', userId);

    if (error) {
      toast({
        title: 'Unable to update status',
        description: error.message
      });
      return;
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    toast({
      title: 'User Status Updated',
      description: `${user.name} has been ${newStatus === 'active' ? 'unblocked' : 'blocked'}`
    });
  };

  const handleDeleteUser = async (userId) => {
    // optionally confirm here
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', userId);

    if (error) {
      toast({
        title: 'Delete Failed',
        description: error.message
      });
      return;
    }

    setUsers(prev => prev.filter(user => user.id !== userId));
    toast({
      title: 'User Deleted',
      description: 'User has been permanently removed'
    });
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      checking_account_balance: user.checking_account_balance.toString(),
      savings_account_balance: user.savings_account_balance.toString()
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
  if (!selectedUser) return;

  const updates = {
    full_name: formData.full_name || selectedUser.full_name || "",
    email: formData.email || selectedUser.email || "",
    checking_account_balance: parseFloat(formData.checking_account_balance) || selectedUser.checking_account_balance || 0,
    savings_account_balance: parseFloat(formData.savings_account_balance) || selectedUser.savings_account_balance || 0
  };

  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', selectedUser.id)
    .select('*')
    .maybeSingle();

  if (error) {
    toast({
      title: 'Update Failed',
      description: error.message
    });
    return;
  }

  // FIXED → use full_name (your real DB column)
  setUsers(prev =>
    prev.map((u) =>
      u.id === selectedUser.id
        ? {
            ...u,
            full_name: data.full_name ?? "",
            email: data.email ?? "",
            checking_account_balance: Number(data.checking_account_balance) || 0,
            savings_account_balance: Number(data.savings_account_balance) || 0
          }
        : u
    )
  );

  setIsEditDialogOpen(false);
  setSelectedUser(null);

  toast({
    title: 'User Updated',
    description: 'User information has been successfully updated'
  });
  };

  const generateAccountNumber = () => {
    return '3032' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  };


  // const handleAddUser = async () => {
  //   if (!formData.full_name || !formData.email) {
  //     toast({
  //       title: 'Validation Error',
  //       description: 'Full name and email are required'
  //     });
  //     return;
  //   }

  //   const nextAccountNumber = generateAccountNumber();
  //   setGeneratedAccountNumber(nextAccountNumber);

  //   const password = formData.password || Math.random().toString(36).slice(-8);

  //   try {
  //     // Create auth user (admin)
  //     const { data, error } = await supabase.auth.signUp({
  //       email: formData.email,
  //       password: formData.password,
  //     });

  //     if (error) throw error;
  //     const userId = data?.user?.id;
  //     if (!userId) throw new Error('No user id returned from auth');

  //     // Insert account row in DB
  //     const checking = parseFloat(formData.checking_account_balance) || 0;
  //     const savings = parseFloat(formData.savings_account_balance) || 0;
  //     const insertPayload = {
  //       id: userId,
  //       full_name: formData.full_name,
  //       email: formData.email,
  //       account_number: nextAccountNumber,
  //       checking_account_balance: checking,
  //       savings_account_balance: savings,
  //       balance: checking + savings,
  //       status: 'active'
  //     };

  //     const { error: dbError } = await supabase.from('accounts').insert([insertPayload]);
  //     if (dbError) {
  //       // cleanup created auth user if DB insert failed
  //       if (supabase.auth?.admin?.deleteUser) {
  //         try { await supabase.auth.admin.deleteUser(userId); } catch (e) { /* ignore cleanup failure */ }
  //       }
  //       throw dbError;
  //     }

  //     // Keep UI shape consistent with fetchUsers mapping
  //     const newUser = {
  //       id: userId.toString(),
  //       full_name: formData.full_name,
  //       email: formData.email,
  //       accountNumber: nextAccountNumber,
  //       checking_account_balance: checking,
  //       savings_account_balance: savings,
  //       status: 'active',
  //       createdAt: new Date().toISOString().split('T')[0]
  //     };

  //     // setUsers(prev => [newUser, ...prev]);
  //     await fetchUsers();

  //     setIsAddDialogOpen(false);
  //     setFormData({
  //       full_name: '',
  //       email: '',
  //       password: '',
  //       checking_account_balance: '',
  //       savings_account_balance: ''
  //     });

  //     toast({
  //       title: 'User Added',
  //       description: 'New user has been successfully created'
  //     });
  //   } catch (err) {
  //     const msg = err?.message || String(err);
  //     // Generic toast for failure + some common checks
  //     toast({
  //       title: 'Add User Failed',
  //       description: msg
  //     });

  //     if (msg.includes('already registered') || msg.toLowerCase().includes('already exists')) {
  //       toast({ title: 'User Already Exists', description: 'A user with this email already exists.' });
  //     } else if (msg.includes('Password should be at least') || msg.toLowerCase().includes('password')) {
  //       toast({ title: 'Weak Password', description: 'Password should be at least 6 characters long.' });
  //     } else if (msg.toLowerCase().includes('invalid email')) {
  //       toast({ title: 'Invalid Email', description: 'Please enter a valid email address.' });
  //     }
  //   }
  // };

  const handleAddUser = async () => {
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Full name, email, and password are required'
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({ title: 'Weak Password', description: 'Password should be at least 8 characters long.' });
      return;
    }

    const checking = Number(formData.checking_account_balance || 0);
    const savings = Number(formData.savings_account_balance || 0);
    if (!Number.isFinite(checking) || checking < 0 || !Number.isFinite(savings) || savings < 0) {
      toast({ title: 'Invalid Balance', description: 'Balances must be valid non-negative amounts.' });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          checking_account_balance: checking,
          savings_account_balance: savings,
          account_number: generateAccountNumber(),
        },
      });
      if (error) throw error;

      await fetchUsers();

      setIsAddDialogOpen(false);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        checking_account_balance: '',
        savings_account_balance: ''
      });

      toast({
        title: 'User Added',
        description: 'New user has been successfully created'
      });

    } catch (err) {
      let msg = err?.message || String(err);
      if (err?.context instanceof Response) {
        const responseBody = await err.context.json().catch(() => null);
        msg = responseBody?.error || msg;
      }
      toast({ title: 'Add User Failed', description: msg });

      if (msg.includes('already registered') || msg.toLowerCase().includes('already exists')) {
        toast({ title: 'User Already Exists', description: 'A user with this email already exists.' });
      } else if (msg.includes('Password should be at least') || msg.toLowerCase().includes('password')) {
        toast({ title: 'Weak Password', description: 'Password should be at least 6 characters long.' });
      } else if (msg.toLowerCase().includes('invalid email')) {
        toast({ title: 'Invalid Email', description: 'Please enter a valid email address.' });
      }
    }
  };


  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">User Management</h1>
          <div className="w-10"></div>
        </div>
        
        <div className="p-4 md:p-6 overflow-x-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center">
              <Users className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3" />
              User Management
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage user accounts and permissions</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center w-xlg sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Add User</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="add-name">Full Name</Label>
                  <Input
                    id="add-name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="add-email">Email</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="add-password">Password</Label>
                  <Input
                    id="add-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <Label htmlFor="add-checking">Checking Balance</Label>
                  <Input
                    id="add-checking"
                    type="number"
                    value={formData.checking_account_balance}
                    onChange={(e) => setFormData(prev => ({ ...prev, checking_account_balance: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="add-savings">Savings Balance</Label>
                  <Input
                    id="add-savings"
                    type="number"
                    value={formData.savings_account_balance}
                    onChange={(e) => setFormData(prev => ({ ...prev, savings_account_balance: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleAddUser(formData.full_name, formData.email)}>
                  Add User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="mb-4 md:mb-6">
          <CardContent className="pt-4 md:pt-6">
            <div className="relative flex items-center">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm md:text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">All Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="hidden sm:table-cell min-w-[150px]">Email</TableHead>
                    <TableHead className="min-w-[100px]">Account</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[120px]">Balance</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                      <TableCell className="font-mono text-xs md:text-sm">{user.accountNumber}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatCurrency(user?.checking_account_balance + user.savings_account_balance)}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="p-2"
                          >
                            <Edit className="w-3 h-3 md:w-4 md:h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBlockUnblock(user.id)}
                            className="p-2"
                          >
                            {user.status === 'active' ? (
                              <UserX className="w-3 h-3 md:w-4 md:h-4" />
                            ) : (
                              <UserCheck className="w-3 h-3 md:w-4 md:h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {loading && <div className="p-4 text-sm text-muted-foreground">Loading users...</div>}
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-checking">Checking Balance</Label>
                <Input
                  id="edit-checking"
                  type="number"
                  value={formData.checking_account_balance}
                  onChange={(e) => setFormData(prev => ({ ...prev, checking_account_balance: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-savings">Savings Balance</Label>
                <Input
                  id="edit-savings"
                  type="number"
                  value={formData.savings_account_balance}
                  onChange={(e) => setFormData(prev => ({ ...prev, savings_account_balance: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;