import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  CreditCard,
  Landmark,
  Laptop,
  LockKeyhole,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  TrendingUp,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import './Index.css';

const navigation = ['Checking & Savings', 'Credit Cards', 'Loans', 'Mortgages', 'Investing & Retirement'];

const categories: { label: string; icon: LucideIcon }[] = [
  { label: 'Featured', icon: BriefcaseBusiness },
  { label: 'Checking & Savings', icon: Wallet },
  { label: 'Credit Cards', icon: CreditCard },
  { label: 'Loans & Mortgages', icon: Landmark },
  { label: 'Investments', icon: TrendingUp },
  { label: 'Learning', icon: BookOpen },
];

type Feature = {
  title: string;
  description: string;
  action: string;
  style: 'photo' | 'blue' | 'navy';
  image?: string;
  imageAlt?: string;
};

const featureSets: Record<string, Feature[]> = {
  Featured: [
    { title: 'Special Offers', description: 'From everyday banking to credit cards, find ways to save money and make real financial progress.', action: 'Explore offers', style: 'photo', image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=85', imageAlt: 'Family enjoying time together outdoors' },
    { title: 'Explore our checking accounts', description: 'Find an account designed to help you stay on top of everyday spending and saving.', action: 'Explore accounts', style: 'navy' },
    { title: 'Real Financial Progress Hub', description: 'Access our financial resource hub to help you manage your money and plan for your future.', action: 'Get started', style: 'blue' },
    { title: 'Tools for your next steps', description: 'Explore resources to help make everyday money decisions clearer.', action: 'View resources', style: 'blue' },
    { title: 'A stronger financial foundation', description: 'Find practical ways to make steady progress toward your personal goals.', action: 'Explore guidance', style: 'blue' },
    { title: 'Guidance for every goal', description: 'Get helpful ideas for the decisions and milestones ahead.', action: 'See your options', style: 'photo', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=85', imageAlt: 'Friends spending time together outdoors' },
  ],
  'Checking & Savings': [
    { title: 'Banking that fits your day', description: 'Make everyday money management simpler with checking built around your needs.', action: 'Compare accounts', style: 'photo' },
    { title: 'Your money, within reach', description: 'Explore convenient ways to bank, wherever the day takes you.', action: 'See digital banking', style: 'navy' },
    { title: 'Build your savings habit', description: 'Set a goal, make a plan, and keep your progress moving in the right direction.', action: 'Explore savings', style: 'blue' },
    { title: 'Ready for your next goal', description: 'Find helpful ways to prepare for a purchase, a trip, or the unexpected.', action: 'Start planning', style: 'blue' },
    { title: 'Stay on top of spending', description: 'Discover simple tools to help organize your everyday finances.', action: 'Explore money tools', style: 'blue' },
    { title: 'Make banking work harder', description: 'Learn how checking and savings can work together for your plans.', action: 'Compare options', style: 'photo' },
  ],
  'Credit Cards': [
    { title: 'Find your next card', description: 'Explore card options and choose features that work for the way you spend.', action: 'Compare cards', style: 'photo' },
    { title: 'Credit, made clearer', description: 'Get practical guidance on choosing and managing a credit card.', action: 'Learn about credit', style: 'navy' },
    { title: 'Make more of every day', description: 'Learn how to get more from the purchases you already make.', action: 'Explore card benefits', style: 'blue' },
    { title: 'Support for what matters', description: 'Explore options designed around different spending priorities.', action: 'See your options', style: 'blue' },
    { title: 'Find features that fit', description: 'Compare helpful features and choose what matters most to you.', action: 'Compare features', style: 'blue' },
    { title: 'Keep track with confidence', description: 'Learn ways to stay organized and make informed card decisions.', action: 'Explore card tools', style: 'photo' },
  ],
  'Loans & Mortgages': [
    { title: 'Plan for what comes next', description: 'Explore flexible borrowing options for the milestones that matter to you.', action: 'Explore lending', style: 'photo' },
    { title: 'Borrow with confidence', description: 'Find helpful resources to make informed decisions about borrowing.', action: 'View resources', style: 'navy' },
    { title: 'Make a home plan', description: 'Understand the home financing journey and what to consider along the way.', action: 'Explore mortgages', style: 'blue' },
    { title: 'Understand your next steps', description: 'Find guidance to help you prepare for a lending conversation.', action: 'Get prepared', style: 'blue' },
    { title: 'Explore flexible options', description: 'Learn about borrowing choices for the milestones ahead.', action: 'Explore lending', style: 'blue' },
    { title: 'Build your homebuying plan', description: 'Get a clearer picture of the steps involved in buying a home.', action: 'See home resources', style: 'photo' },
  ],
  Investments: [
    { title: 'Invest in your future', description: 'Discover ways to make steady progress toward the goals you care about.', action: 'Explore investing', style: 'photo' },
    { title: 'Make retirement yours', description: 'Learn about the choices that can help you prepare for what is ahead.', action: 'Plan for retirement', style: 'navy' },
    { title: 'A plan for every chapter', description: 'Get guidance for building a financial plan that can grow with you.', action: 'Start planning', style: 'blue' },
    { title: 'Guidance when you need it', description: 'Find information to help you make more confident investing decisions.', action: 'Explore guidance', style: 'blue' },
    { title: 'Make a plan for your goals', description: 'Explore ways to connect your investing choices to what matters to you.', action: 'Explore planning', style: 'blue' },
    { title: 'Build for the long term', description: 'Learn about the habits that can support steady financial progress.', action: 'See investing basics', style: 'photo' },
  ],
  Learning: [
    { title: 'Money skills for real life', description: 'Explore straightforward guides to help you make confident money decisions.', action: 'Explore articles', style: 'photo' },
    { title: 'Small steps add up', description: 'Find simple ways to build healthy financial habits over time.', action: 'Get inspired', style: 'navy' },
    { title: 'Build your financial confidence', description: 'Get practical tools and ideas for each step of your financial journey.', action: 'Visit the learning hub', style: 'blue' },
    { title: 'Find guidance for what’s next', description: 'Discover practical ideas for the milestones ahead.', action: 'Explore guidance', style: 'blue' },
    { title: 'Better questions, better choices', description: 'Explore clear information to support everyday money decisions.', action: 'Explore money guides', style: 'blue' },
    { title: 'Learn the basics with clarity', description: 'Get to know key financial topics through straightforward guides.', action: 'Browse the basics', style: 'photo' },
  ],
};

function Brand() {
  return (
    <Link to="/" className="bank-brand" aria-label="Northline Bank home">
      {/* <span className="brand-mark" aria-hidden="true"><Landmark size={21} strokeWidth={2.2} /></span>
      <span>northline<span className="brand-bank">bank</span></span> */}
      <img src="https://www.bmo.com/dist/images/logos/bmo-blue-on-transparent-en.svg" alt="Northline Bank" width="100" height="40" />
    </Link>
  );
}

function UtilityBar({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="utility-bar">
      <button className="utility-personal" type="button">Personal <ChevronDown size={15} aria-hidden="true" /></button>
      <div className="utility-actions">
        <button className="icon-button utility-search" type="button" onClick={onSearch} aria-label="Open search"><Search size={19} /></button>
        <button className="utility-country" type="button" aria-label="Country and language: United States">🇺🇸 <ChevronDown size={14} aria-hidden="true" /></button>
        <Link to="/login" className="utility-signin"><LockKeyhole size={16} aria-hidden="true" /> Sign in <ChevronDown size={15} aria-hidden="true" /></Link>
      </div>
    </div>
  );
}

function BankHeader({ activeCategory, onCategoryChange }: { activeCategory: string; onCategoryChange: (category: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const chooseCategory = (item: string) => {
    const matched = item === 'Mortgages' || item === 'Loans'
      ? 'Loans & Mortgages'
      : item === 'Investing & Retirement'
        ? 'Investments'
        : categories.find(({ label }) => label === item)?.label ?? 'Featured';
    onCategoryChange(matched);
    setMenuOpen(false);
  };

  return (
    <header className="bank-header">
      <UtilityBar onSearch={() => setSearchOpen((open) => !open)} />
      <div className="main-nav-row">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button key={item} type="button" className="nav-link" onClick={() => chooseCategory(item)} aria-current={activeCategory === item ? 'page' : undefined}>{item}</button>
          ))}
        </nav>
        <div className="mobile-actions">
          <Link to="/login" className="mobile-signin"><LockKeyhole size={15} aria-hidden="true" /> Sign in</Link>
          <button className="icon-button menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <div className={`search-panel${searchOpen ? ' is-open' : ''}`} aria-hidden={!searchOpen}>
        <form role="search" onSubmit={(event) => event.preventDefault()}>
          <Search size={18} aria-hidden="true" />
          <input aria-label="Search Northline Bank" placeholder="What can we help you find?" tabIndex={searchOpen ? 0 : -1} />
          <button type="button" onClick={() => setSearchOpen(false)} tabIndex={searchOpen ? 0 : -1}>Close</button>
        </form>
      </div>
      <div id="mobile-navigation" className={`mobile-nav-panel${menuOpen ? ' is-open' : ''}`} aria-hidden={!menuOpen}>
        <nav aria-label="Mobile navigation">
          {navigation.map((item) => <button key={item} type="button" className="mobile-nav-link" onClick={() => chooseCategory(item)} tabIndex={menuOpen ? 0 : -1}>{item}<ArrowRight size={16} aria-hidden="true" /></button>)}
          <Link to="/open-account" className="mobile-open-account" tabIndex={menuOpen ? 0 : -1}>Open an account <ArrowRight size={16} aria-hidden="true" /></Link>
        </nav>
      </div>
    </header>
  );
}

function SecurityStrip() {
  return <div className="security-strip"><ShieldCheck size={19} aria-hidden="true" /><span><strong>Banking built on trust</strong><span className="security-divider">—</span> Demo deposit protection information is illustrative and subject to applicable limits.</span></div>;
}

function HeroBanner() {
  return (
    <section className="hero-banner" aria-labelledby="hero-title">
      <div className="hero-copy">
        <span className="eyebrow">A little more room to grow</span>
        <h1 id="hero-title">Earn up to $600 cash bonus<sup>*</sup></h1>
        <p className="hero-description">Open a new personal checking account and earn up to a $600 cash bonus.*</p>
        <p className="hero-disclaimer">*With qualifying activities. Conditions apply.</p>
        <Link className="outline-button" to="/open-account">Learn more <ArrowRight size={17} aria-hidden="true" /></Link>
      </div>
      <div className="hero-image-wrap">
        <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=85" alt="Colleagues planning together in a bright modern workspace" />
        <div className="hero-image-caption"><span className="caption-mark"><Landmark size={17} /></span><span>Banking for your next chapter</span></div>
      </div>
    </section>
  );
}

function BankingCategories({ active, onChange }: { active: string; onChange: (category: string) => void }) {
  return (
    <div className="category-tabs" role="tablist" aria-label="Personal banking categories">
      {categories.map(({ label, icon: Icon }) => (
        <button key={label} type="button" role="tab" aria-selected={active === label} className={`category-tab${active === label ? ' is-active' : ''}`} onClick={() => onChange(label)}>
          <Icon size={25} strokeWidth={1.55} aria-hidden="true" /><span>{label}</span>
        </button>
      ))}
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.style === 'photo' ? ShieldCheck : feature.style === 'blue' ? TrendingUp : Wallet;
  return (
    <article className={`feature-card feature-${feature.style}`}>
      {feature.style === 'photo' ? (
        <div className="feature-photo"><img src={feature.image ?? 'https://www.bmo.com/dam_asset/transform/00d40e12-3…ceb-ai-hp-tile-en-desktop?format=webp&quality=100'} alt={feature.imageAlt ?? 'Family enjoying time together outdoors'} /></div>
      ) : <div className="feature-icon"><Icon size={39} strokeWidth={1.5} aria-hidden="true" /></div>}
      <div className="feature-content">
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
        <Link to="/open-account" className="feature-action">{feature.action}<ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </article>
  );
}

function FeatureCardGrid({ activeCategory }: { activeCategory: string }) {
  return <div className="feature-grid" key={activeCategory}>{featureSets[activeCategory].map((feature) => <FeatureCard key={feature.title} feature={feature} />)}</div>;
}

function Footer() {
  const footerGroups = [
    { title: 'Explore', links: ['Checking accounts', 'Savings accounts', 'Credit cards', 'Loans & mortgages'] },
    { title: 'Your security', links: ['Security center', 'Privacy', 'Accessibility', 'Terms & conditions'] },
    { title: 'We can help', links: ['Contact us', 'Customer support', 'Find a location', 'Frequently asked questions'] },
  ];
  return (
    <footer className="bank-footer">
      <div className="footer-main">
        <div className="footer-brand"><Brand /><p>Good banking starts with a little more clarity.</p></div>
        {footerGroups.map((group) => <div className="footer-group" key={group.title}><h2>{group.title}</h2>{group.links.map((link) => <a href="#banking-categories" key={link}>{link}</a>)}</div>)}
      </div>
      <div className="footer-bottom"><p>Bmo Bank is a fictional brand for demonstration purposes only. This is not a real financial institution and no banking services are offered.</p><span>{`© ${new Date().getFullYear()} Bmo Bank. All rights reserved.`}</span></div>
    </footer>
  );
}

const Index = () => {
  const [activeCategory, setActiveCategory] = useState('Featured');

  return (
    <div className="bank-home">
      <BankHeader activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <SecurityStrip />
      <main>
        <div className="page-width">
          <HeroBanner />
          <section id="banking-categories" className="discovery-section" aria-labelledby="discovery-title">
            <p className="eyebrow discovery-eyebrow">Personal banking</p>
            <h2 id="discovery-title">What can we help you find today?</h2>
            <BankingCategories active={activeCategory} onChange={setActiveCategory} />
            <FeatureCardGrid activeCategory={activeCategory} />
            {/* <FeatureCardGrid activeCategory={activeCategory} /> */}
          </section>
        </div>
        <section className="support-band" aria-labelledby="support-title">
          <div className="support-inner">
            <h2 id="support-title">Need support? That's what we're here for.</h2>
            <div className="support-links">
              <article className="support-card">
                <Laptop className="support-card-icon" size={52} strokeWidth={1.45} aria-hidden="true" />
                <h3>Bmo Bank online support</h3>
                <p>Get help with your questions using our online support options.</p>
                <Link className="support-card-button support-card-button-primary" to="/contact">Get support</Link>
              </article>
              <article className="support-card">
                <MapPin className="support-card-icon" size={52} strokeWidth={1.45} aria-hidden="true" />
                <h3>Contact our team</h3>
                <p>Reach out to our team for help and information about Bmo Bank.</p>
                <Link className="support-card-button support-card-button-outline" to="/contact">Contact us</Link>
              </article>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
