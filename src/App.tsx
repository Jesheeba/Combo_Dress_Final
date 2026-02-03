import { useState, useEffect } from 'react';
import type { Design, Role, Order, ComboType } from './types';
import { fetchDesigns, syncDesign, removeDesign, fetchOrders, submitOrder, updateOrderStatus } from './data';
import Navigation from './components/Navigation';
import StaffDashboard from './pages/StaffDashboard';
import DesignManager from './pages/DesignManager';
import CustomerGallery from './pages/CustomerGallery';
import FamilyPreview from './components/FamilyPreview';

function App() {
    const [designs, setDesigns] = useState<Design[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [role, setRole] = useState<Role>('STAFF');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [editingDesign, setEditingDesign] = useState<Design | null>(null);
    const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
    const [loading, setLoading] = useState(true);

    const init = async () => {
        try {
            setLoading(true);
            const [designsData, ordersData] = await Promise.all([
                fetchDesigns(),
                fetchOrders()
            ]);
            setDesigns(designsData);
            setOrders(ordersData);
        } catch (error) {
            console.error('Initialization error:', error);
            alert('Failed to connect to database. Falling back to local mode.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        init();
    }, []);

    const updateInventory = async (designId: string, category: string, size: string, change: number) => {
        let updatedDesign: Design | null = null;

        setDesigns(prev => prev.map(d => {
            if (d.id === designId) {
                const cat = category as keyof Design['inventory'];
                updatedDesign = {
                    ...d,
                    inventory: {
                        ...d.inventory,
                        [cat]: {
                            ...(d.inventory[cat] as any),
                            [size]: Math.max(0, (d.inventory[cat] as any)[size] + change)
                        }
                    }
                };
                return updatedDesign;
            }
            return d;
        }));

        if (updatedDesign) {
            await syncDesign(updatedDesign);
        }
    };

    const deleteDesign = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this design?')) {
            setDesigns(prev => prev.filter(d => d.id !== id));
            await removeDesign(id);
        }
    };

    const saveDesign = async (designData: Partial<Design>) => {
        let finalDesign: Design;
        if (editingDesign) {
            finalDesign = { ...editingDesign, ...designData } as Design;
            setDesigns(prev => prev.map(d => d.id === editingDesign.id ? finalDesign : d));
        } else {
            finalDesign = {
                ...designData,
                id: Math.random().toString(36).substr(2, 9),
                createdAt: Date.now(),
            } as Design;
            setDesigns(prev => [finalDesign, ...prev]);
        }

        await syncDesign(finalDesign);
        setEditingDesign(null);
        setActiveTab('dashboard');
    };

    const handlePlaceOrder = async (designId: string, comboType: ComboType, selectedSizes: Record<string, string>) => {
        await submitOrder({ designId, comboType, selectedSizes });
        const ordersData = await fetchOrders();
        setOrders(ordersData);
    };

    const handleAcceptOrder = async (order: Order) => {
        // 1. Deduct Stock
        for (const [member, size] of Object.entries(order.selectedSizes)) {
            const category = member === 'Father' ? 'men' :
                member === 'Mother' ? 'women' :
                    member === 'Son' ? 'boys' : 'girls';
            await updateInventory(order.designId, category, size, -1);
        }

        // 2. Update Order Status
        await updateOrderStatus(order.id, 'accepted');

        // 3. Refresh Orders
        const ordersData = await fetchOrders();
        setOrders(ordersData);
        alert('Order accepted and stock deducted!');
    };

    const handleRejectOrder = async (orderId: string) => {
        await updateOrderStatus(orderId, 'rejected');
        const ordersData = await fetchOrders();
        setOrders(ordersData);
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px', height: '40px', border: '4px solid var(--glass-border)',
                        borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite'
                    }} />
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Synchronizing Database...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                role={role}
                setRole={setRole}
            />

            <main style={{ flexGrow: 1 }}>
                {role === 'STAFF' ? (
                    <>
                        {(activeTab === 'dashboard' || activeTab === 'orders') && (
                            <StaffDashboard
                                designs={designs}
                                orders={orders}
                                updateInventory={updateInventory}
                                deleteDesign={deleteDesign}
                                viewMode={activeTab === 'orders' ? 'orders' : 'inventory'}
                                onBack={() => {
                                    if (activeTab === 'orders') {
                                        setActiveTab('dashboard');
                                    } else {
                                        setRole('CUSTOMER');
                                        setActiveTab('gallery');
                                    }
                                }}
                                onEdit={(d) => {
                                    setEditingDesign(d);
                                    setActiveTab('manage');
                                }}
                                onAddNew={() => {
                                    setEditingDesign(null);
                                    setActiveTab('manage');
                                }}
                                onAcceptOrder={handleAcceptOrder}
                                onRejectOrder={handleRejectOrder}
                            />
                        )}
                        {activeTab === 'manage' && (
                            <DesignManager
                                editingDesign={editingDesign}
                                onSave={saveDesign}
                                onCancel={() => {
                                    setEditingDesign(null);
                                    setActiveTab('dashboard');
                                }}
                            />
                        )}
                    </>
                ) : (
                    <>
                        {activeTab === 'gallery' && (
                            <CustomerGallery
                                designs={designs}
                                selectedDesign={selectedDesign}
                                onBack={() => {
                                    setRole('STAFF');
                                    setActiveTab('dashboard');
                                }}
                                onSelect={(d) => {
                                    setSelectedDesign(d);
                                    setActiveTab('preview');
                                }}
                            />
                        )}
                        {activeTab === 'preview' && (
                            <FamilyPreview
                                design={selectedDesign}
                                onPlaceOrder={handlePlaceOrder}
                                onBack={() => setActiveTab('gallery')}
                            />
                        )}
                    </>
                )}
            </main>

            <footer style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--glass-border)',
                margin: '0 24px 24px 24px'
            }}>
                © 2026 TailorPro Store • Local & Cloud Enabled
            </footer>
        </div>
    );
}

export default App;
