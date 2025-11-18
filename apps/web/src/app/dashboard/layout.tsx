'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth.store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-primary-600">
                Digital Commerce
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="text-gray-700 hover:text-primary-600">
                  Dashboard
                </Link>
                <Link href="/dashboard/products" className="text-gray-700 hover:text-primary-600">
                  Products
                </Link>
                <Link href="/dashboard/orders" className="text-gray-700 hover:text-primary-600">
                  Orders
                </Link>
                <Link href="/dashboard/analytics" className="text-gray-700 hover:text-primary-600">
                  Analytics
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/store/${user?.username}`}
                target="_blank"
                className="text-gray-700 hover:text-primary-600"
              >
                View Store
              </Link>
              <button onClick={logout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
