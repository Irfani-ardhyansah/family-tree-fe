
import { 
    Heart, Camera, Calendar, Users,
    Gift, Home, ChevronRight, Edit,
    Plus, Image
} from 'react-feather'; 
import { useState } from 'react';

export function DashboardPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center">
                    <div className="bg-primary-100 p-3 rounded-full mr-4">
                        <Users className="text-primary-500" size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Total Members</p>
                        <h3 className="text-2xl font-bold text-gray-800">42</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center">
                    <div className="bg-secondary-100 p-3 rounded-full mr-4">
                        <Heart className="text-secondary-500" size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Generations</p>
                        <h3 className="text-2xl font-bold text-gray-800">5</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center">
                    <div className="bg-primary-100 p-3 rounded-full mr-4">
                        <Camera className="text-primary-500" size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Family Photos</p>
                        <h3 className="text-2xl font-bold text-gray-800">128</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center">
                    <div className="bg-secondary-100 p-3 rounded-full mr-4">
                        <Calendar className="text-secondary-500" size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Upcoming Events</p>
                        <h3 className="text-2xl font-bold text-gray-800">3</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Recent Activities</h2>
                        <a href="#" className="text-primary-500 text-sm">View All</a>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <div className="bg-primary-100 p-2 rounded-full mr-4">
                                <Edit className="text-primary-500" size={24} />
                            </div>
                            <div>
                                <p className="font-medium">John updated profile information</p>
                                <p className="text-gray-500 text-sm">2 hours ago</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="bg-secondary-100 p-2 rounded-full mr-4">
                                <Plus className="text-secondary-500" size={24} />
                            </div>
                            <div>
                                <p className="font-medium">Sarah added a new family member</p>
                                <p className="text-gray-500 text-sm">5 hours ago</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="bg-primary-100 p-2 rounded-full mr-4">
                                <Image className="text-primary-500" size={24} />
                            </div>
                            <div>
                                <p className="font-medium">Michael uploaded new photos</p>
                                <p className="text-gray-500 text-sm">1 day ago</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
                    <div className="space-y-4">
                        <button className="w-full bg-primary-500 hover:bg-primary-600 text-white px-4 py-3 rounded-lg transition flex items-center justify-between">
                            <span>View Family Tree</span>
                            <ChevronRight size={24} />
                        </button>
                        <button className="w-full bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-3 rounded-lg transition flex items-center justify-between">
                            <span>Add New Member</span>
                            <ChevronRight size={24} />
                        </button>
                        <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg transition flex items-center justify-between">
                            <span>Share with Family</span>
                            <ChevronRight size={24} />
                        </button>
                        <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg transition flex items-center justify-between">
                            <span>Family Statistics</span>
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Upcoming Events</h2>
                    <a href="#" className="text-primary-500 text-sm">View All</a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center mb-3">
                            <div className="bg-primary-100 text-primary-500 p-2 rounded-full mr-3">
                                <Gift className="text-primary-500" size={24} />
                            </div>
                            <h3 className="font-medium">Birthday</h3>
                        </div>
                        <p className="text-gray-700">Emily's Birthday</p>
                        <p className="text-gray-500 text-sm mt-2">May 15, 2023</p>
                    </div>
                    <div className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center mb-3">
                            <div className="bg-secondary-100 text-secondary-500 p-2 rounded-full mr-3">
                                <Heart className="text-secondary-500" size={24} />
                            </div>
                            <h3 className="font-medium">Anniversary</h3>
                        </div>
                        <p className="text-gray-700">John & Sarah</p>
                        <p className="text-gray-500 text-sm mt-2">June 2, 2023</p>
                    </div>
                    <div className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center mb-3">
                            <div className="bg-primary-100 text-primary-500 p-2 rounded-full mr-3">
                                <Home className="text-primary-500" size={24} />
                            </div>
                            <h3 className="font-medium">Reunion</h3>
                        </div>
                        <p className="text-gray-700">Summer Family Reunion</p>
                        <p className="text-gray-500 text-sm mt-2">July 20, 2023</p>
                    </div>
                </div>
            </div>
        </>
    )
}