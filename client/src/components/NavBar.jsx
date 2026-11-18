import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavBar = ({ title, statusBadge, hotel }) => {
  const { isAuthenticated, role, username, logout } = useAuth();
  const navigate = useNavigate();

  const brandInitial = hotel?.name ? hotel.name.trim().charAt(0).toUpperCase() : 'A';
  const brandName = hotel?.name ? hotel.name.toUpperCase() : 'AURA';
  const brandSub = hotel?.name ? 'Hotel & Dining' : 'Dining';
  const primaryColor = hotel?.theme?.primaryColor || '#D97706';

  const roleLinks = {
    SUPER_ADMIN: [
      { label: 'Super Admin', path: '/superadmin' },
      { label: 'Hotel Dashboard', path: '/hotel-dashboard' },
      { label: 'Restaurant Manager', path: '/manager' },
      { label: 'Onboard Hotel', path: '/onboarding' },
    ],
    HOTEL_OWNER: [
      { label: 'Hotel Dashboard', path: '/hotel-dashboard' },
      { label: 'Restaurant Manager', path: '/manager' },
    ],
    MANAGER: [
      { label: 'Manager', path: '/manager' },
      { label: 'Waiter', path: '/waiter' },
      { label: 'Kitchen', path: '/kitchen' },
      { label: 'Onboard Hotel', path: '/onboarding' },
    ],
    WAITER: [{ label: 'Waiter', path: '/waiter' }],
    KITCHEN: [{ label: 'Kitchen', path: '/kitchen' }],
  };

  const links = isAuthenticated ? (roleLinks[role] || []) : [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-[100] w-full border-b border-charcoal-border bg-charcoal/80 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between text-cream">
        <div className="flex items-center gap-8">
          <Link to={hotel?.slug ? `/menu?hotel=${hotel.slug}` : "/"} className="flex items-center gap-2 group no-underline">
            <div 
              style={{ backgroundColor: primaryColor }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 group-hover:scale-110 transition-transform"
            >
              <span className="text-white text-xl font-black italic">{brandInitial}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-cream leading-none">{brandName}</span>
              <span style={{ color: primaryColor }} className="text-[10px] font-bold tracking-[0.2em] uppercase leading-none mt-0.5">
                {brandSub}
              </span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link key={link.path} to={link.path} className="px-4 py-2 rounded-lg text-sm font-semibold text-cream-muted hover:text-brand hover:bg-brand-light transition-all no-underline">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {title && <span className="hidden md:block text-xs font-black tracking-[0.3em] uppercase text-cream-dim">{title}</span>}
          {statusBadge}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="hidden md:block text-xs font-bold text-cream-dim">
                {username} <span className="text-brand opacity-70">· {role}</span>
              </span>
              <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-rose-400 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all cursor-pointer">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/onboarding" className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-bold text-cream-dim hover:text-brand hover:bg-brand/10 border border-transparent hover:border-brand/20 transition-all no-underline">
                🏨 Onboard Property
              </Link>
              <Link to="/login" className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-brand border border-brand/20 bg-brand/10 hover:bg-brand hover:text-white transition-all no-underline">
                Staff Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
