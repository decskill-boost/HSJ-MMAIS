import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { UserRole } from "../types/permissions";

import WelcomePage from "../components/WelcomePage";
import ExperimentarPlanos from "../components/ExperimentarPlanos";
import PersonalInfo from "../components/PersonalInfo";
import PageNotFound from "../components/PageNotFound";
import Login from "../components/Login";
import DashboardPaciente from "../components/Dashboard/DashboardPaciente";
import DashboardCorpoClinico from "../components/Dashboard/DashboardCorpoClinico";
import PlanosCorpoClinico from "../components/Dashboard/PlanosCorpoClinico";
import PacienteDetalhe from "../components/Dashboard/PacienteDetalhe";
import DashboardAdmin from "../components/Dashboard/DashboardAdmin/DashboardAdmin";
import ExerciciosPage from "../components/Exercicios/ExerciciosPage";
import CriarPlano from "../components/CriarPlano";
import PlanosPaciente from "../components/PlanosPaciente";
import HistoricoRecompensas from "../components/Pacientes/HistoricoRecompensas";

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