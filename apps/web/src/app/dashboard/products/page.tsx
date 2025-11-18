'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Product } from '@commerce/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data.products);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link href="/dashboard/products/new" className="btn btn-primary">
          Create Product
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : products.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No products yet</h3>
          <p className="text-gray-600 mb-6">Create your first product to start selling</p>
          <Link href="/dashboard/products/new" className="btn btn-primary">
            Create Product
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card">
              {product.coverImageUrl && (
                <img
                  src={product.coverImageUrl}
                  alt={product.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {product.description || 'No description'}
              </p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-primary-600">
                  ${(product.priceCents / 100).toFixed(2)}
                </span>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    product.isPublished
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {product.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                {product.salesCount} sales
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/products/${product.id}/edit`}
                  className="btn btn-secondary flex-1 text-center"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="btn bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
