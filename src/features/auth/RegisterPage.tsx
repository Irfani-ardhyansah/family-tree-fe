import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users } from 'react-feather';

// Komponen ini akan dibungkus oleh AuthLayout melalui Router
export function RegisterPage() {
  // 1. State untuk mengontrol semua input
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 2. Hook untuk redirect setelah register
  const navigate = useNavigate();

  // 3. Fungsi untuk menangani submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 4. Validasi password
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return; // Hentikan eksekusi
    }

    // Di aplikasi sungguhan, Anda akan kirim ini ke API Go
    console.log('Registration attempt:', { fullName, email, password });
    
    // Untuk demo, kita langsung redirect ke halaman login
    navigate('/login'); 
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
      <div className="text-center mb-8">
        {/* Ikon diganti ke komponen react-feather */}
        <Users className="text-primary-500 w-12 h-12 mx-auto" />
        <h1 className="text-2xl font-bold text-brand-700 mt-4">Create Account</h1>
        <p className="text-gray-600">Join FamilyRoots to start building your family tree</p>
      </div>

      {/* Form dihubungkan ke handler */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="fullName" // <-- 'for' menjadi 'htmlFor'
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name
          </label>
          <input 
            type="text" 
            id="fullName" 
            name="fullName" 
            required 
            value={fullName} // <-- Hubungkan ke state
            onChange={(e) => setFullName(e.target.value)} // <-- Hubungkan ke state
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            autoComplete="name"
          />
        </div>
        
        <div>
          <label 
            htmlFor="email" 
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
            htmlFor="password" 
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
            autoComplete="new-password"
          />
        </div>

        <div>
          <label 
            htmlFor="confirmPassword" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm Password
          </label>
          <input 
            type="password" 
            id="confirmPassword" 
            name="confirmPassword" 
            required
            value={confirmPassword} // <-- Hubungkan ke state
            onChange={(e) => setConfirmPassword(e.target.value)} // <-- Hubungkan ke state
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            autoComplete="new-password"
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition"
        >
          Register
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">Already have an account? 
          {/* Link diganti ke komponen React Router */}
          <Link 
            to="/login" // <-- Ganti ke <Link>
            className="text-primary-500 hover:text-primary-600 font-medium ml-1"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}