// /lib/verifyOtp.js

export const verifyOtp = async (email, enteredOtp) => {
  try {
    const savedOtp = localStorage.getItem('pendingOtp');
    const expiry = localStorage.getItem('otpExpiry');

    if (!savedOtp) {
      return { success: false, message: 'No OTP found. Please request again.' };
    }

    // ✅ Check expiry
    if (Date.now() > expiry) {
      localStorage.removeItem('pendingOtp');
      localStorage.removeItem('otpExpiry');
      return { success: false, message: 'OTP expired. Please request a new one.' };
    }

    // ✅ Compare
    if (enteredOtp === savedOtp) {
      // Clear OTP from local storage after success
      localStorage.removeItem('pendingOtp');
      localStorage.removeItem('otpExpiry');

      return { success: true, message: 'OTP verified successfully.' };
    }

    return { success: false, message: 'Invalid OTP. Please try again.' };
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return { success: false, message: 'Something went wrong verifying OTP.' };
  }
};

