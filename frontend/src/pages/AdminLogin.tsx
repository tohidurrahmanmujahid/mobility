import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/context/AdminContext';
import { ShieldCheck, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const AdminLogin = () => {
  const { login } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Captcha state
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [captchaInput, setCaptchaInput] = useState('');

  // Generate random numbers on mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setCaptchaInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate Captcha
    if (parseInt(captchaInput) !== num1 + num2) {
      setError('Säkerhetsfrågan är felaktig. Försök igen.');
      generateCaptcha();
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      navigate('/');
    } else {
      setError('Felaktig e-postadress eller lösenord.');
      setPassword('');
      generateCaptcha();
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-4 relative">
      <div className="w-full max-w-[420px] z-10 relative">
        
        {/* Back Link */}
        <button 
          onClick={() => navigate('/')}
          className="group flex items-center text-primary-foreground hover:text-white mb-6 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Tillbaka till startsidan
        </button>

        {/* Brand-matched Card */}
        <Card className="bg-card text-card-foreground shadow-xl rounded-2xl border-none">
          <CardContent className="p-8">
            
            {/* Icon Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#4ab7a7]/10 flex items-center justify-center mb-5">
                <ShieldCheck size={36} className="text-[#4ab7a7]" />
              </div>
              <h1 className="text-3xl font-bold mb-1 text-center">
                Administratör
              </h1>
              <p className="text-muted-foreground text-sm text-center">
                Logga in för att hantera webbplatsen
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">E-postadress</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@mobilitypartner.se"
                  required
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4ab7a7] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Lösenord</label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4ab7a7] transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Captcha */}
              <div className="space-y-1.5 pt-4 border-t border-border">
                <label className="text-sm font-semibold flex justify-between">
                  <span>Säkerhetsfråga</span>
                  <span className="text-[#4ab7a7] font-bold">{num1} + {num2} = ?</span>
                </label>
                <input
                  type="number"
                  value={captchaInput}
                  onChange={e => setCaptchaInput(e.target.value)}
                  placeholder="Skriv in summan"
                  required
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4ab7a7] transition-all"
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-destructive text-sm font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !password || !email || !captchaInput}
                className="w-full bg-[#4ab7a7] hover:bg-[#3a9a8d] text-white font-bold py-6 rounded-full text-lg mt-4 transition-all"
              >
                {loading ? 'Verifierar...' : 'Logga in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center">
          <p className="text-primary-foreground/60 text-xs font-medium">
            &copy; {new Date().getFullYear()} MobilityPartner. Alla rättigheter förbehållna.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
