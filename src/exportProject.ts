import { strToU8, zipSync } from 'fflate';

// Raw imports include the editable sources, not the compiled application bundle.
const sourceFiles = import.meta.glob<string>([
  './**/*.{ts,tsx,css}',
  '../.github/workflows/*.yml',
  '../android/**/*.{gradle,properties,kt,xml}',
  '../android/README.md',
  '../tests/**/*.ts',
  '../package.json',
  '../package-lock.json',
  '../tsconfig.json',
  '../vite.config.ts',
  '../index.html',
  '../README.md',
  '../LICENSE',
  '../.gitignore',
  '../.nvmrc',
  '../public/favicon.svg',
  '../public/.nojekyll',
], { query: '?raw', import: 'default', eager: true });

export async function downloadProject() {
  const files: Record<string, Uint8Array> = {};
  for (const [path, source] of Object.entries(sourceFiles)) {
    const relativePath = path.startsWith('../') ? path.slice(3) : `src/${path.slice(2)}`;
    files[`lisiere/${relativePath}`] = strToU8(source);
  }
  const images = ['liminal-forest.jpg', 'silent-factory.jpg', 'last-light.jpg'];
  await Promise.all(images.map(async (image) => {
    const response = await fetch(new URL(`./images/${image}`, document.baseURI));
    if (!response.ok) throw new Error(`Impossible de charger ${image}`);
    files[`lisiere/public/images/${image}`] = new Uint8Array(await response.arrayBuffer());
  }));
  const archive = zipSync(files, { level: 6 });
  const blob = new Blob([new Uint8Array(archive).buffer], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'lisiere-projet-complet.zip';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 20_000);
}