import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavBar = ({ title, statusBadge, hotel }) => {
  const { isAuthenticated, role, roles, username, fullName, logout, isSuperAdmin, isHotelOwner, isManager, isWaiter, isKitchen, canAccessModule } = useAuth();
  const navigate = useNavigate();

  const brandInitial = hotel?.name ? hotel.name.trim().charAt(0).toUpperCase() : 'A';
  const brandName = hotel?.name ? hotel.name.toUpperCase() : 'AURA';
  const brandSub = hotel?.name ? `${hotel.name} • Hotel & Restaurant` : 'Hotel & Restaurant OS';
  const primaryColor = hotel?.theme?.primaryColor || '#D97706';

  const displayRole = isSuperAdmin ? 'Platform Admin' :
                      isHotelOwner ? 'Hotel Owner' :
                      isManager ? 'Manager' :
                      isWaiter ? 'Staff / Waiter' :
                      isKitchen ? 'Kitchen Chef' : (role || 'Staff');

  // Build clean, human-readable navigation links
  let navLinks = [];

  if (isAuthenticated) {
    if (isSuperAdmin) {
      navLinks = [
        { label: 'Super Admin', path: '/superadmin' },
        { label: 'Hotel Dashboard', path: '/hotel-dashboard' },
        { label: 'Dining Tables & POS', path: '/hotel-dashboard?tab=dining-tables' },
        { label: 'Kitchen KDS', path: '/kitchen' },
        { label: 'Waiter View', path: '/waiter' },
      ];
    } else {
      navLinks.push({ label: 'Dining Dashboard', path: '/hotel-dashboard?tab=dining-dashboard' });
      navLinks.push({ label: 'Order Management', path: '/hotel-dashboard?tab=order-management' });
      navLinks.push({ label: 'Table Management', path: '/hotel-dashboard?tab=table-management' });
      navLinks.push({ label: 'Menu Management', path: '/hotel-dashboard?tab=menu-management' });
      navLinks.push({ label: 'Sales & Billing', path: '/hotel-dashboard?tab=sales-billing' });

      if (role === 'WAITER' || (roles && roles.includes('STAFF'))) {
        navLinks.push({ label: 'Waiter View', path: '/waiter' });
      }
      if (role === 'KITCHEN') {
        navLinks.push({ label: 'Kitchen Display', path: '/kitchen' });
      }
    }
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-[100] w-full border-b border-charcoal-border bg-charcoal/90 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between text-cream">
        <div className="flex items-center gap-6">
          <Link to={hotel?.slug ? `/menu?hotel=${hotel.slug}` : "/"} className="flex items-center gap-2.5 group no-underline">
            <div 
              style={{ backgroundColor: primaryColor }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 group-hover:scale-105 transition-transform"
            >
              <span className="text-white text-xl font-black italic">{brandInitial}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-cream leading-tight">{brandName}</span>
              <span style={{ color: primaryColor }} className="text-[10px] font-bold tracking-wider uppercase leading-none mt-0.5">
                {brandSub}
              </span>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className="px-3 py-1.5 rounded-lg text-xs font-bold text-cream-muted hover:text-white hover:bg-white/10 transition-all no-underline whitespace-nowrap">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {title && <span className="hidden sm:block text-xs font-black tracking-widest uppercase text-cream-dim">{title}</span>}
          {statusBadge}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-cream truncate max-w-[150px]">
                  {fullName || username}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap mt-0.5">
                  {displayRole}
                </span>
              </div>
              <button onClick={handleLogout} className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-rose-300 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all cursor-pointer">
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
