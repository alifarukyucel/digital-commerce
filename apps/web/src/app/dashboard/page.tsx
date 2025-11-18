'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenueCents: 0,
    totalSales: 0,
    averageOrderValueCents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/analytics/overview?period=30d');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/dashboard/products/new" className="btn btn-primary">
          Create Product
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Total Revenue (30d)</h3>
              <p className="text-3xl font-bold text-primary-600">
                ${(stats.totalRevenueCents / 100).toFixed(2)}
              </p>
            </div>
            <div className="card">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Total Sales (30d)</h3>
              <p className="text-3xl font-bold">{stats.totalSales}</p>
            </div>
            <div className="card">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Average Order Value</h3>
              <p className="text-3xl font-bold">
                ${(stats.averageOrderValueCents / 100).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/dashboard/products/new"
                  className="block p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
                >
                  <h3 className="font-medium">Create Product</h3>
                  <p className="text-sm text-gray-600">Add a new digital product to sell</p>
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="block p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
                >
                  <h3 className="font-medium">View Orders</h3>
                  <p className="text-sm text-gray-600">See all customer orders</p>
                </Link>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
              <ol className="space-y-3 list-decimal list-inside text-gray-700">
                <li>Create your first product</li>
                <li>Upload digital files</li>
                <li>Set your price</li>
                <li>Publish and share your storefront</li>
              </ol>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
