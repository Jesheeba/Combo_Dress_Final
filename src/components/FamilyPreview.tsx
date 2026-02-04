import React, { useState } from 'react';
import type { Design, ComboType, AdultSizeStock, KidsSizeStock } from '../types';
import { Users, User, Smile, Baby, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

interface FamilyPreviewProps {
    design: Design | null;
    onPlaceOrder: (designId: string, comboType: ComboType, selectedSizes: Record<string, string>) => Promise<void>;
    onBack: () => void;
}

const FamilyPreview: React.FC<FamilyPreviewProps> = ({ design, onPlaceOrder, onBack }) => {
    const [selectedCombo, setSelectedCombo] = useState<ComboType>('F-M-S-D');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({
        'Father': 'L',
        'Mother': 'M',
        'Son': '4-5',
        'Daughter': '4-5'
    });

    if (orderSuccess) {
        return (
            <div style={{ textAlign: 'center', padding: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                <CheckCircle size={80} color="var(--success)" />
                <h2 style={{ margin: 0 }}>Order Placed Successfully!</h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>Your request has been sent to our staff. Once accepted, your set will be prepared for manufacture.</p>
                <button
                    onClick={() => setOrderSuccess(false)}
                    className="btn btn-primary"
                >
                    Place Another Order
                </button>
            </div>
        );
    }

    if (!design) {
        return (
            <div style={{ textAlign: 'center', padding: '100px', opacity: 0.5 }}>
                <Users size={64} style={{ marginBottom: '24px' }} />
                <h2>Select a design from the gallery first</h2>
            </div>
        );
    }

    const comboMembers = {
        'F-M-S-D': ['Father', 'Mother', 'Son', 'Daughter'],
        'F-S': ['Father', 'Son'],
        'M-D': ['Mother', 'Daughter'],
        'F-M': ['Father', 'Mother'],
    };

    const adultSizes: (keyof AdultSizeStock)[] = ['M', 'L', 'XL', 'XXL', '3XL'];
    const kidsSizes: (keyof KidsSizeStock)[] = ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '9-10', '11-12', '13-14'];

    const getMemberIcon = (member: string) => {
        switch (member) {
            case 'Father': return <User size={48} />;
            case 'Mother': return <Smile size={48} />;
            case 'Son': return <Baby size={40} />;
            case 'Daughter': return <Baby size={40} />;
            default: return <User size={48} />;
        }
    };

    const checkStock = (member: string, size: string) => {
        const category = member === 'Father' ? 'men' :
            member === 'Mother' ? 'women' :
                member === 'Son' ? 'boys' : 'girls';
        const stock = (design.inventory[category] as any)[size] || 0;
        return stock > 0;
    };

    const handleSizeChange = (member: string, size: string) => {
        setSelectedSizes(prev => ({ ...prev, [member]: size }));
    };

    const isAllInStock = comboMembers[selectedCombo].every(m => checkStock(m, selectedSizes[m]));

    return (
        <div style={{ padding: '0 max(16px, 2vw) 48px max(16px, 2vw)', maxWidth: '1200px', margin: '0 auto', width: '100%', overflowX: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
                <button onClick={onBack} className="btn btn-ghost" style={{ gap: '8px' }}>
                    <ArrowLeft size={18} />
                    Back to Gallery
                </button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ marginBottom: '8px' }}>Personalized Family Preview</h1>
                <p style={{ color: 'var(--text-muted)' }}>Matching Set: <strong>{design.name}</strong> • {design.fabric}</p>
            </div>

            <div className="glass-card" style={{ padding: 'max(16px, 4vw)', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Combo Selector */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    {(['F-M-S-D', 'F-S', 'M-D', 'F-M'] as ComboType[]).map(combo => (
                        <button
                            key={combo}
                            onClick={() => setSelectedCombo(combo)}
                            className={`btn ${selectedCombo === combo ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ padding: '12px 24px', borderRadius: '50px' }}
                        >
                            {combo}
                        </button>
                    ))}
                </div>

                {/* Preview Grid with horizontal scroll on mobile */}
                <div
                    className="snap-scroll-container"
                    style={{
                        display: 'flex',
                        gap: '24px',
                        overflowX: 'auto',
                        padding: 'max(20px, 4vw)',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '24px',
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none'
                    }}
                >
                    {comboMembers[selectedCombo].map((member) => {
                        const isInStock = checkStock(member, selectedSizes[member]);
                        const isKid = member === 'Son' || member === 'Daughter';
                        const sizes = isKid ? kidsSizes : adultSizes;

                        return (
                            <div
                                key={member}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '20px',
                                    minWidth: '200px',
                                    scrollSnapAlign: 'center',
                                    flexShrink: 0
                                }}
                            >
                                <div style={{
                                    width: isKid ? '120px' : '160px',
                                    height: isKid ? '180px' : '260px',
                                    background: 'var(--glass)',
                                    border: `2px solid ${isInStock ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                    borderRadius: '30px 30px 10px 10px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundImage: `url(${design.imageUrl})`,
                                        backgroundSize: 'cover',
                                        opacity: 0.8,
                                        mixBlendMode: 'multiply'
                                    }} />

                                    <div style={{ zIndex: 2, color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                                        {getMemberIcon(member)}
                                    </div>

                                    {!isInStock && (
                                        <div style={{
                                            position: 'absolute',
                                            background: 'rgba(239, 68, 68, 0.9)',
                                            color: 'white',
                                            padding: '4px 8px',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            bottom: '20px',
                                            borderRadius: '4px'
                                        }}>
                                            OUT OF STOCK
                                        </div>
                                    )}
                                </div>

                                <div style={{ textAlign: 'center', width: '100%' }}>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>{member}</div>

                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                        Select {isKid ? 'Age' : 'Size'}
                                    </label>

                                    <select
                                        className="input"
                                        style={{ padding: '8px', fontSize: '0.85rem', textAlignLast: 'center' }}
                                        value={selectedSizes[member]}
                                        onChange={(e) => handleSizeChange(member, e.target.value)}
                                    >
                                        {sizes.map(s => (
                                            <option key={s} value={s}>{s} {isKid ? 'Years' : ''}</option>
                                        ))}
                                    </select>

                                    <div style={{
                                        marginTop: '10px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: isInStock ? 'var(--success)' : 'var(--danger)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px'
                                    }}>
                                        {isInStock ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                        {isInStock ? 'Size Available' : 'Sold Out'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Final Status (Sticky on mobile) */}
                <div style={{
                    textAlign: 'center',
                    padding: '24px',
                    borderRadius: '16px',
                    background: isAllInStock ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${isAllInStock ? 'var(--success)' : 'var(--danger)'}`,
                    position: 'sticky',
                    bottom: 'calc(80px + var(--safe-bottom))',
                    backgroundColor: isAllInStock ? 'rgba(15, 23, 42, 0.95)' : 'rgba(239, 68, 68, 0.95)',
                    backdropFilter: 'blur(20px)',
                    zIndex: 100,
                    margin: '0 -16px'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', color: isAllInStock ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        {isAllInStock ? <CheckCircle size={24} /> : <XCircle size={24} />}
                        {isAllInStock ? 'Set Available!' : 'Sizes Out of Stock'}
                    </h2>

                    {isAllInStock && (
                        <button
                            disabled={isSubmitting}
                            onClick={async () => {
                                setIsSubmitting(true);
                                await onPlaceOrder(design.id, selectedCombo, selectedSizes);
                                setIsSubmitting(false);
                                setOrderSuccess(true);
                            }}
                            className="btn btn-primary"
                            style={{ marginTop: '16px', width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '12px' }}
                        >
                            {isSubmitting ? 'Processing...' : 'Place Family Order'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FamilyPreview;
