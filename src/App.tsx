import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import type { Design, Order, ComboType, GranularInventory } from './types';
import { fetchDesigns, syncDesign, removeDesign, fetchOrders, submitOrder, updateOrderStatus, subscribeToOrders, subscribeToDesigns, mapOrderFromDB, deleteOrders } from './data';
import Navigation from './components/Navigation';
import StaffDashboard from './pages/StaffDashboard';
import DesignManager from './pages/DesignManager';
import CustomerGallery from './pages/CustomerGallery';
import FamilyPreview from './components/FamilyPreview';


interface AppNotification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

function App() {
    const [designs, setDesigns] = useState<Design[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);

    const [activeTab, setActiveTab] = useState<string>('dashboard');
    const [editingDesign, setEditingDesign] = useState<Design | null>(null);
    const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedConfig, setSelectedConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const location = useLocation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    // Sync state with URL
    useEffect(() => {
        if (location.pathname.startsWith('/staffview')) {
            if (activeTab === 'gallery' || activeTab === 'preview') {
                setActiveTab('dashboard');
            }
        } else if (location.pathname.startsWith('/customerview')) {
            if (activeTab !== 'gallery' && activeTab !== 'preview') {
                setActiveTab('gallery');
            }
        }
    }, [location.pathname]);

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
            showNotification('Failed to connect to database. Falling back to local mode.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        init();

        // Real-time subscription for Orders
        const unsubOrders = subscribeToOrders((payload: any) => {
            if (payload.eventType === 'INSERT') {
                const newOrder = mapOrderFromDB(payload.new);
                setOrders(prev => {
                    if (prev.some(o => o.id === newOrder.id)) return prev;
                    return [newOrder, ...prev];
                });
            } else if (payload.eventType === 'UPDATE') {
                const updatedOrder = mapOrderFromDB(payload.new);
                setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            } else if (payload.eventType === 'DELETE') {
                setOrders(prev => prev.filter(o => o.id !== payload.old.id));
            }
        });

        // Real-time subscription for Designs (Inventory)
        const unsubDesigns = subscribeToDesigns((payload: any) => {
            // Helper to map DB row to Design object
            const mapDesign = (item: any): Design => ({
                id: item.id,
                name: item.name,
                color: item.color,
                fabric: item.fabric,
                imageUrl: item.imageurl,
                inventory: item.inventory,
                childType: item.childtype,
                label: item.label,
                createdAt: Number(item.createdat)
            });

            if (payload.eventType === 'INSERT') {
                const newDesign = mapDesign(payload.new);
                setDesigns(prev => {
                    if (prev.some(d => d.id === newDesign.id)) return prev;
                    return [newDesign, ...prev];
                });
            } else if (payload.eventType === 'UPDATE') {
                setDesigns(prev => prev.map(d => d.id === payload.new.id ? mapDesign(payload.new) : d));
            } else if (payload.eventType === 'DELETE') {
                const deletedId = payload.old?.id;
                if (deletedId) {
                    setDesigns(prev => prev.filter(d => d.id !== deletedId));
                }
            }
        });

        return () => {
            unsubOrders();
            unsubDesigns();
        };
    }, []);


    const updateInventory = async (designId: string, category: string, size: string, newValue: number) => {
        let updatedDesign: Design | null = null;
        const newDesigns = designs.map(d => {
            if (d.id === designId) {
                const cat = category as keyof Design['inventory'];
                updatedDesign = {
                    ...d,
                    inventory: {
                        ...d.inventory,
                        [cat]: {
                            ...(d.inventory[cat] as any),
                            [size]: Math.max(0, newValue)
                        }
                    }
                };
                return updatedDesign;
            }
            return d;
        });

        if (updatedDesign) {
            setDesigns(newDesigns);
            await syncDesign(updatedDesign);
        }
    };

    const deleteDesign = async (id: string) => {
        // Optimistic update
        const originalDesigns = [...designs];
        setDesigns(prev => prev.filter(d => d.id !== id));

        try {
            await removeDesign(id);
            showNotification('Design deleted successfully!', 'success');
        } catch (error) {
            console.error('Failed to delete design:', error);
            // Revert on failure
            setDesigns(originalDesigns);
            showNotification('Failed to delete design from server. Reverting...', 'error');
        }
    };

    const saveDesign = async (designData: Partial<Design>) => {
        try {
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
            showNotification('Design saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save design:', error);
            showNotification('Failed to save design.', 'error');
        }
    };

    const handlePlaceOrder = async (designId: string, comboType: ComboType, selectedSizes: Record<string, string>, customerDetails: { name: string; email: string; phone: string; address: string; countryCode?: string }) => {
        try {
            const orderPayload: Partial<Order> = {
                designId,
                comboType,
                selectedSizes,
                customerName: customerDetails.name,
                customerEmail: customerDetails.email || '',
                customerPhone: customerDetails.phone,
                customerCountryCode: customerDetails.countryCode || '+91',
                customerAddress: customerDetails.address
            };

            const newOrder = await submitOrder(orderPayload);

            if (newOrder) {
                setOrders(prev => [newOrder, ...prev]);
                showNotification('Order placed successfully!', 'success');
            }
        } catch (error) {
            console.error('Failed to place order:', error);
            showNotification('Failed to place order.', 'error');
        }
    };

    const handleAcceptOrder = async (order: Order) => {
        if (order.status !== 'pending') {
            showNotification('This order has already been processed.', 'info');
            return;
        }

        const design = designs.find(d => d.id === order.designId);
        if (!design) {
            showNotification('Design not found for this order. Cannot deduct stock.', 'error');
            return;
        }

        console.log('Accepting Order:', order.id, 'for Design:', design.name);

        // Deep clone inventory to track changes within this function scope
        const updatedInventory = JSON.parse(JSON.stringify(design.inventory));
        let hasChanges = false;
        const deductions: string[] = [];

        for (const [member, size] of Object.entries(order.selectedSizes)) {
            if (size === 'N/A' || !size) continue;

            let category: keyof GranularInventory | null = null;
            const m = member.toLowerCase();

            if (m === 'father' || m === 'men' || m === 'man') category = 'men';
            else if (m === 'mother' || m === 'women' || m === 'woman') category = 'women';
            else if (m.includes('son') || m.includes('boy')) category = 'boys';
            else if (m.includes('daughter') || m.includes('girl')) category = 'girls';

            if (category) {
                const currentStock = Number(updatedInventory[category][size] || 0);
                if (currentStock > 0) {
                    updatedInventory[category][size] = currentStock - 1;
                    hasChanges = true;
                    deductions.push(`${category} (${size})`);
                } else {
                    console.warn(`Insufficient stock for ${category} size ${size}`);
                }
            } else {
                console.warn(`Could not map member "${member}" to an inventory category`);
            }
        }

        try {
            if (hasChanges) {
                const updatedDesign = { ...design, inventory: updatedInventory };
                // Update local state and sync to DB
                setDesigns(prev => prev.map(d => d.id === design.id ? updatedDesign : d));
                await syncDesign(updatedDesign);
                console.log('Inventory updated for design:', design.name, 'Deductions:', deductions.join(', '));
            }

            await updateOrderStatus(order.id, 'accepted');

            if (!import.meta.env.VITE_SUPABASE_URL) {
                const ordersData = await fetchOrders();
                setOrders(ordersData);
            } else {
                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'accepted' } : o));
            }

            showNotification(`Order accepted! ${hasChanges ? 'Stock updated: ' + deductions.join(', ') : 'No stock changes needed.'}`, 'success');
        } catch (error) {
            console.error('Failed to process order acceptance:', error);
            showNotification('Error updating stock/order. Please check connection.', 'error');
        }
    };

    const handleRejectOrder = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (order && order.status !== 'pending') {
            showNotification('This order has already been processed.', 'info');
            return;
        }
        await updateOrderStatus(orderId, 'rejected');

        if (!import.meta.env.VITE_SUPABASE_URL) {
            const ordersData = await fetchOrders();
            setOrders(ordersData);
        } else {
            // Optimistic update for Supabase mode
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'rejected' } : o));
        }
        showNotification('Order rejected.', 'info');
    };

    const handleDeleteOrders = async (ids: string[]) => {
        await deleteOrders(ids);
        if (!import.meta.env.VITE_SUPABASE_URL) {
            const ordersData = await fetchOrders();
            setOrders(ordersData);
        } else {
            setOrders(prev => prev.filter(o => !ids.includes(o.id)));
        }
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spin" style={{
                        width: '40px', height: '40px', border: '4px solid var(--border-subtle)',
                        borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto'
                    }} />
                    <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading Combo Dress...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', overflow: 'hidden' }}>
            <Navigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <main style={{ flexGrow: 1, overflowY: 'auto' }}>
                <Routes>
                    <Route path="/staffview" element={
                        <>
                            {(activeTab === 'dashboard' || activeTab === 'orders' || activeTab === 'staff-gallery') && (
                                <StaffDashboard
                                    designs={designs}
                                    orders={orders}
                                    updateInventory={updateInventory}
                                    deleteDesign={deleteDesign}
                                    viewMode={activeTab === 'orders' ? 'orders' : activeTab === 'staff-gallery' ? 'gallery' : 'inventory'}
                                    setViewMode={(mode) => {
                                        if (mode === 'gallery') setActiveTab('staff-gallery');
                                        else if (mode === 'orders') setActiveTab('orders');
                                        else setActiveTab('dashboard');
                                    }}
                                    onBack={() => {
                                        if (activeTab === 'orders' || activeTab === 'staff-gallery') {
                                            setActiveTab('dashboard');
                                        } else {
                                            navigate('/customerview');
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
                                    onDeleteOrders={handleDeleteOrders}
                                    showNotification={showNotification}
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
                                    showNotification={showNotification}
                                />
                            )}
                        </>
                    } />
                    <Route path="/customerview" element={
                        <>
                            {activeTab === 'gallery' && (
                                <CustomerGallery
                                    designs={designs}
                                    selectedDesign={selectedDesign}
                                    onSelect={(d, category, config) => {
                                        setSelectedDesign(d);
                                        setSelectedCategory(category || 'ALL');
                                        setSelectedConfig(config || null);
                                        setActiveTab('preview');
                                    }}
                                    showNotification={showNotification}
                                />
                            )}
                            {activeTab === 'preview' && (
                                <FamilyPreview
                                    design={selectedDesign}
                                    category={selectedCategory}
                                    initialConfig={selectedConfig}
                                    onPlaceOrder={handlePlaceOrder}
                                    onBack={() => setActiveTab('gallery')}
                                    showNotification={showNotification}
                                />
                            )}
                        </>
                    } />
                    <Route path="/" element={<Navigate to="/staffview" replace />} />
                    <Route path="*" element={<Navigate to="/staffview" replace />} />
                </Routes>
            </main>

            <footer style={{
                padding: '8px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: 'auto',
                fontSize: '0.8rem'
            }}>
                © 2026 Combodress.com • Developed by <a href="https://sirahdigital.in/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sirah Digital</a>
            </footer>

            {/* Notifications UI */}
            <div className="notification-container">
                {notifications.map(n => (
                    <div key={n.id} className={`notification-toast ${n.type}`}>
                        <div style={{ flexShrink: 0 }}>
                            {n.type === 'success' && <CheckCircle2 size={24} color="var(--success)" />}
                            {n.type === 'error' && <XCircle size={24} color="var(--danger)" />}
                            {n.type === 'info' && <Info size={24} color="var(--primary)" />}
                        </div>
                        <div style={{ flexGrow: 1, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                            {n.message}
                        </div>
                        <button
                            onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', opacity: 0.4 }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
