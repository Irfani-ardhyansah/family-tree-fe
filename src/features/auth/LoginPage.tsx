import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users } from 'react-feather';
import { AuthLayout } from '@/components/layouts/AuthLayout';
// Komponen ini akan dibungkus oleh AuthLayout melalui Router
export function LoginPage() {
  // 1. State untuk mengontrol input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 2. Hook untuk redirect setelah login
  const navigate = useNavigate();

  // 3. Fungsi untuk menangani submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Di aplikasi sungguhan, Anda akan kirim ini ke API Go
    console.log('Login attempt:', { email, password });
    
    // Untuk demo, kita langsung redirect ke dashboard
    // Ini adalah cara SPA, tidak me-refresh halaman
    navigate('/dashboard'); 
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
    <div className="text-center mb-8">
        {/* 4. Ikon diganti ke komponen react-feather */}
        <Users className="text-primary-500 w-12 h-12 mx-auto" />
        <h1 className="text-2xl font-bold text-brand-700 mt-4">Welcome Back</h1>
        <p className="text-gray-600">Login to your FamilyRoots account</p>
    </div>

    {/* 5. Form dihubungkan ke handler */}
    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
        <label 
            htmlFor="email" // <-- 'for' menjadi 'htmlFor'
            className="block text-sm font-medium text-gray-700 mb-1"
        >
            Email
        </label>
        <input 
            type="email" 
            id="email" 
            name="email" 
            required 
            value={email} // <-- Hubungkan ke state
            onChange={(e) => setEmail(e.target.value)} // <-- Hubungkan ke state
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            autoComplete="email"
        />
        </div>
        <div>
        <label 
            htmlFor="password" // <-- 'for' menjadi 'htmlFor'
            className="block text-sm font-medium text-gray-700 mb-1"
        >
            Password
        </label>
        <input 
            type="password" 
            id="password" 
            name="password" 
            required
            value={password} // <-- Hubungkan ke state
            onChange={(e) => setPassword(e.target.value)} // <-- Hubungkan ke state
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            autoComplete="current-password"
        />
        </div>
        <div className="flex items-center justify-between">
        <div className="flex items-center">
            <input 
            id="remember" 
            name="remember" 
            type="checkbox" 
            className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded" 
            />
            <label 
            htmlFor="remember" // <-- 'for' menjadi 'htmlFor'
            className="ml-2 block text-sm text-gray-700"
            >
            Remember me
            </label>
        </div>
        <a href="#" className="text-sm text-primary-500 hover:text-primary-600">
            Forgot password?
        </a>
        </div>
        <button 
        type="submit" 
        className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition"
        >
        Login
        </button>
    </form>

    <div className="mt-6 text-center">
        <p className="text-gray-600">Don't have an account? 
        {/* 6. Link diganti ke komponen React Router */}
        <Link 
            to="/register" // <-- Ganti ke <Link>
            className="text-primary-500 hover:text-primary-600 font-medium ml-1"
        >
            Register
        </Link>
        </p>
    </div>
    </div>
  );
}