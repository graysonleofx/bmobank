import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { HelpCircle, Send, MessageCircle, Phone, Mail, Clock } from 'lucide-react';

const SupportSection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    priority: '',
    message: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      priority: '',
      message: ''
    });
    
    toast({
      title: "Support Request Submitted",
      description: "We've received your message and will respond within 24 hours.",
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <HelpCircle className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold">Customer Support</h2>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Live Chat</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Available 24/7
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const chatUrl = 'https://direct.lc.chat/19380503/'; // replace with your actual chat route or external chat widget URL
                const newWindow = window.open(chatUrl, '_blank', 'noopener,noreferrer,width=420,height=720');
                if (newWindow) {
                  try {
                    newWindow.focus();
                  } catch {}
                  toast({
                    title: 'Chat Started',
                    description: 'A live chat window has been opened. Our agents will be with you shortly.',
                  });
                } else {
                  // Popup blocked — fallback to navigating in current tab
                  toast({
                    title: 'Popup Blocked',
                    description: 'Please allow popups or click OK to open chat in this tab.',
                    variant: 'destructive',
                  });
                  // fallback navigation
                  window.location.href = chatUrl;
                }
              }}
              aria-label="Start live chat"
            >
              Start Chat
            </Button>
          </CardContent>
        </Card>

        {/* <Card className="text-center">
          <CardContent className="p-4">
            <Phone className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Phone Support</h3>
            <p className="text-sm text-muted-foreground mb-3">
              +1 (800) 123-4567
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={async () => {
              const displayNumber = '+1 (800) 123-4567';
              const telNumber = displayNumber.replace(/[^\d+]/g, '');
              const telUrl = `tel:${telNumber}`;

              // Try to open the dialer
              try {
                window.location.href = telUrl;
                toast({
                title: 'Calling Support',
                description: `Attempting to call ${displayNumber}`,
                });
              } catch {
                // Fallback: copy to clipboard and notify
                if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(displayNumber);
                toast({
                  title: 'Phone number copied',
                  description: 'Phone number copied to clipboard. Please call from your phone.',
                });
                } else {
                toast({
                  title: 'Unable to place call',
                  description: `Please call ${displayNumber}`,
                });
                }
              }
              }}
              aria-label="Call support"
            >
              Call Now
            </Button>
          </CardContent>
        </Card> */}

        <Card className="text-center">
          <CardContent className="p-4">
            <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Email Support</h3>
            <p className="text-sm text-muted-foreground mb-3">
              contactus.bmobank@gmail.com
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const mailto = 'mailto:contactus.bmobank@gmail.com';
                window.location.href = mailto;
              }}
              aria-label="Send email"
            >
              Send Email
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Support Hours */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Support Hours</h3>
              <p className="text-sm text-muted-foreground">
                Monday - Friday: 8:00 AM - 8:00 PM (EST) <br />
                Saturday: 9:00 AM - 5:00 PM (EST) <br />
                Sunday: Closed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Send us a Message</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority Level</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - General inquiry</SelectItem>
                    <SelectItem value="medium">Medium - Account issue</SelectItem>
                    <SelectItem value="high">High - Urgent transaction</SelectItem>
                    <SelectItem value="critical">Critical - Security concern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Please describe your issue or question in detail..."
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={6}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending Message...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Support Request
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-1">How do I reset my password?</h4>
            <p className="text-sm text-muted-foreground">
              Click "Forgot Password" on the login page and follow the instructions sent to your email.
            </p>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-1">What are the transfer limits?</h4>
            <p className="text-sm text-muted-foreground">
              Daily transfer limit is $500,000. Monthly limit is $5,000,000.
            </p>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-1">How long do withdrawals take?</h4>
            <p className="text-sm text-muted-foreground">
              Local transfers are instant. International transfers take 1-3 business days.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportSection;