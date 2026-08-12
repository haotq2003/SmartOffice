'use client';

import React from 'react';
import Navbar from './components/Navbar';
import { Calendar, ShieldCheck, BarChart2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const LandingPage: React.FC = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/dashboard');
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar onLoginClick={handleGetStarted} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest rounded-full">
              The Future of Workspace
            </span>
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
              Optimize Your Office Resources
            </h1>
            <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
              Streamline scheduling for meeting rooms, vehicles, and equipment in one unified platform. Boost productivity and reduce overhead effortlessly.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleGetStarted}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                Start Your Free Trial
              </button>
              <button className="flex items-center gap-2 border border-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center">▶</span>
                Watch Demo
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <img className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" src="https://picsum.photos/seed/u1/40/40" alt="User 1" />
                <img className="w-8 h-8 rounded-full border-2 border-white bg-gray-300" src="https://picsum.photos/seed/u2/40/40" alt="User 2" />
                <img className="w-8 h-8 rounded-full border-2 border-white bg-gray-400" src="https://picsum.photos/seed/u3/40/40" alt="User 3" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Joined by 10k+ office managers worldwide</p>
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
            <div className="relative bg-gray-100 p-8 rounded-[40px] shadow-2xl border border-white">
              <img
                src="https://picsum.photos/seed/dashboard/800/600"
                alt="App Interface"
                className="rounded-2xl shadow-inner border border-gray-200"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-50">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Available Now</p>
                  <p className="text-sm font-bold text-gray-900">Conference Room B</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 border-y border-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">Trusted by Leading Global Companies</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale contrast-125">
            <span className="text-2xl font-black italic tracking-tighter">TECHCORP</span>
            <span className="text-2xl font-black italic tracking-tighter">VIRTUE</span>
            <span className="text-2xl font-black italic tracking-tighter">GLOBEX</span>
            <span className="text-2xl font-black italic tracking-tighter">INITECH</span>
            <span className="text-2xl font-black italic tracking-tighter">OMNI</span>
          </div>
        </div>
      </section>

      {/* Value Prop Section */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to manage workspace assets efficiently</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Our platform centralizes all office resources so you can focus on what matters: the work.</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Resource Booking', icon: Calendar, color: 'blue', desc: 'Real-time availability and instant scheduling for any office asset. From desk pods to company vans.' },
            { title: 'Approval Workflow', icon: ShieldCheck, color: 'blue', desc: 'Custom rules and automated permissions for high-value resource requests. Set limits and track hierarchies.' },
            { title: 'Usage Analytics', icon: BarChart2, color: 'blue', desc: 'Data-driven insights into how your office space and equipment are actually used. Identify underutilized assets.' }
          ].map((feat, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className={`w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6`}>
                <feat.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feat.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{feat.desc}</p>
              <a href="#" className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:gap-4 transition-all">
                Learn more <ArrowRight size={16} />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Device Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Seamless management across all devices</h2>
            <p className="text-gray-500">Manage bookings from your desk or on the move with our fully responsive mobile and tablet applications.</p>
          </div>
          <button className="px-6 py-3 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50">View All Integrations</button>
        </div>

        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square rounded-3xl overflow-hidden shadow-lg hover:scale-105 transition-transform">
              <img src={`https://picsum.photos/seed/dev${i}/500/500`} alt={`Device Preview ${i}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="px-4 py-24">
        <div className="max-w-6xl mx-auto bg-blue-600 rounded-[40px] p-12 lg:p-24 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-700 opacity-90"></div>
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-6xl font-bold mb-8">Ready to transform your workspace?</h2>
            <p className="text-xl text-blue-50 mb-12 max-w-2xl mx-auto opacity-80">Join over 500+ enterprises that trust Smart Office to manage their resources every day.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={handleGetStarted} className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl">Get Started for Free</button>
              <button className="bg-transparent border border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all">Talk to Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* Real Footer */}
      <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-white rounded-sm"></div>
              </div>
              <span className="text-lg font-bold text-gray-900">Smart Office</span>
            </div>
            <p className="text-gray-500 text-sm max-w-xs mb-8">The all-in-one workspace operating system for modern hybrid teams.</p>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">🌐</div>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">@</div>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">🔗</div>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-6">PRODUCT</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-600">Features</a></li>
              <li><a href="#" className="hover:text-blue-600">Pricing</a></li>
              <li><a href="#" className="hover:text-blue-600">Enterprise</a></li>
              <li><a href="#" className="hover:text-blue-600">Integrations</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-6">COMPANY</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-600">About Us</a></li>
              <li><a href="#" className="hover:text-blue-600">Careers</a></li>
              <li><a href="#" className="hover:text-blue-600">Blog</a></li>
              <li><a href="#" className="hover:text-blue-600">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-6">RESOURCES</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-600">Documentation</a></li>
              <li><a href="#" className="hover:text-blue-600">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-600">Community</a></li>
              <li><a href="#" className="hover:text-blue-600">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 border-t border-gray-50 pt-10">
          <p>© 2024 Smart Office SaaS. All rights reserved.</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <span>English (US)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> All Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
