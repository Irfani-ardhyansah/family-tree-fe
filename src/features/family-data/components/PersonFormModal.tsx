import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { X, User, Calendar, Heart } from 'react-feather';

type Person = {
    id: string;
    name: string;
    gender: string;
    birthDate: string;
    relationship: string;
    status: string;
};

type PersonFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    personToEdit: Person | null;
};

const MOCK_PEOPLE = [
    { id: '1', name: 'Kakek Buyut' }, 
    { id: '2', name: 'Nenek Buyut' },
    { id: '3', name: 'John Doe' },
    { id: '4', name: 'Jane Doe' },
];

export function PersonFormModal({ isOpen, onClose, personToEdit }: PersonFormModalProps) {
    const [name, setName] = useState('');
    const [gender, setGender] = useState('male');
    const [birthDate, setBirthDate] = useState('');
    
    useEffect(() => {
        if (isOpen) {
        if (personToEdit) {
            setName(personToEdit.name);
            setGender(personToEdit.gender.toLowerCase());
            setBirthDate(personToEdit.birthDate);
        } else {
            setName('');
            setGender('male');
            setBirthDate('');
        }
        }
    }, [isOpen, personToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (personToEdit) {
            console.log('Updating person:', personToEdit.id, { name, gender, birthDate });
        } else {
            console.log('Creating new person:', { name, gender, birthDate });
        }
        onClose();
    };

    return (
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={onClose}>
                    
                    {/* Backdrop (overlay) */}
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/30" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                
                                {/* Header Modal */}
                                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                                    <Dialog.Title as="h3" className="...">
                                        {personToEdit ? 'Edit Family Member' : 'Add New Family Member'}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Full Name
                                    </label>
                                    <div className="mt-1">
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                        placeholder="e.g. John Doe"
                                    />
                                    </div>
                                </div>

                                {/* Field: Gender */}
                                <div>
                                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                                        Gender
                                    </label>
                                    <select
                                        id="gender"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {/* Field: Birth Date */}
                                <div>
                                    <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                                        Birth Date
                                    </label>
                                    <input
                                        type="date"
                                        id="birthDate"
                                        value={birthDate}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                        onChange={(e) => setBirthDate(e.target.value)}
                                    />
                                </div>
                                
                                <div className="pt-2">
                                    <h4 className="text-brand-700 font-medium mb-2">Relations</h4>
                                    
                                    <label htmlFor="father" className="block text-sm font-medium text-gray-700">Father</label>
                                    <select id="father" className="mt-1 mb-3 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                                        <option value="">Unknown</option>
                                        {MOCK_PEOPLE.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    
                                    <label htmlFor="mother" className="block text-sm font-medium text-gray-700">Mother</label>
                                    <select id="mother" className="mt-1 mb-3 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                                    <option value="">Unknown</option>
                                        {MOCK_PEOPLE.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>


                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                            >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex items-center justify-center rounded-lg border border-transparent bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 focus:outline-none"
                                            >
                                            {personToEdit ? 'Save Changes' : 'Save Member'}
                                        </button>
                                    </div>
                                </form>

                            </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
    );
}