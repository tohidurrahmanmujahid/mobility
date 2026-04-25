import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { apiPost } from '@/utils/api';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiPost('/api/auth/forgot-password', { email }, { includeAuth: false });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setEmail('');
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
        <title>Glömt lösenord - Mobility Partner</title>
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
              Glömt lösenord
            </h2>
            <p className="mt-2 text-center subheading-small text-primary-forest">
              Ange din e-postadress så skickar vi dig en länk för att återställa ditt lösenord
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
              </div>
            )}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                E-postadress
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="din@epost.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Skickar...' : 'Skicka återställningslänk'}
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
