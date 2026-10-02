import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, ImagePlus, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react';
import supabase from '@/lib/supabaseClient';

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const compressImage = (file) => new Promise((resolve, reject) => {
  const image = new Image(); const reader = new FileReader();
  reader.onload = () => { image.src = reader.result; }; reader.onerror = reject;
  image.onload = () => { const scale = Math.min(1, 1800 / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); canvas.toBlob((blob) => blob ? resolve(new File([blob], `${file.name}.jpg`, { type: 'image/jpeg' })) : reject(new Error('Image compression failed')), 'image/jpeg', 0.82); };
  image.onerror = reject; reader.readAsDataURL(file);
});

const ChequeImageField = ({ label, value, onChange, disabled }) => {
  const [error, setError] = useState('');
  const choose = async (file) => { if (!file) return; if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return; } if (file.size > MAX_FILE_SIZE) { setError('Image must be 8 MB or smaller.'); return; } try { setError(''); onChange(await compressImage(file)); } catch { setError('Unable to process this image.'); } };
  return <div className="space-y-3 rounded-lg border p-4"><div className="flex items-center justify-between"><Label>{label}</Label>{value && <Badge variant="secondary">Ready</Badge>}</div>{value ? <div className="space-y-3"><img src={URL.createObjectURL(value)} alt={`${label} preview`} className="h-40 w-full rounded-md border object-contain bg-muted" /><div className="flex gap-2"><label className="flex-1"><Button type="button" variant="outline" className="w-full" asChild><span><RefreshCw className="mr-2 h-4 w-4" />Replace</span></Button><input className="hidden" type="file" accept="image/*" capture="environment" disabled={disabled} onChange={(e) => choose(e.target.files?.[0])} /></label><Button type="button" variant="ghost" onClick={() => onChange(null)} disabled={disabled}><Trash2 className="h-4 w-4" /></Button></div></div> : <div className="grid grid-cols-2 gap-2"><label><Button type="button" variant="outline" className="w-full" asChild><span><ImagePlus className="mr-2 h-4 w-4" />Take Photo</span></Button><input className="hidden" type="file" accept="image/*" capture="environment" disabled={disabled} onChange={(e) => choose(e.target.files?.[0])} /></label><label><Button type="button" variant="outline" className="w-full" asChild><span><Upload className="mr-2 h-4 w-4" />Upload</span></Button><input className="hidden" type="file" accept="image/*" disabled={disabled} onChange={(e) => choose(e.target.files?.[0])} /></label></div>}{error && <p className="text-sm text-destructive">{error}</p>}</div>;
};

const ChequeDepositForm = ({ userName, accountNumber, onSubmitted }) => {
  const { toast } = useToast(); const [form, setForm] = useState({ amount: '', currency: 'USD', chequeNumber: '', bankName: '', accountHolderName: userName || '', issueDate: '', memo: '', notes: '' }); const [images, setImages] = useState({ front: null, back: null }); const [submitting, setSubmitting] = useState(false); const [success, setSuccess] = useState(null); const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0 || !form.chequeNumber.trim() || !form.bankName.trim() || !form.accountHolderName.trim() || !form.issueDate || !images.front || !images.back) {
      toast({ title: 'Complete the cheque details', description: 'Enter all required fields and add both cheque images.', variant: 'destructive' });
      return;
    }
    if (new Date(form.issueDate) > new Date()) {
      toast({ title: 'Invalid issue date', description: 'The cheque issue date cannot be in the future.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    let depositId;
    const uploaded = [];
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Please sign in again before submitting a deposit.');

      depositId = crypto.randomUUID();
      for (const [side, file] of [['front', images.front], ['back', images.back]]) {
        const path = `${user.id}/${depositId}/${side}.jpg`;
        const { error } = await supabase.storage.from('cheque-images').upload(path, file, { contentType: 'image/jpeg', upsert: false });
        if (error) throw error;
        uploaded.push(path);
      }

      const { data: deposit, error: depositError } = await supabase.rpc('submit_cheque_deposit', {
        p_deposit_id: depositId,
        p_amount: amount,
        p_currency: form.currency,
        p_cheque_number: form.chequeNumber.trim(),
        p_bank_name: form.bankName.trim(),
        p_account_holder_name: form.accountHolderName.trim(),
        p_issue_date: form.issueDate,
        p_memo: form.memo.trim() || null,
        p_notes: form.notes.trim() || null,
        p_front_image_path: uploaded[0],
        p_back_image_path: uploaded[1],
      });
      if (depositError) throw depositError;

      const timestamp = deposit?.created_at || new Date().toISOString();
      setSuccess({ amount, chequeNumber: form.chequeNumber.trim() });
      onSubmitted?.({
        id: deposit?.id || depositId,
        user_id: user.id,
        deposit_id: deposit?.id || depositId,
        email: user.email,
        account_name: form.accountHolderName.trim(),
        user_account: accountNumber,
        type: 'cheque_deposit',
        amount,
        note: form.memo.trim() || 'Cheque Deposit',
        status: 'pending',
        reference: `CHEQUE-${deposit?.id || depositId}`,
        created_at: timestamp,
        date: timestamp.slice(0, 10),
      });
    } catch (error) {
      if (uploaded.length) {
        const { error: cleanupError } = await supabase.storage.from('cheque-images').remove(uploaded);
        if (cleanupError) console.error('Unable to clean up uploaded cheque images', cleanupError);
      }
      toast({ title: 'Submission failed', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };
  if (success) return <Card className="border-green-200"><CardContent className="space-y-4 p-6"><CheckCircle2 className="h-10 w-10 text-green-600" /><div><h3 className="text-lg font-semibold">Cheque deposit submitted successfully.</h3><p className="text-sm text-muted-foreground">Your cheque deposit is currently under review. Your account balance will be updated after approval.</p></div><div className="grid grid-cols-3 gap-3 text-sm"><div><span className="text-muted-foreground">Amount</span><p className="font-semibold">{success.amount.toLocaleString()} {form.currency}</p></div><div><span className="text-muted-foreground">Cheque Number</span><p className="font-semibold">{success.chequeNumber}</p></div><div><span className="text-muted-foreground">Status</span><p className="font-semibold text-amber-600">Pending</p></div></div></CardContent></Card>;
  return <form onSubmit={submit} className="space-y-6 pb-40 md:pb-6"><Card><CardHeader><CardTitle>Cheque Details</CardTitle><CardDescription>Provide the information exactly as printed on the cheque.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="cheque-amount">Cheque amount</Label><Input id="cheque-amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => update('amount', e.target.value)} required /></div><div><Label htmlFor="cheque-currency">Currency</Label><select id="cheque-currency" className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.currency} onChange={(e) => update('currency', e.target.value)}><option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option><option>AUD</option></select></div><div><Label htmlFor="cheque-number">Cheque number</Label><Input id="cheque-number" value={form.chequeNumber} onChange={(e) => update('chequeNumber', e.target.value)} required /></div><div><Label htmlFor="bank-name">Bank name</Label><Input id="bank-name" value={form.bankName} onChange={(e) => update('bankName', e.target.value)} required /></div><div><Label htmlFor="account-holder">Account holder/name on cheque</Label><Input id="account-holder" value={form.accountHolderName} onChange={(e) => update('accountHolderName', e.target.value)} required /></div><div><Label htmlFor="issue-date">Cheque issue date</Label><Input id="issue-date" type="date" value={form.issueDate} onChange={(e) => update('issueDate', e.target.value)} required /></div><div className="sm:col-span-2"><Label htmlFor="cheque-memo">Memo/reference</Label><Input id="cheque-memo" value={form.memo} onChange={(e) => update('memo', e.target.value)} /></div></CardContent></Card><Card><CardHeader><CardTitle>Cheque Images</CardTitle><CardDescription>Clear images of both sides are required. Images remain private.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><ChequeImageField label="Front of cheque" value={images.front} onChange={(file) => setImages((current) => ({ ...current, front: file }))} disabled={submitting} /><ChequeImageField label="Back of cheque" value={images.back} onChange={(file) => setImages((current) => ({ ...current, back: file }))} disabled={submitting} /></CardContent></Card><div className="sticky bottom-20 z-30 -mx-3 bg-background/95 px-3 py-3 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none"><Button type="submit" size="lg" className="w-full shadow-lg" disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Cheque Deposit</Button></div></form>;
};
export default ChequeDepositForm;