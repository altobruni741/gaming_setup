import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUp, Check, ChevronRight, Hand, Lightbulb, Maximize, Pause, Play, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import Brand from './Brand';
import Controls from './Controls';
import Dialog from './Dialog';
import { GameEngine } from '../game/engine';
import { LEVELS } from '../game/levels';
import type { GameStatus, InputState, WorldEvent } from '../game/world';

interface GameScreenProps {
  levelIndex: number;
  onExit: () => void;
  onComplete: (level: number) => void;
  onStartLevel: (level: number) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  playCue: (event: WorldEvent) => void;
  motionEnabled: boolean;
}

const INITIAL_STATUS: GameStatus = {
  context: '', progress: 0, plateActive: false, leverActive: false,
  elapsed: 0, deaths: 0, dead: false, deathReason: '',
};

export default function GameScreen({ levelIndex, onExit, onComplete, onStartLevel, soundEnabled, toggleSound, playCue, motionEnabled }: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const callbackRef = useRef({ onComplete, playCue });
  callbackRef.current = { onComplete, playCue };
  const [status, setStatus] = useState(INITIAL_STATUS);
  const [paused, setPaused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<{ seconds: number; deaths: number } | null>(null);
  const [error, setError] = useState('');
  const level = LEVELS[levelIndex];

  useEffect(() => {
    if (!canvasRef.current) return;
    setResult(null);
    setPaused(false);
    setShowHint(false);
    setStatus(INITIAL_STATUS);
    setError('');
    try {
      const engine = new GameEngine(canvasRef.current, LEVELS[levelIndex], {
        onStatus: setStatus,
        onEvent: (event, world) => {
          callbackRef.current.playCue(event);
          if (event === 'complete') {
            setResult({ seconds: Math.round(world.elapsed), deaths: world.deaths });
            callbackRef.current.onComplete(levelIndex);
          }
        },
      }, motionEnabled);
      engineRef.current = engine;
      canvasRef.current.focus();
      return () => {
        engine.dispose();
        engineRef.current = null;
      };
    } catch {
      setError('Votre navigateur ne permet pas de lancer le moteur 2D. Essayez une version r\u00e9cente de Firefox, Chrome ou Safari.');
    }
  }, [levelIndex, motionEnabled]);

  useEffect(() => {
    engineRef.current?.setPaused(paused || showHelp || showHint || result !== null);
  }, [paused, showHelp, showHint, result, levelIndex]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Escape' && !paused && !showHelp && !result) {
        event.preventDefault();
        if (showHint) setShowHint(false);
        else setPaused(true);
      }
    };
    const onHidden = () => {
      if (document.hidden && !result) setPaused(true);
    };
    const onAndroidBack = () => {
      if (result) {
        onExit();
      } else if (showHelp) {
        setShowHelp(false);
      } else if (showHint) {
        setShowHint(false);
      } else if (paused) {
        setPaused(false);
      } else {
        setPaused(true);
      }
    };
    const onBlur = () => {
      if (!result && !showHelp) setPaused(true);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', onBlur);
    window.addEventListener('lisiere-back', onAndroidBack);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('lisiere-back', onAndroidBack);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [paused, showHelp, showHint, result, onExit]);

  function restart() {
    engineRef.current?.restart();
    setStatus(INITIAL_STATUS);
    setResult(null);
    setPaused(false);
    setShowHint(false);
    canvasRef.current?.focus();
  }

  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (shellRef.current?.requestFullscreen) await shellRef.current.requestFullscreen();
      else setError('Le plein \u00e9cran n\u2019est pas pris en charge. Le jeu reste disponible dans cette fen\u00eatre.');
    } catch {
      setError('Le navigateur a refus\u00e9 le plein \u00e9cran. Vous pouvez continuer \u00e0 jouer.');
    }
  }

  function touch(action: keyof InputState, down: boolean, event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (down) event.currentTarget.setPointerCapture(event.pointerId);
    engineRef.current?.setTouchInput(action, down);
  }

  const touchButton = (action: keyof InputState, label: string, icon: ReactNode) => (
    <button
      className="touch-button"
      aria-label={label}
      onPointerDown={(event) => touch(action, true, event)}
      onPointerUp={(event) => touch(action, false, event)}
      onPointerCancel={(event) => touch(action, false, event)}
      onLostPointerCapture={() => engineRef.current?.setTouchInput(action, false)}
      onContextMenu={(event) => event.preventDefault()}
    >{icon}</button>
  );

  const allMechanismsActive = (!level.plate || status.plateActive) && (!level.lever || status.leverActive);

  return (
    <main className="game-shell" ref={shellRef}>
      <header className="game-header">
        <div className="game-heading">
          <button className="icon-button" onClick={onExit} aria-label="Retour au menu"><ArrowLeft size={19} /></button>
          <Brand />
          <div className="game-chapter-label"><span>CHAPITRE 0{levelIndex + 1}</span><strong>{level.title}</strong></div>
        </div>
        <div className="game-header-actions">
          <button className="icon-button" onClick={toggleSound} aria-label={soundEnabled ? 'Couper le son' : 'Activer le son'} aria-pressed={soundEnabled}>{soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}</button>
          <button className="icon-button fullscreen-button" onClick={fullscreen} aria-label="Plein &eacute;cran"><Maximize size={18} /></button>
          <button className="pause-button" onClick={() => setPaused(true)} aria-label="Mettre le jeu en pause"><Pause size={16} /><span>Pause</span><kbd>Esc</kbd></button>
        </div>
      </header>

      <div className="game-world">
        <canvas ref={canvasRef} tabIndex={0} aria-label={`Chapitre ${levelIndex + 1} : ${level.title}. Fl\u00e8ches pour avancer, Espace pour sauter, E pour interagir. Appuyez sur \u00c9chap pour les instructions.`}>
          Ce jeu utilise Canvas 2D. Utilisez un navigateur r&eacute;cent pour jouer.
        </canvas>
        <div className="game-hud">
          <div className="game-objective"><span>{allMechanismsActive ? 'LE CHEMIN EST OUVERT' : 'VOTRE PROCHAIN PAS'}</span><p>{allMechanismsActive ? 'Rejoignez la lumi\u00e8re de l\u2019autre c\u00f4t\u00e9.' : level.objective}</p></div>
          <button className={`hint-button ${showHint ? 'active' : ''}`} onClick={() => setShowHint(!showHint)} aria-expanded={showHint}><Lightbulb size={16} /><span>Un indice</span></button>
        </div>
        <AnimatePresence>
          {showHint && <motion.div className="game-hint" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <button className="icon-button" onClick={() => setShowHint(false)} aria-label="Fermer l'indice"><X size={17} /></button>
            <span className="eyebrow">UN AUTRE REGARD</span><p>{level.hint}</p><small>Le temps s&rsquo;arr&ecirc;te pendant la lecture.</small>
          </motion.div>}
          {status.context && !status.dead && !showHint && <motion.div key={status.context} className="game-context" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status"><Hand size={16} />{status.context}</motion.div>}
          {status.dead && <motion.div className="death-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status"><span>CE N&rsquo;EST QU&rsquo;UN AUTRE D&Eacute;BUT</span><p>{status.deathReason}</p></motion.div>}
        </AnimatePresence>
        {error && <div className="game-error" role="alert"><p>{error}</p><button className="text-button" onClick={() => setError('')}>Fermer<X size={15} /></button><button className="text-button" onClick={onExit}>Retour au menu<ArrowRight size={15} /></button></div>}
      </div>

      <div className="touch-controls" aria-label="Commandes tactiles">
        <div>{touchButton('left', 'Aller \u00e0 gauche', <ArrowLeft size={24} />)}{touchButton('right', 'Aller \u00e0 droite', <ArrowRight size={24} />)}</div>
        <div>{touchButton('interact', 'Interagir ou maintenir pour pousser', <Hand size={23} />)}{touchButton('jump', 'Sauter', <ArrowUp size={25} />)}</div>
      </div>
      <footer className="game-footer">
        <div className="game-key-hints"><span><kbd><ArrowLeft size={12} /></kbd><kbd><ArrowRight size={12} /></kbd>Se d&eacute;placer</span><span><kbd className="wide-key">Espace</kbd>Sauter</span><span><kbd>E</kbd>Interagir</span></div>
        <button className="text-button" onClick={() => setShowHelp(true)}>Comment jouer<ChevronRight size={15} /></button>
        <span className="game-save-note"><Check size={13} />Sauvegarde par chapitre</span>
      </footer>
      <div className="game-progress-track"><div style={{ width: `${status.progress}%` }} /></div>

      {paused && !showHelp && !result && <Dialog title="Le monde peut attendre." eyebrow="UNE RESPIRATION" onClose={() => setPaused(false)} className="pause-dialog">
        <p className="dialog-description">Vous retrouverez les ombres exactement l&agrave; o&ugrave; vous les avez laiss&eacute;es.</p>
        <button className="primary-button full-width" onClick={() => setPaused(false)}><Play size={17} fill="currentColor" />Reprendre l&rsquo;aventure<ArrowRight size={18} /></button>
        <button className="secondary-button full-width" onClick={restart}><RotateCcw size={17} />Recommencer le chapitre</button>
        <div className="pause-links"><button className="text-button" onClick={() => { setPaused(false); setShowHelp(true); }}>Comment jouer</button><button className="text-button muted" onClick={onExit}>Retour au menu<ArrowRight size={15} /></button></div>
      </Dialog>}
      {showHelp && <Dialog title="Apprivoisez les ombres." eyebrow="COMMENT JOUER" onClose={() => setShowHelp(false)}>
        <Controls /><button className="primary-button full-width" onClick={() => setShowHelp(false)}>Reprendre la travers&eacute;e<ArrowRight size={18} /></button>
      </Dialog>}
      {result && <Dialog title={levelIndex === 2 ? 'La lumi\u00e8re vous attendait.' : 'Un pas de plus vers l\u2019inconnu.'} eyebrow={`CHAPITRE 0${levelIndex + 1} TRAVERS\u00c9`} onClose={onExit} dismissible={false} className="completion-dialog">
        <div className="completion-mark"><Check size={30} strokeWidth={1} /></div>
        <p className="dialog-description">{levelIndex === 2 ? 'Vous avez travers\u00e9 la for\u00eat, r\u00e9veill\u00e9 les machines et trouv\u00e9 l\u2019autre rive. Le silence a d\u00e9sormais une autre couleur.' : `Les ombres ont livr\u00e9 leur secret. Le prochain chapitre, \u00ab ${LEVELS[levelIndex + 1].title} \u00bb, vous attend.`}</p>
        <p className="completion-stats">{Math.floor(result.seconds / 60)} min {String(result.seconds % 60).padStart(2, '0')}<span />{result.deaths === 0 ? 'Sans perdre votre chemin' : `${result.deaths + 1} tentatives, un chemin trouv\u00e9`}</p>
        <button className="primary-button full-width" onClick={() => levelIndex < 2 ? onStartLevel(levelIndex + 1) : onExit()}>{levelIndex < 2 ? 'Continuer la travers\u00e9e' : 'Revenir \u00e0 la lisi\u00e8re'}<ArrowRight size={18} /></button>
        <div className="pause-links"><button className="text-button" onClick={restart}><RotateCcw size={15} />Rejouer ce chapitre</button>{levelIndex < 2 && <button className="text-button muted" onClick={onExit}>Retour au menu</button>}</div>
      </Dialog>}
    </main>
  );
}