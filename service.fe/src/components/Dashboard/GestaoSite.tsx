import { useEffect, useState } from "react";
import { conteudoService } from "../../services/conteudoService";
import type { LandingContent } from "../../services/conteudoService";
import BtnGlobal from "../BtnGlobal";

const GestaoSite = () => {
  const [content, setContent] = useState<LandingContent>({
    hero_titulo: "",
    hero_subtitulo: "",
    hero_frase: "",
    logo_1_url: "",
    logo_2_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    conteudoService
      .getLandingContent()
      .then((data) => {
        setContent({
          hero_titulo: data.hero_titulo || "Bem-vindo ao MMAIS+!",
          hero_subtitulo: data.hero_subtitulo || "Mais Minutos Ativos · A Academia de Heróis",
          hero_uls: data.hero_uls || "Uma aplicação do Serviço de Oncologia Pediátrica da ULS São João",
          hero_frase: data.hero_frase || "Missões, conquistas e superpoderes — mais um passo, todos os dias.",
          logo_1_url: data.logo_1_url || "",
          logo_2_url: data.logo_2_url || "",
        });
      })
      .catch(() => setMessage("Erro ao carregar conteúdo."))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContent({ ...content, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await conteudoService.updateLandingContent(content);
      setMessage("Conteúdo guardado com sucesso!");
    } catch {
      setMessage("Erro ao guardar conteúdo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-aco">A carregar...</div>;
  }

  return (
    <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-extrabold text-tinta sm:text-4xl">Gestão da Landing Page</h1>
        <p className="mt-2 text-sm text-aco">
          Altere os textos apresentados na página inicial (pública) do MMAIS+.
        </p>

        {message && (
          <div className={`mt-4 rounded-xl p-4 text-sm font-bold ${message.includes('Erro') ? 'bg-turbo/20 text-turbo-escuro' : 'bg-verde-agua/20 text-verde-agua'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-2xl border-[3px] border-tinta bg-papel-claro p-6 shadow-vinheta">
          <div>
            <label className="block text-sm font-bold text-tinta">Título Principal</label>
            <input
              type="text"
              name="hero_titulo"
              value={content.hero_titulo}
              onChange={handleChange}
              placeholder="Ex: Bem-vindo ao MMAIS+!"
              className="mt-1 block w-full rounded-xl border-2 border-tinta/20 bg-papel px-4 py-2.5 outline-none transition focus:border-cobalto"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-tinta">Subtítulo</label>
            <input
              type="text"
              name="hero_subtitulo"
              value={content.hero_subtitulo}
              onChange={handleChange}
              placeholder="Ex: Mais Minutos Ativos · A Academia de Heróis"
              className="mt-1 block w-full rounded-xl border-2 border-tinta/20 bg-papel px-4 py-2.5 outline-none transition focus:border-cobalto"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-tinta">Aviso Institucional (ULS)</label>
            <input
              type="text"
              name="hero_uls"
              value={content.hero_uls}
              onChange={handleChange}
              placeholder="Ex: Uma aplicação do Serviço de Oncologia Pediátrica da ULS São João"
              className="mt-1 block w-full rounded-xl border-2 border-tinta/20 bg-papel px-4 py-2.5 outline-none transition focus:border-cobalto"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-tinta">Frase de Missão</label>
            <textarea
              name="hero_frase"
              value={content.hero_frase}
              onChange={handleChange}
              rows={3}
              placeholder="Ex: Missões, conquistas e superpoderes — mais um passo, todos os dias."
              className="mt-1 block w-full rounded-xl border-2 border-tinta/20 bg-papel px-4 py-2.5 outline-none transition focus:border-cobalto"
            />
          </div>

          <div className="pt-4">
            <BtnGlobal type="submit" disabled={saving} className="w-full sm:w-auto px-8 py-3">
              {saving ? "A Guardar..." : "Guardar Alterações"}
            </BtnGlobal>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GestaoSite;
