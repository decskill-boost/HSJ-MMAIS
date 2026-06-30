import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import WelcomePage from "../components/WelcomePage";

import PersonalInfo from "../components/PersonalInfo/PersonalInfo";
import PageNotFound from "../components/PageNotFound";
import Login from "../components/Login";

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
        path: "*",
        element: <PageNotFound />,
      },
    ],
  },
]);
