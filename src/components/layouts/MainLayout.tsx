import React from 'react';
import { Navbar } from '@/components/ui/Navbar'; 
import { Footer } from '@/components/ui/Footer'; 

type MainLayoutProps = {
  children: React.ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-100">
        <Navbar />

        <main>
            <div className="mx-auto max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {children}
            </div>
        </main>

        <Footer />
        
        </div>
    );
}