import { useEffect, useRef, useState } from "react";
import { exerciciosService } from "../../services/exercicios";
import type { Exercicio } from "../../services/exercicios";
import { supabase } from "../../services/supabaseClient";
import { CriarExercicioModal } from "./CriarExercicioModal";
import LoadingSpinner from "../LoadingSpinner";

const CATEGORIAS_OPCOES = [
  "Quadríceps",
  "Glúteos",
  "Gémeos",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Abdominais",
  "Lombar",
  "Mobilidade e Flexibilidade",
  "Respiratório",
  "Equilíbrio e Coordenação",
  "Relaxamento",
];

const MATERIAIS_OPCOES = [
  "Tapete de Pilates",
  "Bola Pequena Pilates",
  "Bola de Pilates Grande",
  "Elásticos (Musculação)",
  "Elásticos (Pilates)",
  "Anel de Pilates",
  "Handgrip",
  "Minibicicleta Estática",
  "Jogo de Halteres",
  "Bola de Reação",
  "Bola de Ténis",
  "TRX",
];

const DIFICULDADE_OPCOES = [
  { label: "Fácil", value: "facil" },
  { label: "Médio", value: "medio" },
  { label: "Difícil", value: "dificil" },
];

function getDificuldadeLabel(value: string): string {
  if (value === "facil") return "Fácil";
  if (value === "medio") return "Médio";
  if (value === "dificil") return "Difícil";
  return value;
}

const FORMATOS_ACEITES = ["video/mp4", "video/quicktime"];
const TAMANHO_MAXIMO_MB = 100;

function toggleMaterial(currentStr: string | undefined, material: string): string {
  const currentArr = currentStr
    ? currentStr.split(",").map((m) => m.trim()).filter(Boolean)
    : [];
  if (currentArr.includes(material)) {
    return currentArr.filter((m) => m !== material).join(", ");
  } else {
    return [...currentArr, material].join(", ");
  }
}

const ExerciciosPage = () => {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [exercicioAberto, setExercicioAberto] = useState<Exercicio | null>(null);
  const [exercicioEditando, setExercicioEditando] = useState<Exercicio | null>(null);
  const [exercicioAEliminar, setExercicioAEliminar] = useState<Exercicio | null>(null);
  const [mensagem, setMensagem] = useState("");

  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroDuracao, setFiltroDuracao] = useState("Todas");
  const [filtroDificuldade, setFiltroDificuldade] = useState("Todas");
  const [filtroCondicao, setFiltroCondicao] = useState("Todas");

  const [modalCriarAberto, setModalCriarAberto] = useState(false);

  const [uploadingEdit, setUploadingEdit] = useState(false);
  const [uploadProgressEdit, setUploadProgressEdit] = useState<number>(0);
  const [erroDuracaoEdit, setErroDuracaoEdit] = useState("");
  const [erroXpEdit, setErroXpEdit] = useState("");
  const [erroVideoEdit, setErroVideoEdit] = useState("");
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const [editVideoPreview, setEditVideoPreview] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregarExercicios();
  }, []);

  async function carregarExercicios() {
    try {
      const data = await exerciciosService.getAll();
      setExercicios(Array.isArray(data) ? data : []);
    } catch {
      setExercicios([]);
    } finally {
      setLoading(false);
    }
  }

  function validarCampoNumerico(valor: number): string {
    if (!Number.isInteger(valor)) return "Não são permitidos valores decimais.";
    if (valor <= 0) return "O valor tem de ser maior que 0.";
    return "";
  }

  function handleEditVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErroVideoEdit("");
    if (!FORMATOS_ACEITES.includes(file.type)) {
      setErroVideoEdit("Formato inválido. Usa MP4 ou MOV.");
      return;
    }
    if (file.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      setErroVideoEdit(`O vídeo não pode ter mais de ${TAMANHO_MAXIMO_MB}MB.`);
      return;
    }
    setEditVideoFile(file);
    setEditVideoPreview(URL.createObjectURL(file));
  }

  async function handleGuardar() {
    if (!exercicioEditando) return;
    const erroD = validarCampoNumerico(exercicioEditando.duracao_segundos);
    const erroX = validarCampoNumerico(exercicioEditando.recompensa_xp);
    setErroDuracaoEdit(erroD);
    setErroXpEdit(erroX);
    if (erroD || erroX || erroVideoEdit) return;

    setUploadingEdit(true);
    setUploadProgressEdit(0);
    try {
      let url_video = exercicioEditando.url_video;
      if (editVideoFile) {
        const ext = editVideoFile.name.split(".").pop();
        const fileName = `${Date.now()}.${ext}`;
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          if (progress >= 85) { clearInterval(interval); progress = 85; }
          setUploadProgressEdit(progress);
        }, 200);
        const { error } = await supabase.storage
          .from("exercise-videos")
          .upload(fileName, editVideoFile, { upsert: false });
        clearInterval(interval);
        setUploadProgressEdit(100);
        if (error) throw error;
        const { data: publicData } = supabase.storage
          .from("exercise-videos")
          .getPublicUrl(fileName);
        url_video = publicData.publicUrl;
      }

      await exerciciosService.update(exercicioEditando.id_exercicio, {
        ...exercicioEditando,
        url_video,
      });
      setMensagem("Exercício atualizado com sucesso");
      setExercicioEditando(null);
      setEditVideoFile(null);
      setEditVideoPreview(null);
      setErroVideoEdit("");
      carregarExercicios();
      setTimeout(() => setMensagem(""), 3000);
    } catch (err) {
      console.error(err);
      setMensagem("Erro ao atualizar exercício");
      setTimeout(() => setMensagem(""), 3000);
    } finally {
      setUploadingEdit(false);
      setUploadProgressEdit(0);
    }
  }

  async function handleEliminar() {
    if (!exercicioAEliminar) return;
    await exerciciosService.remove(exercicioAEliminar.id_exercicio);
    setExercicioAEliminar(null);
    setMensagem("Exercício eliminado com sucesso");
    carregarExercicios();
    setTimeout(() => setMensagem(""), 3000);
  }

  const categorias = [
    "Todas",
    ...Array.from(new Set(exercicios.map((e) => e.categoria))),
  ];

  const exerciciosFiltrados = exercicios.filter((ex) => {
    if (filtroCategoria !== "Todas" && ex.categoria !== filtroCategoria) return false;
    if (filtroDuracao !== "Todas") {
      const min = ex.duracao_segundos / 60;
      if (filtroDuracao === "Até 5 min" && min > 5) return false;
      if (filtroDuracao === "5–15 min" && (min <= 5 || min > 15)) return false;
      if (filtroDuracao === "Mais de 15 min" && min <= 15) return false;
    }
    if (filtroDificuldade !== "Todas") {
      const label = getDificuldadeLabel(ex.dificuldade_clinica);
      if (label !== filtroDificuldade) return false;
    }
    if (filtroCondicao !== "Todas") {
      if (ex.condicao_paciente !== filtroCondicao) return false;
    }
    return true;
  });

  const temFiltrosAtivos =
    filtroCategoria !== "Todas" ||
    filtroDuracao !== "Todas" ||
    filtroDificuldade !== "Todas" ||
    filtroCondicao !== "Todas";

  if (loading) return <LoadingSpinner mensagem="A carregar biblioteca de exercícios..." />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Cabeçalho sóbrio do QG clínico */}
      <div className="mb-6 rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-6 shadow-vinheta">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cobalto">
              Protocolos
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-tinta">
              Biblioteca de Exercícios
            </h1>
            <p className="mt-1 text-sm text-aco">
              {exerciciosFiltrados.length}{" "}
              {exerciciosFiltrados.length === 1 ? "exercício" : "exercícios"}
              {temFiltrosAtivos ? " (filtrados)" : ""}
            </p>
          </div>
          <button
            onClick={() => setModalCriarAberto(true)}
            className="flex items-center gap-2 rounded-(--radius-vinheta) border-[3px] border-tinta bg-cobalto px-4 py-2.5 text-sm font-bold text-papel shadow-vinheta transition hover:bg-cobalto-vivo active:scale-95 active:shadow-none"
          >
            <span className="text-lg leading-none">+</span> Criar exercício
          </button>
        </div>
        <div className="flex flex-wrap items-end gap-4 border-t border-tinta/15 pt-5">
          <div>
            <label className="block text-xs font-medium text-aco mb-1">Categoria</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="rounded-lg border border-tinta/15 px-3 py-2 text-sm text-tinta bg-papel-claro focus:outline-none focus:ring-2 focus:ring-cobalto/30"
            >
              {categorias.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-aco mb-1">Duração</label>
            <select
              value={filtroDuracao}
              onChange={(e) => setFiltroDuracao(e.target.value)}
              className="rounded-lg border border-tinta/15 px-3 py-2 text-sm text-tinta bg-papel-claro focus:outline-none focus:ring-2 focus:ring-cobalto/30"
            >
              {["Todas", "Até 5 min", "5–15 min", "Mais de 15 min"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-aco mb-1">Intensidade</label>
            <select
              value={filtroDificuldade}
              onChange={(e) => setFiltroDificuldade(e.target.value)}
              className="rounded-lg border border-tinta/15 px-3 py-2 text-sm text-tinta bg-papel-claro focus:outline-none focus:ring-2 focus:ring-cobalto/30"
            >
              {["Todas", "Fácil", "Médio", "Difícil"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-aco mb-1">Condição</label>
            <select
              value={filtroCondicao}
              onChange={(e) => setFiltroCondicao(e.target.value)}
              className="rounded-lg border border-tinta/15 px-3 py-2 text-sm text-tinta bg-papel-claro focus:outline-none focus:ring-2 focus:ring-cobalto/30"
            >
              {["Todas", "A", "B", "C"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          {temFiltrosAtivos && (
            <button
              onClick={() => {
                setFiltroCategoria("Todas");
                setFiltroDuracao("Todas");
                setFiltroDificuldade("Todas");
                setFiltroCondicao("Todas");
              }}
              className="rounded-lg bg-cobalto hover:bg-cobalto-vivo px-4 py-2 text-sm font-bold text-white transition"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {mensagem && (
        <div className={`mb-4 rounded-lg px-4 py-3 font-medium ${mensagem.includes("Erro") ? "bg-capa/10 text-capa-escura" : "bg-turbo/10 text-turbo-escuro"}`}>
          {mensagem}
        </div>
      )}

      {exerciciosFiltrados.length === 0 ? (
        <p className="text-aco">Nenhum exercício encontrado com esses filtros.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {exerciciosFiltrados.map((ex) => (
            <div
              key={ex.id_exercicio}
              className="flex cursor-pointer flex-col overflow-hidden rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro shadow-vinheta transition hover:-translate-y-0.5"
              onClick={() => setExercicioAberto(ex)}
            >
              <div className="relative h-48 w-full flex-shrink-0 border-b-[3px] border-tinta bg-papel">
                {ex.url_video ? (
                  <video src={`${ex.url_video}#t=0.1`} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-aco">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded-lg border-2 border-tinta bg-cobalto px-2 py-1 text-xs font-bold text-papel">
                  {ex.categoria}
                </span>
              </div>
              <div className="p-4 flex flex-col flex-grow justify-between">
                <div>
                  <h3 className="font-bold text-tinta text-base">{ex.nome_exercicio}</h3>
                  {/* Metadados em chips — antes era uma fila corrida de emojis
                      difícil de ler em relance */}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-full border border-tinta/15 bg-papel px-2 py-1 font-semibold text-aco">
                      {Math.floor(ex.duracao_segundos / 60)} min
                    </span>
                    <span className="rounded-full border border-tinta/15 bg-papel px-2 py-1 font-semibold text-aco">
                      {getDificuldadeLabel(ex.dificuldade_clinica)}
                    </span>
                    <span className="rounded-full border border-cobalto/25 bg-cobalto/10 px-2 py-1 font-semibold text-cobalto">
                      Cond. {ex.condicao_paciente || "A"}
                    </span>
                    <span className="rounded-full border border-tinta/20 bg-raio/20 px-2 py-1 font-semibold text-tinta">
                      {ex.recompensa_xp} XP
                    </span>
                    {ex.repeticoes && ex.repeticoes > 0 && (
                      <span className="rounded-full border border-tinta/15 bg-papel px-2 py-1 font-semibold text-aco">
                        {ex.repeticoes} rep.
                      </span>
                    )}
                  </div>
                  {ex.materiais_necessarios && (
                    <p className="mt-2 line-clamp-1 text-xs font-medium text-aco">
                      🛠 {ex.materiais_necessarios}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 items-start justify-end mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExercicioEditando({ ...ex });
                      setEditVideoPreview(null);
                      setEditVideoFile(null);
                      setErroDuracaoEdit("");
                      setErroXpEdit("");
                      setErroVideoEdit("");
                    }}
                    className="text-aco hover:text-cobalto rounded-lg p-1.5 hover:bg-papel transition mt-0.5"
                    title="Editar"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExercicioAEliminar(ex);
                    }}
                    className="text-aco hover:text-capa rounded-lg p-1.5 hover:bg-papel transition mt-0.5"
                    title="Eliminar"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CriarExercicioModal
        isOpen={modalCriarAberto}
        onClose={() => setModalCriarAberto(false)}
        categorias={CATEGORIAS_OPCOES}
        materiais={MATERIAIS_OPCOES}
        onSucesso={() => carregarExercicios()}
      />

      {/* Modal de detalhe */}
      {exercicioAberto && (
        <div className="fixed inset-0 bg-tinta/50 flex items-center justify-center z-50 p-4">
          <div className="bg-papel-claro rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col md:flex-row">
              {exercicioAberto.url_video ? (
                <video
                  src={exercicioAberto.url_video}
                  className="w-full md:w-1/2 rounded-tl-2xl rounded-bl-2xl object-cover"
                  controls autoPlay muted
                />
              ) : (
                <div className="w-full md:w-1/2 h-64 bg-papel flex items-center justify-center rounded-tl-2xl rounded-bl-2xl text-aco">
                  Sem vídeo
                </div>
              )}
              <div className="p-6 flex flex-col justify-between w-full md:w-1/2">
                <div>
                  <h2 className="text-xl font-extrabold text-tinta">
                    {exercicioAberto.nome_exercicio}
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div className="rounded-xl bg-papel p-3">
                      <p className="text-xs text-aco">Categoria</p>
                      <p className="font-bold text-tinta">{exercicioAberto.categoria}</p>
                    </div>

                    {exercicioAberto.materiais_necessarios && (
                      <div className="rounded-xl bg-cobalto/10 p-3">
                        <p className="text-xs text-cobalto font-bold">🛠 Materiais Necessários</p>
                        <p className="font-bold text-tinta">{exercicioAberto.materiais_necessarios}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-papel p-3">
                        <p className="text-xs text-aco">Duração</p>
                        <p className="font-bold text-tinta">{Math.floor(exercicioAberto.duracao_segundos / 60)} min</p>
                      </div>
                      <div className="rounded-xl bg-papel p-3">
                        <p className="text-xs text-aco">Intensidade</p>
                        <p className="font-bold text-tinta">{getDificuldadeLabel(exercicioAberto.dificuldade_clinica)}</p>
                      </div>
                      <div className="rounded-xl bg-papel p-3">
                        <p className="text-xs text-aco">Condição do Paciente</p>
                        <p className="font-bold text-tinta">{exercicioAberto.condicao_paciente || "A"}</p>
                      </div>
                      <div className="rounded-xl bg-papel p-3">
                        <p className="text-xs text-aco">Recompensa XP</p>
                        <p className="font-bold text-tinta">{exercicioAberto.recompensa_xp} XP</p>
                      </div>
                      {/* Repetições no modal de detalhe */}
                      {exercicioAberto.repeticoes && exercicioAberto.repeticoes > 0 && (
                        <div className="rounded-xl bg-cobalto/10 p-3 col-span-2">
                          <p className="text-xs text-cobalto font-bold">🔁 Repetições</p>
                          <p className="font-bold text-tinta">{exercicioAberto.repeticoes} repetições</p>
                        </div>
                      )}
                    </div>

                    {exercicioAberto.descricao && (
                      <div className="rounded-xl bg-papel p-3">
                        <p className="text-xs text-aco">Instruções</p>
                        <p className="text-tinta text-sm whitespace-pre-line">{exercicioAberto.descricao}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex gap-2 justify-end">
                  <button
                    onClick={() => setExercicioAberto(null)}
                    className="rounded-lg border border-tinta/15 px-4 py-2 text-sm font-medium text-aco hover:bg-papel"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      setExercicioEditando({ ...exercicioAberto });
                      setEditVideoPreview(null);
                      setEditVideoFile(null);
                      setErroVideoEdit("");
                      setExercicioAberto(null);
                    }}
                    className="rounded-lg bg-cobalto px-4 py-2 text-sm font-bold text-white hover:bg-cobalto-vivo"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => { setExercicioAEliminar(exercicioAberto); setExercicioAberto(null); }}
                    className="rounded-lg bg-capa px-4 py-2 text-sm font-bold text-white hover:bg-capa-escura"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {exercicioEditando && (
        <div className="fixed inset-0 bg-tinta/40 flex items-center justify-center z-50 p-4">
          <div className="bg-papel-claro rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-tinta mb-5">Editar Exercício</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-aco">
                    Vídeo <span className="text-aco">(MP4 ou MOV, máx. 100MB)</span>
                  </label>
                  <div
                    onClick={() => !uploadingEdit && editFileInputRef.current?.click()}
                    className={`mt-1 w-full rounded-xl border-2 border-dashed ${erroVideoEdit ? "border-capa bg-capa/10" : "border-tinta/15 hover:border-cobalto-vivo bg-papel"} transition cursor-pointer overflow-hidden`}
                    style={{ minHeight: "140px" }}
                  >
                    {editVideoPreview ? (
                      <video src={editVideoPreview} className="w-full max-h-48 object-cover rounded-xl" controls />
                    ) : exercicioEditando.url_video ? (
                      <div className="relative">
                        <video src={exercicioEditando.url_video} className="w-full max-h-48 object-cover rounded-xl" />
                        <div className="absolute inset-0 flex items-center justify-center bg-tinta/30 rounded-xl hover:bg-tinta/40 transition">
                          <p className="text-white text-sm font-medium">Clica para substituir o vídeo</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-6 text-aco">
                        <svg className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                        </svg>
                        <p className="text-sm font-medium">Clica para fazer upload do vídeo</p>
                      </div>
                    )}
                  </div>
                  <input ref={editFileInputRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={handleEditVideoChange} />
                  {erroVideoEdit && <p className="text-xs font-medium text-capa mt-1">{erroVideoEdit}</p>}
                  {editVideoFile && !erroVideoEdit && <p className="text-xs text-aco mt-1">Novo vídeo: {editVideoFile.name}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-aco">Nome</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-tinta/15 px-3 py-2 text-sm"
                    value={exercicioEditando.nome_exercicio}
                    onChange={(e) => setExercicioEditando({ ...exercicioEditando, nome_exercicio: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-aco">Categoria</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-tinta/15 px-3 py-2 text-sm bg-papel-claro"
                    value={exercicioEditando.categoria}
                    onChange={(e) => setExercicioEditando({ ...exercicioEditando, categoria: e.target.value })}
                  >
                    {CATEGORIAS_OPCOES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-aco mb-2 block">
                    Materiais Necessários <span className="text-aco">(opcional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {MATERIAIS_OPCOES.map((material) => {
                      const currentArr = (exercicioEditando.materiais_necessarios || "")
                        .split(",").map((m) => m.trim()).filter(Boolean);
                      const isSelected = currentArr.includes(material);
                      return (
                        <button
                          key={material}
                          type="button"
                          onClick={() => {
                            const newStr = toggleMaterial(exercicioEditando.materiais_necessarios, material);
                            setExercicioEditando({ ...exercicioEditando, materiais_necessarios: newStr });
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${isSelected ? "bg-cobalto text-papel shadow-sm" : "bg-papel text-aco hover:bg-tinta/5"}`}
                        >
                          {material}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-aco">Duração (seg)</label>
                    <input
                      type="number"
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${erroDuracaoEdit ? "border-capa" : "border-tinta/15"}`}
                      value={exercicioEditando.duracao_segundos}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setExercicioEditando({ ...exercicioEditando, duracao_segundos: v });
                        setErroDuracaoEdit(validarCampoNumerico(v));
                      }}
                    />
                    {erroDuracaoEdit && <p className="text-xs text-capa mt-1">{erroDuracaoEdit}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-aco">Recompensa XP</label>
                    <input
                      type="number"
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${erroXpEdit ? "border-capa" : "border-tinta/15"}`}
                      value={exercicioEditando.recompensa_xp}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setExercicioEditando({ ...exercicioEditando, recompensa_xp: v });
                        setErroXpEdit(validarCampoNumerico(v));
                      }}
                    />
                    {erroXpEdit && <p className="text-xs text-capa mt-1">{erroXpEdit}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-aco">Intensidade</label>
                    <select
                      className="mt-1 w-full rounded-lg border border-tinta/15 px-3 py-2 text-sm bg-papel-claro"
                      value={exercicioEditando.dificuldade_clinica}
                      onChange={(e) => setExercicioEditando({ ...exercicioEditando, dificuldade_clinica: e.target.value })}
                    >
                      {DIFICULDADE_OPCOES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-aco">Condição do Paciente</label>
                    <select
                      className="mt-1 w-full rounded-lg border border-tinta/15 px-3 py-2 text-sm bg-papel-claro"
                      value={exercicioEditando.condicao_paciente || "A"}
                      onChange={(e) => setExercicioEditando({ ...exercicioEditando, condicao_paciente: e.target.value })}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                  {/* Campo de repetições no modal de edição */}
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-aco">
                      Repetições <span className="text-aco">(opcional — deixa vazio se for por tempo)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="mt-1 w-full rounded-lg border border-tinta/15 px-3 py-2 text-sm"
                      placeholder="Ex: 10"
                      value={exercicioEditando.repeticoes ?? ""}
                      onChange={(e) =>
                        setExercicioEditando({
                          ...exercicioEditando,
                          repeticoes: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-aco">
                      Instruções <span className="text-aco">(opcional · máx. 1000 caracteres)</span>
                    </label>
                    <span className={`text-xs ${(exercicioEditando.descricao ?? "").length >= 900 ? "text-capa" : "text-aco"}`}>
                      {(exercicioEditando.descricao ?? "").length}/1000
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    className="mt-1 w-full rounded-lg border border-tinta/15 px-3 py-2 text-sm resize-none"
                    value={exercicioEditando.descricao ?? ""}
                    onChange={(e) => setExercicioEditando({ ...exercicioEditando, descricao: e.target.value })}
                  />
                </div>
              </div>

              {uploadingEdit && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-aco mb-1">
                    <span>A fazer upload do vídeo...</span>
                    <span>{uploadProgressEdit}%</span>
                  </div>
                  <div className="w-full bg-tinta/10 rounded-full h-2">
                    <div className="bg-cobalto h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgressEdit}%` }} />
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => { setExercicioEditando(null); setEditVideoFile(null); setEditVideoPreview(null); setErroVideoEdit(""); }}
                  disabled={uploadingEdit}
                  className="rounded-lg border border-tinta/15 px-4 py-2 text-sm font-medium text-aco hover:bg-papel disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={uploadingEdit || !!erroVideoEdit}
                  className="rounded-lg bg-cobalto px-4 py-2 text-sm font-bold text-white hover:bg-cobalto-vivo disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingEdit ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de eliminação */}
      {exercicioAEliminar && (
        <div className="fixed inset-0 bg-tinta/40 flex items-center justify-center z-50">
          <div className="bg-papel-claro rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-tinta mb-2">Eliminar Exercício</h2>
            <p className="text-sm text-aco mb-6">
              Tem a certeza de que deseja eliminar este exercício? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setExercicioAEliminar(null)}
                className="rounded-lg border border-tinta/15 px-4 py-2 text-sm font-medium text-aco hover:bg-papel"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                className="rounded-lg bg-capa px-4 py-2 text-sm font-bold text-white hover:bg-capa-escura"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciciosPage;