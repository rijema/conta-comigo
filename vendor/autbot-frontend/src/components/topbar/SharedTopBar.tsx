import { useNavigate } from 'react-router-dom';
import './SharedTopBar.css';
import { FaUserCircle, FaArrowLeft, FaChartBar } from 'react-icons/fa';
import { useBrand } from '../../contexts/BrandContext';

interface SharedTopBarProps {
  pageType: 'login' | 'register' | 'chat' | 'tutorial' | 'profile' | 'info' | 'agenda' | 'dashboard' | 'profissionais';
  onShowChatView?: () => void;
  onShowHistoryView?: () => void;
  isHistoryViewActive?: boolean;
}

const SharedTopBar = ({ pageType, onShowChatView, onShowHistoryView, isHistoryViewActive }: SharedTopBarProps) => {
  const navigate = useNavigate();
  const { appName, logoSrc, homePath, returnUrl, brand } = useBrand();

  const showBackButton = ['tutorial', 'profile', 'info', 'agenda', 'dashboard', 'profissionais'].includes(pageType);

  const handleAutBotClick = () => {
    if (pageType === 'chat' && onShowChatView) {
      onShowChatView();
    } else {
      navigate(homePath);
    }
  };

  const handleReturnToContaComigo = () => {
    if (returnUrl) {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: "titia:return", url: returnUrl },
          "*"
        );
      } else {
        window.location.assign(returnUrl);
      }
      return;
    }
    navigate(homePath);
  };

  return (
    <header className="shared-top-bar">
      <div className="shared-top-bar-left">
        <div className="shared-top-bar-return">
          {showBackButton && (
            <button title="Voltar" className="shared-nav-button icon-button" onClick={() => navigate(-1)}>
              <FaArrowLeft size={20} />
            </button>
          )}
        </div>
        {brand !== 'titia' && <img src={logoSrc} alt={`${appName} Logo`} className="shared-logo" />}
        <button className="shared-app-name-button" onClick={handleAutBotClick}>
          {appName}
        </button>
      </div>

      <nav className="shared-top-bar-right">
        {pageType === 'chat' && (
          <>
            {isHistoryViewActive ? (
              <button title="Voltar ao Chat" className="shared-nav-button icon-button" onClick={onShowChatView}>
                <FaArrowLeft size={20} />
              </button>
            ) : (
              <button className="shared-nav-button" onClick={onShowHistoryView}>
                Histórico
              </button>
            )}

            {!isHistoryViewActive && (
              <button className="shared-nav-button" onClick={() => navigate('/agenda')}>
                Agenda
              </button>
            )}

            {!isHistoryViewActive && (
              <button className="shared-nav-button" onClick={() => navigate('/profissionais')}>
                Profissionais
              </button>
            )}
          </>
        )}


        {(pageType === 'login' || pageType === 'register' || (pageType === 'chat' && !isHistoryViewActive)) && (
          <button className="shared-nav-button" onClick={() => navigate('/tutorial')}>
            Tutorial
          </button>
        )}

        {pageType === 'login' && (
          <>
            <button className="shared-nav-button" onClick={() => navigate('/cadastro')}>
              Cadastre-se
            </button>
            <button className="shared-nav-button" onClick={() => navigate('/sobre')}>
              Info
            </button>
          </>
        )}

        {pageType === 'register' && (
          <>
            <button className="shared-nav-button" onClick={() => navigate(homePath)}>
              Login
            </button>
            <button className="shared-nav-button" onClick={() => navigate('/sobre')}>
              Info
            </button>
          </>
        )}

        
        {(pageType === 'chat' || pageType === 'profile') && (
          <button 
            title="Dashboard" 
            className="shared-nav-button icon-button" 
            onClick={() => navigate('/dashboard')}
          >
            <FaChartBar size={20} />
          </button>
        )}

        {pageType === 'chat' && (
          <button title="Perfil" className="shared-nav-button icon-button" onClick={() => navigate('/perfil')}>
            <FaUserCircle size={20} />
          </button>
        )}
      </nav>
    </header>
  );
};

export default SharedTopBar;