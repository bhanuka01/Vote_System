import React from 'react';
import { redirect } from 'next/navigation';
import { verifyAdminSession, getAdminElectionData } from '@/app/actions/admin';
import AdminDashboard from '@/components/AdminDashboard';

export default async function AdminPage() {
  const isAuthenticated = await verifyAdminSession();

  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  const { settings, candidates, stats } = await getAdminElectionData();

  return (
    <AdminDashboard
      initialSettings={settings}
      candidates={candidates}
      stats={stats}
    />
  );
}
