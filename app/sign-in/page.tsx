import { Suspense } from 'react';
import SignInClient from './SignInClient';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="text-neutral-500">Loading…</div>}>
      <SignInClient />
    </Suspense>
  );
}
