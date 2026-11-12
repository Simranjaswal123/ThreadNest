import { Link } from 'react-router-dom';

// The bottom of every page: a "Back to top" bar and a few useful links.
export default function Footer() {
  return (
    <footer className="mt-12 text-sm text-white">
      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="block w-full bg-ink-soft py-4 text-center font-medium hover:bg-ink-light">
        Back to top
      </button>

      <div className="bg-ink-light">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div>
            <h2 className="mb-3 text-base font-bold">Get to know us</h2>
            <p className="text-slate-300">
              Threadnest is a small shop for everyday basics: T-shirts, hoodies, caps, tote bags and socks.
            </p>
          </div>
          <div>
            <h2 className="mb-3 text-base font-bold">Your account</h2>
            <ul className="space-y-2 text-slate-300">
              <li><Link to="/" className="hover:underline">Shop all products</Link></li>
              <li><Link to="/cart" className="hover:underline">Your cart</Link></li>
              <li><Link to="/orders" className="hover:underline">Returns &amp; orders</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-base font-bold">Good to know</h2>
            <ul className="space-y-2 text-slate-300">
              <li>Cancel any order until it is shipped.</li>
              <li>Payments in this demo shop are simulated.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-ink py-4 text-center text-xs text-slate-300">
        © 2026 Threadnest.
      </div>
    </footer>
  );
}
