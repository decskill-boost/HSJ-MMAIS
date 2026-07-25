/**
 * Rodapé no fim do flex-col do Layout: encosta ao fundo quando a página é curta
 * e é empurrado para baixo quando é longa — sem tapar conteúdo nem deixar uma
 * faixa de fundo entre a página e o rodapé.
 */
const Footer = () => {
  return (
    <footer className="w-full border-t-[3px] border-tinta bg-papel-claro py-4 text-center text-xs font-bold text-aco">
      ULS São João · 2026
    </footer>
  );
};

export default Footer;
