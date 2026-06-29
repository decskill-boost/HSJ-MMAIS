import { Outlet, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuthActions } from "../hooks/useAuthActions";

export const Layout = () => {
  const navigate = useNavigate();
  // Desestruturamos a lógica vinda do ficheiro à parte
  const { user, handleLogin, handleLogout } = useAuthActions();

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50">
      <Navbar
        user={user}
        onLoginClick={() => navigate("/login")}
        onLogoutClick={handleLogout}
      />
      <main className="flex flex-1 flex-col pb-16">
        {/* O Outlet continua a passar o contexto exatamente igual */}
        <Outlet context={{ user, handleLogin, handleLogout }} />
      </main>
      <Footer />
    </div>
  );
};
