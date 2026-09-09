import React from 'react';
import { redirect } from 'next/navigation';
import { verifyAdminSession, getAdminElectionData } from '@/app/actions/admin';
import CandidateManagement from '@/components/CandidateManagement';

export default async function AdminCandidatesPage() {
  const isAuthenticated = await verifyAdminSession();

  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  const { settings, candidates, stats } = await getAdminElectionData();

  return (
    <CandidateManagement
      initialCandidates={candidates}
      electionStatus={settings?.status || 'DRAFT'}
      votesCast={stats.votesCast}
    />
  );
}
