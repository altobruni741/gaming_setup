import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronRight, Headphones, Info, LockKeyhole, Menu, RotateCcw, Settings2, Volume2, VolumeX, X } from 'lucide-react';
import Brand, { BrandMark, GitHubIcon } from './components/Brand';
import Controls from './components/Controls';
import Dialog from './components/Dialog';
import GameScreen from './components/GameScreen';
import ProjectPanel from './components/ProjectPanel';
import { LEVELS } from './game/levels';
import { EMPTY_PROGRESS, readPreferences, readProgress, savePreferences, saveProgress } from './lib/storage';
import type { Preferences } from './lib/storage';
import { useAmbientAudio } from './lib/useAmbientAudio';

type Modal = 'controls' | 'project' | 'settings' | 'reset' | null;

const reveal = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function App() {
  const [progress, setProgress] = useState(readProgress);
  const [preferences, setPreferences] = useState(readPreferences);
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('experience');
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const scrollPosition = useRef(0);
  const toastId = useRef(0);
  const audio = useAmbientAudio(preferences.volume);
  const finished = progress.completed.length === LEVELS.length;

  const notify = useCallback((message: string) => {
    toastId.current += 1;
    setToast({ message, id: toastId.current });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!saveProgress(progress) && progress.started) {
      notify('La sauvegarde locale est indisponible. Gardez cette page ouverte pour conserver votre progression.');
    }
  }, [progress, notify]);

  useEffect(() => savePreferences(preferences), [preferences]);

  useEffect(() => {
    if (activeLevel !== null) return;
    const onAndroidBack = () => {
      if (mobileOpen) {
        setMobileOpen(false);
      } else if (modal === 'reset') {
        setModal('settings');
      } else if (modal) {
        setModal(null);
      } else if (window.location.hash) {
        window.history.back();
      } else {
        (window as Window & { LisiereNative?: { exitApp: () => void } }).LisiereNative?.exitApp();
      }
    };
    window.addEventListener('lisiere-back', onAndroidBack);
    return () => window.removeEventListener('lisiere-back', onAndroidBack);
  }, [activeLevel, mobileOpen, modal]);

  useEffect(() => {
    if (audio.error) notify(audio.error);
  }, [audio.error, notify]);

  useEffect(() => {
    if (activeLevel !== null) return;
    const onScroll = () => {
      const chapters = document.getElementById('chapitres');
      setActiveNav(chapters && chapters.getBoundingClientRect().top < 180 ? 'chapitres' : 'experience');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.scrollTo({ top: scrollPosition.current, behavior: 'instant' });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeLevel]);

  function openModal(next: Modal) {
    setMobileOpen(false);
    setModal(next);
  }

  function startLevel(index: number) {
    if (index > 0 && !progress.completed.includes(index - 1)) {
      notify(`Terminez \u00ab ${LEVELS[index - 1].title} \u00bb pour d\u00e9couvrir ce chapitre.`);
      return;
    }
    if (activeLevel === null) scrollPosition.current = window.scrollY;
    setModal(null);
    setMobileOpen(false);
    setProgress((previous) => ({ ...previous, started: true, current: index }));
    setActiveLevel(index);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  const completeLevel = useCallback((index: number) => {
    setProgress((previous) => ({
      started: true,
      current: Math.min(index + 1, LEVELS.length - 1),
      completed: [...new Set([...previous.completed, index])],
    }));
  }, []);

  const exitGame = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    setActiveLevel(null);
  }, []);

  function updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences((previous) => ({ ...previous, [key]: value }));
  }

  const begin = () => startLevel(finished ? 0 : progress.current);

  return (
    <MotionConfig reducedMotion={preferences.motion ? 'user' : 'always'}>
      <div className="app" data-motion={preferences.motion ? 'on' : 'off'}>
        {activeLevel !== null ? (
          <GameScreen levelIndex={activeLevel} onExit={exitGame} onComplete={completeLevel} onStartLevel={startLevel} soundEnabled={audio.enabled} toggleSound={audio.toggle} playCue={audio.cue} motionEnabled={preferences.motion} />
        ) : (
          <>
            <a className="skip-link" href="#main-content">Aller au contenu</a>
            <header className="site-header">
              <div className="header-inner">
                <a href="#experience" className="brand-link" aria-label="Lisi&egrave;re, accueil" onClick={() => setMobileOpen(false)}><Brand /></a>
                <nav className="desktop-nav" aria-label="Navigation principale">
                  <a href="#experience" className={activeNav === 'experience' ? 'active' : ''}>L&rsquo;exp&eacute;rience</a>
                  <a href="#chapitres" className={activeNav === 'chapitres' ? 'active' : ''}>Chapitres</a>
                  <button onClick={() => openModal('controls')}>Comment jouer</button>
                </nav>
                <div className="header-actions">
                  <button className={`icon-button sound-toggle ${audio.enabled ? 'sound-active' : ''}`} onClick={audio.toggle} aria-label={audio.enabled ? 'Couper l\u2019ambiance sonore' : 'Activer l\u2019ambiance sonore'} title={audio.enabled ? 'Couper le son' : 'Activer le son'} aria-pressed={audio.enabled}>{audio.enabled ? <Volume2 size={19} strokeWidth={1.5} /> : <VolumeX size={19} strokeWidth={1.5} />}</button>
                  <span className="header-divider" />
                  <button className="project-button" onClick={() => openModal('project')}><GitHubIcon size={17} /><span>Le projet</span><ArrowUpRight size={14} /></button>
                  <button className="icon-button mobile-menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-controls="mobile-navigation" aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
                </div>
              </div>
              <AnimatePresence>
                {mobileOpen && <motion.nav className="mobile-nav" id="mobile-navigation" aria-label="Navigation mobile" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <a href="#experience" onClick={() => setMobileOpen(false)}>L&rsquo;exp&eacute;rience<ArrowUpRight size={17} /></a>
                  <a href="#chapitres" onClick={() => setMobileOpen(false)}>Les chapitres<ArrowDownRight size={17} /></a>
                  <button onClick={() => openModal('controls')}>Comment jouer<ChevronRight size={17} /></button>
                  <button onClick={() => openModal('project')}>Le projet GitHub<GitHubIcon size={17} /></button>
                </motion.nav>}
              </AnimatePresence>
            </header>

            <main id="main-content">
              <section className="hero" id="experience" aria-labelledby="hero-title">
                <div className="hero-media">
                  <motion.img className="hero-image" src="./images/liminal-forest.jpg" alt="Une petite silhouette face au passage d'une for&ecirc;t noy&eacute;e de brume." initial={{ scale: 1.045 }} animate={{ scale: 1 }} transition={{ duration: 22, ease: 'linear' }} fetchPriority="high" />
                </div>
                <div className="hero-shade" />
                <div className="forest-motes" aria-hidden="true">{Array.from({ length: 15 }, (_, index) => <span key={index} style={{ left: `${35 + (index * 17) % 65}%`, top: `${17 + (index * 11) % 68}%`, animationDelay: `${-index * 1.7}s`, animationDuration: `${10 + index % 6 * 2}s` }} />)}</div>
                <div className="page-width hero-inner">
                  <motion.div className="hero-copy" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}>
                    <motion.p className="hero-eyebrow" variants={reveal}><span />ENTRE L&rsquo;OMBRE ET L&rsquo;&Eacute;VEIL</motion.p>
                    <motion.h1 id="hero-title" variants={reveal}>LISI&Egrave;RE</motion.h1>
                    <motion.div className="hero-intro" variants={reveal}><h2>Chaque ombre cache un chemin.</h2><p>Observez. Anticipez. Traversez l&rsquo;inconnu.<br />Une aventure o&ugrave; chaque pas compte.</p></motion.div>
                    <motion.div className="hero-actions" variants={reveal}>
                      <button className="primary-button hero-play" onClick={begin}><span>{finished ? 'Rejouer l\u2019aventure' : progress.started ? 'Reprendre l\u2019aventure' : 'Commencer l\u2019aventure'}</span><ArrowRight size={19} strokeWidth={1.7} /></button>
                      <a className="hero-secondary" href="#univers">D&eacute;couvrir l&rsquo;univers<ArrowDownRight size={17} /></a>
                    </motion.div>
                  </motion.div>
                  <a href="#chapitres" className="scroll-cue"><span className="scroll-line" /><span>L&rsquo;INCONNU VOUS ATTEND</span><ArrowDown size={13} /></a>
                </div>
              </section>

              <section className="chapters-section" id="chapitres" aria-labelledby="chapters-title">
                <div className="page-width">
                  <p className="eyebrow">LE VOYAGE</p>
                  <div className="section-heading"><h2 id="chapters-title">Trois lieux. Un seul chemin.</h2><span>Avancez &agrave; votre rythme.</span></div>
                  <div className="chapter-grid">
                    {LEVELS.map((level, index) => {
                      const locked = index > 0 && !progress.completed.includes(index - 1);
                      const completed = progress.completed.includes(index);
                      return (
                        <motion.button className={`chapter-item ${locked ? 'is-locked' : ''}`} key={level.id} onClick={() => startLevel(index)} aria-disabled={locked} aria-label={`${level.title}. ${locked ? 'Verrouill\u00e9, terminez le chapitre pr\u00e9c\u00e9dent.' : completed ? 'Rejouer ce chapitre.' : 'Commencer ce chapitre.'}`} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.65, delay: index * 0.09 }}>
                          <div className="chapter-image-wrap"><img src={level.image} alt={level.description} loading="lazy" /><span className="chapter-image-shade" /><span className="chapter-image-action">{locked ? <LockKeyhole size={18} strokeWidth={1.4} /> : completed ? <RotateCcw size={19} strokeWidth={1.4} /> : <ArrowUpRight size={22} strokeWidth={1.4} />}</span></div>
                          <div className="chapter-title-row"><span className="chapter-index">0{index + 1}</span><h3>{level.title}</h3>{completed && <Check size={16} className="chapter-complete" />}</div>
                          <p>{locked ? `Terminez le chapitre 0${index} pour continuer` : completed ? 'Vous connaissez le chemin. Red\u00e9couvrez-le.' : level.subtitle}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="universe-section" id="univers" aria-labelledby="universe-title">
                <div className="page-width universe-inner">
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}><p className="eyebrow">MOINS DE BRUIT. PLUS D&rsquo;INSTINCT.</p><h2 id="universe-title">Tout ne se voit pas.<br /><span>Tout se ressent.</span></h2></motion.div>
                  <div className="universe-copy"><p>Vous n&rsquo;avez ni arme, ni carte. Seulement votre regard et le courage d&rsquo;avancer. Dans ce monde suspendu, d&eacute;placez ce qui vous retient, comprenez ce qui vous menace, et faites de l&rsquo;ombre votre alli&eacute;e.</p><button className="text-button" onClick={begin}>Faire le premier pas<ArrowRight size={17} /></button></div>
                  <BrandMark className="universe-mark" />
                </div>
              </section>
            </main>

            <footer className="site-footer page-width">
              <div className="footer-brand"><Brand /><p>Un univers original. Une travers&eacute;e singuli&egrave;re.</p></div>
              <div className="footer-links"><button onClick={() => openModal('project')}><GitHubIcon size={16} />Code &amp; compilation<ArrowUpRight size={13} /></button><button onClick={() => openModal('settings')}><Settings2 size={16} />Param&egrave;tres</button></div>
              <div className="footer-bottom"><span>&copy; 2026 LISI&Egrave;RE</span><span>Con&ccedil;u pour le navigateur. Pens&eacute; pour l&rsquo;exploration.</span><button onClick={audio.toggle}><Headphones size={13} />{audio.enabled ? 'L\u2019ambiance est activ\u00e9e' : 'Une exp\u00e9rience \u00e0 \u00e9couter'}</button></div>
            </footer>
          </>
        )}

        {modal === 'controls' && <Dialog title="Apprivoisez les ombres." eyebrow="COMMENT JOUER" onClose={() => setModal(null)}><Controls /><button className="primary-button full-width" onClick={begin}>Je suis pr&ecirc;t &agrave; traverser<ArrowRight size={18} /></button></Dialog>}
        {modal === 'project' && <Dialog title={'De l\u2019ombre au code.'} eyebrow={'LE PROJET LISI\u00c8RE'} onClose={() => setModal(null)} className="project-dialog"><ProjectPanel /></Dialog>}
        {modal === 'settings' && <Dialog title={'\u00c0 votre rythme.'} eyebrow={'PARAM\u00c8TRES'} onClose={() => setModal(null)}>
          <p className="dialog-description">Quelques r&eacute;glages pour une travers&eacute;e qui vous ressemble.</p>
          <div className="settings-list">
            <div className="setting-row"><div><strong>Ambiance sonore</strong><span>Un souffle, une pr&eacute;sence, quelques notes.</span></div><button className={`switch ${audio.enabled ? 'is-on' : ''}`} role="switch" aria-checked={audio.enabled} aria-label="Ambiance sonore" onClick={audio.toggle}><span /></button></div>
            <div className="setting-volume"><label htmlFor="volume">Volume<span>{Math.round(preferences.volume * 100)} %</span></label><input id="volume" type="range" min="0" max="1" step="0.01" value={preferences.volume} onChange={(event) => updatePreference('volume', Number(event.target.value))} aria-label="Volume de l'ambiance" /></div>
            <div className="setting-row"><div><strong>Animations d&rsquo;ambiance</strong><span>Brume, particules et mouvements de l&rsquo;interface.</span></div><button className={`switch ${preferences.motion ? 'is-on' : ''}`} role="switch" aria-checked={preferences.motion} aria-label="Animations d'ambiance" onClick={() => updatePreference('motion', !preferences.motion)}><span /></button></div>
          </div>
          <div className="save-setting"><div><span className="eyebrow">VOTRE TRAVERS&Eacute;E</span><p>{progress.started ? `${progress.completed.length} chapitre${progress.completed.length > 1 ? 's' : ''} travers\u00e9${progress.completed.length > 1 ? 's' : ''}. Votre prochain pas vous attend.` : 'Votre histoire n\u2019a pas encore commenc\u00e9.'}</p><small>La progression est conserv&eacute;e sur cet appareil, par chapitre.</small></div><button className="text-button reset-save" disabled={!progress.started} onClick={() => setModal('reset')}><RotateCcw size={15} />Effacer la progression</button></div>
        </Dialog>}
        {modal === 'reset' && <Dialog title="Revenir au premier pas ?" eyebrow={'NOUVELLE TRAVERS\u00c9E'} onClose={() => setModal('settings')}>
          <p className="dialog-description">Les chapitres d&eacute;bloqu&eacute;s et votre sauvegarde seront effac&eacute;s de cet appareil. Cette action est d&eacute;finitive.</p>
          <button className="primary-button full-width" onClick={() => { setProgress({ ...EMPTY_PROGRESS }); setModal(null); notify('Une nouvelle aventure vous attend \u00e0 la lisi\u00e8re.'); }}>Recommencer mon histoire<RotateCcw size={17} /></button><button className="secondary-button full-width" onClick={() => setModal('settings')}>Garder ma progression</button>
        </Dialog>}
        <AnimatePresence>{toast && <motion.div className="toast" key={toast.id} role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><Info size={18} /><p>{toast.message}</p><button className="icon-button" aria-label="Fermer la notification" onClick={() => setToast(null)}><X size={16} /></button></motion.div>}</AnimatePresence>
      </div>
    </MotionConfig>
  );
}
