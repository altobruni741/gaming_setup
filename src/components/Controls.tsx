import { ArrowLeft, ArrowRight, ArrowUp, Hand, Pause, MoveRight } from 'lucide-react';

export default function Controls() {
  return (
    <div className="controls-content">
      <p className="dialog-description">Vous n&rsquo;avez pas besoin de courir. Prenez le temps de comprendre ce qui vous entoure.</p>
      <div className="control-list">
        <div className="control-row">
          <span className="control-symbol"><MoveRight size={20} /></span>
          <div><strong>Se d&eacute;placer</strong><span>Avancez, ou revenez sur vos pas.</span></div>
          <div className="key-group"><kbd><ArrowLeft size={14} /></kbd><kbd><ArrowRight size={14} /></kbd><i>ou</i><kbd>Q</kbd><kbd>D</kbd></div>
        </div>
        <div className="control-row">
          <span className="control-symbol"><ArrowUp size={20} /></span>
          <div><strong>Sauter</strong><span>Un peu d&rsquo;&eacute;lan peut tout changer.</span></div>
          <div className="key-group"><kbd className="wide-key">Espace</kbd></div>
        </div>
        <div className="control-row">
          <span className="control-symbol"><Hand size={20} /></span>
          <div><strong>Interagir</strong><span>Activez un levier. Maintenez pour pousser.</span></div>
          <div className="key-group"><kbd>E</kbd></div>
        </div>
        <div className="control-row">
          <span className="control-symbol"><Pause size={20} /></span>
          <div><strong>Faire une pause</strong><span>Le monde vous attendra.</span></div>
          <div className="key-group"><kbd className="wide-key">&Eacute;chap</kbd></div>
        </div>
      </div>
      <p className="controls-note">Sur Android, jouez en paysage avec les boutons tactiles. Maintenez la main et une direction en m&ecirc;me temps pour pousser. Au clavier, A / D et W / Z fonctionnent aussi.</p>
      <div className="controls-principle">
        <span className="small-cross" aria-hidden="true">+</span>
        <div><h3>Observer. Comprendre. Traverser.</h3><p>Les caisses maintiennent les dalles actives. Les ombres prot&egrave;gent des projecteurs. Chaque &eacute;chec vous ram&egrave;ne au d&eacute;but du chapitre, sans limite d&rsquo;essais.</p></div>
      </div>
    </div>
  );
}