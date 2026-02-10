import React from 'react';
import { useLocation } from 'react-router-dom';
import { ShoppingBag, LayoutDashboard } from 'lucide-react';


interface NavigationProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
    const location = useLocation();
    return (
        <nav style={{
            padding: '8px max(16px, 2vw)',
            background: 'var(--bg-main)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img src="/logo.png" alt="ComboDress Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    ComboDress <span style={{ fontWeight: 400, opacity: 0.5 }}>Store</span>
                </h1>
            </div>

            <div className="nav-center" style={{
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                ...(location.pathname.startsWith('/customerview') ? {
                    position: 'relative'
                } : {})
            }}>
                <button
                    onClick={() => {
                        if (location.pathname.startsWith('/staffview')) {
                            setActiveTab('staff-gallery');
                        } else {
                            setActiveTab('gallery');
                        }
                    }}
                    className={`btn ${activeTab === 'gallery' || activeTab === 'staff-gallery' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ gap: '6px', fontSize: '0.8rem', padding: '8px 12px', whiteSpace: 'nowrap' }}
                >
                    <ShoppingBag size={14} />
                    Gallery
                </button>

                {!location.pathname.startsWith('/customerview') && (
                    <>
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ gap: '6px', fontSize: '0.8rem', padding: '8px 12px', whiteSpace: 'nowrap' }}
                        >
                            <LayoutDashboard size={14} />
                            Inventory
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ gap: '6px', fontSize: '0.8rem', padding: '8px 12px', whiteSpace: 'nowrap' }}
                        >
                            <ShoppingBag size={14} />
                            Orders
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navigation;
