import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import PrivateRoute from "../routes/PrivateRoute";

export default function ProtectedLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <PrivateRoute>
            <div className="h-screen flex bg-slate-100 overflow-hidden relative">
                {/* Backdrop overlay for mobile */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
                
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <main className="flex-1 overflow-auto p-4 md:p-6 bg-slate-100">
                        <Outlet />
                    </main>
                </div>
            </div>
        </PrivateRoute>
    );
}
