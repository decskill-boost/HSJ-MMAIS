# Vídeos dos exercícios no Google Cloud Storage

Os vídeos da biblioteca de exercícios vivem num bucket **privado** do GCS
(`hsj-mmais`, projeto `onsight-dev`). Antes estavam no bucket público
`exercise-videos` do Supabase Storage.

## Como funciona

**Upload**

1. O ecrã pede `POST /api/exercicios/videos` com `{ tipo }`. Só o corpo
   clínico pode.
2. O backend assina um URL de `PUT` válido por 15 minutos, para um objeto novo
   `exercicios/<uuid>.mp4|mov`. O tipo e o limite de 100 MB ficam presos na
   assinatura.
3. O browser envia o vídeo **direto ao bucket**: o ficheiro não passa pela
   Vercel, que só aceita pedidos até 4,5 MB. Depois grava em `url_video` a
   referência `gs://hsj-mmais/exercicios/<uuid>.mp4`.

**Leitura**

- O bucket não é público: um URL sem assinatura dá 403.
- Um interceptor global (`AssinarVideosInterceptor`) troca cada `url_video`
  `gs://…` que sai da API por um link de leitura assinado. Os ecrãs usam-no
  como `src` sem saber de nada disto.
- Os links são assinados por janelas de 6 h e valem entre 6 e 12 h. Dentro da
  mesma janela, o mesmo vídeo dá sempre o mesmo link, e assim o browser
  aproveita a cache.
- Só se assinam objetos de `exercicios/` deste bucket.
- Os endpoints públicos dos planos standard (experimentar sem registo) também
  devolvem links assinados, mas apenas para os vídeos desses planos.
- Quando o ecrã de edição devolve o link assinado, o DTO converte-o de volta
  para `gs://` antes de gravar.

## Montar o bucket (uma vez)

Requer o [gcloud CLI](https://cloud.google.com/sdk/docs/install). A partir da
raiz do repositório:

```sh
PROJETO=onsight-dev
BUCKET=hsj-mmais
SA=mmais-videos@$PROJETO.iam.gserviceaccount.com

# Bucket privado, com acesso uniforme e public access prevention
gcloud storage buckets create gs://$BUCKET --project=$PROJETO \
  --location=europe-west1 --uniform-bucket-level-access \
  --public-access-prevention

# CORS para o PUT vindo do browser (acrescentar aqui outros domínios do frontend)
gcloud storage buckets update gs://$BUCKET --cors-file=service.srv/deploy/gcs/cors.json

# Conta de serviço do backend: cria objetos (uploads) e lê-os (links de leitura
# assinados). Não pode apagar nem mudar permissões.
gcloud iam service-accounts create mmais-videos --project=$PROJETO
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member=serviceAccount:$SA --role=roles/storage.objectCreator
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member=serviceAccount:$SA --role=roles/storage.objectViewer

# Chave da conta de serviço (o backend precisa dela para assinar os URLs)
gcloud iam service-accounts keys create chave-gcs.json --iam-account=$SA
```

Não dar `allUsers` ao bucket: deixava os vídeos abertos a quem tivesse o URL e
tornava as assinaturas inúteis.

## Variáveis do backend

| Variável          | Valor                                                  |
| ----------------- | ------------------------------------------------------ |
| `GCS_BUCKET`      | `hsj-mmais`                                            |
| `GCS_CREDENTIALS` | conteúdo do `chave-gcs.json`, tal e qual ou em base64  |

Na Vercel (projeto `hsj-mmais-iall`):

```sh
printf %s hsj-mmais | vercel env add GCS_BUCKET production
base64 -i chave-gcs.json | vercel env add GCS_CREDENTIALS production
rm chave-gcs.json   # a chave não fica no disco nem, muito menos, no git
```

Sem `GCS_CREDENTIALS` o backend usa as Application Default Credentials. No App
Engine ou no Cloud Run é a conta de serviço do runtime, que precisa do papel
`roles/iam.serviceAccountTokenCreator` sobre si própria para assinar URLs.

Se as variáveis faltarem, só o envio de vídeos falha (503) e os vídeos do GCS
ficam sem link. O resto da aplicação arranca normalmente.

## Migrar os vídeos que estão no Supabase

```sh
cd service.srv
node --env-file=.env.local scripts/migrar-videos-para-gcs.js            # só lista
node --env-file=.env.local scripts/migrar-videos-para-gcs.js --aplicar  # copia e atualiza
```

O `.env.local` tem de ter a base de dados de produção (`DB_*`) e as duas
variáveis acima. O script copia cada vídeo para `exercicios/<nome original>` e
só depois troca o `url_video` para `gs://…`; pode correr-se mais do que uma
vez. O bucket antigo do Supabase fica intacto. Apagá-lo é um passo à parte,
depois de confirmar que todos os vídeos tocam.
