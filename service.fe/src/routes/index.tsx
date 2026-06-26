import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./Layout";
import WelcomePage from "../components/WelcomePage";
import LoginForm from "../components/LoginForm";
import PersonalInfo from "../components/PersonalInfo/PersonalInfo";

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
        element: <LoginForm />,
      },
      {
        path: "perfil",
        element: <PersonalInfo />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
