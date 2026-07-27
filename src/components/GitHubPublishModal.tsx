import React, { useState, useEffect } from 'react';
import { X, Send, Github, CheckCircle2, AlertCircle, ExternalLink, Copy, Check, Globe, Link2, Key, GitBranch, RefreshCw, AlertTriangle } from 'lucide-react';
import { APP_VERSION } from '../utils/musicTheory';
import { ProgressionConfig } from '../utils/standaloneExporter';
import { publishToGitHub, verifyGitHubRepo, VerificationResult } from '../utils/githubPublisher';

interface GitHubPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  escalasDict?: Record<string, string>;
  ritmosDict?: Record<string, string>;
  padroesDict?: Record<string, string>;
  acordesDict?: Record<string, string>;
  currentConfig?: ProgressionConfig;
}

export const GitHubPublishModal: React.FC<GitHubPublishModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [token, setToken] = useState(() => localStorage.getItem('gh_token') || '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');
  const [username, setUsername] = useState(() => localStorage.getItem('gh_username') || '');
  const [repo, setRepo] = useState(() => localStorage.getItem('gh_repo') || 'estudio-melodico');
  const [branch, setBranch] = useState(() => localStorage.getItem('gh_branch') || 'main');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);

  const [copiedRepo, setCopiedRepo] = useState(false);
  const [copiedPages, setCopiedPages] = useState(false);

  // Load last publication if available
  const [lastPublished, setLastPublished] = useState<{
    username: string;
    repo: string;
    branch?: string;
    time: string;
    version: string;
    repoUrl: string;
    pagesUrl: string;
  } | null>(() => {
    const saved = localStorage.getItem('gh_last_published');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (lastPublished) {
      if (!username) setUsername(lastPublished.username);
      if (!repo) setRepo(lastPublished.repo);
      if (lastPublished.branch && !localStorage.getItem('gh_branch')) {
        setBranch(lastPublished.branch);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentUsername = username.trim();
  const currentRepo = repo.trim();
  const currentBranch = branch.trim() || 'main';

  const defaultRepoUrl = currentUsername ? `https://github.com/${currentUsername}/${currentRepo}/tree/${currentBranch}` : '';
  const defaultPagesUrl = currentUsername ? `https://${currentUsername.toLowerCase()}.github.io/${currentRepo}/` : '';

  const displayRepoUrl = lastPublished?.repoUrl || defaultRepoUrl;
  const displayPagesUrl = lastPublished?.pagesUrl || defaultPagesUrl;
  const displayActionsUrl = currentUsername ? `https://github.com/${currentUsername}/${currentRepo}/actions` : '';

  const handleVerify = async () => {
    if (!token.trim()) {
      setStatus('error');
      setMessage('Informe o Token de Acesso do GitHub para verificar.');
      return;
    }

    setIsVerifying(true);
    setStatus('idle');
    setMessage('Verificando usuário, repositório e branch no GitHub...');

    try {
      const res = await verifyGitHubRepo({
        token,
        username,
        repo,
        branch,
      });

      setVerification(res);

      if (res.userLogin && !username) {
        setUsername(res.userLogin);
      }

      if (!res.valid) {
        setStatus('error');
        setMessage(res.error || 'Verificação falhou. Verifique os dados fornecidos.');
      } else {
        if (res.warning) {
          setStatus('idle');
          setMessage(res.warning);
        } else {
          setStatus('idle');
          setMessage(`✅ Repositório '${username || res.userLogin}/${repo}' e branch '${currentBranch}' confirmados no GitHub!`);
        }
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Erro ao realizar verificação no GitHub.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setStatus('error');
      setMessage('Informe o Token de Acesso do GitHub.');
      return;
    }

    setStatus('loading');
    setMessage(`Verificando conexão e dados no GitHub...`);

    try {
      // Step 1: Pre-verification
      const vResult = await verifyGitHubRepo({
        token,
        username,
        repo,
        branch,
      });

      setVerification(vResult);

      if (!vResult.valid) {
        setStatus('error');
        setMessage(vResult.error || 'Verificação inicial falhou. Ajuste os dados e tente novamente.');
        return;
      }

      const activeUser = username.trim() || vResult.userLogin;

      // Step 2: Publish workspace files
      setMessage(`Coletando todos os arquivos do workspace v${APP_VERSION} e enviando para '${activeUser}/${currentRepo}' (${currentBranch})...`);

      const result = await publishToGitHub({
        token,
        username: activeUser,
        repo: currentRepo,
        branch: currentBranch,
      });

      const pubInfo = {
        username: result.username,
        repo: result.repo,
        branch: result.branch,
        version: APP_VERSION,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        repoUrl: result.repoUrl,
        pagesUrl: result.pagesUrl,
      };

      localStorage.setItem('gh_token', token.trim());
      localStorage.setItem('gh_username', result.username);
      localStorage.setItem('gh_repo', result.repo);
      localStorage.setItem('gh_branch', result.branch);
      localStorage.setItem('gh_last_published', JSON.stringify(pubInfo));

      setUsername(result.username);
      setRepo(result.repo);
      setBranch(result.branch);
      setLastPublished(pubInfo);

      setStatus('success');
      setMessage(result.message);
    } catch (err: any) {
      console.error('Publish error:', err);
      setStatus('error');
      setMessage(err?.message || 'Erro ao publicar no GitHub. Verifique os parâmetros informados.');
    }
  };

  const handleCopy = (text: string, type: 'repo' | 'pages') => {
    navigator.clipboard.writeText(text);
    if (type === 'repo') {
      setCopiedRepo(true);
      setTimeout(() => setCopiedRepo(false), 2000);
    } else {
      setCopiedPages(true);
      setTimeout(() => setCopiedPages(false), 2000);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn overflow-y-auto"
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
          title="Fechar (Esc)"
        >
          <X className="w-4 h-4" />
          <span className="font-medium">Fechar</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Publicação GitHub Pages</h3>
            <p className="text-xs text-slate-400">Sincronizar workspace atual v{APP_VERSION} no GitHub</p>
          </div>
        </div>

        <form onSubmit={handlePublish} className="space-y-4">
          {/* Token Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>Token de Acesso Pessoal (PAT)</span>
              </span>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,workflow"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                <span>Criar token</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setVerification(null);
              }}
              placeholder="ghp_..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Owner & Repo Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome do Usuário / Owner
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setVerification(null);
                }}
                placeholder="Ex: seu-usuario-github"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Ex: rictbx</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome do Repositório
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => {
                  setRepo(e.target.value);
                  setVerification(null);
                }}
                placeholder="estudio-melodico"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Ex: estudio-melodico</span>
            </div>
          </div>

          {/* Branch Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                <span>Nome da Branch</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Atalho:</span>
                <button
                  type="button"
                  onClick={() => {
                    setBranch('main');
                    setVerification(null);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded transition ${
                    branch === 'main'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  main
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBranch('master');
                    setVerification(null);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded transition ${
                    branch === 'master'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  master
                </button>
              </div>
            </div>
            <input
              type="text"
              value={branch}
              onChange={(e) => {
                setBranch(e.target.value);
                setVerification(null);
              }}
              placeholder="main"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Verification Bar & Action */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying || status === 'loading'}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Verificando...' : 'Verificar Repositório no GitHub'}</span>
            </button>
          </div>

          {/* Verification Feedback Badge */}
          {verification && (
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                verification.valid
                  ? verification.warning
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {verification.valid ? (
                  verification.warning ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>
                  {verification.valid
                    ? verification.warning
                      ? 'Aviso de Verificação do GitHub'
                      : 'Repositório e Branch Verificados'
                    : 'Atenção: Dados Não Coincidem no GitHub'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {verification.valid
                  ? verification.warning ||
                    `Conexão OK! O repositório '${username || verification.userLogin}/${repo}' existe e a branch '${currentBranch}' está pronta.`
                  : verification.error}
              </p>
            </div>
          )}

          {/* Main Status Message */}
          {status !== 'idle' && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : status === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              }`}
            >
              {status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : status === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              ) : (
                <Send className="w-4 h-4 shrink-0 animate-pulse text-indigo-400" />
              )}
              <span className="font-medium">{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || isVerifying}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{status === 'loading' ? 'Sincronizando no GitHub...' : `🚀 Enviar Projeto Atual (v${APP_VERSION})`}</span>
          </button>
        </form>

        {/* Links Section (Appears after publishing or if previously published) */}
        {(status === 'success' || lastPublished) && displayRepoUrl && (
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-indigo-400" />
                Links de Acesso ao GitHub
              </span>
              {lastPublished && (
                <span className="text-[11px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  branch: {lastPublished.branch || currentBranch}
                </span>
              )}
            </div>

            {/* Repositório Link Card */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-slate-300" />
                  Repositório no GitHub ({lastPublished?.branch || currentBranch})
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(displayRepoUrl, 'repo')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                  title="Copiar link do repositório"
                >
                  {copiedRepo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRepo ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <a
                href={displayRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-indigo-300 hover:text-indigo-200 break-all flex items-center gap-1.5 group bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 transition"
              >
                <span className="truncate flex-1">{displayRepoUrl}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-indigo-300 transition" />
              </a>

              <a
                href={displayRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Abrir Repositório no GitHub</span>
                <ExternalLink className="w-3 h-3 text-slate-400 ml-1" />
              </a>
            </div>

            {/* GitHub Actions Workflow Link Card */}
            {displayActionsUrl && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    Compilação Automática (GitHub Actions)
                  </span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                    .github/workflows/deploy.yml
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  O commit ativou o workflow do GitHub Actions. O Vite compilará a aplicação e publicará o site automaticamente em 1 a 2 minutos.
                </p>

                <a
                  href={displayActionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold py-2 px-3 rounded-lg border border-amber-500/40 transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Acompanhar Status da Compilação no GitHub Actions</span>
                  <ExternalLink className="w-3 h-3 text-amber-400 ml-1" />
                </a>
              </div>
            )}

            {/* GitHub Pages Site Link Card */}
            {displayPagesUrl && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    Aplicação Online (GitHub Pages)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(displayPagesUrl, 'pages')}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
                    title="Copiar link do GitHub Pages"
                  >
                    {copiedPages ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPages ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                <a
                  href={displayPagesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-sky-300 hover:text-sky-200 break-all flex items-center gap-1.5 group bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 transition"
                >
                  <span className="truncate flex-1">{displayPagesUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-sky-300 transition" />
                </a>

                <a
                  href={displayPagesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-sky-600/20 hover:bg-sky-600/30 text-sky-200 text-xs font-semibold py-2 px-3 rounded-lg border border-sky-500/30 transition flex items-center justify-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>Acessar App no GitHub Pages</span>
                  <ExternalLink className="w-3 h-3 text-sky-400 ml-1" />
                </a>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <X className="w-4 h-4 text-slate-400" />
            <span>Voltar ao Estúdio Melódico</span>
          </button>
        </div>
      </div>
    </div>
  );
};
