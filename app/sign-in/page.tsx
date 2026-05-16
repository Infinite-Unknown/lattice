import { Suspense } from 'react';
import SignInClient from './SignInClient';
import LatticeLoader from '../components/LatticeLoader';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><LatticeLoader size="lg" label="Loading sign in…" /></div>}>
      <SignInClient />
    </Suspense>
  );
}
