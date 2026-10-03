import emailjs from '@emailjs/browser';

const attemptedTransactionIds = new Set();

const requiredFields = [
  'user_name',
  'user_email',
  'transaction_status',
  'amount',
  'currency',
  'transaction_id',
  'transaction_date',
];

const maskAccount = (accountNumber) => {
  const digits = String(accountNumber || '').replace(/\s/g, '');
  if (!digits) return '';
  if (digits.length <= 4) return '****';
  return `****${digits.slice(-4)}`;
};

const formatAmount = (amount) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return '';
  return numericAmount.toFixed(2);
};

const formatTransactionDate = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
};

const getTemplateParams = (transactionData) => {
  const transactionType = transactionData?.transaction_type;
  const isTransfer = transactionType === 'Transfer';
  const isWithdrawal = transactionType === 'Withdrawal';

  if (!isTransfer && !isWithdrawal) {
    throw new Error('Unsupported transaction notification type.');
  }

  const templateParams = {
    user_name: transactionData.user_name?.trim() || '',
    user_email: transactionData.user_email?.trim() || '',
    transaction_type: transactionType,
    transaction_status: transactionData.transaction_status || '',
    amount: formatAmount(transactionData.amount),
    currency: transactionData.currency || '',
    recipient_name: isTransfer ? transactionData.recipient_name?.trim() || '' : '',
    masked_account: isTransfer ? maskAccount(transactionData.masked_account) : '',
    withdrawal_method: isWithdrawal ? transactionData.withdrawal_method?.trim() || '' : '',
    masked_destination: isWithdrawal ? maskAccount(transactionData.masked_destination) : '',
    transaction_id: transactionData.transaction_id?.trim() || '',
    transaction_date: formatTransactionDate(transactionData.transaction_date),
    description: transactionData.description?.trim() || '',
    balance: transactionData.balance || '',
  };

  const missingFields = requiredFields.filter((field) => !templateParams[field]);
  if (missingFields.length > 0) {
    throw new Error(`Transaction notification is missing required data: ${missingFields.join(', ')}`);
  }

  if (isTransfer && (!templateParams.recipient_name || !templateParams.masked_account)) {
    throw new Error('Transfer notification is missing recipient details.');
  }

  if (isWithdrawal && (!templateParams.withdrawal_method || !templateParams.masked_destination)) {
    throw new Error('Withdrawal notification is missing destination details.');
  }

  if (templateParams.transaction_status !== 'Successful') {
    throw new Error('Only successful transactions can send a notification.');
  }

  return templateParams;
};

export const sendTransactionSuccessEmail = async (transactionData) => {
  const templateParams = getTemplateParams(transactionData);
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CONFIRMED;

  if (!serviceId || !publicKey || !templateId) {
    throw new Error('EmailJS service ID, public key, and template ID must be configured.');
  }

  const transactionId = templateParams.transaction_id;
  const storageKey = `bmo:transaction-email-attempted:${transactionId}`;

  if (attemptedTransactionIds.has(transactionId)) {
    return Promise.resolve({ skipped: true });
  }

  try {
    if (localStorage.getItem(storageKey)) {
      attemptedTransactionIds.add(transactionId);
      return Promise.resolve({ skipped: true });
    }
    localStorage.setItem(storageKey, 'true');
  } catch (error) {
    console.warn('Could not persist transaction email deduplication state:', error);
  }

  attemptedTransactionIds.add(transactionId);

  return emailjs.send(serviceId, templateId, templateParams, publicKey);
};
