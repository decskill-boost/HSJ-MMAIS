import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { UserRole } from "../types/permissions";

import WelcomePage from "../components/WelcomePage";
import PersonalInfo from "../components/PersonalInfo/PersonalInfo";
import PageNotFound from "../components/PageNotFound";
import Login from "../components/Login";
import DashboardPaciente from "../components/Dashboard/DashboardPaciente";
import DashboardCorpoClinico from "../components/Dashboard/DashboardCorpoClinico";
import DashboardAdmin from "../components/Dashboard/DashboardAdmin/DashboardAdmin";
import ExerciciosPage from "../components/Exercicios/ExerciciosPage";
import CriarPlano from "../components/CriarPlano";
import PlanosPaciente from "../components/PlanosPaciente";

import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // 🟢 ROTAS PÚBLICAS
      {
        path: "",
        element: <WelcomePage />,
      },
      {
        path: "login",
        element: <Login />,
      },

      // 🟡 ROTAS AUTENTICADAS (Apenas precisa de login, sem perfil específico)
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "perfil",
            element: <PersonalInfo />,
          },
        ],
      },

      // 🔴 ROTAS CORPO CLÍNICO (Protegidas por perfil)
      {
        element: <ProtectedRoute role={UserRole.CORPO_CLINICO} />,
        children: [
          {
            path: "dashboard/medico",
            element: <DashboardCorpoClinico />,
          },
          {
            path: "exercicios",
            element: <ExerciciosPage />,
          },
          {
            path: "plano/criar",
            element: <CriarPlano />,
          },
        ],
      },

      // 🟣 ROTAS ADMIN (Protegidas por Admin)
      {
        element: <ProtectedRoute role={UserRole.ADMIN} />,
        children: [
          {
            path: "dashboard/admin",
            element: <DashboardAdmin />,
          },
        ],
      },

      // 🔵 ROTAS PACIENTE (Protegidas por perfil)
      {
        element: <ProtectedRoute role={UserRole.PACIENTE} />,
        children: [
          {
            path: "dashboard/paciente",
            element: <DashboardPaciente />,
          },
          {
            path: "paciente/planos",
            element: <PlanosPaciente />,
          },
        ],
      },

      // ⚪ ROTA NÃO ENCONTRADA (Catch-all)
      {
        path: "*",
        element: <PageNotFound />,
      },
    ],
  },
]);