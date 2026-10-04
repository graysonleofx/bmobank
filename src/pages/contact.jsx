// Create a responsive ContactUs React component for a banking web app. It should include a form with fields: full name, email, phone number, subject, and message. Validate input fields, show error messages, and a success alert after submission. Use Tailwind CSS for styling. On submit, send the form data using EmailJS.

import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { toast } from '../components/ui/use-toast';
import BankPageHeader from '@/components/BankPageHeader';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isSending, setIsSending] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9+\-().\s]{7,20}$/;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Enter a valid email';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!phoneRegex.test(formData.phone)) newErrors.phone = 'Enter a valid phone number';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSending(true);

    // Use environment variables for IDs (set REACT_APP_* in .env)
    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
    const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
    const userId = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'YOUR_USER_ID';

    const templateParams = {
      from_name: formData.fullName,
      from_email: formData.email,
      phone: formData.phone,
      subject: formData.subject,
      message: formData.message,
    };

    emailjs
      .send(serviceId, templateId, templateParams, userId)
      .then(() => {
        toast({ title: 'Message sent successfully!', variant: 'success' });
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      })
      .catch((error) => {
        console.error('Email send error:', error);
        toast({ title: 'Error sending message', variant: 'error' });
      })
      .finally(() => setIsSending(false));
  };

  const contactDetails = {
    phone: '+1 (000) 000-0000',
    email: 'customerservice@brno-bank.com',
    address: '123 Finance Drive, Suite 400, Melbourne VIC 3000, Australia',
    hours: [
      { days: 'Mon - Fri', times: '9:00 AM - 6:00 PM' },
      { days: 'Sat', times: '10:00 AM - 2:00 PM' },
      { days: 'Sun', times: 'Closed' },
    ],
  };

  return (
    <div className="northline-page northline-contact-page">
      <BankPageHeader page="contact" />
      <main className="northline-page-content northline-contact-layout" id="contact">
          {/* Form card */}
          <div className="northline-contact-panel">
            <h1 className="northline-contact-title">Contact us</h1>
            <p className="northline-contact-intro">We'd love to help. Send us a message and our team will get back to you within one business day.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                  className={`mt-1 block w-full rounded-lg p-3 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                    errors.fullName ? 'border-red-300 ring-red-100' : 'border-gray-200 ring-primary/20'
                  }`}
                  placeholder="Jane Doe"
                />
                {errors.fullName && <p id="fullName-error" className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`mt-1 block w-full rounded-lg p-3 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                      errors.email ? 'border-red-300 ring-red-100' : 'border-gray-200 ring-primary/20'
                    }`}
                    placeholder="jane@example.com"
                  />
                  {errors.email && <p id="email-error" className="mt-1 text-sm text-red-500">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    className={`mt-1 block w-full rounded-lg p-3 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                      errors.phone ? 'border-red-300 ring-red-100' : 'border-gray-200 ring-primary/20'
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && <p id="phone-error" className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  aria-invalid={!!errors.subject}
                  aria-describedby={errors.subject ? 'subject-error' : undefined}
                  className={`mt-1 block w-full rounded-lg p-3 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                    errors.subject ? 'border-red-300 ring-red-100' : 'border-gray-200 ring-primary/20'
                  }`}
                  placeholder="How can we help?"
                />
                {errors.subject && <p id="subject-error" className="mt-1 text-sm text-red-500">{errors.subject}</p>}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                  className={`mt-1 block w-full rounded-lg p-3 text-sm shadow-sm h-36 focus:outline-none focus:ring-2 ${
                    errors.message ? 'border-red-300 ring-red-100' : 'border-gray-200 ring-primary/20'
                  }`}
                  placeholder="Tell us more about your request..."
                />
                {errors.message && <p id="message-error" className="mt-1 text-sm text-red-500">{errors.message}</p>}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSending}
                  className={`northline-primary-button w-full flex items-center justify-center gap-3 rounded-lg py-3 text-white text-sm font-medium transition ${
                    isSending ? 'bg-primary/70 cursor-wait' : 'bg-primary hover:bg-primary-dark'
                  }`}
                >
                  {isSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>

          {/* Info + Map panel */}
          <aside className="space-y-5">
            <div className="northline-contact-info">
              <h3 className="text-2xl font-semibold text-primary mb-2">Our Location & Contact</h3>
              <p className="text-sm text-gray-600 mb-4">Reach out directly or visit our main branch during business hours.</p>

              <ul className="space-y-4">
                {/* <li className="flex items-start gap-3">
                  <span className="flex-none bg-primary/10 text-primary p-2 rounded-lg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 5a2 2 0 0 1 2-2h2.2a2 2 0 0 1 1.6.8L12 8l3.2-4.2A2 2 0 0 1 16.8 2H19a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z" fill="currentColor"/></svg>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Address</p>
                    <p className="text-sm text-gray-600">{contactDetails.address}</p>
                  </div>
                </li> */}

                {/* <li className="flex items-start gap-3">
                  <span className="flex-none bg-primary/10 text-primary p-2 rounded-lg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 5v14a2 2 0 0 0 2 2h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 7h10v10H7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Phone</p>
                    <a href={`tel:${contactDetails.phone.replace(/[^0-9+]/g, '')}`} className="text-sm text-gray-600 hover:text-primary">{contactDetails.phone}</a>
                  </div>
                </li> */}

                <li className="flex items-start gap-3">
                  <span className="flex-none bg-primary/10 text-primary p-2 rounded-lg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M22 12v7a2 2 0 0 1-2 2H4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 7v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 8h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Email</p>
                    <a href={`mailto:${contactDetails.email}`} className="text-sm text-gray-600 hover:text-primary">{contactDetails.email}</a>
                  </div>
                </li>
              </ul>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-800 mb-2">Business Hours</p>
                <div className="text-sm text-gray-600 space-y-1">
                  {contactDetails.hours.map((h) => (
                    <div key={h.days} className="flex justify-between">
                      <span>{h.days}</span>
                      <span className="text-gray-500">{h.times}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="northline-contact-map">
              <iframe
                title="Bank Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509374!2d144.9537353153166!3d-37.81627974202195!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577d6a5b8b8b8b8!2sFederation%20Square!5e0!3m2!1sen!2sau!4v1614031234567!5m2!1sen!2sau"
                width="600"
                height="360"
                className="w-full h-72 sm:h-80"
                allowFullScreen=""
                loading="lazy"
              />
            </div>
          </aside>
      </main>
    </div>
  );
};

export default ContactUs;
