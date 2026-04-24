import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page by default
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>Mobilitypartner</title>
        <meta name="description" content="Dealer and Admin Warranty Management Dashboard" />
      </Head>
      
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 font-rubriker">Mobilitypartner</h1>
        <p className="mt-2 text-gray-600 font-text-primary">Redirecting to login...</p>
      </div>
    </div>
  );
}