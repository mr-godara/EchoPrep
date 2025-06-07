import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, UserPlus, LogOut, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { cn } from '../lib/utils.js';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;
  
  // Determine dashboard path based on user role
  const dashboardPath = user ? `/${user.role}/dashboard` : '/login';

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">EchoPrep</span>
        </Link>

        {/* Desktop menu */}
        <nav className="hidden md:flex md:items-center md:space-x-6">
          <Link 
            to="/" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground/80",
              isActive('/') ? "text-foreground" : "text-foreground/60"
            )}
          >
            Home
          </Link>
          {user ? (
            <>
              <Link 
                to={dashboardPath}
                className={cn(
                  "flex items-center space-x-1 text-sm font-medium transition-colors hover:text-foreground/80",
                  isActive(dashboardPath) ? "text-foreground" : "text-foreground/60"
                )}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/setup" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground/80",
                  isActive('/setup') ? "text-foreground" : "text-foreground/60"
                )}
              >
                New Interview
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-1 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground/80"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={cn(
                  "flex items-center space-x-1 text-sm font-medium transition-colors hover:text-foreground/80",
                  isActive('/login') ? "text-foreground" : "text-foreground/60"
                )}
              >
                <LogIn size={16} />
                <span>Login</span>
              </Link>
              <Link 
                to="/signup" 
                className="btn btn-primary flex items-center space-x-1"
              >
                <UserPlus size={16} />
                <span>Sign Up</span>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <button 
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="container mx-auto px-4 py-4 md:hidden">
          <nav className="flex flex-col space-y-4">
            <Link 
              to="/"
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground/80",
                isActive('/') ? "text-foreground" : "text-foreground/60"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {user ? (
              <>
                <Link 
                  to={dashboardPath}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-foreground/80",
                    isActive(dashboardPath) ? "text-foreground" : "text-foreground/60"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  to="/setup"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-foreground/80",
                    isActive('/setup') ? "text-foreground" : "text-foreground/60"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  New Interview
                </Link>
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-1 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground/80"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login"
                  className={cn(
                    "flex items-center space-x-1 text-sm font-medium transition-colors hover:text-foreground/80",
                    isActive('/login') ? "text-foreground" : "text-foreground/60"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn size={16} />
                  <span>Login</span>
                </Link>
                <Link 
                  to="/signup"
                  className="btn btn-primary flex w-full items-center justify-center space-x-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserPlus size={16} />
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;