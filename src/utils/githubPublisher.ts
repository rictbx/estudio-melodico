import { APP_VERSION } from './musicTheory';
import githubPublisherRaw from './githubPublisher.ts?raw';

export interface PublishOptions {
  token: string;
  username: string;
  repo: string;
  branch?: string;
}

export interface PublishResult {
  success: boolean;
  message: string;
  repoUrl: string;
  actionsUrl: string;
  pagesUrl: string;
  username: string;
  repo: string;
  branch: string;
  fileCount: number;
}

export interface VerificationResult {
  valid: boolean;
  userLogin: string;
  repoExists: boolean;
  branchExists: boolean;
  defaultBranch: string;
  warning?: string;
  error?: string;
}

// Dynamically capture all workspace files using Vite's eager import.meta.glob
async function getWorkspaceFiles(): Promise<Record<string, string>> {
  const globFiles = import.meta.glob(
    [
      '/src/**/*',
      '/.github/**/*',
      '/index.html',
      '/package.json',
      '/vite.config.ts',
      '/tsconfig.json',
      '/README.md',
      '/metadata.json',
    ],
    { query: '?raw', import: 'default', eager: true }
  ) as Record<string, string>;

  const filesMap: Record<string, string> = {};

  for (const [rawPath, content] of Object.entries(globFiles)) {
    const cleanPath = rawPath.replace(/^\//, '');
    if (typeof content === 'string' && content.length > 0) {
      filesMap[cleanPath] = content;
    }
  }

  // Ensure src/utils/githubPublisher.ts is explicitly included
  if (!filesMap['src/utils/githubPublisher.ts'] || filesMap['src/utils/githubPublisher.ts'].length === 0) {
    filesMap['src/utils/githubPublisher.ts'] = githubPublisherRaw;
  }

  // Fallback for .github/workflows/deploy.yml
  if (!filesMap['.github/workflows/deploy.yml']) {
    filesMap['.github/workflows/deploy.yml'] = `name: Deploy to GitHub Pages

on:
  push:
    branches: ["main", "master"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;
  }

  return filesMap;
}

function encodeBase64(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

export async function verifyGitHubRepo(options: {
  token: string;
  username: string;
  repo: string;
  branch?: string;
}): Promise<VerificationResult> {
  const token = options.token.trim();
  const repoName = options.repo.trim() || 'estudio-melodico';
  let username = options.username.trim();
  const targetBranch = (options.branch || 'main').trim() || 'main';

  if (!token) {
    return {
      valid: false,
      userLogin: '',
      repoExists: false,
      branchExists: false,
      defaultBranch: 'main',
      error: 'Token de Acesso do GitHub não informado.',
    };
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // 1. Check Token / User
  const userRes = await fetch('https://api.github.com/user', { headers });
  if (!userRes.ok) {
    if (userRes.status === 401) {
      return {
        valid: false,
        userLogin: '',
        repoExists: false,
        branchExists: false,
        defaultBranch: 'main',
        error: 'Token do GitHub inválido ou expirado (Status 401). Verifique suas permissões.',
      };
    }
    return {
      valid: false,
      userLogin: '',
      repoExists: false,
      branchExists: false,
      defaultBranch: 'main',
      error: `Erro ao autenticar no GitHub: ${userRes.statusText}`,
    };
  }

  const userData = await userRes.json();
  const userLogin = userData.login;
  if (!username) {
    username = userLogin;
  }

  // 2. Check Repo existence
  const repoRes = await fetch(`https://api.github.com/repos/${username}/${repoName}`, { headers });

  if (!repoRes.ok) {
    if (repoRes.status === 404) {
      return {
        valid: false,
        userLogin,
        repoExists: false,
        branchExists: false,
        defaultBranch: 'main',
        error: `O repositório '${username}/${repoName}' não foi encontrado no GitHub. Verifique se o Nome de Usuário (Owner) e o Repositório estão corretos.`,
      };
    }
    return {
      valid: false,
      userLogin,
      repoExists: false,
      branchExists: false,
      defaultBranch: 'main',
      error: `Erro ao checar repositório '${username}/${repoName}': status ${repoRes.status}`,
    };
  }

  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch || 'main';

  // 3. Check Branch existence
  const branchRes = await fetch(
    `https://api.github.com/repos/${username}/${repoName}/git/ref/heads/${targetBranch}`,
    { headers }
  );

  const branchExists = branchRes.ok;
  let warning: string | undefined;

  if (!branchExists) {
    warning = `A branch '${targetBranch}' não existe atualmente em '${username}/${repoName}'. Ela será criada automaticamente ao publicar.`;
  } else if (targetBranch !== defaultBranch) {
    warning = `A branch '${targetBranch}' é diferente da branch padrão do repositório ('${defaultBranch}'). Os arquivos serão enviados para '${targetBranch}'.`;
  }

  return {
    valid: true,
    userLogin,
    repoExists: true,
    branchExists,
    defaultBranch,
    warning,
  };
}

export async function publishToGitHub(options: PublishOptions): Promise<PublishResult> {
  const token = options.token.trim();
  const repoName = options.repo.trim() || 'estudio-melodico';
  let username = options.username.trim();
  const targetBranch = (options.branch || 'main').trim() || 'main';

  if (!token) {
    throw new Error('Token de Acesso do GitHub não fornecido.');
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // 1. Initial Pre-Verification
  const userRes = await fetch('https://api.github.com/user', { headers });
  if (!userRes.ok) {
    if (userRes.status === 401) {
      throw new Error('Token do GitHub inválido ou expirado (status 401).');
    }
    throw new Error(`Erro de autenticação no GitHub: ${userRes.statusText}`);
  }
  const userData = await userRes.json();
  const userLogin = userData.login;
  if (!username) {
    username = userLogin;
  }

  // 2. Check or create repository
  const repoCheckUrl = `https://api.github.com/repos/${username}/${repoName}`;
  let repoCheckRes = await fetch(repoCheckUrl, { headers });

  if (!repoCheckRes.ok) {
    if (repoCheckRes.status === 404) {
      // Try to create repository if owner is the authenticated user
      if (username.toLowerCase() === userLogin.toLowerCase()) {
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
          throw new Error(
            `Não foi possível criar o repositório '${username}/${repoName}': ${
              errJson.message || createRepoRes.statusText
            }`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        throw new Error(
          `O repositório '${username}/${repoName}' não existe no GitHub e você não pode criá-lo em uma conta de outro usuário.`
        );
      }
    } else {
      throw new Error(
        `Não foi possível verificar o repositório '${username}/${repoName}': ${repoCheckRes.statusText}`
      );
    }
  }

  // 3. Get all current workspace files
  const filesMap = await getWorkspaceFiles();
  const filePaths = Object.keys(filesMap);

  if (filePaths.length === 0) {
    throw new Error('Nenhum arquivo encontrado no workspace para enviar ao GitHub.');
  }

  // 4. Create Git Blobs for every workspace file
  const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];

  for (const filePath of filePaths) {
    const content = filesMap[filePath];
    const base64Content = encodeBase64(content);

    const blobRes = await fetch(
      `https://api.github.com/repos/${username}/${repoName}/git/blobs`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: base64Content,
          encoding: 'base64',
        }),
      }
    );

    if (!blobRes.ok) {
      const errJson = await blobRes.json().catch(() => ({}));
      throw new Error(
        `Erro ao criar blob para '${filePath}': ${errJson.message || blobRes.statusText}`
      );
    }

    const blobData = await blobRes.json();
    treeItems.push({
      path: filePath,
      mode: '100644',
      type: 'blob',
      sha: blobData.sha,
    });
  }

  // 5. Get current parent commit SHA if ref exists
  let latestCommitSha: string | null = null;

  const targetRefRes = await fetch(
    `https://api.github.com/repos/${username}/${repoName}/git/ref/heads/${targetBranch}`,
    { headers }
  );

  if (targetRefRes.ok) {
    const refData = await targetRefRes.json();
    latestCommitSha = refData.object.sha;
  } else {
    // Check if default branch has commits to inherit parent
    const repoInfoRes = await fetch(`https://api.github.com/repos/${username}/${repoName}`, { headers });
    if (repoInfoRes.ok) {
      const repoInfo = await repoInfoRes.json();
      const defBranch = repoInfo.default_branch || 'main';
      const defRefRes = await fetch(
        `https://api.github.com/repos/${username}/${repoName}/git/ref/heads/${defBranch}`,
        { headers }
      );
      if (defRefRes.ok) {
        const defRefData = await defRefRes.json();
        latestCommitSha = defRefData.object.sha;
      }
    }
  }

  // 6. Create Git Tree (omitting base_tree guarantees full current workspace capture without 404 tree errors)
  const treeRes = await fetch(
    `https://api.github.com/repos/${username}/${repoName}/git/trees`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ tree: treeItems }),
    }
  );

  if (!treeRes.ok) {
    const errJson = await treeRes.json().catch(() => ({}));
    if (treeRes.status === 404) {
      throw new Error(
        `Erro ao criar árvore Git (404 Not Found): Verifique se o Nome do Usuário ('${username}') e Repositório ('${repoName}') coincidem com o GitHub.`
      );
    }
    throw new Error(`Erro ao criar árvore Git: ${errJson.message || treeRes.statusText}`);
  }

  const newTreeData = await treeRes.json();
  const newTreeSha = newTreeData.sha;

  // 7. Create Commit
  const commitMsg = `🚀 Sincronização workspace AI Studio v${APP_VERSION} [branch: ${targetBranch}] (${filePaths.length} arquivos)`;
  const createCommitBody: any = {
    message: commitMsg,
    tree: newTreeSha,
  };
  if (latestCommitSha) {
    createCommitBody.parents = [latestCommitSha];
  }

  const newCommitRes = await fetch(
    `https://api.github.com/repos/${username}/${repoName}/git/commits`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMsg,
        tree: newTreeSha,
        ...(latestCommitSha ? { parents: [latestCommitSha] } : {}),
      }),
    }
  );

  if (!newCommitRes.ok) {
    const errJson = await newCommitRes.json().catch(() => ({}));
    throw new Error(`Erro ao criar commit no GitHub: ${errJson.message || newCommitRes.statusText}`);
  }

  const newCommitData = await newCommitRes.json();
  const newCommitSha = newCommitData.sha;

  // 8. Update existing branch ref or create new branch ref
  if (targetRefRes.ok) {
    const updateRefRes = await fetch(
      `https://api.github.com/repos/${username}/${repoName}/git/refs/heads/${targetBranch}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: newCommitSha,
          force: true,
        }),
      }
    );

    if (!updateRefRes.ok) {
      const errJson = await updateRefRes.json().catch(() => ({}));
      throw new Error(
        `Erro ao atualizar branch '${targetBranch}': ${errJson.message || updateRefRes.statusText}`
      );
    }
  } else {
    const createRefRes = await fetch(
      `https://api.github.com/repos/${username}/${repoName}/git/refs`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${targetBranch}`,
          sha: newCommitSha,
        }),
      }
    );

    if (!createRefRes.ok) {
      const errJson = await createRefRes.json().catch(() => ({}));
      throw new Error(
        `Erro ao criar branch '${targetBranch}': ${errJson.message || createRefRes.statusText}`
      );
    }
  }

  // 9. Try enabling GitHub Pages (if not already managed by Actions workflow)
  try {
    await fetch(`https://api.github.com/repos/${username}/${repoName}/pages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        build_type: 'workflow',
      }),
    });
  } catch (e) {
    // Ignore if pages is already enabled or configured via GitHub Actions
  }

  const repoUrl = `https://github.com/${username}/${repoName}/tree/${targetBranch}`;
  const actionsUrl = `https://github.com/${username}/${repoName}/actions`;
  const pagesUrl = `https://${username.toLowerCase()}.github.io/${repoName}/`;

  return {
    success: true,
    message: `Commit realizado com sucesso na branch '${targetBranch}'! O workflow do GitHub Actions (.github/workflows/deploy.yml) foi acionado para compilar e publicar no GitHub Pages (${filePaths.length} arquivos sincronizados).`,
    repoUrl,
    actionsUrl,
    pagesUrl,
    username,
    repo: repoName,
    branch: targetBranch,
    fileCount: filePaths.length,
  };
}
