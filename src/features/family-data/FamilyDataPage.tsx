import { useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PersonFormModal } from './components/PersonFormModal';

import { 
  Plus, 
  Users, 
  Heart, 
  Camera, 
  Calendar, 
  Edit, 
  Trash2 
} from 'react-feather';

type Person = {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  relationship: string;
  status: string;
};

const MOCK_TABLE_DATA = [
  { id: '1', name: 'John Doe', gender: 'Male', birthDate: '1980-05-20', relationship: 'Self', status: 'Alive' },
  { id: '2', name: 'Jane Doe', gender: 'Female', birthDate: '1982-11-30', relationship: 'Spouse', status: 'Alive' },
  { id: '3', name: 'Kakek Buyut', gender: 'Male', birthDate: '1930-10-10', relationship: 'Grandfather', status: 'Deceased' },
  { id: '4', name: 'Nenek Buyut', gender: 'Female', birthDate: '1932-01-15', relationship: 'Grandmother', status: 'Deceased' },
];

export function FamilyDataPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [familyData, setFamilyData] = useState(MOCK_TABLE_DATA);
  
  const openAddModal = () => {
    setPersonToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (person: Person) => {
    setPersonToEdit(person); // Set data (mode Edit)
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPersonToEdit(null); // Selalu reset saat ditutup
  };

  const handleDelete = (personId: string, personName: string) => {
    if (window.confirm(`Are you sure you want to delete ${personName}?`)) {
      
      setFamilyData(currentData => {
        return currentData.filter(person => person.id !== personId);
      });

      console.log("Deleted person:", personId);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-brand-700">Family Data</h1>
          <button 
            onClick={openAddModal} 
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition flex items-center"
          >
              <Plus className="mr-2" size={20} />
              Add Member
          </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birth Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {familyData.map((person) => (
                        <tr key={person.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-brand-700">{person.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.gender}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.birthDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.relationship}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              person.status === 'Alive' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {person.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                            <button className="text-primary-500 hover:text-primary-600"
                                onClick={() => openEditModal(person)}
                            >
                              <Edit size={18} />
                            </button>
                            <button className="text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(person.id, person.name)}
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      <PersonFormModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        personToEdit={personToEdit} // <-- Kirim data edit ke modal
      />

    </>
  );
}