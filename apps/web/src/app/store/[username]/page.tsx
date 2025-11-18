import Link from 'next/link';
import api from '@/lib/api';
import type { StorefrontData } from '@commerce/types';

async function getStorefront(username: string): Promise<StorefrontData | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/store/${username}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    return null;
  }
}

export default async function StorefrontPage({
  params,
}: {
  params: { username: string };
}) {
  const data = await getStorefront(params.username);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Store Not Found</h1>
          <p className="text-gray-600">This creator's storefront doesn't exist.</p>
        </div>
      </div>
    );
  }

  const { user, products } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Creator Profile */}
          <div className="text-center mb-12">
            {user.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={user.displayName || user.username}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
            )}
            <h1 className="text-4xl font-bold mb-2">
              {user.displayName || user.username}
            </h1>
            {user.bio && <p className="text-gray-600 text-lg">{user.bio}</p>}
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600">No products available yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/store/${user.username}/${product.slug}`}
                  className="card hover:shadow-lg transition"
                >
                  {product.coverImageUrl && (
                    <img
                      src={product.coverImageUrl}
                      alt={product.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h2 className="text-2xl font-semibold mb-2">{product.title}</h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {product.description || 'No description'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold text-primary-600">
                      ${(product.priceCents / 100).toFixed(2)}
                    </span>
                    {product.salesCount > 0 && (
                      <span className="text-sm text-gray-500">
                        {product.salesCount} sales
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
