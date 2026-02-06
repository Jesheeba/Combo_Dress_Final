import React, { useState } from 'react';
import type { Design, ComboType } from '../types';
import { ShoppingCart, ArrowLeft, Check, Users } from 'lucide-react';

interface FamilyPreviewProps {
    design: Design | null;
    onPlaceOrder: (designId: string, comboType: ComboType, sizes: Record<string, string>) => Promise<void>;
    onBack: () => void;
}

const FamilyPreview: React.FC<FamilyPreviewProps> = ({ design, onPlaceOrder, onBack }) => {
    const [selectedCombo, setSelectedCombo] = useState<ComboType>('F-M-S-D');
    const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({
        Father: 'L',
        Mother: 'M',
        Son: '4-5',
        Daughter: '4-5'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!design) return null;

    const combos: { id: ComboType; label: string; members: string[] }[] = [
        { id: 'F-M-S-D', label: 'Complete Family Set', members: ['Father', 'Mother', 'Son', 'Daughter'] },
        { id: 'F-S', label: 'Father & Son', members: ['Father', 'Son'] },
        { id: 'M-D', label: 'Mother & Daughter', members: ['Mother', 'Daughter'] },
        { id: 'F-M', label: 'Couple Set (M/F)', members: ['Father', 'Mother'] },
    ];

    const currentCombo = combos.find(c => c.id === selectedCombo) || combos[0];

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onPlaceOrder(design.id, selectedCombo, selectedSizes);
            alert('Order placed successfully!');
            onBack();
        } catch (error) {
            alert('Failed to place order.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px max(16px, 2vw)' }}>
            <button onClick={onBack} className="btn btn-ghost" style={{ marginBottom: '24px', gap: '8px' }}>
                <ArrowLeft size={18} />
                Back to Gallery
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '48px' }}>
                {/* Visual Section */}
                <div>
                    <div style={{
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-md)',
                        position: 'relative',
                        aspectRatio: '4/5',
                        background: 'var(--bg-secondary)'
                    }}>
                        <img src={design.imageUrl} alt={design.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '32px',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            color: 'white'
                        }}>
                            <h1 style={{ margin: 0, fontSize: '2rem' }}>{design.name}</h1>
                            <p style={{ margin: '8px 0 0 0', opacity: 0.8 }}>{design.color} • {design.fabric}</p>
                        </div>
                    </div>
                </div>

                {/* Selection Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <section>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Users size={20} />
                            1. Select Combination
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {combos.map(combo => (
                                <button
                                    key={combo.id}
                                    onClick={() => setSelectedCombo(combo.id)}
                                    className={`btn ${selectedCombo === combo.id ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ padding: '16px', borderRadius: '16px', justifyContent: 'flex-start', textAlign: 'left', minHeight: '80px' }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{combo.label}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>{combo.members.join(', ')}</div>
                                    </div>
                                    {selectedCombo === combo.id && <Check size={18} style={{ marginLeft: 'auto' }} />}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>2. Specify Sizes</h3>
                        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {currentCombo.members.map(member => (
                                <div key={member} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600 }}>{member} Size</span>
                                    <select
                                        className="input"
                                        style={{ width: '120px', padding: '8px' }}
                                        value={selectedSizes[member]}
                                        onChange={(e) => setSelectedSizes({ ...selectedSizes, [member]: e.target.value })}
                                    >
                                        {(member === 'Father' || member === 'Mother') ? (
                                            ['M', 'L', 'XL', 'XXL', '3XL'].map(s => <option key={s} value={s}>{s}</option>)
                                        ) : (
                                            ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '9-10', '11-12', '13-14'].map(s => <option key={s} value={s}>{s}</option>)
                                        )}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </section>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn btn-primary"
                        style={{ height: '64px', fontSize: '1.2rem', borderRadius: '16px', marginTop: 'auto' }}
                    >
                        {isSubmitting ? 'Processing...' : (
                            <>
                                <ShoppingCart size={22} />
                                Place Family Order
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FamilyPreview;
