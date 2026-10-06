import { useState } from 'react';
import { ArrowUpRight, Check, Copy, Download, FileCode2, LoaderCircle } from 'lucide-react';
import { GitHubIcon } from './Brand';

export default function ProjectPanel() {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function download() {
    setDownloading(true);
    setError('');
    try {
      const { downloadProject } = await import('../exportProject');
      await downloadProject();
      setDownloaded(true);
    } catch {
      setError('Le t\u00e9l\u00e9chargement a \u00e9chou\u00e9. V\u00e9rifiez votre connexion et r\u00e9essayez.');
    } finally {
      setDownloading(false);
    }
  }

  async function copyCommands() {
    try {
      await navigator.clipboard.writeText('npm ci\nnpm run build\nnpm run preview');
      setCopied(true);
    } catch {
      setError('La copie est indisponible. Vous pouvez s\u00e9lectionner les commandes ci-dessous.');
    }
  }

  return (
    <div className="project-panel">
      <p className="dialog-description">Un univers original, un projet qui vous appartient. Retrouvez le code TypeScript, l&rsquo;application Android et tout le n&eacute;cessaire pour compiler le jeu.</p>
      <div className="project-file-list">
        <div><FileCode2 size={18} /><code>src/game/</code><span>Moteur et &eacute;nigmes</span></div>
        <div><FileCode2 size={18} /><code>android/</code><span>Application Android paysage</span></div>
        <div><FileCode2 size={18} /><code>build-apk.yml</code><span>Compilation de l&rsquo;APK</span></div>
      </div>
      <div className="terminal">
        <div className="terminal-heading"><span>COMPILER EN LOCAL</span><button className="icon-button" onClick={copyCommands} aria-label={copied ? 'Commandes copi\u00e9es' : 'Copier les commandes'}>{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>
        <pre><code><span>$ </span>npm ci{'\n'}<span>$ </span>npm run build{'\n'}<span>$ </span>npm run preview</code></pre>
        <p>Node.js 22.18 ou plus r&eacute;cent. Les fichiers compil&eacute;s sont dans <code>dist/</code>.</p>
      </div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <button className="primary-button full-width" onClick={download} disabled={downloading}>
        {downloading ? <LoaderCircle className="spin" size={18} /> : downloaded ? <Check size={18} /> : <Download size={18} />}
        {downloading ? 'Pr\u00e9paration de l\u2019archive...' : downloaded ? 'T\u00e9l\u00e9charger \u00e0 nouveau le projet' : 'T\u00e9l\u00e9charger le projet complet'}
        <span className="button-suffix">.zip</span>
      </button>
      <a className="secondary-button full-width github-link" href="https://github.com/new" target="_blank" rel="noreferrer"><GitHubIcon size={18} />Cr&eacute;er mon d&eacute;p&ocirc;t GitHub<ArrowUpRight size={17} /></a>
      <p className="project-note">Ajoutez l&rsquo;archive &agrave; votre d&eacute;p&ocirc;t GitHub. Le workflow <strong>Build APK</strong> g&eacute;n&egrave;re une APK Debug dans <strong>Actions &gt; Artifacts</strong> &agrave; chaque envoi sur <code>main</code>. La signature Google Play et votre connexion GitHub restent sous votre contr&ocirc;le.</p>
    </div>
  );
}