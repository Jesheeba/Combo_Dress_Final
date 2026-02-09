import React, { useState } from 'react';
import type { Design, ComboType } from '../types';
import { ShoppingCart, ArrowLeft, Check } from 'lucide-react';

interface FamilyPreviewProps {
    design: Design | null;
    category?: string;
    initialConfig?: {
        father: string;
        mother: string;
        sons: string[];
        daughters: string[];
    };
    onPlaceOrder: (designId: string, comboType: ComboType, sizes: Record<string, string>, customerDetails: { name: string; email: string; phone: string; address: string; countryCode: string }) => Promise<void>;
    onBack: () => void;
}

const FamilyPreview: React.FC<FamilyPreviewProps> = ({ design, category = 'ALL', initialConfig, onPlaceOrder, onBack }) => {

    // Helper to determine if a member should be shown based on category and design availability
    const shouldShowMember = (member: 'men' | 'women' | 'boys' | 'girls') => {
        if (!design) return false;

        // Check if design actually has stock for this category
        const inventory = design.inventory[member];
        const hasStock = Object.values(inventory).some(s => Number(s) > 0);
        if (!hasStock) return false;

        let effectiveCategory = category;



        if (effectiveCategory === 'ALL') return true;

        // Exact category matches
        if (effectiveCategory === 'boys') return member === 'boys';
        if (effectiveCategory === 'girls') return member === 'girls';
        if (effectiveCategory === 'unisex') return member === 'boys' || member === 'girls';

        // Combo matches
        if (effectiveCategory === 'F-M-S-D') return true;
        if (effectiveCategory === 'F-S') return member === 'men' || member === 'boys';
        if (effectiveCategory === 'M-D') return member === 'women' || member === 'girls';
        if (effectiveCategory === 'F-M') return member === 'men' || member === 'women';

        return false;
    };

    // State for multiple members, initialized from config if available AND visible
    const [sons, setSons] = useState<{ id: number; size: string }[]>(() => {
        const canShow = shouldShowMember('boys');
        if (!canShow) return [{ id: 1, size: 'N/A' }];

        return initialConfig?.sons.length
            ? initialConfig.sons.map((s, i) => ({ id: Date.now() + i, size: s }))
            : [{ id: 1, size: 'N/A' }];
    });

    const [daughters, setDaughters] = useState<{ id: number; size: string }[]>(() => {
        const canShow = shouldShowMember('girls');
        if (!canShow) return [{ id: 1, size: 'N/A' }];

        return initialConfig?.daughters.length
            ? initialConfig.daughters.map((d, i) => ({ id: Date.now() + i + 100, size: d }))
            : [{ id: 1, size: 'N/A' }];
    });

    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        email: '',
        phone: '',
        countryCode: '+91',
        address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showOrderForm, setShowOrderForm] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [showValidationError, setShowValidationError] = useState(false);

    if (!design) return null;

    // Correctly initialize sizes based on visibility
    const [fatherSize, setFatherSize] = useState<string>(
        shouldShowMember('men') ? (initialConfig?.father || 'N/A') : 'N/A'
    );
    const [motherSize, setMotherSize] = useState<string>(
        shouldShowMember('women') ? (initialConfig?.mother || 'N/A') : 'N/A'
    );

    const addSon = () => setSons([...sons, { id: Date.now(), size: 'N/A' }]);
    const removeSon = (id: number) => setSons(sons.filter(s => s.id !== id));
    const updateSonSize = (id: number, size: string) => {
        setSons(sons.map(s => s.id === id ? { ...s, size } : s));
    };

    const addDaughter = () => setDaughters([...daughters, { id: Date.now(), size: 'N/A' }]);
    const removeDaughter = (id: number) => setDaughters(daughters.filter(d => d.id !== id));
    const updateDaughterSize = (id: number, size: string) => {
        setDaughters(daughters.map(d => d.id === id ? { ...d, size } : d));
    };

    const validateSelection = () => {
        const hasFather = fatherSize !== 'N/A';
        const hasMother = motherSize !== 'N/A';
        const hasSons = sons.some(s => s.size !== 'N/A');
        const hasDaughters = daughters.some(d => d.size !== 'N/A');
        return hasFather || hasMother || hasSons || hasDaughters;
    };

    const handleSubmit = async () => {
        if (!validateSelection()) {
            setShowValidationError(true);
            return;
        }

        if (!customerDetails.name || !customerDetails.phone || !customerDetails.address) {
            setShowErrors(true);
            return;
        }

        setIsSubmitting(true);
        try {
            // Determine a combo label or use 'Custom'
            let comboType: ComboType = 'Custom';

            const activeSons = sons.filter(s => s.size !== 'N/A' && shouldShowMember('boys'));
            const activeDaughters = daughters.filter(d => d.size !== 'N/A' && shouldShowMember('girls'));
            const hasF = fatherSize !== 'N/A' && shouldShowMember('men');
            const hasM = motherSize !== 'N/A' && shouldShowMember('women');
            const hasS = activeSons.length > 0;
            const hasD = activeDaughters.length > 0;

            if (hasF && hasM && hasS && hasD) comboType = 'F-M-S-D';
            else if (hasF && hasS && !hasM && !hasD) comboType = 'F-S';
            else if (hasM && hasD && !hasF && !hasS) comboType = 'M-D';
            else if (hasF && hasM && !hasS && !hasD) comboType = 'F-M';

            // Flatten sizes for submission
            const submissionSizes: Record<string, string> = {};
            if (hasF) submissionSizes['Father'] = fatherSize;
            if (hasM) submissionSizes['Mother'] = motherSize;

            activeSons.forEach((s, idx) => {
                const label = activeSons.length === 1 ? 'Son' : `Son ${idx + 1}`;
                submissionSizes[label] = s.size;
            });

            activeDaughters.forEach((d, idx) => {
                const label = activeDaughters.length === 1 ? 'Daughter' : `Daughter ${idx + 1}`;
                submissionSizes[label] = d.size;
            });

            await onPlaceOrder(design.id, comboType, submissionSizes, customerDetails);
            setOrderSuccess(true);
        } catch (error) {
            alert('Failed to place order.');
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowOrderForm(false);
        setOrderSuccess(false);
        setShowErrors(false);
        setCustomerDetails({ name: '', email: '', phone: '', countryCode: '+91', address: '' });
        setIsSubmitting(false);
        // Reset sizes
        setFatherSize('N/A');
        setMotherSize('N/A');
        setSons([{ id: 1, size: 'N/A' }]);
        setDaughters([{ id: 1, size: 'N/A' }]);

        if (orderSuccess) {
            onBack();
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px max(16px, 2vw)' }}>
            <button onClick={onBack} className="btn btn-ghost" style={{ marginBottom: '24px', gap: '8px' }}>
                <ArrowLeft size={18} />
                Back to Gallery
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '32px' }}>

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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <section>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Select Sizes</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
                            Choose sizes for the family members you want to order for.
                        </p>

                        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Check availability and render selectors */}
                            {shouldShowMember('men') && Object.values(design.inventory.men).some(s => s > 0) && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600 }}>Father Size</span>
                                    <select
                                        className="input"
                                        style={{ width: '120px', padding: '8px' }}
                                        value={fatherSize}
                                        onChange={(e) => setFatherSize(e.target.value)}
                                    >
                                        <option value="N/A">None</option>
                                        {['M', 'L', 'XL', 'XXL', '3XL'].map(s => {
                                            const stock = design.inventory.men[s as keyof typeof design.inventory.men];
                                            const isAvailable = stock > 0;
                                            return (
                                                <option
                                                    key={s}
                                                    value={s}
                                                    disabled={!isAvailable}
                                                    style={!isAvailable ? { color: '#bbb' } : {}}
                                                >
                                                    {s}{!isAvailable ? ' ✕' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            )}

                            {shouldShowMember('women') && Object.values(design.inventory.women).some(s => s > 0) && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600 }}>Mother Size</span>
                                    <select
                                        className="input"
                                        style={{ width: '120px', padding: '8px' }}
                                        value={motherSize}
                                        onChange={(e) => setMotherSize(e.target.value)}
                                    >
                                        <option value="N/A">None</option>
                                        {['M', 'L', 'XL', 'XXL', '3XL'].map(s => {
                                            const stock = design.inventory.women[s as keyof typeof design.inventory.women];
                                            const isAvailable = stock > 0;
                                            return (
                                                <option
                                                    key={s}
                                                    value={s}
                                                    disabled={!isAvailable}
                                                    style={!isAvailable ? { color: '#bbb' } : {}}
                                                >
                                                    {s}{!isAvailable ? ' ✕' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            )}

                            {shouldShowMember('boys') && Object.values(design.inventory.boys).some(s => s > 0) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {sons.map((son, idx) => (
                                        <div key={son.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 600 }}>Son {sons.length > 1 ? idx + 1 : ''} Size</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <select
                                                    className="input"
                                                    style={{ width: '120px', padding: '8px' }}
                                                    value={son.size}
                                                    onChange={(e) => updateSonSize(son.id, e.target.value)}
                                                >
                                                    <option value="N/A">None</option>
                                                    {['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '9-10', '11-12', '13-14'].map(s => {
                                                        const stock = design.inventory.boys[s as keyof typeof design.inventory.boys];
                                                        const isAvailable = stock > 0;
                                                        return (
                                                            <option
                                                                key={s}
                                                                value={s}
                                                                disabled={!isAvailable}
                                                                style={!isAvailable ? { color: '#bbb' } : {}}
                                                            >
                                                                {s}{!isAvailable ? ' ✕' : ''}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                {sons.length > 1 && (
                                                    <button onClick={() => removeSon(son.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>✕</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addSon}
                                        className="btn-add-member"
                                        style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                                    >
                                        + Add another Son
                                    </button>
                                </div>
                            )}

                            {shouldShowMember('girls') && Object.values(design.inventory.girls).some(s => s > 0) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {daughters.map((daughter, idx) => (
                                        <div key={daughter.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 600 }}>Daughter {daughters.length > 1 ? idx + 1 : ''} Size</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <select
                                                    className="input"
                                                    style={{ width: '120px', padding: '8px' }}
                                                    value={daughter.size}
                                                    onChange={(e) => updateDaughterSize(daughter.id, e.target.value)}
                                                >
                                                    <option value="N/A">None</option>
                                                    {['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '9-10', '11-12', '13-14'].map(s => {
                                                        const stock = design.inventory.girls[s as keyof typeof design.inventory.girls];
                                                        const isAvailable = stock > 0;
                                                        return (
                                                            <option
                                                                key={s}
                                                                value={s}
                                                                disabled={!isAvailable}
                                                                style={!isAvailable ? { color: '#bbb' } : {}}
                                                            >
                                                                {s}{!isAvailable ? ' ✕' : ''}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                {daughters.length > 1 && (
                                                    <button onClick={() => removeDaughter(daughter.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>✕</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addDaughter}
                                        className="btn-add-member"
                                        style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                                    >
                                        + Add another Daughter
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    <button
                        onClick={() => {
                            if (!validateSelection()) {
                                setShowValidationError(true);
                                return;
                            }
                            setShowOrderForm(true);
                        }}
                        className="btn btn-primary"
                        style={{ height: '64px', fontSize: '1.2rem', borderRadius: '16px' }}
                    >
                        <ShoppingCart size={22} />
                        Proceed to Checkout
                    </button>
                </div>
            </div>

            {/* Order Form Modal */}
            {showOrderForm && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2000,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'max(16px, 2vw)',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div
                        style={{
                            background: 'var(--bg-main)',
                            borderRadius: '24px',
                            width: '100%',
                            maxWidth: '500px',
                            boxShadow: 'var(--shadow-xl)',
                            border: '1px solid var(--border-subtle)',
                            padding: '24px',
                            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                    >
                        {orderSuccess ? (
                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                <div style={{
                                    width: '80px', height: '80px', background: '#d1fae5', borderRadius: '50%', color: '#059669',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto'
                                }}>
                                    <Check size={48} strokeWidth={3} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#059669' }}>Order Placed!</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                                    Thank you, {customerDetails.name}.<br />
                                    We have received your order request.
                                </p>
                                <button
                                    onClick={handleCloseModal}
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '14px', borderRadius: '16px', fontSize: '1.1rem' }}
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', marginTop: 0 }}>Shipping Details</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Name <span style={{ color: 'red' }}>*</span></label>
                                        <input
                                            type="text"
                                            className={`input ${showErrors && !customerDetails.name ? 'input-error' : ''}`}
                                            placeholder="Enter your full name"
                                            value={customerDetails.name}
                                            onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                                            style={{ width: '100%', padding: '12px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Email <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(Optional)</span></label>
                                        <input
                                            type="email"
                                            className="input"
                                            placeholder="Enter your email"
                                            value={customerDetails.email}
                                            onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                                            style={{ width: '100%', padding: '12px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Phone Number <span style={{ color: 'red' }}>*</span></label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <select
                                                className="input"
                                                value={customerDetails.countryCode}
                                                onChange={(e) => setCustomerDetails({ ...customerDetails, countryCode: e.target.value })}
                                                style={{ width: '100px', padding: '12px' }}
                                            >
                                                <option value="+91">+91 (IN)</option>
                                                <option value="+1">+1 (US)</option>
                                                <option value="+44">+44 (UK)</option>
                                                <option value="+971">+971 (UAE)</option>
                                                <option value="+61">+61 (AU)</option>
                                            </select>
                                            <input
                                                type="tel"
                                                className={`input ${showErrors && !customerDetails.phone ? 'input-error' : ''}`}
                                                placeholder="Phone number"
                                                value={customerDetails.phone}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (/^\d*$/.test(val) && val.length <= 10) {
                                                        setCustomerDetails({ ...customerDetails, phone: val });
                                                    }
                                                }}
                                                style={{ flexGrow: 1, padding: '12px' }}
                                                maxLength={10}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Address <span style={{ color: 'red' }}>*</span></label>
                                        <textarea
                                            className={`input ${showErrors && !customerDetails.address ? 'input-error' : ''}`}
                                            placeholder="Enter your delivery address"
                                            value={customerDetails.address}
                                            onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                                            style={{ width: '100%', padding: '12px', minHeight: '80px' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={handleCloseModal}
                                        className="btn btn-ghost"
                                        style={{ flexGrow: 1, padding: '12px', borderRadius: '12px' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="btn btn-primary"
                                        style={{ flexGrow: 2, padding: '12px', borderRadius: '12px', fontWeight: 600 }}
                                    >
                                        {isSubmitting ? 'Processing...' : 'Confirm Order'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {/* Validation Error Modal */}
            {showValidationError && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 3000,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: 'var(--bg-main)',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '400px',
                        padding: '32px',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-subtle)',
                        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{
                            width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', color: '#ef4444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto'
                        }}>
                            <ShoppingCart size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--text-main)' }}>No Sizes Selected</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
                            Please select at least one size for your family members before proceeding to checkout.
                        </p>
                        <button
                            onClick={() => setShowValidationError(false)}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '14px', borderRadius: '16px', fontSize: '1.1rem' }}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyPreview;
