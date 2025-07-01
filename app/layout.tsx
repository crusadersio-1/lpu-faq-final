import './globals.css';
import type { Metadata } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import Link from 'next/link';

// Configure fonts
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const merriweather = Merriweather({ 
  subsets: ['latin'], 
  weight: ['400', '700'],
  variable: '--font-merriweather' 
});

export const metadata: Metadata = {
  title: 'LPU FAQ Assistant',
  description: 'Admin dashboard for managing LPU FAQ content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable} scroll-smooth`}>
      <body className="font-sans min-h-screen flex flex-col">
        {children}
        <footer className="bg-[#8B0000] text-white mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {/* University Info */}
              <div className="space-y-4 text-center sm:text-left">
                <h3 className="text-lg font-bold">LYCEUM OF THE PHILIPPINES UNIVERSITY</h3>
                <p className="text-sm text-gray-200">Learn Different. Live Different.</p>
                <div className="flex justify-center sm:justify-start space-x-4">
                  <a href="https://www.facebook.com/LPUManila" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/></svg>
                  </a>
                  <a href="https://www.instagram.com/lpumanilaofficial/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                  <a href="https://www.linkedin.com/company/lyceum-of-the-philippines-university-manila" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li><Link href="/" className="text-gray-200 hover:text-white">Home</Link></li>
                  <li><Link href="/faq" className="text-gray-200 hover:text-white">FAQ</Link></li>
                  <li><Link href="/contact" className="text-gray-200 hover:text-white">Contact</Link></li>
                  <li><Link href="/admin" className="text-gray-200 hover:text-white">Admin Panel</Link></li>
                </ul>
              </div>

              {/* Contact Info */}
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold mb-4">Contact Us</h3>
                <ul className="space-y-2 text-gray-200">
                  <li>General Luna St, corner Muralla St</li>
                  <li>Intramuros, Manila, 1002</li>
                  <li>Metro Manila, Philippines</li>
                  <li>Phone: (555) 123-4567</li>
                  <li>Email: info@lpu.edu.ph</li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-300 mt-8 pt-4">
              <p className="text-center text-sm">
                &copy; {new Date().getFullYear()} Lyceum of the Philippines University. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
