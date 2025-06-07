import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null); // Renamed
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth(); // Removed error
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null); // Clear previous errors

    // Validate form
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Please enter your full name');
      return;
    }

    if (!email.trim()) {
      setFormError('Please enter your email');
      return;
    }

    if (!password) {
      setFormError('Please enter a password');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    // Split name into firstName and lastName
    const nameParts = trimmedName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    setIsSubmitting(true);
    try {
      const userData = {
        firstName,
        lastName: lastName || '', // Handle cases where only first name is entered
        email: email.trim(),
        password,
        role: 'candidate' as 'candidate' | 'hr', // Default role for public signup
        // company and position are optional and not collected here
      };
      await signup(userData); // Pass a single object
      navigate('/setup'); // Navigate on successful signup
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('An unknown signup error occurred.');
      }
      console.error("Signup page error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-transition container mx-auto px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="card">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold">Create an Account</h1>
            <p className="text-muted-foreground">
              Sign up to start practicing your interview skills
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
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                className="input w-full"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

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

            <div className="mb-4">
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input w-full"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="input w-full"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center space-x-1 text-sm">
            <span className="text-muted-foreground">Already have an account?</span>
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </div>

          <div className="mt-6 rounded-md bg-muted p-4">
            <h3 className="mb-2 font-semibold">By signing up, you get:</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-sm">
                <CheckCircle2 size={16} className="mr-2 text-success" />
                <span>Unlimited practice interviews</span>
              </li>
              <li className="flex items-center text-sm">
                <CheckCircle2 size={16} className="mr-2 text-success" />
                <span>AI-powered performance analysis</span>
              </li>
              <li className="flex items-center text-sm">
                <CheckCircle2 size={16} className="mr-2 text-success" />
                <span>Personalized improvement recommendations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;