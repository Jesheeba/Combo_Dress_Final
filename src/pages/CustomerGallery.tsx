import React, { useState, useMemo } from 'react';
import type { Design, ComboType, AdultSizeStock, KidsSizeStock } from '../types';
import { Sparkles, ArrowRight, CheckCircle, Filter, Users, Baby, Download, X, Search } from 'lucide-react';
import { downloadSingleImage } from '../data';

interface CustomerGalleryProps {
    designs: Design[];
    onSelect: (design: Design, category?: string, config?: any) => void;
    selectedDesign: Design | null;
}



const CustomerGallery: React.FC<CustomerGalleryProps> = ({ designs, onSelect, selectedDesign }) => {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('ALL');
    const [showResults, setShowResults] = useState(false);

    // Add effect to handle body scroll
    React.useEffect(() => {
        if (showResults) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [showResults]);

    const [filterSizes, setFilterSizes] = useState<{
        father: string;
        mother: string;
        sons: string[];
        daughters: string[];
    }>({
        father: 'N/A',
        mother: 'N/A',
        sons: ['N/A'],
        daughters: ['N/A']
    });


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
        'Custom': [] as string[],
    };

    const handleReset = () => {
        setActiveFilter('ALL');
        setFilterSizes({
            father: 'N/A',
            mother: 'N/A',
            sons: ['N/A'],
            daughters: ['N/A']
        });
        setShowResults(false);
    };

    const filteredDesigns = useMemo(() => {
        return designs.filter(design => {
            // Text search
            const matchesSearch =
                design.name.toLowerCase().includes(search.toLowerCase()) ||
                design.color.toLowerCase().includes(search.toLowerCase()) ||
                design.fabric.toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return false;

            // 1. Combo / Category Filter
            let passesCategory = true;
            if (activeFilter !== 'ALL') {
                if (['boys', 'girls', 'unisex'].includes(activeFilter)) {
                    const cf = activeFilter as 'boys' | 'girls' | 'unisex';
                    if (cf === 'unisex') {
                        // For unisex, we look for designs specifically labeled unisex
                        // OR designs that have available stock for BOTH boys and girls
                        const hasBoys = Object.values(design.inventory.boys).some(s => s > 0);
                        const hasGirls = Object.values(design.inventory.girls).some(s => s > 0);

                        if (design.childType !== 'unisex' && !(hasBoys && hasGirls)) {
                            passesCategory = false;
                        }
                    } else {
                        // For Boys or Girls specifically:
                        // Ignore the label! Just check if there is stock.
                        const inventory = design.inventory[cf as keyof Design['inventory']];
                        const hasStock = Object.values(inventory).some(stock => stock > 0);
                        if (!hasStock) passesCategory = false;
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

            // 3. Strict Size Filter
            // Even in 'ALL' mode, if a user selected a specific size for any member, 
            // the design MUST satisfy that requirement.
            const hasSpecificSizeRequirements =
                filterSizes.father !== 'N/A' ||
                filterSizes.mother !== 'N/A' ||
                filterSizes.sons.some(s => s !== 'N/A') ||
                filterSizes.daughters.some(d => d !== 'N/A');

            let membersToCheck: string[] = [];

            if (activeFilter === 'ALL') {
                if (!hasSpecificSizeRequirements) {
                    // HIDDEN BY DEFAULT: Don't show any designs if no specific sizes are chosen in 'ALL' mode
                    return false;
                }

                // If sizes are selected, check any member that has a selection
                if (filterSizes.father !== 'N/A') membersToCheck.push('men');
                if (filterSizes.mother !== 'N/A') membersToCheck.push('women');
                if (filterSizes.sons.some(s => s !== 'N/A')) membersToCheck.push('boys');
                if (filterSizes.daughters.some(d => d !== 'N/A')) membersToCheck.push('girls');
            } else {
                // For specific combo/child filters, we require core members
                if (['boys', 'girls', 'unisex'].includes(activeFilter)) {
                    membersToCheck = activeFilter === 'unisex' ? ['boys', 'girls'] : [activeFilter];
                } else {
                    membersToCheck = comboMembers[activeFilter as ComboType];
                }
            }

            // If we have specific filters but no members identified? 
            // (Shouldn't happen with above logic, but safety first)
            if (membersToCheck.length === 0) return true;

            return membersToCheck.every(member => {
                const m = member as keyof Design['inventory'];

                // Get required sizes for this member type from our filter state
                let requiredSizes: string[] = [];
                if (m === 'men') requiredSizes = [filterSizes.father];
                else if (m === 'women') requiredSizes = [filterSizes.mother];
                else if (m === 'boys') requiredSizes = filterSizes.sons;
                else if (m === 'girls') requiredSizes = filterSizes.daughters;

                // Check if design has stock for ALL required sizes of this member
                return requiredSizes.every(size => {
                    if (size === 'N/A') return true;
                    return (design.inventory[m] as any)[size] > 0;
                });
            });
        });
    }, [designs, activeFilter, filterSizes]);

    return (
        <div style={{ padding: '8px max(12px, 2vw)', width: '100%', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>

            <div style={{ textAlign: 'center', marginBottom: '8px', marginTop: '0px' }}>
                <h1 style={{ fontSize: '1.4rem', marginBottom: '0px' }}>Our Exclusive Collection</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Find the perfect matching set for your family</p>
            </div>

            {/* Filter Section */}
            {/* Filter Section */}
            <div
                style={{
                    maxWidth: '1000px',
                    margin: '8px auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    background: 'var(--bg-main)',
                    padding: '24px',
                    borderRadius: '24px',
                    border: '1px solid var(--border-subtle)',
                    width: '100%',
                    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.07)',
                    flexShrink: 0
                }}
            >
                {/* Search Bar inside Card */}
                <div style={{ position: 'relative', width: '100%' }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by fabric, color, or design name..."
                        style={{ paddingLeft: '44px', height: '42px', borderRadius: '10px', background: 'white', border: '1px solid var(--border-subtle)', fontSize: '0.9rem', width: '100%' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>


                <div className="filter-categories-grid">
                    {/* All / Combos */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <Users size={14} color="var(--primary)" />
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', height: '14px', lineHeight: '14px' }}>
                                COMBINATIONS
                            </label>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            <button
                                onClick={handleReset}
                                className={`btn ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ padding: '6px 14px', borderRadius: '40px', fontSize: '0.85rem', flexShrink: 0 }}
                            >
                                All Designs
                            </button>
                            {combos.map((combo) => (
                                <button
                                    key={combo.id}
                                    onClick={() => {
                                        setActiveFilter(combo.id);
                                        setFilterSizes(prev => ({
                                            ...prev,
                                            father: (combo.id.includes('F') && prev.father === 'N/A') ? 'XL' : prev.father,
                                            mother: (combo.id.includes('M') && prev.mother === 'N/A') ? 'L' : prev.mother,
                                            sons: (combo.id.includes('S') && prev.sons.every(s => s === 'N/A')) ? ['4-5'] : prev.sons,
                                            daughters: (combo.id.includes('D') && prev.daughters.every(d => d === 'N/A')) ? ['4-5'] : prev.daughters,
                                        }));
                                    }}
                                    className={`btn ${activeFilter === combo.id ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ padding: '6px 14px', borderRadius: '40px', fontSize: '0.85rem', flexShrink: 0 }}
                                >
                                    {combo.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Children Categories */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <Baby size={14} color="var(--primary)" />
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', height: '14px', lineHeight: '14px' }}>
                                CHILDREN
                            </label>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {childCategories.map((child) => (
                                <button
                                    key={child.id}
                                    onClick={() => {
                                        setActiveFilter(child.id);
                                        setFilterSizes(prev => ({
                                            ...prev,
                                            sons: (child.id !== 'girls' && prev.sons.every(s => s === 'N/A')) ? ['4-5'] : prev.sons,
                                            daughters: (child.id !== 'boys' && prev.daughters.every(d => d === 'N/A')) ? ['4-5'] : prev.daughters,
                                        }));
                                    }}
                                    className={`btn ${activeFilter === child.id ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ padding: '6px 14px', borderRadius: '40px', fontSize: '0.85rem', flexShrink: 0 }}
                                >
                                    {child.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '14px 18px', background: '#f8f9ff', borderRadius: '16px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={15} color="var(--primary)" />
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, height: '15px', lineHeight: '15px' }}>Filter by Exact Sizes</h4>
                    </div>

                    <div className="filter-sizes-grid">
                        {/* Men */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '66px' }}>
                            {(activeFilter === 'ALL' || activeFilter === 'F-S' || activeFilter === 'F-M' || activeFilter === 'F-M-S-D') ? (
                                <>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, height: '14px', lineHeight: '14px' }}>Father Size</label>
                                    <select
                                        className="input"
                                        style={{ padding: '8px 12px', fontSize: '0.9rem', width: '100%', borderRadius: '10px', background: 'white', height: '40px' }}
                                        value={filterSizes.father}
                                        onChange={(e) => setFilterSizes({ ...filterSizes, father: e.target.value })}
                                    >
                                        <option value="N/A">None (Skip)</option>
                                        {adultSizes.map(s => <option key={String(s)} value={String(s)}>{String(s)}</option>)}
                                    </select>
                                </>
                            ) : <div style={{ height: '60px' }} />}
                        </div>

                        {/* Women */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '66px' }}>
                            {(activeFilter === 'ALL' || activeFilter === 'M-D' || activeFilter === 'F-M' || activeFilter === 'F-M-S-D') ? (
                                <>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, height: '14px', lineHeight: '14px' }}>Mother Size</label>
                                    <select
                                        className="input"
                                        style={{ padding: '8px 12px', fontSize: '0.9rem', width: '100%', borderRadius: '10px', background: 'white', height: '40px' }}
                                        value={filterSizes.mother}
                                        onChange={(e) => setFilterSizes({ ...filterSizes, mother: e.target.value })}
                                    >
                                        <option value="N/A">None (Optional)</option>
                                        {adultSizes.map(s => <option key={String(s)} value={String(s)}>{String(s)}</option>)}
                                    </select>
                                </>
                            ) : <div style={{ height: '60px' }} />}
                        </div>

                        {/* Boys */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '66px' }}>
                            {(activeFilter === 'ALL' || activeFilter === 'boys' || activeFilter === 'unisex' || activeFilter === 'F-S' || activeFilter === 'F-M-S-D') ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '14px' }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Son Size</label>
                                        <button
                                            onClick={() => setFilterSizes({ ...filterSizes, sons: [...filterSizes.sons, 'N/A'] })}
                                            className="btn-add-member"
                                            style={{ margin: 0, padding: '0 4px', fontSize: '0.7rem' }}
                                        >+ Add</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {filterSizes.sons.map((size, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '4px' }}>
                                                <select
                                                    className="input"
                                                    style={{ padding: '8px 12px', fontSize: '0.9rem', width: '100%', borderRadius: '10px', background: 'white', height: '40px' }}
                                                    value={size}
                                                    onChange={(e) => {
                                                        const newSons = [...filterSizes.sons];
                                                        newSons[idx] = e.target.value;
                                                        setFilterSizes({ ...filterSizes, sons: newSons });
                                                    }}
                                                >
                                                    <option value="N/A">None</option>
                                                    {kidsSizes.map(s => <option key={String(s)} value={String(s)}>{String(s)}</option>)}
                                                </select>
                                                {filterSizes.sons.length > 1 && (
                                                    <button
                                                        onClick={() => setFilterSizes({ ...filterSizes, sons: filterSizes.sons.filter((_, i) => i !== idx) })}
                                                        style={{ color: 'var(--error, red)', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
                                                    >✕</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : <div style={{ height: '60px' }} />}
                        </div>

                        {/* Girls */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '66px' }}>
                            {(activeFilter === 'ALL' || activeFilter === 'girls' || activeFilter === 'unisex' || activeFilter === 'M-D' || activeFilter === 'F-M-S-D') ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '14px' }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Daughter Size</label>
                                        <button
                                            onClick={() => setFilterSizes({ ...filterSizes, daughters: [...filterSizes.daughters, 'N/A'] })}
                                            className="btn-add-member"
                                            style={{ margin: 0, padding: '0 4px', fontSize: '0.7rem' }}
                                        >+ Add</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {filterSizes.daughters.map((size, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '4px' }}>
                                                <select
                                                    className="input"
                                                    style={{ padding: '8px 12px', fontSize: '0.9rem', width: '100%', borderRadius: '10px', background: 'white', height: '40px' }}
                                                    value={size}
                                                    onChange={(e) => {
                                                        const newDaughters = [...filterSizes.daughters];
                                                        newDaughters[idx] = e.target.value;
                                                        setFilterSizes({ ...filterSizes, daughters: newDaughters });
                                                    }}
                                                >
                                                    <option value="N/A">None</option>
                                                    {kidsSizes.map(s => <option key={String(s)} value={String(s)}>{String(s)}</option>)}
                                                </select>
                                                {filterSizes.daughters.length > 1 && (
                                                    <button
                                                        onClick={() => setFilterSizes({ ...filterSizes, daughters: filterSizes.daughters.filter((_, i) => i !== idx) })}
                                                        style={{ color: 'var(--error, red)', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
                                                    >✕</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : <div style={{ height: '60px' }} />}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => { setShowResults(true); }}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', marginTop: '4px', fontSize: '1rem', fontWeight: 700 }}
                >
                    {(() => {
                        const noFatherSize = filterSizes.father === 'N/A';
                        const noMotherSize = filterSizes.mother === 'N/A';
                        const noSonSize = filterSizes.sons.every(s => s === 'N/A');
                        const noDaughterSize = filterSizes.daughters.every(d => d === 'N/A');
                        const noSizesSelected = noFatherSize && noMotherSize && noSonSize && noDaughterSize;

                        // 1. Initial/Zero state
                        if (activeFilter === 'ALL' && noSizesSelected) {
                            return "Select a Category or Size to Browse";
                        }

                        // 2. Specific Category Prompts (if no size selected)
                        if (activeFilter === 'boys' && noSonSize) return "Please Select a Son Size";
                        if (activeFilter === 'girls' && noDaughterSize) return "Please Select a Daughter Size";
                        if (activeFilter === 'unisex' && noSonSize && noDaughterSize) return "Please Select a Child Size";

                        // Combinations
                        if (activeFilter.includes('F') && noFatherSize) return "Please Select Father Size";
                        if (activeFilter.includes('M') && noMotherSize) return "Please Select Mother Size";
                        if (activeFilter.includes('S') && noSonSize) return "Please Select Son Size";
                        if (activeFilter.includes('D') && noDaughterSize) return "Please Select Daughter Size";

                        // 3. Availability Check
                        if (filteredDesigns.length === 0) {
                            return "Not Available - No Matching Outfits";
                        }

                        // 4. Browsing vs Matching
                        if (noSizesSelected) {
                            const categoryLabel = childCategories.find(c => c.id === activeFilter)?.label ||
                                combos.find(c => c.id === activeFilter)?.label ||
                                'Collection';
                            return `Browse All ${categoryLabel} (${filteredDesigns.length})`;
                        }

                        return `Find Matching Outfits (${filteredDesigns.length})`;
                    })()}
                </button>
            </div>

            {showResults && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 3000,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'max(16px, 2vw)',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: 'var(--bg-main)',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '1200px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-subtle)',
                        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Found {filteredDesigns.length} Designs</h3>
                            <button
                                onClick={() => setShowResults(false)}
                                className="btn btn-ghost"
                                style={{
                                    padding: '8px',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Close Results"
                            >
                                <X size={24} color="var(--primary)" />
                            </button>
                        </div>

                        <div style={{
                            overflowY: 'auto',
                            padding: '24px',
                            flexGrow: 1
                        }}>
                            {filteredDesigns.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5, border: '1px dashed var(--border-subtle)', borderRadius: '24px' }}>
                                    <Filter size={64} style={{ marginBottom: '24px', color: 'var(--primary)' }} />
                                    <h2>No matching designs</h2>
                                    <p>Try selecting another category.</p>
                                    <button
                                        onClick={handleReset}
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
                                                background: 'var(--bg-main)',
                                                border: selectedDesign?.id === design.id ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                                                borderRadius: '24px',
                                                transform: selectedDesign?.id === design.id ? 'translateY(-8px)' : 'none',
                                                position: 'relative',
                                                boxShadow: selectedDesign?.id === design.id ? 'var(--shadow-md)' : 'var(--shadow-sm)'
                                            }}
                                            onClick={() => {
                                                const config = {
                                                    father: (activeFilter === 'ALL' || activeFilter === 'F-S' || activeFilter === 'F-M' || activeFilter === 'F-M-S-D') ? filterSizes.father : 'N/A',
                                                    mother: (activeFilter === 'ALL' || activeFilter === 'M-D' || activeFilter === 'F-M' || activeFilter === 'F-M-S-D') ? filterSizes.mother : 'N/A',
                                                    sons: (activeFilter === 'ALL' || activeFilter === 'boys' || activeFilter === 'unisex' || activeFilter === 'F-S' || activeFilter === 'F-M-S-D') ? filterSizes.sons : [],
                                                    daughters: (activeFilter === 'ALL' || activeFilter === 'girls' || activeFilter === 'unisex' || activeFilter === 'M-D' || activeFilter === 'F-M-S-D') ? filterSizes.daughters : []
                                                };
                                                onSelect(design, activeFilter, config);
                                            }}
                                        >
                                            {selectedDesign?.id === design.id && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '16px',
                                                    right: '16px',
                                                    background: 'var(--primary)',
                                                    borderRadius: '50%',
                                                    padding: '6px',
                                                    zIndex: 20
                                                }}>
                                                    <CheckCircle size={18} color="white" />
                                                </div>
                                            )}

                                            <div className="mobile-full-bleed" style={{ position: 'relative', height: '320px', overflow: 'hidden' }}>
                                                <img
                                                    src={design.imageUrl}
                                                    alt={design.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                                    className="gallery-img"
                                                />
                                                {design.childType && design.childType !== 'none' && (
                                                    <div style={{
                                                        position: 'absolute', top: '16px', left: '16px',
                                                        background: 'var(--bg-main)', padding: '6px 14px',
                                                        borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800,
                                                        color: 'var(--text-main)', border: '1px solid var(--border-subtle)',
                                                        textTransform: 'uppercase', boxShadow: 'var(--shadow-sm)',
                                                        zIndex: 10
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
                                                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%)',
                                                    color: 'white'
                                                }}>
                                                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>{design.name}</h3>
                                                    <p style={{ margin: '6px 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', fontWeight: 500 }}>
                                                        {design.color} • {design.fabric}
                                                    </p>
                                                </div>
                                            </div>

                                            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Sparkles size={16} color="var(--primary)" />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                                        {design.label || 'PREMIUM DESIGN'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); downloadSingleImage(design.imageUrl, design.name); }}
                                                        className="btn btn-ghost"
                                                        style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}
                                                        title="Download Image"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const config = {
                                                                father: (activeFilter === 'ALL' || activeFilter === 'F-S' || activeFilter === 'F-M' || activeFilter === 'F-M-S-D') ? filterSizes.father : 'N/A',
                                                                mother: (activeFilter === 'ALL' || activeFilter === 'M-D' || activeFilter === 'F-M' || activeFilter === 'F-M-S-D') ? filterSizes.mother : 'N/A',
                                                                sons: (activeFilter === 'ALL' || activeFilter === 'boys' || activeFilter === 'unisex' || activeFilter === 'F-S' || activeFilter === 'F-M-S-D') ? filterSizes.sons : [],
                                                                daughters: (activeFilter === 'ALL' || activeFilter === 'girls' || activeFilter === 'unisex' || activeFilter === 'M-D' || activeFilter === 'F-M-S-D') ? filterSizes.daughters : []
                                                            };
                                                            onSelect(design, activeFilter, config);
                                                        }}
                                                        className={`btn ${selectedDesign?.id === design.id ? 'btn-primary' : 'btn-ghost'}`}
                                                        style={{
                                                            padding: '10px 20px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.85rem',
                                                            border: selectedDesign?.id === design.id ? 'none' : '1px solid var(--border-subtle)'
                                                        }}
                                                    >
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerGallery;
