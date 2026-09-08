import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users } from 'react-feather';
import { appPaths } from '@/shared/routes';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    console.log('Registration attempt:', { fullName, email, password });
    navigate(appPaths.login);
  };

  const fieldClass =
    'w-full rounded-xl border border-suite-border bg-suite-soft px-4 py-2.5 text-suite-ink placeholder:text-suite-faint focus:border-primary-500 focus:bg-suite-surface focus:outline-none focus:ring-1 focus:ring-primary-500';
  const labelClass = 'mb-1.5 block text-sm font-medium text-suite-muted';

  return (
    <div className="rounded-[28px] border border-suite-border/80 bg-suite-surface/90 p-6 shadow-card backdrop-blur-md sm:p-8">
      <div className="mb-8 text-center">
        <Users className="mx-auto h-10 w-10 text-primary-500" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-suite-ink">
          Create Account
        </h1>
        <p className="mt-2 text-sm text-suite-muted">
          Join Family Suite to start building your family tree
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className={labelClass}>
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={fieldClass}
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={fieldClass}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary-500 px-4 py-3 font-semibold text-white transition hover:bg-primary-600"
        >
          Register
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-suite-muted">
          Already have an account?
          <Link
            to={appPaths.login}
            className="ml-1 font-semibold text-primary-400 hover:text-primary-300"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
