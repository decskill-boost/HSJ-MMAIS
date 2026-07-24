import { useRef, useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { exerciciosService } from "../../services/exercicios";

const FORMATOS_ACEITES = ["video/mp4", "video/quicktime"];
const TAMANHO_MAXIMO_MB = 100;

const DIFICULDADE_OPCOES = [
  { label: "Fácil", value: "facil" },
  { label: "Médio", value: "medio" },
  { label: "Difícil", value: "dificil" },
];

interface CriarExercicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSucesso: () => void;
  categorias: string[];
  materiais: string[];
}

export const CriarExercicioModal = ({ isOpen, onClose, onSucesso, categorias, materiais }: CriarExercicioModalProps) => {
  const [passo, setPasso] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [erroVideo, setErroVideo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nome_exercicio: "",
    categoria: categorias[0] || "Quadríceps",
    duracao_segundos: 60,
    dificuldade_clinica: "facil",
    condicao_paciente: "A",
    recompensa_xp: 10,
    repeticoes: "" as number | "",
    descricao: "",
    materiais_necessarios: "",
  });

  const [erroDuracao, setErroDuracao] = useState("");
  const [erroXp, setErroXp] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPasso(1);
      setUploading(false);
      setUploadProgress(0);
      setVideoFile(null);
      setVideoPreview(null);
      setErroVideo("");
      setForm({
        nome_exercicio: "",
        categoria: categorias[0] || "Quadríceps",
        duracao_segundos: 60,
        dificuldade_clinica: "facil",
        condicao_paciente: "A",
        recompensa_xp: 10,
        repeticoes: "",
        descricao: "",
        materiais_necessarios: "",
      });
    }
  }, [isOpen, categorias]);

  if (!isOpen) return null;

  function validarCampoNumerico(valor: number): string {
    if (!Number.isInteger(valor)) return "Não são permitidos valores decimais.";
    if (valor <= 0) return "O valor tem de ser maior que 0.";
    return "";
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErroVideo("");
    if (!FORMATOS_ACEITES.includes(file.type)) {
      setErroVideo("Formato inválido. Usa MP4 ou MOV.");
      return;
    }
    if (file.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      setErroVideo(`O vídeo não pode ter mais de ${TAMANHO_MAXIMO_MB}MB.`);
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }

  function toggleMaterial(material: string) {
    const currentArr = form.materiais_necessarios
      ? form.materiais_necessarios.split(",").map((m) => m.trim()).filter(Boolean)
      : [];
    const newArr = currentArr.includes(material)
      ? currentArr.filter((m) => m !== material)
      : [...currentArr, material];
    setForm({ ...form, materiais_necessarios: newArr.join(", ") });
  }

  async function handleCriar() {
    const erroD = validarCampoNumerico(form.duracao_segundos);
    const erroX = validarCampoNumerico(form.recompensa_xp);
    setErroDuracao(erroD);
    setErroXp(erroX);
    if (erroD || erroX || erroVideo) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      let url_video = "";
      if (videoFile) {
        const ext = videoFile.name.split(".").pop();
        const fileName = `${Date.now()}.${ext}`;
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          if (progress >= 85) { clearInterval(interval); progress = 85; }
          setUploadProgress(progress);
        }, 200);
        const { error } = await supabase.storage.from("exercise-videos").upload(fileName, videoFile);
        clearInterval(interval);
        setUploadProgress(100);
        if (error) throw error;
        const { data: publicData } = supabase.storage.from("exercise-videos").getPublicUrl(fileName);
        url_video = publicData.publicUrl;
      }

      await exerciciosService.create({
        nome_exercicio: form.nome_exercicio,
        categoria: form.categoria,
        duracao_segundos: form.duracao_segundos,
        dificuldade_clinica: form.dificuldade_clinica,
        condicao_paciente: form.condicao_paciente,
        recompensa_xp: form.recompensa_xp,
        repeticoes: form.repeticoes !== "" ? Number(form.repeticoes) : undefined,
        descricao: form.descricao,
        materiais_necessarios: form.materiais_necessarios,
        url_video,
      });
      onSucesso();
      setPasso(3);
    } catch (err) {
      console.error("Erro no upload/criação:", err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  return (
    <div className="fixed inset-0 bg-tinta/50 flex items-center justify-center z-50 p-4">
      <div className="bg-papel-claro rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        {passo === 3 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 bg-turbo/15 text-turbo-escuro rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-tinta mb-2">Exercício Criado!</h3>
            <p className="text-sm text-aco text-center mb-6">
              O exercício foi adicionado com sucesso à tua biblioteca.
            </p>
            <button onClick={onClose} className="rounded-lg bg-cobalto px-6 py-2 text-sm font-bold text-white hover:bg-cobalto-vivo w-full">
              Concluir e Fechar
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-tinta mb-5">
              Novo Exercício (Passo {passo}/2)
            </h2>

            {passo === 1 ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-aco">
                    Vídeo <span className="text-aco">(MP4/MOV, máx 100MB)</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-1 w-full rounded-xl border-2 border-dashed ${erroVideo ? "border-capa bg-capa/10" : "border-tinta/15 hover:border-cobalto bg-papel"} transition cursor-pointer flex flex-col items-center justify-center overflow-hidden`}
                    style={{ minHeight: "140px" }}
                  >
                    {videoPreview ? (
                      <video src={videoPreview} className="w-full max-h-48 object-cover rounded-xl" controls />
                    ) : (
                      <div className="flex flex-col items-center py-6 text-aco">
                        <svg className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                        </svg>
                        <p className="text-sm font-medium">Clica para fazer upload</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={handleVideoChange} />
                  {erroVideo && <p className="text-xs font-medium text-capa-escura mt-1">{erroVideo}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-aco">Nome *</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-tinta/15 px-3 py-2 text-sm"
                    placeholder="Ex: Agachamento"
                    value={form.nome_exercicio}
                    onChange={(e) => setForm({ ...form, nome_exercicio: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-aco">Categoria *</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-tinta/15 px-3 py-2 text-sm bg-papel-claro"
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  >
                    {categorias.map((c: string) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={onClose} className="rounded-lg border border-tinta/15 px-4 py-2 text-sm font-medium text-aco hover:bg-papel">
                    Cancelar
                  </button>
                  <button
                    onClick={() => setPasso(2)}
                    disabled={!form.nome_exercicio || !!erroVideo}
                    className="rounded-lg bg-cobalto px-4 py-2 text-sm font-bold text-white hover:bg-cobalto-vivo disabled:opacity-50"
                  >
                    Seguinte
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-aco mb-2 block">
                    Materiais Necessários <span className="text-aco">(opcional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {materiais.map((m: string) => {
                      const isSelected = form.materiais_necessarios.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => toggleMaterial(m)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${isSelected ? "bg-cobalto text-white shadow-sm" : "bg-tinta/10 text-aco hover:bg-tinta/15"}`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-aco">Duração (seg) *</label>
                    <input
                      type="number"
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${erroDuracao ? "border-capa" : "border-tinta/15"}`}
                      value={form.duracao_segundos}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setForm({ ...form, duracao_segundos: v });
                        setErroDuracao(validarCampoNumerico(v));
                      }}
                    />
                    {erroDuracao && <p className="text-xs text-capa-escura mt-1">{erroDuracao}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-aco">XP *</label>
                    <input
                      type="number"
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${erroXp ? "border-capa" : "border-tinta/15"}`}
                      value={form.recompensa_xp}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setForm({ ...form, recompensa_xp: v });
                        setErroXp(validarCampoNumerico(v));
                      }}
                    />
                    {erroXp && <p className="text-xs text-capa-escura mt-1">{erroXp}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-aco">Intensidade *</label>
                    <select
                      className="mt-1 w-full rounded-lg border border-tinta/15 px-3 py-2 text-sm bg-papel-claro"
                      value={form.dificuldade_clinica}
                      onChange={(e) => setForm({ ...form, dificuldade_clinica: e.target.value })}
                    >
                      {DIFICULDADE_OPCOES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-aco">Condição do Paciente *</label>
                    <select
                      className="mt-1 w-full rounded-lg border border-tinta/15 px-3 py-2 text-sm bg-papel-claro"
                      value={form.condicao_paciente}
                      onChange={(e) => setForm({ ...form, condicao_paciente: e.target.value })}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                  {/* Campo de repetições */}
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-aco">
                      Repetições <span className="text-aco">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="mt-1 w-full rounded-lg border border-tinta/15 px-3 py-2 text-sm"
                      placeholder="Ex: 10"
                      value={form.repeticoes}
                      onChange={(e) =>
                        setForm({ ...form, repeticoes: e.target.value === "" ? "" : Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-aco">
                      Instruções <span className="text-aco">(máx 1000)</span>
                    </label>
                    <span className={`text-xs ${form.descricao.length >= 900 ? "text-capa-escura" : "text-aco"}`}>
                      {form.descricao.length}/1000
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    className="mt-1 w-full rounded-lg border border-tinta/15 px-3 py-2 text-sm resize-none"
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  />
                </div>

                {uploading && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-aco mb-1">
                      <span>A gravar...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-tinta/10 rounded-full h-2">
                      <div className="bg-cobalto h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setPasso(1)} disabled={uploading} className="rounded-lg border border-tinta/15 px-4 py-2 text-sm font-medium text-aco hover:bg-papel">
                    Voltar
                  </button>
                  <button
                    onClick={handleCriar}
                    disabled={uploading || erroDuracao !== "" || erroXp !== ""}
                    className="rounded-lg bg-cobalto px-4 py-2 text-sm font-bold text-white hover:bg-cobalto-vivo disabled:opacity-50"
                  >
                    {uploading ? "A gravar..." : "Criar Exercício"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};