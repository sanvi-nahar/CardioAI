import React from "react";

export default function StatCard({ label, value, icon }) {
  return (
    <div className="
      bg-white 
      p-5 
      rounded-2xl 
      shadow-sm 
      border border-slate-200 
      hover:shadow-md 
      transition-all 
      duration-300
      cursor-pointer
    ">
      <div className="flex items-center gap-4">

        {/* Icon container */}
        <div className="
          w-14 h-14 
          rounded-xl 
          flex items-center justify-center
          bg-gradient-to-br from-blue-100 to-blue-200
          text-blue-600
          shadow-inner
        ">
          {icon}
        </div>

        {/* Text section */}
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <h2 className="text-3xl font-bold text-slate-800 mt-1">{value}</h2>
        </div>

      </div>
    </div>
  );
}
