import { LayoutDashboard, PlusCircle, Users, ShoppingBag, UserCheck } from 'lucide-react';
import type { Role } from '../types';

interface NavigationProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    role: Role;
    setRole: (role: Role) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, role, setRole }) => {
    const staffTabs = [
        { id: 'dashboard', label: 'Ledger', icon: LayoutDashboard },
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'manage', label: 'Edit', icon: PlusCircle },
    ];

    const customerTabs = [
        { id: 'gallery', label: 'Gallery', icon: ShoppingBag },
        { id: 'preview', label: 'Preview', icon: Users },
    ];

    const tabs = role === 'STAFF' ? staffTabs : customerTabs;

    return (
        <>
            {/* Desktop/Tablet Navigation Header */}
            <div className="glass-card tablet-up" style={{
                margin: '24px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: '24px',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                        <ShoppingBag size={24} color="white" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>TailorPro Store</h2>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ height: '24px', width: '1px', background: 'var(--glass-border)', margin: '0 8px' }} />
                    <button
                        onClick={() => {
                            const newRole = role === 'STAFF' ? 'CUSTOMER' : 'STAFF';
                            setRole(newRole);
                            setActiveTab(newRole === 'STAFF' ? 'dashboard' : 'gallery');
                        }}
                        className="btn btn-ghost"
                        style={{ background: role === 'STAFF' ? 'rgba(99, 102, 241, 0.1)' : 'transparent' }}
                    >
                        {role === 'STAFF' ? <UserCheck size={18} color="var(--primary)" /> : <Users size={18} />}
                        <span>{role === 'STAFF' ? 'Staff Mode' : 'Customer View'}</span>
                    </button>
                </div>
            </div>

            {/* Mobile Header (minimal) */}
            <div className="mobile-only" style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.5)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingBag size={20} color="var(--primary)" />
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.03em' }}>TAILORPRO</span>
                </div>
                <button
                    onClick={() => {
                        const newRole = role === 'STAFF' ? 'CUSTOMER' : 'STAFF';
                        setRole(newRole);
                        setActiveTab(newRole === 'STAFF' ? 'dashboard' : 'gallery');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}
                >
                    {role === 'STAFF' ? <UserCheck size={20} color="var(--primary)" /> : <Users size={20} />}
                </button>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-bottom-nav mobile-only">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                        style={{ background: 'none', border: 'none' }}
                    >
                        <tab.icon size={22} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>
        </>
    );
};

export default Navigation;
