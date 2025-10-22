import React from 'react';

type AuthLayoutProps = {
    children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
            {children}
        </div>
    );
}