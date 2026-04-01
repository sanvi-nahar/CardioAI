import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin text-blue-500 text-4xl">⏳</div>
      </div>
    );
  }

  // If no user/token is in the final context state, restrict execution
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
