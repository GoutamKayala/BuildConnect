import React from 'react';
import { Link } from 'react-router-dom';
import { Palette, LayoutGrid, Hammer, Layers, Zap, Droplet, Brush, Home as HomeIcon } from 'lucide-react';

export const Categories = () => {
  const categoriesList = [
    { name: 'Interior Design', icon: Palette, desc: 'Complete 3BHK, villa & office space design with 3D renders.' },
    { name: 'Modular Kitchen', icon: LayoutGrid, desc: 'Acrylic, veneer, and PU finish kitchens with Blum fittings.' },
    { name: 'Carpentry', icon: Hammer, desc: 'Custom wardrobes, TV units, teak furniture, and wooden partitions.' },
    { name: 'False Ceiling', icon: Layers, desc: 'Gypsum, POP ceiling design with LED profile lighting.' },
    { name: 'Painting', icon: Brush, desc: 'Royal texture painting, exterior weatherproof coating & waterproofing.' },
    { name: 'Electrical Work', icon: Zap, desc: 'Wiring, MCB setup, smart home automation & concealed lighting.' },
    { name: 'Plumbing', icon: Droplet, desc: 'Bathroom sanitary installation, pressure pumps & piping.' },
    { name: 'Architecture', icon: HomeIcon, desc: 'Structural planning, elevation designs & Municipal approvals.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl font-extrabold text-slate-900">Service Categories</h1>
        <p className="text-sm text-slate-500">Discover specialized professionals across every interior design & renovation category</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categoriesList.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <Link
              key={i}
              to={`/workers?category=${encodeURIComponent(cat.name)}`}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition space-y-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cat.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
