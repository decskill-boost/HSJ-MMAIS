import { NavLink } from "react-router-dom";

// Ícones inline (sem dependências)
const IconHome = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
);

const IconLibrary = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 5h10v14H4z" />
    <path d="M14 7h3l3 12h-3" />
    <path d="M7 9h4M7 13h4" />
  </svg>
);

const IconPlus = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconClipboard = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12h6M9 16h6" />
  </svg>
);

export interface SidebarLink {
  to: string;
  label: string;
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  end?: boolean;
}

export const IconeInicio = IconHome;
export const IconeBiblioteca = IconLibrary;
export const IconePlano = IconPlus;
export const IconePlanos = IconClipboard;

interface SidebarProps {
  links: SidebarLink[];
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ links, isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {/* Overlay escuro para mobile quando a sidebar está aberta */}
      {isOpen && (
        <div
          className="fixed inset-0 top-[68px] z-30 bg-tinta/50 backdrop-blur-sm transition-opacity md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - flutuante em mobile, fixa/estática em desktop */}
      <aside
        className={`fixed inset-y-0 left-0 top-[68px] z-40 w-60 transform overflow-y-auto border-r border-tinta/15 bg-papel-claro transition-transform duration-300 ease-in-out md:static md:block md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col gap-1 p-4">
          {links.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose} // Fecha o menu ao clicar num link (bom para mobile)
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition ${
                  isActive
                    ? "border-tinta bg-cobalto/10 text-cobalto shadow-[2px_2px_0_#141F3C]"
                    : "border-transparent text-aco hover:bg-papel hover:text-tinta"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
