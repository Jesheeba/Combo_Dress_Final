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
        { id: 'dashboard', label: 'Stock Ledger', icon: LayoutDashboard },
        { id: 'orders', label: 'Pending Orders', icon: ShoppingBag },
        { id: 'manage', label: 'Design Editor', icon: PlusCircle },
    ];

    const customerTabs = [
        { id: 'gallery', label: 'Dress Gallery', icon: ShoppingBag },
        { id: 'preview', label: 'Family Preview', icon: Users },
    ];

    const tabs = role === 'STAFF' ? staffTabs : customerTabs;

    return (
        <div className="glass-card" style={{
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
                <div style={{
                    background: 'var(--primary)',
                    padding: '8px',
                    borderRadius: '10px',
                    display: 'flex'
                }}>
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
                        <span style={{ display: 'none', md: 'inline' } as any}>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{
                    height: '24px',
                    width: '1px',
                    background: 'var(--glass-border)',
                    margin: '0 8px'
                }} />

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
    );
};

export default Navigation;
