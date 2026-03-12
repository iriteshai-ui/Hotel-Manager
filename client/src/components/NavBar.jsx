import { Link } from 'react-router-dom';

const NavBar = ({ title, statusBadge }) => {
  return (
    <nav className="sticky top-0 z-[100] w-full border-b border-charcoal-border bg-charcoal/80 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between text-cream">
        {/* Left: Branding */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group no-underline">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center shadow-lg shadow-brand/20 group-hover:scale-110 transition-transform">
              <span className="text-white text-xl font-black italic">A</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-cream leading-none">AURA</span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-brand uppercase leading-none mt-0.5">Dining</span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Menu', path: '/menu' },
              { label: 'Kitchen', path: '/kitchen' },
              { label: 'Waiter', path: '/waiter' },
              { label: 'Manager', path: '/manager' },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-cream-muted hover:text-brand hover:bg-brand-light transition-all no-underline"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Dynamic Title / Status */}
        <div className="flex items-center gap-6">
          {title && (
            <h1 className="hidden sm:block text-sm font-bold tracking-widest uppercase text-cream-dim border-l border-charcoal-border pl-6">
              {title}
            </h1>
          )}
          {statusBadge}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
