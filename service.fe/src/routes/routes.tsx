import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { UserRole } from "../types/permissions";

// Primeira pintura: carregadas de imediato
import WelcomePage from "../components/WelcomePage";
import PageNotFound from "../components/PageNotFound";
import Login from "../components/Login";

// Restantes rotas: code-splitting — cada perfil só descarrega o que usa
const ExperimentarPlanos = lazy(() => import("../components/ExperimentarPlanos"));
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
const GestaoPlanos = lazy(
  () => import("../components/Dashboard/GestaoPlanos"),
);
const PlanosPaciente = lazy(() => import("../components/PlanosPaciente"));
const HistoricoRecompensas = lazy(
  () => import("../components/Pacientes/HistoricoRecompensas"),
);

import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "", element: <WelcomePage /> },
      { path: "experimentar", element: <ExperimentarPlanos /> },
      { path: "login", element: <Login /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: "perfil", element: <PersonalInfo /> },
        ],
      },

      {
        element: <ProtectedRoute role={UserRole.CORPO_CLINICO} />,
        children: [
          { path: "dashboard/medico", element: <DashboardCorpoClinico /> },
          { path: "dashboard/medico/pacientes", element: <PlanosCorpoClinico /> },
          { path: "dashboard/medico/pacientes/:pacienteId", element: <PacienteDetalhe /> },
          { path: "exercicios", element: <ExerciciosPage /> },
          { path: "plano/criar", element: <CriarPlano /> },
          { path: "dashboard/medico/planos", element: <GestaoPlanos /> },
        ],
      },

      {
        element: <ProtectedRoute role={UserRole.ADMIN} />,
        children: [
          { path: "dashboard/admin", element: <DashboardAdmin /> },
        ],
      },

      {
        element: <ProtectedRoute role={UserRole.PACIENTE} />,
        children: [
          { path: "dashboard/paciente", element: <DashboardPaciente /> },
          { path: "paciente/planos", element: <PlanosPaciente /> },
          { path: "paciente/historico", element: <HistoricoRecompensas /> },
        ],
      },

      { path: "*", element: <PageNotFound /> },
    ],
  },
]);
