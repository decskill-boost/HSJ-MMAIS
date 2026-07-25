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
    <div ref={ref} className="h-full w-full">
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
