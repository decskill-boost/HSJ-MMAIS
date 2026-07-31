import { useEffect, useRef, useState } from "react";

/**
 * Miniatura de vídeo que só começa a carregar quando o cartão se aproxima do
 * ecrã. Sem isto, uma grelha inteira pede os metadados de todos os vídeos ao
 * mesmo tempo — os ficheiros são pesados e travam o ecrã num tablet de
 * enfermaria. Mesmo padrão da capa dos planos (margem de 300px).
 */
const MiniaturaVideo = ({ url }: { url: string }) => {
  const [visivel, setVisivel] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisivel(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [url]);

  return (
    // `absolute inset-0`: a miniatura preenche o contentor sem NUNCA lhe ditar
    // o tamanho. Em fluxo normal, um vídeo vertical impunha a sua altura
    // intrínseca ao cartão — dentro de um `flex-col`, o `min-height: auto` de
    // um item ganha ao `aspect-video` do contentor e a caixa esticava-se. Numa
    // grelha, todos os cartões da linha cresciam com ele e os de vídeo
    // horizontal ficavam com um vazio enorme. Fora de fluxo, isso não pode
    // acontecer em contentor nenhum.
    //
    // Todos os sítios que a usam já têm `relative` no contentor.
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      {visivel && (
        // #t=0.1 força o browser a pintar um frame em vez de um retângulo preto
        <video
          src={`${url}#t=0.1`}
          className="h-full w-full object-cover"
          preload="metadata"
          muted
          playsInline
        />
      )}
    </div>
  );
};

export default MiniaturaVideo;
