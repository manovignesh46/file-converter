'use client'

import { useState, useEffect } from 'react'

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

const Info = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
)

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAbout(false)
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

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
            <a href="#features" className="text-gray-400 cursor-not-allowed pointer-events-none">
              Features
            </a>
            <a href="#pricing" className="text-gray-400 cursor-not-allowed pointer-events-none">
              Pricing
            </a>
            <a href="#support" className="text-gray-400 cursor-not-allowed pointer-events-none">
              Support
            </a>
            <button 
              onClick={() => setShowAbout(true)}
              className="text-gray-600 hover:text-gray-900 transition-colors flex items-center"
            >
              <Info className="w-4 h-4 mr-1" />
              About
            </button>
          </nav>
          
          {/* Desktop Buttons */}
          <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
            <button className="btn-secondary text-xs sm:text-sm px-2 sm:px-4 py-2 opacity-50 cursor-not-allowed" disabled>
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button className="btn-primary text-xs sm:text-sm px-2 sm:px-4 py-2 opacity-50 cursor-not-allowed" disabled>
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
              <a href="#features" className="text-gray-400 cursor-not-allowed pointer-events-none py-2">
                Features
              </a>
              <a href="#pricing" className="text-gray-400 cursor-not-allowed pointer-events-none py-2">
                Pricing
              </a>
              <a href="#support" className="text-gray-400 cursor-not-allowed pointer-events-none py-2">
                Support
              </a>
              <button 
                onClick={() => {
                  setShowAbout(true)
                  setIsMobileMenuOpen(false)
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors py-2 flex items-center"
              >
                <Info className="w-4 h-4 mr-2" />
                About
              </button>
            </nav>
            
            <div className="flex flex-col space-y-2">
              <button className="btn-secondary text-sm px-4 py-3 justify-center opacity-50 cursor-not-allowed" disabled>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
              <button className="btn-primary text-sm px-4 py-3 justify-center opacity-50 cursor-not-allowed" disabled>
                <Download className="w-4 h-4 mr-2" />
                Download App
              </button>
            </div>
          </div>
        )}
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Info className="w-6 h-6 mr-2 text-primary-500" />
                About
              </h2>
              <button
                onClick={() => setShowAbout(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-10 h-10 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">File Converter Pro</h3>
                <p className="text-gray-600 mb-4">Professional Image Processing Tool</p>
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="text-sm text-gray-500 mb-2">Developed by:</p>
                  <p className="text-lg font-semibold text-primary-600">Manovignesh</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">
                  © 2025 File Converter Pro. All rights reserved.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAbout(false)}
              className="w-full mt-4 btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
