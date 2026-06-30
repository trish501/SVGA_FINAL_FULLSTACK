import React from "react";
import { BookOpen, Mail, Phone, Instagram, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer id="about" className="bg-slate-50 pt-20 pb-10 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Identity & Mission */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white shadow-sm">
                <BookOpen size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-slate-800 leading-none">
                  SVGA
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Book-Bank
                </span>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Our mission is to ensure that no student is deprived of educational resources due to financial constraints. Empowering students, one book at a time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-slate-800 mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {['Home', 'Sponsors', 'Features', 'Workflow', 'Location'].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`} className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-slate-800 mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Email</p>
                  <a href="mailto:support@svgabookbank.edu" className="text-sm text-slate-500 hover:text-blue-600">
                    support@svgabookbank.edu
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Phone</p>
                  <a href="tel:+911234567890" className="text-sm text-slate-500 hover:text-blue-600">
                    +91 123 456 7890
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h4 className="font-bold text-slate-800 mb-6">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 transition-all">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} SVGA Book Bank. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-800">Privacy Policy</a>
            <a href="#" className="hover:text-slate-800">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
