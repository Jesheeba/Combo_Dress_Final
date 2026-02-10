import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Design, Order, AdultSizeStock, KidsSizeStock } from '../types';
import { Search, Edit2, Trash2, Plus, ArrowLeftRight, Clock, CheckCircle2, XCircle, ShoppingBag, Download, FileSpreadsheet, Images, Loader2, ArrowLeft, Eye } from 'lucide-react';
import { exportToCSV, exportImagesToZip, downloadSingleImage, generateInvoicePDF } from '../data';

interface StaffDashboardProps {
    designs: Design[];
    orders: Order[];
    updateInventory: (designId: string, category: string, size: string, change: number) => Promise<void>;
    deleteDesign: (id: string) => Promise<void>;
    onEdit: (design: Design) => void;
    onAddNew: () => void;
    onAcceptOrder: (order: Order) => Promise<void>;
    onRejectOrder: (orderId: string) => Promise<void>;
    onBack: () => void;
    viewMode: 'inventory' | 'orders' | 'gallery';
    setViewMode: (mode: 'inventory' | 'orders' | 'gallery') => void;
    onDeleteOrders: (ids: string[]) => Promise<void>;
    showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({
    designs, orders, updateInventory, deleteDesign, onEdit, onAddNew, onAcceptOrder, onRejectOrder, onDeleteOrders, onBack, viewMode, setViewMode, showNotification
}) => {
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [analyticsFilter, setAnalyticsFilter] = useState<'all' | 'low-stock'>('all');
    const [isExportingImages, setIsExportingImages] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [orderView, setOrderView] = useState<'active' | 'history'>('active');
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedOrderIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedOrderIds(newSelected);
    };

    const filteredDesigns = designs.filter(design => {
        const matchesSearch =
            design.name.toLowerCase().includes(search.toLowerCase()) ||
            design.color.toLowerCase().includes(search.toLowerCase()) ||
            design.fabric.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (analyticsFilter === 'low-stock') {
            const categories = ['men', 'women', 'boys', 'girls'] as const;
            return categories.some(cat =>
                Object.values(design.inventory[cat]).some(stock => {
                    const s = Number(stock);
                    return s >= 0 && s <= 5;
                })
            );
        }

        return true;
    });

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const historyOrders = orders.filter(o => o.status === 'accepted' || o.status === 'rejected').sort((a, b) => b.createdAt - a.createdAt);

    const adultSizes: (keyof AdultSizeStock)[] = ['M', 'L', 'XL', 'XXL', '3XL'];
    const kidsSizes: (keyof KidsSizeStock)[] = ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '9-10', '11-12', '13-14'];

    const analytics = useMemo(() => {
        let totalStock = 0;
        let lowStockCount = 0;

        designs.forEach(d => {
            (['men', 'women', 'boys', 'girls'] as const).forEach(cat => {
                Object.values(d.inventory[cat]).forEach(stock => {
                    const s = Number(stock);
                    totalStock += s;
                    if (s >= 0 && s <= 5) lowStockCount++;
                });
            });
        });

        return {
            totalDesigns: designs.length,
            totalStock,
            lowStockCount,
            pendingOrders: pendingOrders.length
        };
    }, [designs, pendingOrders]);

    const InlineInput = ({ value, onUpdate }: { value: number, onUpdate: (newVal: number) => void }) => {
        return (
            <input
                type="number"
                value={value}
                placeholder="0"
                onChange={(e) => onUpdate(parseInt(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontWeight: 700,
                    opacity: 1,
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    padding: '8px 0',
                    outline: 'none',
                    transition: 'all 0.2s'
                }}
            />
        );
    };

    const handleImageExport = async () => {
        setIsExportingImages(true);
        setExportProgress(0);
        try {
            await exportImagesToZip(designs, (p) => setExportProgress(p));
            showNotification('Images exported successfully!', 'success');
        } catch (error) {
            showNotification('Bulk image export failed. Please try again.', 'error');
        } finally {
            setIsExportingImages(false);
        }
    };

    const downloadOrder = async (order: Order) => {
        try {
            await generateInvoicePDF(order);
            showNotification('Invoice generated successfully.', 'success');
        } catch (error) {
            showNotification('Failed to generate invoice.', 'error');
        }
    };



    return (
        <div className="w-full-force" style={{ maxWidth: 'none', margin: '0 auto', padding: viewMode === 'inventory' ? 'max(16px, 2vw) 0' : 'max(16px, 2vw)', width: '100%', overflowX: 'hidden' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                background: 'var(--bg-secondary)',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: '16px',
                margin: viewMode === 'inventory' ? '0 max(16px, 2vw) 24px' : '0 0 24px'
            }}>
                <div className="mobile-stack" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                onClick={onBack}
                                className="btn btn-ghost" style={{ padding: '8px' }}
                                title={viewMode === 'orders' ? "Back to Ledger" : "Switch to Customer View"}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h1 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                                {viewMode === 'inventory' ? (
                                    <><ArrowLeftRight size={20} color="var(--primary)" /> Ledger</>
                                ) : (
                                    <><Clock size={20} color="var(--primary)" /> Orders</>
                                )}
                            </h1>
                        </div>
                        <div className="mobile-only" style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={onAddNew} className="btn btn-primary" style={{ padding: '8px 12px' }}>
                                <Plus size={18} />
                                New
                            </button>
                        </div>
                    </div>
                    {viewMode === 'orders' ? (
                        selectedOrderIds.size > 0 ? (
                            <button
                                onClick={() => setShowBulkDeleteConfirm(true)}
                                className="btn btn-primary"
                                style={{ background: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Trash2 size={16} />
                                Delete Selected ({selectedOrderIds.size})
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-main)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                <button
                                    onClick={() => setOrderView('active')}
                                    className={`btn ${orderView === 'active' ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setOrderView('history')}
                                    className={`btn ${orderView === 'history' ? 'btn-black-active active' : 'btn-ghost btn-black-active'}`}
                                    style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                                >
                                    History
                                </button>
                            </div>
                        )
                    ) : (
                        <div style={{ position: 'relative', width: '100%', maxWidth: '100%', flexGrow: 1 }}>
                            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                            <input
                                type="text" className="input" placeholder="Search..."
                                style={{ paddingLeft: '36px', height: '40px' }}
                                value={search} onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="mobile-stack" style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%', justifyContent: 'flex-end', marginTop: '12px' }}>
                    {viewMode === 'inventory' && (
                        <div style={{ display: 'flex', gap: '8px', flexGrow: 1 }}>
                            <button
                                onClick={() => exportToCSV(designs)}
                                className="btn btn-ghost" style={{ fontSize: '0.8rem', gap: '6px', flexGrow: 1 }} title="Download Inventory Data"
                            >
                                <FileSpreadsheet size={16} />
                                CSV
                            </button>
                            <button
                                onClick={handleImageExport}
                                disabled={isExportingImages}
                                className="btn btn-ghost" style={{ fontSize: '0.8rem', gap: '6px', flexGrow: 1 }} title="Download All Images"
                            >
                                {isExportingImages ? (
                                    <>
                                        <Loader2 size={16} className="spin" />
                                        {exportProgress}%
                                    </>
                                ) : (
                                    <>
                                        <Images size={16} />
                                        Images
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                    <button onClick={() => navigate('/customerview')} className="btn btn-secondary" style={{ padding: '8px 20px', flexGrow: 1 }}>
                        <Eye size={18} />
                        <span>Customer view</span>
                    </button>

                    <button onClick={onAddNew} className="btn btn-primary tablet-up" style={{ padding: '8px 20px' }}>
                        <Plus size={18} />
                        New Entry
                    </button>
                </div>
            </div>

            {viewMode === 'inventory' && (
                <>
                    {/* Analytics Dashboard */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px',
                        padding: '0 max(16px, 2vw)'
                    }}>
                        {[
                            { id: 'all', label: 'Total Designs', value: analytics.totalDesigns, icon: FileSpreadsheet, color: '#6366f1' },
                            { id: 'all', label: 'Total Units', value: analytics.totalStock, icon: ShoppingBag, color: '#10b981' },
                            { id: 'low-stock', label: 'Low Stock', value: analytics.lowStockCount, icon: XCircle, color: '#ef4444' },
                            { id: 'orders', label: 'Orders', value: analytics.pendingOrders, icon: Clock, color: '#f59e0b' },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className="glass-card"
                                style={{
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    border: (stat.id === analyticsFilter && stat.id !== 'all') ? `2px solid ${stat.color}` : '1px solid var(--border-subtle)',
                                    transform: (stat.id === analyticsFilter && stat.id !== 'all') ? 'scale(1.02)' : 'none',
                                    transition: 'all 0.2s ease',
                                    background: (stat.id === analyticsFilter && stat.id !== 'all') ? `${stat.color}05` : 'var(--bg-secondary)'
                                }}
                                onClick={() => {
                                    if (stat.id === 'orders') {
                                        setViewMode('orders');
                                    } else {
                                        setAnalyticsFilter(stat.id as any);
                                        if (stat.id === 'all') setSearch('');
                                    }
                                }}
                            >
                                <div style={{ background: `${stat.color}20`, color: stat.color, padding: '8px', borderRadius: '10px' }}>
                                    <stat.icon size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stat.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {analyticsFilter === 'low-stock' && (
                        <div style={{ marginBottom: '16px', padding: '0 max(16px, 2vw)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                                <XCircle size={18} />
                                <span style={{ fontWeight: 600 }}>Filtering: Low Stock Items Only</span>
                            </div>
                            <button onClick={() => setAnalyticsFilter('all')} className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
                                Clear Filter
                            </button>
                        </div>
                    )}

                    {/* Desktop Table View */}
                    <div className="tablet-up desktop-full-width-inventory" style={{ padding: '0 max(16px, 2vw)' }}>
                        <div className="glass-card" style={{ overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                            <th style={{ padding: '12px 16px', width: '60px' }}>Swatch</th>
                                            <th style={{ padding: '12px 16px', minWidth: '150px' }}>Design Name</th>
                                            <th style={{ padding: '12px 16px', width: '100px' }}>Category</th>
                                            {kidsSizes.map(s => <th key={s} style={{ padding: '12px 4px', textAlign: 'center', width: '45px' }}>{s}</th>)}
                                            {adultSizes.map(s => <th key={s} style={{ padding: '12px 4px', textAlign: 'center', width: '45px', borderLeft: s === 'M' ? '1px solid var(--glass-border)' : 'none' }}>{s}</th>)}
                                            <th style={{ padding: '12px 16px', textAlign: 'right', width: '100px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDesigns.map(design => (
                                            <React.Fragment key={design.id}>
                                                {(['men', 'women', 'boys', 'girls'] as const).map((cat, idx) => (
                                                    <tr key={`${design.id}-${cat}`} style={{
                                                        borderBottom: idx === 3 ? '2px solid var(--border-subtle)' : '1px solid var(--border-subtle)',
                                                        transition: 'background 0.2s'
                                                    }}>
                                                        {idx === 0 && (
                                                            <>
                                                                <td rowSpan={4} className="swatch-col" style={{ padding: '16px', verticalAlign: 'top' }}>
                                                                    <div
                                                                        style={{ position: 'relative', width: '40px', height: '40px', cursor: 'pointer' }}
                                                                        onClick={async () => {
                                                                            try {
                                                                                await downloadSingleImage(design.imageUrl, design.name);
                                                                                showNotification('Image downloaded successfully.', 'success');
                                                                            } catch (error) {
                                                                                showNotification('Failed to download image. Check CORS settings.', 'error');
                                                                            }
                                                                        }}
                                                                        title="Download this image"
                                                                    >
                                                                        <img src={design.imageUrl} style={{ width: '100%', height: '100%', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--glass-border)' }} alt="" />
                                                                        <div style={{
                                                                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px',
                                                                            opacity: 0, transition: 'opacity 0.2s'
                                                                        }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                                                                            <Download size={14} color="white" />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td rowSpan={4} style={{ padding: '16px', verticalAlign: 'top', minWidth: '180px' }}>
                                                                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{design.name}</div>
                                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>{design.color} | {design.fabric}</div>
                                                                </td>
                                                            </>
                                                        )}
                                                        <td style={{ padding: '8px 16px', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                                                            {cat}
                                                        </td>
                                                        {kidsSizes.map(size => (
                                                            <td key={size} style={{ padding: 0, borderRight: '1px solid rgba(255,255,255,0.02)' }}>
                                                                {('boys' === cat || 'girls' === cat) ? (
                                                                    <InlineInput
                                                                        value={(design.inventory[cat] as any)[size]}
                                                                        onUpdate={(newVal) => updateInventory(design.id, cat, size, newVal)}
                                                                    />
                                                                ) : <div style={{ opacity: 0.1, textAlign: 'center' }}>-</div>}
                                                            </td>
                                                        ))}
                                                        {adultSizes.map(size => (
                                                            <td key={size} style={{ padding: 0, borderLeft: size === 'M' ? '1px solid var(--glass-border)' : 'none', borderRight: '1px solid rgba(255,255,255,0.02)' }}>
                                                                {('men' === cat || 'women' === cat) ? (
                                                                    <InlineInput
                                                                        value={(design.inventory[cat] as any)[size]}
                                                                        onUpdate={(newVal) => updateInventory(design.id, cat, size, newVal)}
                                                                    />
                                                                ) : <div style={{ opacity: 0.1, textAlign: 'center' }}>-</div>}
                                                            </td>
                                                        ))}
                                                        {idx === 0 && (
                                                            <td rowSpan={4} className="actions-col" style={{ padding: '16px', textAlign: 'right', verticalAlign: 'top' }}>
                                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                                    <button onClick={() => onEdit(design)} className="btn btn-ghost" style={{ padding: '6px' }} title="Edit Details">
                                                                        <Edit2 size={14} />
                                                                    </button>
                                                                    <button onClick={() => setDeleteId(design.id)} className="btn btn-ghost" style={{ padding: '6px', color: 'var(--danger)' }} title="Delete Design">
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                        {filteredDesigns.map(design => (
                            <div key={design.id} className="glass-card" style={{
                                padding: '16px',
                                width: '100%',
                                borderRadius: 0,
                                borderLeft: 'none',
                                borderRight: 'none'
                            }}>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                    <img src={design.imageUrl} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} alt="" />
                                    <div>
                                        <h3 style={{ margin: 0 }}>{design.name}</h3>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{design.color} • {design.fabric}</p>
                                    </div>
                                </div>

                                {(['men', 'women', 'boys', 'girls'] as const).map(cat => (
                                    <div key={cat} style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>{cat} Inventory</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                                            {((cat === 'men' || cat === 'women') ? adultSizes : kidsSizes).map(size => (
                                                <div key={size} style={{
                                                    padding: '8px',
                                                    background: 'var(--bg-main)',
                                                    border: '1px solid var(--border-subtle)',
                                                    borderRadius: '6px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center'
                                                }}>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{size}</div>
                                                    <InlineInput
                                                        value={(design.inventory[cat] as any)[size]}
                                                        onUpdate={(newVal) => updateInventory(design.id, cat, size, newVal)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                                    <button onClick={() => downloadSingleImage(design.imageUrl, design.name)} className="btn btn-ghost" style={{ flexGrow: 1, justifyContent: 'center' }} title="Download Image">
                                        <Download size={16} /> Download
                                    </button>
                                    <button onClick={() => onEdit(design)} className="btn btn-ghost" style={{ flexGrow: 1, justifyContent: 'center' }}>
                                        <Edit2 size={16} /> Edit
                                    </button>
                                    <button onClick={() => setDeleteId(design.id)} className="btn btn-ghost" style={{ color: 'var(--danger)', flexGrow: 1, justifyContent: 'center' }}>
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {
                viewMode === 'orders' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {(orderView === 'active' ? pendingOrders : historyOrders).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '100px', opacity: 0.5 }}>
                                <Clock size={48} style={{ marginBottom: '16px' }} />
                                <p>No {orderView} orders at the moment.</p>
                            </div>
                        ) : (
                            (orderView === 'active' ? pendingOrders : historyOrders).map(order => (
                                <div key={order.id} className="glass-card" style={{ padding: 'max(16px, 3vw)', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--border-subtle)', position: 'relative' }}>
                                    {orderView === 'history' && (
                                        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedOrderIds.has(order.id)}
                                                onChange={() => handleToggleSelect(order.id)}
                                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            />
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: 'max(12px, 2vw)', marginBottom: '16px', flexDirection: window.innerWidth < 640 ? 'column' : 'row' }}>
                                        <div style={{ width: window.innerWidth < 640 ? '100%' : '100px', flexShrink: 0 }}>
                                            <img
                                                src={designs.find(d => d.id === order.designId)?.imageUrl}
                                                style={{ width: '100%', aspectRatio: '1/1', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                                                alt=""
                                            />
                                        </div>
                                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Order #{order.id.slice(-6).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString()}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                                                    {designs.find(d => d.id === order.designId)?.name || 'Unknown Design'}
                                                </h3>
                                                {orderView === 'history' && (
                                                    <span className={`badge ${order.status === 'accepted' ? 'badge-success' : 'badge-danger'}`} style={{
                                                        borderRadius: '6px',
                                                        padding: '4px 10px',
                                                        fontSize: '0.7rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        {order.status === 'accepted' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                        {order.status?.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Customer Details */}
                                            <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', fontSize: '0.85rem', border: '1px solid var(--border-subtle)' }}>
                                                <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer Details</div>
                                                <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{order.customerEmail}</div>
                                                <div style={{ margin: '4px 0' }}>{order.customerCountryCode && <span style={{ color: 'var(--text-muted)', marginRight: '4px' }}>{order.customerCountryCode}</span>}{order.customerPhone}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{order.customerAddress}</div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                                <span className="badge badge-info" style={{ borderRadius: '6px', padding: '4px 10px', fontSize: '0.7rem' }}>{order.comboType}</span>
                                                {Object.entries(order.selectedSizes)
                                                    .filter(([_, size]) => size !== 'N/A')
                                                    .map(([member, size]) => (
                                                        <div key={member} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', background: 'white', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>
                                                                {member}: {size}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => downloadOrder(order)}
                                            className="btn btn-ghost btn-download"
                                            style={{ flexGrow: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
                                        >
                                            Invoice PDF
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const design = designs.find(d => d.id === order.designId);
                                                if (design) {
                                                    try {
                                                        await downloadSingleImage(design.imageUrl, design.name);
                                                        showNotification('Image downloaded successfully.', 'success');
                                                    } catch (error) {
                                                        showNotification('Failed to download image. Check CORS settings.', 'error');
                                                    }
                                                } else {
                                                    showNotification('Design information not found for this order.', 'error');
                                                }
                                            }}
                                            className="btn btn-ghost btn-download"
                                            style={{ flexGrow: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
                                        >
                                            Dress Image
                                        </button>
                                        {orderView === 'active' && (
                                            <>
                                                <button
                                                    onClick={() => onRejectOrder(order.id)}
                                                    className="btn btn-ghost btn-reject" style={{ color: 'var(--danger)', gap: '8px', flexGrow: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                                                >
                                                    <XCircle size={18} />
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => onAcceptOrder(order)}
                                                    className="btn btn-primary" style={{ gap: '8px', padding: '12px 32px', flexGrow: 2, justifyContent: 'center' }}
                                                >
                                                    <CheckCircle2 size={18} />
                                                    Accept
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )
            }

            {
                viewMode === 'gallery' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '24px',
                        paddingBottom: '80px' // Space for mobile FAB
                    }}>
                        {filteredDesigns.map(design => (
                            <div key={design.id} className="glass-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ position: 'relative', paddingTop: '100%' }}>
                                    <img
                                        src={design.imageUrl}
                                        alt={design.name}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        display: 'flex',
                                        gap: '8px'
                                    }}>
                                        <button
                                            onClick={() => downloadSingleImage(design.imageUrl, design.name)}
                                            className="btn glass-card"
                                            style={{ padding: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }}
                                            title="Download Image"
                                        >
                                            <Download size={16} color="var(--text-main)" />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{design.name}</h3>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {design.color} • {design.fabric}
                                    </p>

                                    <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => onEdit(design)}
                                            className="btn btn-secondary"
                                            style={{ flexGrow: 1, justifyContent: 'center' }}
                                        >
                                            <Edit2 size={16} /> Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(design.id)}
                                            className="btn btn-ghost"
                                            style={{ color: 'var(--danger)', padding: '8px' }}
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredDesigns.length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                <Images size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <p>No designs found matching your search.</p>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Mobile FAB */}
            {
                viewMode === 'inventory' && (
                    <button onClick={onAddNew} className="fab mobile-only">
                        <Plus size={28} />
                    </button>
                )
            }

            {/* Custom Confirmation Modal */}
            {
                deleteId && (
                    <div style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 2000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <div className="glass-card" style={{
                            padding: '32px',
                            maxWidth: '440px',
                            width: '100%',
                            boxShadow: 'var(--shadow-xl)',
                            textAlign: 'center',
                            animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}>
                            <div style={{
                                width: '64px', height: '64px',
                                background: '#fef2f2', color: '#ef4444',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <Trash2 size={32} />
                            </div>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Delete Design?</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                Are you sure you want to delete <strong style={{ color: 'var(--text-main)' }}>{designs.find(d => d.id === deleteId)?.name}</strong>? This action will permanently remove it from the inventory.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, padding: '12px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (deleteId) deleteDesign(deleteId);
                                        setDeleteId(null);
                                    }}
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '12px', background: '#ef4444', borderColor: '#ef4444' }}
                                >
                                    Delete Now
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Bulk Delete Confirmation Modal */}
            {
                showBulkDeleteConfirm && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}>
                        <div style={{
                            background: 'var(--bg-main)', padding: '24px', borderRadius: '16px',
                            maxWidth: '400px', width: '100%', boxShadow: 'var(--shadow-lg)'
                        }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem' }}>Confirm Bulk Deletion</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
                                Are you sure you want to delete {selectedOrderIds.size} selected orders? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowBulkDeleteConfirm(false)}
                                    className="btn btn-ghost"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        await onDeleteOrders(Array.from(selectedOrderIds));
                                        setSelectedOrderIds(new Set());
                                        setShowBulkDeleteConfirm(false);
                                    }}
                                    className="btn btn-primary"
                                    style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                                >
                                    Delete {selectedOrderIds.size} Orders
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <style>{`
                .spin { animation: spin 1000ms linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .btn-black-active { transition: all 0.2s; }
                .btn-black-active:hover:not(:disabled),
                .btn-black-active.active {
                    background: #000000 !important;
                    color: #ffffff !important;
                }
            `}</style>
        </div >
    );
};

export default StaffDashboard;
