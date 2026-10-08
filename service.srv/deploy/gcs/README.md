# Vídeos dos exercícios no Google Cloud Storage

Os vídeos da biblioteca de exercícios vivem num bucket do GCS (antes estavam no
bucket `exercise-videos` do Supabase Storage).

Como funciona um upload:

1. O ecrã pede ao backend `POST /api/exercicios/videos` com `{ tipo }` (só o
   corpo clínico pode).
2. O backend assina um URL de `PUT` válido por 15 minutos, para um objeto novo
   `exercicios/<uuid>.mp4|mov`, com o tipo e o limite de 100 MB presos na
   assinatura.
3. O browser envia o vídeo **direto ao bucket** (o ficheiro não passa pela
   Vercel, que só aceita pedidos até 4,5 MB) e grava o URL público em
   `url_video`.

## Montar o bucket (uma vez)

Requer o [gcloud CLI](https://cloud.google.com/sdk/docs/install). A partir da
raiz do repositório:

```sh
PROJETO=o-teu-projeto-gcp
BUCKET=mmais-videos
SA=mmais-videos@$PROJETO.iam.gserviceaccount.com

# Bucket em Madrid (o mais próximo do Porto), com acesso uniforme
gcloud storage buckets create gs://$BUCKET --project=$PROJETO \
  --location=europe-southwest1 --uniform-bucket-level-access

# Leitura pública — os <video> leem os ficheiros sem credenciais, como no Supabase
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member=allUsers --role=roles/storage.objectViewer

# CORS para o PUT vindo do browser (acrescentar aqui outros domínios do frontend)
gcloud storage buckets update gs://$BUCKET --cors-file=service.srv/deploy/gcs/cors.json

# Conta de serviço do backend: só pode criar objetos neste bucket
gcloud iam service-accounts create mmais-videos --project=$PROJETO
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member=serviceAccount:$SA --role=roles/storage.objectCreator

# Chave da conta de serviço (o backend precisa dela para assinar os URLs)
gcloud iam service-accounts keys create chave-gcs.json --iam-account=$SA
```

Se o `allUsers` for recusado, a organização tem a *public access prevention*
ligada; um administrador tem de a desligar para este bucket. Se a criação da
chave for recusada (`iam.disableServiceAccountKeyCreation`), o mesmo.

## Variáveis do backend

| Variável          | Valor                                                  |
| ----------------- | ------------------------------------------------------ |
| `GCS_BUCKET`      | nome do bucket, ex. `mmais-videos`                     |
| `GCS_CREDENTIALS` | conteúdo do `chave-gcs.json`, tal e qual ou em base64  |

Na Vercel (projeto `hsj-mmais-iall`):

```sh
printf %s mmais-videos | vercel env add GCS_BUCKET production
base64 -i chave-gcs.json | vercel env add GCS_CREDENTIALS production
rm chave-gcs.json   # a chave não fica no disco nem, muito menos, no git
```

Sem `GCS_CREDENTIALS` o backend usa as Application Default Credentials — no App
Engine ou no Cloud Run é a conta de serviço do runtime, que precisa do papel
`roles/iam.serviceAccountTokenCreator` sobre si própria para assinar URLs.

Se as variáveis faltarem, só o envio de vídeos falha (503); o resto da
aplicação arranca normalmente.

## Migrar os vídeos que estão no Supabase

```sh
cd service.srv
node --env-file=.env.local scripts/migrar-videos-para-gcs.js            # só lista
node --env-file=.env.local scripts/migrar-videos-para-gcs.js --aplicar  # copia e atualiza
```

O `.env.local` tem de ter a base de dados de produção (`DB_*`) e as duas
variáveis acima. O script copia cada vídeo para `exercicios/<nome original>` e
só depois troca o `url_video` na tabela `exercicios`; pode correr-se mais do que
uma vez. O bucket antigo do Supabase fica intacto — apagá-lo é um passo à
parte, depois de confirmar que todos os vídeos tocam.
