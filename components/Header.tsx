'use client'

import { useState } from 'react'

// Simple icon components
const Camera = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
)

const Settings = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 1v6m0 6v6"></path>
  </svg>
)

const Download = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7,10 12,15 17,10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
)

const Menu = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
)

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-500 p-2 rounded-lg">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">File Converter</h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Professional Image Processing</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
            <a href="#support" className="text-gray-600 hover:text-gray-900 transition-colors">
              Support
            </a>
          </nav>
          
          {/* Desktop Buttons */}
          <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
            <button className="btn-secondary text-xs sm:text-sm px-2 sm:px-4 py-2">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button className="btn-primary text-xs sm:text-sm px-2 sm:px-4 py-2">
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden mt-4 pt-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-3 mb-4">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors py-2">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors py-2">
                Pricing
              </a>
              <a href="#support" className="text-gray-600 hover:text-gray-900 transition-colors py-2">
                Support
              </a>
            </nav>
            
            <div className="flex flex-col space-y-2">
              <button className="btn-secondary text-sm px-4 py-3 justify-center">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
              <button className="btn-primary text-sm px-4 py-3 justify-center">
                <Download className="w-4 h-4 mr-2" />
                Download App
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
