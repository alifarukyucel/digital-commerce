import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <nav className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">Digital Commerce</h1>
          <div className="space-x-4">
            <Link href="/login" className="btn btn-secondary">
              Log In
            </Link>
            <Link href="/signup" className="btn btn-primary">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            Sell Digital Products
            <br />
            <span className="text-primary-600">With Ease</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            A minimalistic platform for creators to sell ebooks, courses, software, and more.
            No complexity, just results.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup" className="btn btn-primary text-lg px-8 py-3">
              Start Selling
            </Link>
            <Link href="#features" className="btn btn-secondary text-lg px-8 py-3">
              Learn More
            </Link>
          </div>
        </div>

        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="card">
            <h3 className="text-xl font-semibold mb-3">Instant Setup</h3>
            <p className="text-gray-600">
              Create your storefront and start selling in minutes. No technical knowledge required.
            </p>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-3">Secure Payments</h3>
            <p className="text-gray-600">
              Powered by Stripe for secure, reliable payment processing worldwide.
            </p>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-3">Automatic Delivery</h3>
            <p className="text-gray-600">
              Files are delivered instantly after purchase. No manual work needed.
            </p>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <p className="text-center text-gray-600">
          © 2025 Digital Commerce. Built with Next.js and Express.
        </p>
      </footer>
    </div>
  );
}
