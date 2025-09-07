import React from 'react';
import { Header, Footer } from '../components';

const PublicLayout = ({ children, onLoginClick }) => {
    return (
            <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-zinc-900">
            <Header onLoginClick={onLoginClick} />
            <main className="container mx-auto px-6 py-8 flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;