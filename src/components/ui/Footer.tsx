export function Footer() {
    return (
        <footer className="bg-gray-100 py-6 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-gray-600">© 2023 FamilyRoots Explorer. All rights reserved.</p>
                <div className="flex justify-center space-x-6 mt-4">
                    <a href="#" className="text-gray-500 hover:text-primary-500 transition"><i data-feather="facebook"></i></a>
                    <a href="#" className="text-gray-500 hover:text-primary-500 transition"><i data-feather="twitter"></i></a>
                    <a href="#" className="text-gray-500 hover:text-primary-500 transition"><i data-feather="instagram"></i></a>
                    <a href="#" className="text-gray-500 hover:text-primary-500 transition"><i data-feather="linkedin"></i></a>
                </div>
            </div>
        </footer>
    )
}