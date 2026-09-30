import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Landmark, LockKeyhole, Menu, UserRoundPlus, X } from 'lucide-react';
import './BankPages.css';

type BankPageHeaderProps = {
  page: 'login' | 'signup' | 'contact';
};

const navigation = ['Checking & Savings', 'Credit Cards', 'Loans', 'Mortgages', 'Investing & Retirement'];

function Brand() {
  return (
    <Link to="/" className="bank-page-brand" aria-label="Bmo Bank home">
      {/* <span className="bank-page-brand-mark" aria-hidden="true"><Landmark size={20} /></span>
      <span>bmo<span>bank</span></span> */}

      <img src="https://www.bmo.com/dist/images/logos/bmo-blue-on-transparent-en.svg" alt="Bmo Bank" width="100" height="40" />
    </Link>
  );
}

const BankPageHeader = ({ page }: BankPageHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const primaryAction = page === 'login'
    ? { label: 'Open an account', to: '/open-account' }
    : { label: 'Sign in', to: '/login' };

  return (
    <header className="bank-page-header">
      <div className="bank-page-utility">
        <Link to="/" className="bank-page-personal">Personal <ChevronDown size={14} aria-hidden="true" /></Link>
        <Link to="/contact" className="bank-page-contact-link">Contact us</Link>
      </div>
      <div className="bank-page-header-main">
        <Brand />
        <nav className="bank-page-desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => <Link key={item} to="/#banking-categories">{item}</Link>)}
        </nav>
        <div className="bank-page-header-actions">
          <Link className="bank-page-primary-action is-header-action" to={primaryAction.to}>
            {primaryAction.label === 'Sign in'
              ? <LockKeyhole size={15} aria-hidden="true" />
              : <UserRoundPlus size={16} aria-hidden="true" />}
            <span className="bank-page-action-label-desktop">{primaryAction.label}</span>
            <span className="bank-page-action-label-mobile">{primaryAction.label === 'Sign in' ? 'Sign in' : 'Open account'}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </Link>
          <button type="button" className="bank-page-menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <nav className={`bank-page-mobile-nav${menuOpen ? ' is-open' : ''}`} aria-label="Mobile navigation" aria-hidden={!menuOpen}>
        {navigation.map((item) => <Link key={item} to="/#banking-categories" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}>{item}<ArrowRight size={16} aria-hidden="true" /></Link>)}
      </nav>
    </header>
  );
};

export default BankPageHeader;