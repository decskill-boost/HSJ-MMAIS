import { useState } from "react";
import WelcomePage from "./components/WelcomePage";
import LoginForm from "./components/LoginForm";

function App() {
  const [autenticar, setAutenticar] = useState(false);

  return (
    <main>
      {autenticar ? (
        <LoginForm />
      ) : (
        <WelcomePage onEnter={() => setAutenticar(true)} />
      )}
    </main>
  );
}

export default App;