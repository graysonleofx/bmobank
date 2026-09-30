// /lib/sendOtp.js
import emailjs from 'emailjs-com';

// Generate and send OTP via EmailJS
export const sendOtp = async (userEmail) => {
  try {
    // ✅ Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Store OTP temporarily in localStorage (or you can use Supabase if needed)
    localStorage.setItem('pendingOtp', otp);
    localStorage.setItem('otpExpiry', Date.now() + 5 * 60 * 1000); // expires in 5 mins

    // ✅ Send OTP through EmailJS
    const result = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,   // your Service ID
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,  // your Template ID
      {
        to_email: userEmail,
        otp_code: otp,
      },
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY    // your Public Key
    );

    console.log('EmailJS result:', result.text);

    return { success: true, message: 'OTP sent successfully' };

  } catch (error) {
    console.error('Error sending OTP with EmailJS:', error);
    return { success: false, message: 'Failed to send OTP. Try again.' };
  }
};
