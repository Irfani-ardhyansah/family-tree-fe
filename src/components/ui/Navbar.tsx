import { Users, User, Plus } from 'react-feather'; 
import { Link } from 'react-router-dom';     
import { NavLink } from 'react-router-dom';

export function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center"> 
            <Users className="text-primary-500 mr-2" size={24} />
            <span className="text-xl font-bold text-gray-800">FamilyRoots</span>
          </Link>

          <div className="hidden md:flex space-x-8">
            <NavLink 
              to="/" 
              className={({ isActive }) =>
                `font-medium transition ${
                  isActive 
                    ? 'text-primary-500' 
                    : 'text-brand-700 hover:text-primary-500' 
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/family/tree" 
              className={({ isActive }) =>
                `font-medium transition ${
                  isActive 
                    ? 'text-primary-500' 
                    : 'text-brand-700 hover:text-primary-500' 
                }`
              }
            >
              Family Tree
            </NavLink>
            <NavLink 
              to="/family/data" 
              className={({ isActive }) =>
                `font-medium transition ${
                  isActive 
                    ? 'text-primary-500' 
                    : 'text-brand-700 hover:text-primary-500' 
                }`
              }
            >
              Family Data
            </NavLink>
          </div>

          <div className="flex items-center">
            {/* <button className="flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white  font-medium py-2 px-4 rounded-full transition">
              <Plus className="mr-1" size={20} />
              Add Member
            </button> */}
            <User size={24} />
          </div>
        </div>
      </div>
    </nav>
  );
}