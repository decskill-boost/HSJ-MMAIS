import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { UserRole } from "../types/permissions";

// Primeira pintura: carregadas de imediato
import WelcomePage from "../components/WelcomePage";
import PageNotFound from "../components/PageNotFound";
import Login from "../components/Login";

// Restantes rotas: code-splitting — cada perfil só descarrega o que usa
const MissaoProposito = lazy(() => import("../components/MissaoProposito"));
const PersonalInfo = lazy(() => import("../components/PersonalInfo"));
const DashboardPaciente = lazy(
  () => import("../components/Dashboard/DashboardPaciente"),
);
const DashboardCorpoClinico = lazy(
  () => import("../components/Dashboard/DashboardCorpoClinico"),
);
const PlanosCorpoClinico = lazy(
  () => import("../components/Dashboard/PlanosCorpoClinico"),
);
const PacienteDetalhe = lazy(
  () => import("../components/Dashboard/PacienteDetalhe"),
);
const DashboardAdmin = lazy(
  () => import("../components/Dashboard/DashboardAdmin/DashboardAdmin"),
);
const ExerciciosPage = lazy(
  () => import("../components/Exercicios/ExerciciosPage"),
);
const CriarPlano = lazy(() => import("../components/CriarPlano"));
const PlanosPaciente = lazy(() => import("../components/PlanosPaciente"));
const PacientesList = lazy(
  () => import("../components/Pacientes/PacientesList"),
);
const PacientePerfil = lazy(
  () => import("../components/Pacientes/PacientePerfil"),
);

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
        path: "missao",
        element: <MissaoProposito />,
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
            path: "dashboard/medico/pacientes",
            element: <PlanosCorpoClinico />,
          },
          {
            path: "dashboard/medico/pacientes/:pacienteId",
            element: <PacienteDetalhe />,
          },
          {
            path: "exercicios",
            element: <ExerciciosPage />,
          },
          {
            path: "plano/criar",
            element: <CriarPlano />,
          },
          {
            path: "dashboard/medico/adesao",
            element: <PacientesList />,
          },
          {
            path: "dashboard/medico/adesao/:idPaciente",
            element: <PacientePerfil />,
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
