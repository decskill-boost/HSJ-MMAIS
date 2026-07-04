import { NavLink } from "react-router-dom";

// Ícones inline (sem dependências)
const IconHome = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
);

const IconLibrary = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 5h10v14H4z" />
    <path d="M14 7h3l3 12h-3" />
    <path d="M7 9h4M7 13h4" />
  </svg>
);

const IconPlus = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Ícone de prancheta/lista — para "Ver Planos"
const IconClipboard = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12h6M9 16h6" />
  </svg>
);

// Um link da sidebar
export interface SidebarLink {
  to: string;
  label: string;
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  end?: boolean;
}

// Links pré-definidos, para reutilizar no Layout
export const IconeInicio = IconHome;
export const IconeBiblioteca = IconLibrary;
export const IconePlano = IconPlus;
export const IconePlanos = IconClipboard;

interface SidebarProps {
  links: SidebarLink[];
}

export const Sidebar = ({ links }: SidebarProps) => {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
      <nav className="sticky top-16 flex flex-col gap-1 p-4">
        {links.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;