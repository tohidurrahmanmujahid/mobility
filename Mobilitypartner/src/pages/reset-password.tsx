import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { apiPost } from '@/utils/api';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    // Get token from URL query parameter
    if (router.isReady) {
      const tokenParam = router.query.token as string;
      if (tokenParam) {
        setToken(tokenParam);
      } else {
        setError('Ogiltig återställningslänk. Token saknas.');
      }
    }
  }, [router.isReady, router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken långt');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Ogiltig återställningslänk. Token saknas.');
      setLoading(false);
      return;
    }

    try {
      const response = await apiPost('/api/auth/reset-password', { token, password }, { includeAuth: false });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setPassword('');
        setConfirmPassword('');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Ett fel uppstod. Försök igen senare.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: 'url(/picture.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(1px)'
        }}
      />
      <Head>
        <title>Återställ lösenord - Mobility Partner</title>
      </Head>

      <div className="card max-w-md w-full relative z-10">
        <div className="card-body space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Image
                src="/Mobilitypartnerlogo_mini.PNG"
                alt="Mobility Partner Logo"
                width={120}
                height={120}
                className="h-auto"
                priority
              />
            </div>
            <h2 className="heading-primary text-center">
              Återställ lösenord
            </h2>
            <p className="mt-2 text-center subheading-small text-primary-forest">
              Ange ditt nya lösenord nedan
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="alert-error">
                {error}
              </div>
            )}
            {success && (
              <div className="alert-success">
                {success}
                <p className="mt-2 text-sm">Omdirigerar till inloggningssidan...</p>
              </div>
            )}
            <div className="space-y-4">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Nytt lösenord
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="form-input"
                  placeholder="Minst 8 tecken"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!token || success !== ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Bekräfta nytt lösenord
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="form-input"
                  placeholder="Ange lösenordet igen"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!token || success !== ''}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !token || success !== ''}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Återställer...' : 'Återställ lösenord'}
              </button>
            </div>

            <div className="text-center">
              <Link href="/login" className="font-underrubriker font-medium text-accent-teal hover:text-accent-teal/80 transition-colors duration-200">
                Tillbaka till inloggning
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
