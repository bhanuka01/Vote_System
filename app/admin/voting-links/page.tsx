import React from 'react';
import { redirect } from 'next/navigation';
import { verifyAdminSession, getAdminTokensAction, getAdminElectionData } from '@/app/actions/admin';
import VotingLinksManager from '@/components/VotingLinksManager';

export default async function AdminVotingLinksPage() {
  const isAuthenticated = await verifyAdminSession();

  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  const [tokens, { settings }] = await Promise.all([
    getAdminTokensAction(),
    getAdminElectionData(),
  ]);

  return (
    <VotingLinksManager
      initialTokens={tokens}
      totalEligible={settings?.total_eligible_voters || 56}
    />
  );
}
