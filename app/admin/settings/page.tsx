import React from 'react';
import { redirect } from 'next/navigation';
import { verifyAdminSession, getAdminElectionData } from '@/app/actions/admin';
import SettingsManager from '@/components/SettingsManager';

export default async function AdminSettingsPage() {
  const isAuthenticated = await verifyAdminSession();

  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  const { settings } = await getAdminElectionData();

  return <SettingsManager initialSettings={settings} />;
}
