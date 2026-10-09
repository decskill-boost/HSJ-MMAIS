import { beforeEach, describe, expect, it, vi } from "vitest";

const { post, put } = vi.hoisted(() => ({ post: vi.fn(), put: vi.fn() }));

vi.mock("../src/services/apiClient", () => ({ apiClient: { post } }));
vi.mock("axios", () => ({ default: { put } }));

import { enviarVideo } from "../src/services/videos";

const UPLOAD = {
  urlUpload:
    "https://storage.googleapis.com/mmais-videos/exercicios/abc.mp4?X-Goog-Signature=123",
  cabecalhos: {
    "Content-Type": "video/mp4",
    "x-goog-content-length-range": "0,104857600",
  },
  urlVideo: "gs://mmais-videos/exercicios/abc.mp4",
};

describe("enviarVideo", () => {
  beforeEach(() => {
    post.mockReset().mockResolvedValue({ data: UPLOAD });
    put.mockReset().mockResolvedValue({ status: 200 });
  });

  it("pede o URL assinado com o tipo do ficheiro e devolve a referência a gravar", async () => {
    const ficheiro = new File(["video"], "salto.mp4", { type: "video/mp4" });

    await expect(enviarVideo(ficheiro)).resolves.toBe(UPLOAD.urlVideo);
    expect(post).toHaveBeenCalledWith("/exercicios/videos", {
      tipo: "video/mp4",
    });
  });

  // Os cabeçalhos fazem parte da assinatura: outros quaisquer dão 403 no GCS,
  // e um Authorization a mais também.
  it("envia o ficheiro ao bucket só com os cabeçalhos assinados", async () => {
    const ficheiro = new File(["video"], "salto.mp4", { type: "video/mp4" });

    await enviarVideo(ficheiro);

    const [url, corpo, opcoes] = put.mock.calls[0];
    expect(url).toBe(UPLOAD.urlUpload);
    expect(corpo).toBe(ficheiro);
    expect(opcoes.headers).toEqual(UPLOAD.cabecalhos);
  });

  it("reporta o progresso real do envio", async () => {
    put.mockImplementation((_url, _corpo, opcoes) => {
      opcoes.onUploadProgress({ loaded: 25, total: 100 });
      opcoes.onUploadProgress({ loaded: 100, total: 100 });
      return Promise.resolve({ status: 200 });
    });
    const aoProgredir = vi.fn();

    await enviarVideo(
      new File(["video"], "salto.mov", { type: "video/quicktime" }),
      aoProgredir,
    );

    expect(aoProgredir.mock.calls).toEqual([[25], [100]]);
  });

  it("não devolve URL nenhum se o envio ao bucket falhar", async () => {
    put.mockRejectedValue(new Error("403 SignatureDoesNotMatch"));

    await expect(
      enviarVideo(new File(["video"], "salto.mp4", { type: "video/mp4" })),
    ).rejects.toThrow("403");
  });
});
