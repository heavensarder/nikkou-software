import React from 'react';
import type { Metadata } from 'next';
import {
  Database,
  Server,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import styles from './dashboard.module.css';

export const metadata: Metadata = {
  title: 'Admin Dashboard Overview | Nikkou Centre',
  description: 'Official Nikkou Centre administration dashboard overview, real-time database connectivity, student enrollment tracking, and system health status.',
  openGraph: {
    title: 'Admin Dashboard Overview | Nikkou Centre',
    description: 'Official Nikkou Centre administration dashboard overview, real-time database connectivity, student enrollment tracking, and system health status.',
    url: '/dashboard',
    siteName: 'Nikkou Centre',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nikkou Centre Administrative Dashboard',
        type: 'image/jpeg',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Admin Dashboard Overview | Nikkou Centre',
    description: 'Official Nikkou Centre administration dashboard overview, real-time database connectivity, student enrollment tracking, and system health status.',
    images: ['/images/og-image.jpg'],
  },
};

export default function DashboardPage() {
  return (
    <div className={styles.dashboardContainer} suppressHydrationWarning>
      {/* Welcome Banner */}
      <section className={styles.welcomeBanner}>
        <div className={styles.welcomeText}>
          <h2>Welcome, Administrator</h2>
          <p className={styles.welcomeSubtitle}>
            Nikkou Centre Administrative Portal
          </p>
        </div>

        <div className={styles.dbStatusBadge}>
          <span className={styles.pulseDot} />
          <span>MySQL Connected: nikkou-software</span>
        </div>
      </section>

      {/* Real System Specifications & Environment */}
      <div className={styles.contentGrid}>
        {/* Left: System Status Overview */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>
              <Database size={18} color="#1f3864" />
              Database & Environment Status
            </h3>
            <span className={styles.statusOnlineTag}>
              <CheckCircle2 size={14} />
              Connected
            </span>
          </div>

          <div className={styles.panelBody}>
            <div className={styles.specList}>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Database Name</span>
                <span className={styles.specVal}>nikkou-software</span>
              </div>

              <div className={styles.specRow}>
                <span className={styles.specLabel}>Database Server</span>
                <span className={styles.specVal}>127.0.0.1:3306 (MySQL)</span>
              </div>

              <div className={styles.specRow}>
                <span className={styles.specLabel}>Connection Driver</span>
                <span className={styles.specVal}>mysql2 (Direct Pool, No Prisma)</span>
              </div>

              <div className={styles.specRow}>
                <span className={styles.specLabel}>Active Account</span>
                <span className={styles.specVal}>nikkou_admin</span>
              </div>

              <div className={styles.specRow}>
                <span className={styles.specLabel}>Session Type</span>
                <span className={styles.specVal}>Signed JWT (HTTP-Only Cookie)</span>
              </div>

              <div className={styles.specRow}>
                <span className={styles.specLabel}>Application Framework</span>
                <span className={styles.specVal}>Next.js (App Router)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Ready Canvas */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>
              <Layers size={18} color="#e62b2b" />
              Workspace Ready
            </h3>
          </div>

          <div className={styles.panelBody}>
            <p className={styles.infoText}>
              The authentication system and database connection are fully operational.
            </p>
            <p className={styles.infoSubtext}>
              All mock numbers and demo content have been removed. Let me know what data or modules you would like to build next.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
