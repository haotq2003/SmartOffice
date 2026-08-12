'use client';

import React from 'react';

interface NavbarProps {
    onLoginClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick }) => {
    return (
        <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
                        </div>
                        <span className="text-xl font-bold text-gray-900">Smart Office</span>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#" className="text-sm font-medium text-gray-600 hover:text-blue-600">Features</a>
                        <a href="#" className="text-sm font-medium text-gray-600 hover:text-blue-600">Pricing</a>
                        <a href="#" className="text-sm font-medium text-gray-600 hover:text-blue-600">Resources</a>
                        <button onClick={onLoginClick} className="text-sm font-medium text-gray-600 hover:text-blue-600">Login</button>
                        <button onClick={onLoginClick} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
