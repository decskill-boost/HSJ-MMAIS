import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import WelcomePage from "../components/WelcomePage";

import PersonalInfo from "../components/PersonalInfo/PersonalInfo";
import PageNotFound from "../components/PageNotFound";
import Login from "../components/Login";
import DashboardPaciente from "../components/Dashboard/DashboardPaciente";
import DashboardCorpoClinico from "../components/Dashboard/DashboardCorpoClinico";
import CriarPlano from "../components/CriarPlano";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "",
        element: <WelcomePage />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "perfil",
        element: <PersonalInfo />,
      },
      {
        path: "dashboard/paciente",
        element: <DashboardPaciente />,
      },
      {
        path: "dashboard/medico",
        element: <DashboardCorpoClinico />,
      },
      {
        path: "plano/criar",
        element: <CriarPlano />,
      },
      {
        path: "*",
        element: <PageNotFound />,
      },
    ],
  },
]);