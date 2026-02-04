import React, { useState } from 'react';
import type { Design, Order, AdultSizeStock, KidsSizeStock } from '../types';
import { Search, Edit2, Trash2, Plus, ArrowLeftRight, Clock, CheckCircle2, XCircle, ShoppingBag, Download, FileSpreadsheet, Images, Loader2, ArrowLeft, PlusCircle } from 'lucide-react';
import { exportToCSV, exportImagesToZip, pushLocalToCloud, downloadSingleImage } from '../data';

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
    viewMode: 'inventory' | 'orders';
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({
    designs, orders, updateInventory, deleteDesign, onEdit, onAddNew, onAcceptOrder, onRejectOrder, onBack, viewMode
}) => {
    const [search, setSearch] = useState('');
    const [isExportingImages, setIsExportingImages] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [isMigrating, setIsMigrating] = useState(false);

    const filteredDesigns = designs.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.fabric.toLowerCase().includes(search.toLowerCase())
    );

    const pendingOrders = orders.filter(o => o.status === 'pending');

    const adultSizes: (keyof AdultSizeStock)[] = ['M', 'L', 'XL', 'XXL', '3XL'];
    const kidsSizes: (keyof KidsSizeStock)[] = ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '9-10', '11-12', '13-14'];

    const InlineInput = ({ value, onUpdate }: { value: number, onUpdate: (newVal: number) => void }) => (
        <input
            type="number"
            value={value || ''}
            placeholder="0"
            onChange={(e) => onUpdate(parseInt(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
            style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: value === 0 ? 'rgba(255,255,255,0.1)' : 'white',
                textAlign: 'center',
                fontSize: '0.9rem',
                padding: '8px 0',
                outline: 'none',
                transition: 'background 0.2s'
            }}
        />
    );

    const handleImageExport = async () => {
        setIsExportingImages(true);
        setExportProgress(0);
        try {
            await exportImagesToZip(designs, (p) => setExportProgress(p));
        } catch (error) {
            alert('Bulk image export failed. Please try again.');
        } finally {
            setIsExportingImages(false);
        }
    };

    const downloadOrder = (order: Order) => {
        const content = `
ORDER RECEIPT
-------------
Order ID: ${order.id.toUpperCase()}
Date: ${new Date(order.createdAt).toLocaleString()}
Design: ${order.designId}
Combo: ${order.comboType}

Items:
${Object.entries(order.selectedSizes).map(([member, size]) => `- ${member}: Size ${size}`).join('\n')}

Status: ${order.status.toUpperCase()}
-------------
`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = order.designId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.href = url;
        a.download = `order_${safeName}_${order.id.slice(-4)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };


    const handleCloudMigration = async () => {
        if (!window.confirm('This will copy all your local designs to the cloud database. Continue?')) return;
        setIsMigrating(true);
        const success = await pushLocalToCloud();
        setIsMigrating(false);
        if (success) {
            alert('Local data successfully migrated to the cloud!');
            window.location.reload();
        } else {
            alert('Migration failed. Ensure Supabase is correctly configured in your .env file.');
        }
    };

    return (
        <div style={{ padding: 'max(16px, 2vw)', width: '100%', overflowX: 'hidden' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                background: 'rgba(255,255,255,0.02)',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
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
                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px', flexGrow: 1 }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                        <input
                            type="text" className="input" placeholder="Search..."
                            style={{ paddingLeft: '36px', height: '40px' }}
                            value={search} onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {viewMode === 'inventory' && (
                        <div style={{ display: 'flex', gap: '8px', marginRight: '16px', paddingRight: '16px', borderRight: '1px solid var(--glass-border)' }}>
                            <button
                                onClick={() => exportToCSV(designs)}
                                className="btn btn-ghost" style={{ fontSize: '0.8rem', gap: '6px' }} title="Download Inventory Data"
                            >
                                <FileSpreadsheet size={16} />
                                CSV
                            </button>
                            <button
                                onClick={handleImageExport}
                                disabled={isExportingImages}
                                className="btn btn-ghost" style={{ fontSize: '0.8rem', gap: '6px' }} title="Download All Images"
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
                    <button onClick={onAddNew} className="btn btn-primary tablet-up" style={{ padding: '8px 20px' }}>
                        <Plus size={18} />
                        New Entry
                    </button>
                </div>
            </div>

            {viewMode === 'inventory' ? (
                <>
                    {/* Desktop Table View */}
                    <div className="glass-card tablet-up" style={{ overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
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
                                                    borderBottom: idx === 3 ? '2px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.03)',
                                                    transition: 'background 0.2s'
                                                }}>
                                                    {idx === 0 && (
                                                        <>
                                                            <td rowSpan={4} style={{ padding: '16px', verticalAlign: 'top' }}>
                                                                <div
                                                                    style={{ position: 'relative', width: '40px', height: '40px', cursor: 'pointer' }}
                                                                    onClick={() => downloadSingleImage(design.imageUrl, design.name)}
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
                                                            <td rowSpan={4} style={{ padding: '16px', verticalAlign: 'top' }}>
                                                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{design.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{design.fabric} | {design.color}</div>
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
                                                        <td rowSpan={4} style={{ padding: '16px', textAlign: 'right', verticalAlign: 'top' }}>
                                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                                <button onClick={() => onEdit(design)} className="btn btn-ghost" style={{ padding: '6px' }} title="Edit Details">
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button onClick={() => deleteDesign(design.id)} className="btn btn-ghost" style={{ padding: '6px', color: 'var(--danger)' }} title="Delete Design">
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

                    {/* Mobile Card View */}
                    <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {filteredDesigns.map(design => (
                            <div key={design.id} className="glass-card" style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                    <img src={design.imageUrl} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} alt="" />
                                    <div>
                                        <h3 style={{ margin: 0 }}>{design.name}</h3>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{design.color} • {design.fabric}</p>
                                    </div>
                                </div>

                                {(['men', 'women', 'boys', 'girls'] as const).map(cat => (
                                    <div key={cat} style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--primary)' }}>{cat} Inventory</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                                            {((cat === 'men' || cat === 'women') ? adultSizes : kidsSizes).map(size => (
                                                <div key={size} style={{
                                                    padding: '8px',
                                                    background: 'rgba(255,255,255,0.03)',
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
                                    <button onClick={() => deleteDesign(design.id)} className="btn btn-ghost" style={{ color: 'var(--danger)', flexGrow: 1, justifyContent: 'center' }}>
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {pendingOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '100px', opacity: 0.5 }}>
                            <Clock size={48} style={{ marginBottom: '16px' }} />
                            <p>No pending orders at the moment.</p>
                        </div>
                    ) : (
                        pendingOrders.map(order => (
                            <div key={order.id} className="glass-card" style={{ padding: 'max(16px, 3vw)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ background: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '12px', flexShrink: 0 }}>
                                        <ShoppingBag size={20} />
                                    </div>
                                    <div style={{ minWidth: '200px', flexGrow: 1 }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                            Order #{order.id.slice(-6).toUpperCase()} • {new Date(order.createdAt).toLocaleTimeString()}
                                        </div>
                                        <h3 style={{ margin: 0 }}>
                                            {designs.find(d => d.id === order.designId)?.name || 'Unknown Design'}
                                        </h3>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                            <span className="badge badge-info">{order.comboType}</span>
                                            {Object.entries(order.selectedSizes).map(([member, size]) => (
                                                <span key={member} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {member}: <strong>{size}</strong>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => downloadOrder(order)}
                                        className="btn btn-ghost" title="Download Order Details"
                                        style={{ flexGrow: 1, justifyContent: 'center' }}
                                    >
                                        <Download size={18} />
                                    </button>
                                    <button
                                        onClick={() => onRejectOrder(order.id)}
                                        className="btn btn-ghost" style={{ color: 'var(--danger)', gap: '8px', flexGrow: 1, justifyContent: 'center' }}
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
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            {viewMode === 'inventory' && (
                <div style={{ marginTop: '40px', padding: 'max(16px, 4vw)', borderRadius: '24px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 12px 0' }}>Cloud Migration Utility</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '600px', margin: '0 auto 24px auto' }}>
                        If you have recently configured Supabase environment variables, use this tool to upload your existing local designs to the live database.
                    </p>
                    <button
                        onClick={handleCloudMigration}
                        disabled={isMigrating}
                        className="btn btn-primary" style={{ gap: '8px' }}
                    >
                        {isMigrating ? <Loader2 size={18} className="spin" /> : <PlusCircle size={18} />}
                        Sync Local Data to Cloud
                    </button>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px' }}>
                        Note: This will not overwrite existing cloud data, but will add any missing local designs.
                    </p>
                </div>
            )}
            {/* Mobile FAB */}
            {viewMode === 'inventory' && (
                <button onClick={onAddNew} className="fab mobile-only">
                    <Plus size={28} />
                </button>
            )}

            <style>{`
                .spin { animation: spin 1000ms linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default StaffDashboard;
