'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Menu,
  LogOut,
  FileText,
  ChevronRight,
  Settings,
} from 'lucide-react';
import styles from './layout.module.css';

interface AdminUser {
  id: number;
  username: string;
  full_name: string;
  email: string | null;
  role: string;
}

interface SidebarNavProps {
  collapsed: boolean;
  cvMakerOpen: boolean;
  setCvMakerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

function SidebarNav({
  collapsed,
  cvMakerOpen,
  setCvMakerOpen,
  setCollapsed,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.navSection} suppressHydrationWarning>
      <div className={styles.navLabel} suppressHydrationWarning>
        <span suppressHydrationWarning>{!collapsed && 'Main Menu'}</span>
      </div>

      {/* 1. Dashboard Overview */}
      <Link
        href="/dashboard"
        className={`${styles.navItem} ${pathname === '/dashboard' ? styles.navItemActive : ''}`}
        title="Dashboard"
      >
        <div className={styles.navIcon}>
          <LayoutDashboard size={20} />
        </div>
        {!collapsed && (
          <div className={styles.navText}>
            <span>Dashboard</span>
            {pathname === '/dashboard' && <span className={styles.activeDot} />}
          </div>
        )}
      </Link>

      {/* 2. CV Maker Parent Accordion Module */}
      <div style={{ marginTop: '4px' }}>
        <button
          type="button"
          onClick={() => {
            if (collapsed) setCollapsed(false);
            setCvMakerOpen(!cvMakerOpen);
          }}
          className={`${styles.navParentBtn} ${pathname.startsWith('/dashboard/cv-maker') ? styles.navParentActive : ''}`}
          title="CV Maker"
        >
          <div className={styles.navIcon}>
            <FileText size={20} />
          </div>
          {!collapsed && (
            <div className={styles.navText}>
              <span>CV Maker</span>
              <span className={`${styles.chevronIcon} ${cvMakerOpen ? styles.chevronExpanded : ''}`}>
                <ChevronRight size={16} />
              </span>
            </div>
          )}
        </button>

        {/* Nested Sub-items (Only when expanded) */}
        {!collapsed && cvMakerOpen && (
          <div className={styles.subnavContainer}>
            <Link
              href="/dashboard/cv-maker/students"
              className={`${styles.subnavItem} ${pathname === '/dashboard/cv-maker/students' ? styles.subnavItemActive : ''}`}
            >
              <span className={styles.subnavDot} />
              <span>Student List</span>
            </Link>

            <Link
              href="/dashboard/cv-maker/new?fresh=true"
              className={`${styles.subnavItem} ${pathname === '/dashboard/cv-maker/new' ? styles.subnavItemActive : ''}`}
            >
              <span className={styles.subnavDot} />
              <span>Create New CV</span>
            </Link>
          </div>
        )}
      </div>

      {/* 3. Settings */}
      <div style={{ marginTop: '4px' }}>
        <Link
          href="/dashboard/settings"
          className={`${styles.navItem} ${pathname.startsWith('/dashboard/settings') ? styles.navItemActive : ''}`}
          title="Settings"
        >
          <div className={styles.navIcon}>
            <Settings size={20} />
          </div>
          {!collapsed && (
            <div className={styles.navText}>
              <span>Settings</span>
              {pathname.startsWith('/dashboard/settings') && <span className={styles.activeDot} />}
            </div>
          )}
        </Link>
      </div>
    </nav>
  );
}

function SidebarNavFallback({ collapsed }: { collapsed: boolean }) {
  return (
    <nav className={styles.navSection} suppressHydrationWarning>
      <div className={styles.navLabel} suppressHydrationWarning>
        <span suppressHydrationWarning>{!collapsed && 'Main Menu'}</span>
      </div>
      <div className={styles.navItem}>
        <div className={styles.navIcon}>
          <LayoutDashboard size={20} />
        </div>
        {!collapsed && (
          <div className={styles.navText}>
            <span>Dashboard</span>
          </div>
        )}
      </div>
      <div className={styles.navItem} style={{ marginTop: '4px' }}>
        <div className={styles.navIcon}>
          <Settings size={20} />
        </div>
        {!collapsed && (
          <div className={styles.navText}>
            <span>Settings</span>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [cvMakerOpen, setCvMakerOpen] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Fetch logged in admin profile
    async function fetchAdminUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Failed to load admin profile', err);
      }
    }

    fetchAdminUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/';
    }
  };

  return (
    <div className={styles.dashboardShell} suppressHydrationWarning>
      {/* Collapsible Sidebar */}
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}
        suppressHydrationWarning
      >
        <div className={styles.sidebarHeader} suppressHydrationWarning style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: collapsed ? '0 10px' : '0 16px' }}>
          <Link href="/dashboard" className={styles.logoLink}>
            <Image
              src="/images/nikkou-logo.png"
              alt="Nikkou Centre Logo"
              width={collapsed ? 40 : 170}
              height={40}
              priority
              className={styles.logoFull}
              style={{ objectFit: 'contain' }}
            />
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={styles.sidebarToggleBtn}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle navigation menu"
            style={{ width: '32px', height: '32px', flexShrink: 0, padding: 0 }}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Navigation Section with Suspense */}
        <Suspense fallback={<SidebarNavFallback collapsed={collapsed} />}>
          <SidebarNav
            collapsed={collapsed}
            cvMakerOpen={cvMakerOpen}
            setCvMakerOpen={setCvMakerOpen}
            setCollapsed={setCollapsed}
          />
        </Suspense>

        {/* Admin Profile Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'N'}
            </div>
            {!collapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {user?.full_name || 'Nikkou Admin'}
                </span>
                <span className={styles.userRole}>
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
            title="Logout"
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContainer} suppressHydrationWarning>

        {/* Page Content */}
        <main className={styles.contentWrapper} suppressHydrationWarning>
          {children}
        </main>
      </div>
    </div>
  );
}
