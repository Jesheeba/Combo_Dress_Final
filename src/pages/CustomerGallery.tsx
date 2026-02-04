import React, { useState, useMemo } from 'react';
import type { Design, ComboType, AdultSizeStock, KidsSizeStock } from '../types';
import { Sparkles, ArrowRight, CheckCircle, Search, Filter, Users, Baby, ArrowLeft, Download } from 'lucide-react';
import { downloadSingleImage } from '../data';

interface CustomerGalleryProps {
    designs: Design[];
    onSelect: (design: Design) => void;
    onBack: () => void;
    selectedDesign: Design | null;
}

type FilterType = 'ALL' | ComboType | 'boys' | 'girls' | 'unisex';

const CustomerGallery: React.FC<CustomerGalleryProps> = ({ designs, onSelect, onBack, selectedDesign }) => {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [useSizeFilter, setUseSizeFilter] = useState(false);
    const [filterSizes, setFilterSizes] = useState<Record<string, string>>({
        'men': 'L',
        'women': 'M',
        'boys': '4-5',
        'girls': '4-5'
    });
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const adultSizes: (keyof AdultSizeStock)[] = ['M', 'L', 'XL', 'XXL', '3XL'];
    const kidsSizes: (keyof KidsSizeStock)[] = ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '9-10', '11-12', '13-14'];

    const combos: { id: ComboType; label: string }[] = [
        { id: 'F-M-S-D', label: 'Full Family Set' },
        { id: 'F-S', label: 'Father & Son' },
        { id: 'M-D', label: 'Mother & Daughter' },
        { id: 'F-M', label: 'Couple Set' },
    ];

    const childCategories: { id: 'boys' | 'girls' | 'unisex'; label: string }[] = [
        { id: 'boys', label: 'Boys Selection' },
        { id: 'girls', label: 'Girls Selection' },
        { id: 'unisex', label: 'Unisex / Both' },
    ];

    const comboMembers = {
        'F-M-S-D': ['men', 'women', 'boys', 'girls'],
        'F-S': ['men', 'boys'],
        'M-D': ['women', 'girls'],
        'F-M': ['men', 'women'],
    };

    const filteredDesigns = useMemo(() => {
        return designs.filter(design => {
            // 1. Search Filter (Name, Color, Fabric)
            const searchLower = search.toLowerCase();
            const matchesSearch =
                design.name.toLowerCase().includes(searchLower) ||
                design.color.toLowerCase().includes(searchLower) ||
                design.fabric.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            // 2. Combo / Category Filter
            let passesCategory = true;
            if (activeFilter !== 'ALL') {
                if (['boys', 'girls', 'unisex'].includes(activeFilter)) {
                    const cf = activeFilter as 'boys' | 'girls' | 'unisex';
                    if (cf === 'unisex') {
                        if (design.childType !== 'unisex') {
                            const hasBoys = Object.values(design.inventory.boys).some(s => s > 0);
                            const hasGirls = Object.values(design.inventory.girls).some(s => s > 0);
                            if (!(hasBoys && hasGirls)) passesCategory = false;
                        }
                    } else {
                        if (design.childType && design.childType !== cf && design.childType !== 'unisex') passesCategory = false;
                        else {
                            const inventory = design.inventory[cf as keyof Design['inventory']];
                            const hasStock = Object.values(inventory).some(stock => stock > 0);
                            if (!hasStock) passesCategory = false;
                        }
                    }
                } else {
                    const members = comboMembers[activeFilter as ComboType];
                    passesCategory = members.every(member => {
                        const inventory = design.inventory[member as keyof Design['inventory']];
                        return Object.values(inventory).some(stock => stock > 0);
                    });
                }
            }

            if (!passesCategory) return false;

            // 3. Strict Size Filter (New)
            if (useSizeFilter) {
                // If a specific combo filter is active, only check those members
                const activeMembers = activeFilter === 'ALL'
                    ? ['men', 'women', 'boys', 'girls']
                    : (['boys', 'girls', 'unisex'].includes(activeFilter)
                        ? (activeFilter === 'unisex' ? ['boys', 'girls'] : [activeFilter])
                        : comboMembers[activeFilter as ComboType]);

                return activeMembers.every(member => {
                    const m = member as keyof Design['inventory'];
                    return (design.inventory[m] as any)[filterSizes[m]] > 0;
                });
            }

            return true;
        });
    }, [designs, search, activeFilter, useSizeFilter, filterSizes]);

    return (
        <div style={{ padding: '0 max(16px, 2vw) 48px max(16px, 2vw)', width: '100%', overflowX: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <button onClick={onBack} className="btn btn-ghost" style={{ gap: '8px' }} title="Back to Staff Mode">
                    <ArrowLeft size={18} />
                    Back
                </button>
                <button
                    onClick={() => setIsFilterDrawerOpen(true)}
                    className="btn btn-primary mobile-only"
                    style={{ gap: '8px', borderRadius: '50px', padding: '8px 20px' }}
                >
                    <Filter size={18} />
                    Filters
                </button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '12px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Our Exclusive Collection</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Find the perfect matching set for your family</p>
            </div>

            {/* Desktop Filters / Mobile Drawer */}
            <div
                className={isFilterDrawerOpen ? '' : 'tablet-up'}
                style={isFilterDrawerOpen ? {
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.95)',
                    padding: '24px',
                    zIndex: 2000,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px'
                } : {
                    maxWidth: '1000px',
                    margin: '0 auto 48px auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    background: 'rgba(255,255,255,0.03)',
                    padding: 'max(20px, 4vw)',
                    borderRadius: '24px',
                    border: '1px solid var(--glass-border)',
                    width: '100%'
                }}
            >
                {isFilterDrawerOpen && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h2 style={{ margin: 0 }}>Filters</h2>
                        <button onClick={() => setIsFilterDrawerOpen(false)} className="btn btn-ghost" style={{ padding: '8px' }}>
                            <ArrowLeft size={24} />
                        </button>
                    </div>
                )}
                <div style={{ position: 'relative' }}>
                    <Search
                        style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}
                        size={20}
                    />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by fabric, color, or design name..."
                        style={{ paddingLeft: '48px', height: '56px', fontSize: '1.1rem' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    {/* All / Combos */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Users size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                            Combinations
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            <button
                                onClick={() => setActiveFilter('ALL')}
                                className={`btn ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem' }}
                            >
                                All Designs
                            </button>
                            {combos.map((combo) => (
                                <button
                                    key={combo.id}
                                    onClick={() => setActiveFilter(combo.id)}
                                    className={`btn ${activeFilter === combo.id ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem' }}
                                >
                                    {combo.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Children Categories */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Baby size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                            Children
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {childCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveFilter(cat.id)}
                                    className={`btn ${activeFilter === cat.id ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem' }}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Size Selective Filtering */}
                <div style={{ padding: '24px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Filter size={18} color="var(--primary)" />
                            Filter by Exact Sizes
                        </h4>
                        <label className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={useSizeFilter}
                                onChange={(e) => setUseSizeFilter(e.target.checked)}
                            />
                            Enable Size Filter
                        </label>
                    </div>

                    {useSizeFilter && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
                            {['men', 'women', 'boys', 'girls'].map(member => {
                                // Only show size picker for members involved in current filter
                                const isMemberActive = activeFilter === 'ALL' ||
                                    (['boys', 'girls', 'unisex'].includes(activeFilter)
                                        ? (activeFilter === 'unisex' ? (member === 'boys' || member === 'girls') : member === activeFilter)
                                        : comboMembers[activeFilter as ComboType].includes(member));

                                if (!isMemberActive) return null;

                                const sizes = (member === 'men' || member === 'women') ? adultSizes : kidsSizes;

                                return (
                                    <div key={member}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'capitalize' }}>
                                            {member} Size
                                        </label>
                                        <select
                                            className="input"
                                            style={{ padding: '8px 12px', height: 'auto', fontSize: '1rem', background: 'rgba(15, 23, 42, 0.9)' }}
                                            value={filterSizes[member]}
                                            onChange={(e) => setFilterSizes({ ...filterSizes, [member]: e.target.value })}
                                        >
                                            {sizes.map(s => <option key={String(s)} value={String(s)}>{String(s)}</option>)}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {isFilterDrawerOpen && (
                    <button
                        onClick={() => setIsFilterDrawerOpen(false)}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '16px', borderRadius: '16px', marginTop: 'auto' }}
                    >
                        Apply Filters ({filteredDesigns.length} Results)
                    </button>
                )}
            </div>

            {filteredDesigns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px', opacity: 0.5 }}>
                    <Filter size={64} style={{ marginBottom: '24px', color: 'var(--primary)' }} />
                    <h2>No matching designs</h2>
                    <p>Try searching for a different term or selecting another category.</p>
                    <button
                        onClick={() => { setSearch(''); setActiveFilter('ALL'); }}
                        className="btn btn-ghost"
                        style={{ marginTop: '16px' }}
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : (
                <div className="dashboard-grid">
                    {filteredDesigns.map(design => (
                        <div
                            key={design.id}
                            className={`glass-card ${selectedDesign?.id === design.id ? 'active' : ''}`}
                            style={{
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: selectedDesign?.id === design.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                transform: selectedDesign?.id === design.id ? 'translateY(-8px) scale(1.02)' : 'none',
                                position: 'relative'
                            }}
                            onClick={() => onSelect(design)}
                        >
                            {selectedDesign?.id === design.id && (
                                <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background: 'var(--primary)',
                                    borderRadius: '50%',
                                    padding: '4px',
                                    zIndex: 10
                                }}>
                                    <CheckCircle size={20} color="white" />
                                </div>
                            )}

                            <div className="mobile-full-bleed" style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
                                <img
                                    src={design.imageUrl}
                                    alt={design.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                    className="gallery-img"
                                />
                                {design.childType && design.childType !== 'none' && (
                                    <div style={{
                                        position: 'absolute', top: '12px', left: '12px',
                                        background: 'rgba(15, 23, 42, 0.8)', padding: '4px 12px',
                                        borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800,
                                        color: 'white', border: '1px solid rgba(255,255,255,0.1)',
                                        textTransform: 'uppercase'
                                    }}>
                                        {design.childType}
                                    </div>
                                )}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    padding: '24px',
                                    background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.9))'
                                }}>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{design.name}</h3>
                                    <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                                        {design.color} • {design.fabric}
                                    </p>
                                </div>
                            </div>

                            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <Sparkles size={16} color="var(--primary)" />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>{design.label || 'PREMIUM DESIGN'}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); downloadSingleImage(design.imageUrl, design.name); }}
                                        className="btn btn-ghost"
                                        style={{ padding: '8px' }}
                                        title="Download Image"
                                    >
                                        <Download size={18} />
                                    </button>
                                    <button className={`btn ${selectedDesign?.id === design.id ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '8px 16px' }}>
                                        {selectedDesign?.id === design.id ? 'Selected' : 'Select'}
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerGallery;
