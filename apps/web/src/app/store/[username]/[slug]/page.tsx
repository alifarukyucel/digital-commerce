'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/store/${params.username}/${params.slug}`
        );
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params]);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const response = await api.post('/checkout/create-session', {
        productId: product.id,
        buyerEmail,
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Info */}
            <div>
              {product.coverImageUrl && (
                <img
                  src={product.coverImageUrl}
                  alt={product.title}
                  className="w-full rounded-lg shadow-md mb-6"
                />
              )}
              <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
              <p className="text-gray-700 text-lg mb-6 whitespace-pre-wrap">
                {product.description}
              </p>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-bold text-primary-600">
                  ${(product.priceCents / 100).toFixed(2)}
                </span>
                {product.salesCount > 0 && (
                  <span className="text-gray-600">{product.salesCount} sales</span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                By{' '}
                <a
                  href={`/store/${product.user.username}`}
                  className="text-primary-600 hover:underline"
                >
                  {product.user.displayName || product.user.username}
                </a>
              </p>
            </div>

            {/* Purchase Form */}
            <div>
              <div className="card sticky top-8">
                <h2 className="text-2xl font-semibold mb-6">Purchase</h2>
                <form onSubmit={handlePurchase} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="input"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      We'll send your download link here
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={processing}
                    className="btn btn-primary w-full text-lg py-3"
                  >
                    {processing ? 'Processing...' : `Buy for $${(product.priceCents / 100).toFixed(2)}`}
                  </button>

                  <div className="text-xs text-gray-600 text-center">
                    <p>Secure payment powered by Stripe</p>
                    <p>Instant delivery after purchase</p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
