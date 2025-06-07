import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth(); 
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null); 

    // Validate form
    if (!email.trim()) {
      setFormError('Please enter your email');
      return;
    }

    if (!password) {
      setFormError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/setup'); // Navigate on successful login
    } catch (err) {
      // Handle errors thrown by the login function from AuthContext
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('An unknown login error occurred.');
      }
      console.error("Login page error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-transition container mx-auto px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="card">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground">
              Log in to continue your interview practice
            </p>
          </div>

          {formError && ( // Use formError here
            <div className="mb-6 flex items-start rounded-md bg-destructive/10 p-3 text-destructive">
              <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <p>{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input w-full"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="label mb-0">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                className="input w-full"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center space-x-1 text-sm">
            <span className="text-muted-foreground">Don't have an account?</span>
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </div>

          <div className="mt-6 rounded-md bg-muted p-4 text-center text-sm text-muted-foreground">
            <p>For demo purposes, you can log in with any email and password.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;