import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import PrivateRoute from "../routes/PrivateRoute";

export default function ProtectedLayout() {
    return (
        <PrivateRoute>
            <div className="h-screen flex bg-slate-100">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-auto p-6 bg-slate-100">
                        <Outlet />
                    </main>
                </div>
            </div>
        </PrivateRoute>
    );
}
