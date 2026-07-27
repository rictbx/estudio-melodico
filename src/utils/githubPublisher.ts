import { APP_VERSION } from './musicTheory';

export interface PublishOptions {
  token: string;
  username: string;
  repo: string;
  htmlContent: string;
}

export interface PublishResult {
  success: boolean;
  message: string;
  repoUrl: string;
  pagesUrl: string;
  username: string;
  repo: string;
}

export async function publishToGitHub(options: PublishOptions): Promise<PublishResult> {
  const token = options.token.trim();
  const repoName = options.repo.trim() || 'estudio-melodico';
  let username = options.username.trim();

  if (!token) {
    throw new Error('Token do GitHub não fornecido.');
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // 1. Verify token and get username if empty
  const userRes = await fetch('https://api.github.com/user', { headers });
  if (!userRes.ok) {
    if (userRes.status === 401) {
      throw new Error('Token do GitHub inválido ou expirado.');
    }
    throw new Error(`Erro de autenticação no GitHub: ${userRes.statusText}`);
  }
  const userData = await userRes.json();
  if (!username) {
    username = userData.login;
  }

  // 2. Check if repo exists
  const repoCheckUrl = `https://api.github.com/repos/${username}/${repoName}`;
  const repoCheckRes = await fetch(repoCheckUrl, { headers });

  let defaultBranch = 'main';

  if (!repoCheckRes.ok) {
    if (repoCheckRes.status === 404) {
      // Create repository
      const createRepoRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: repoName,
          description: `Estúdio Melódico & Gerador MIDI - v${APP_VERSION}`,
          homepage: `https://${username.toLowerCase()}.github.io/${repoName}/`,
          auto_init: true,
          private: false,
        }),
      });

      if (!createRepoRes.ok) {
        const errJson = await createRepoRes.json().catch(() => ({}));
        throw new Error(`Não foi possível criar o repositório '${repoName}': ${errJson.message || createRepoRes.statusText}`);
      }
      const newRepoData = await createRepoRes.json();
      defaultBranch = newRepoData.default_branch || 'main';
      // Give GitHub a moment to initialize the repo
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } else {
      throw new Error(`Erro ao checar repositório: ${repoCheckRes.statusText}`);
    }
  } else {
    const existingRepo = await repoCheckRes.json();
    defaultBranch = existingRepo.default_branch || 'main';
  }

  // 3. Check existing index.html to get file SHA (for updates)
  const fileUrl = `https://api.github.com/repos/${username}/${repoName}/contents/index.html`;
  const fileCheckRes = await fetch(fileUrl, { headers });
  let sha: string | undefined = undefined;

  if (fileCheckRes.ok) {
    const fileData = await fileCheckRes.json();
    sha = fileData.sha;
  }

  // 4. Encode HTML content to UTF-8 base64
  const encoder = new TextEncoder();
  const data = encoder.encode(options.htmlContent);
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  const base64Content = btoa(binary);

  // 5. Create or update index.html
  const putRes = await fetch(fileUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `🚀 Publicação Versão v${APP_VERSION} via Estúdio Melódico`,
      content: base64Content,
      branch: defaultBranch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const errJson = await putRes.json().catch(() => ({}));
    throw new Error(`Erro ao enviar index.html: ${errJson.message || putRes.statusText}`);
  }

  // 6. Try enabling GitHub Pages if not enabled
  try {
    await fetch(`https://api.github.com/repos/${username}/${repoName}/pages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: {
          branch: defaultBranch,
          path: '/',
        },
      }),
    });
  } catch (e) {
    // Pages might already be enabled or take time; swallow non-fatal error
  }

  const repoUrl = `https://github.com/${username}/${repoName}`;
  const pagesUrl = `https://${username.toLowerCase()}.github.io/${repoName}/`;

  return {
    success: true,
    message: `Versão ${APP_VERSION} publicada com sucesso no GitHub!`,
    repoUrl,
    pagesUrl,
    username,
    repo: repoName,
  };
}
