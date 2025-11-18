'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    priceCents: 0,
    productType: 'download',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/products', {
        ...formData,
        priceCents: Math.round(formData.priceCents * 100),
      });
      router.push(`/dashboard/products/${response.data.id}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create Product</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => {
              const title = e.target.value;
              setFormData({
                ...formData,
                title,
                slug: formData.slug || generateSlug(title),
              });
            }}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">URL Slug *</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) =>
              setFormData({ ...formData, slug: e.target.value.toLowerCase() })
            }
            className="input"
            pattern="[a-z0-9-]+"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Lowercase letters, numbers, and hyphens only
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Price (USD) *</label>
          <input
            type="number"
            value={formData.priceCents}
            onChange={(e) =>
              setFormData({ ...formData, priceCents: parseFloat(e.target.value) || 0 })
            }
            className="input"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Product Type *</label>
          <select
            value={formData.productType}
            onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
            className="input"
            required
          >
            <option value="download">Download</option>
            <option value="membership">Membership</option>
            <option value="license">License</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
