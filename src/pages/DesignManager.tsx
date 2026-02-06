import React, { useState, useEffect, useRef } from 'react';
import type { Design, AdultSizeStock, KidsSizeStock } from '../types';
import { Save, ArrowLeft, Sparkles, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { uploadImage } from '../data';
import { useLocation, useNavigate } from 'react-router-dom';

interface DesignManagerProps {
    onSave: (design: Partial<Design>) => Promise<void>;
    editingDesign?: Design | null;
    onCancel?: () => void;
}

const emptyAdult = (): AdultSizeStock => ({ M: 0, L: 0, XL: 0, XXL: 0, '3XL': 0 });
const emptyKids = (): KidsSizeStock => ({
    '0-1': 0, '1-2': 0, '2-3': 0, '3-4': 0, '4-5': 0, '5-6': 0,
    '6-7': 0, '7-8': 0, '9-10': 0, '11-12': 0, '13-14': 0
});

const DesignManager: React.FC<DesignManagerProps> = ({ onSave, editingDesign: propsEditingDesign, onCancel }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Use prop if provided, otherwise check location state (from StaffDashboard Edit button)
    const editingDesign = propsEditingDesign || location.state?.design as Design | null;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState<Partial<Design>>({
        name: '',
        color: '',
        fabric: '',
        imageUrl: '',
        inventory: {
            men: emptyAdult(),
            women: emptyAdult(),
            boys: emptyKids(),
            girls: emptyKids()
        },
        label: 'PREMIUM DESIGN'
    });

    useEffect(() => {
        if (editingDesign) {
            setFormData(editingDesign);
        }
    }, [editingDesign]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadImage(file);
            setFormData(prev => ({ ...prev, imageUrl: url }));
        } catch (error) {
            alert('Failed to upload image. Please check your storage configuration.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.imageUrl) {
            alert('Please upload an image first.');
            return;
        }
        await onSave(formData);
        if (onCancel) onCancel();
        else navigate('/staffview');
    };

    const handleBack = () => {
        if (onCancel) onCancel();
        else navigate('/staffview');
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 max(16px, 2vw) 48px max(16px, 2vw)', width: '100%', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', borderBottom: '1px solid var(--border-subtle)', marginBottom: '40px' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.8rem', margin: 0 }}>
                    {editingDesign ? 'Edit Design' : 'New Entry'}
                    <Sparkles color="var(--accent)" />
                </h1>
                <button onClick={handleBack} className="btn btn-ghost" style={{ paddingRight: 0 }}>
                    <ArrowLeft size={18} />
                    Dashboard
                </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '64px' }}>
                {/* Image Section */}
                <div>
                    <label style={{ display: 'block', marginBottom: '16px', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>1. Visuals</label>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: '100%',
                            aspectRatio: '1/1',
                            background: 'var(--bg-secondary)',
                            border: `2px dashed ${formData.imageUrl ? 'transparent' : 'var(--border-subtle)'}`,
                            borderRadius: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: formData.imageUrl ? 'var(--shadow-md)' : 'none'
                        }}
                    >
                        {isUploading ? (
                            <div style={{ textAlign: 'center' }}>
                                <Loader2 className="spin" size={32} color="var(--accent)" />
                                <p style={{ marginTop: '12px', fontSize: '0.8rem' }}>Uploading cloth...</p>
                            </div>
                        ) : formData.imageUrl ? (
                            <>
                                <img src={formData.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                                <div style={{
                                    position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s',
                                    backdropFilter: 'blur(4px)'
                                }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                                    <div className="btn btn-secondary" style={{ borderRadius: '50px', boxShadow: 'var(--shadow-md)' }}>
                                        <Upload size={18} />
                                        Replace Image
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                                <ImageIcon size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                                <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>Upload Design Image</p>
                                <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>High resolution cloth photography preferred.</p>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                    </div>
                </div>

                {/* Details Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>2. Details</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label className="label">Product Name</label>
                            <input required className="input" placeholder="e.g. Royal Heritage Print" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label className="label">Color Theme</label>
                                <input required className="input" placeholder="e.g. Navy Blue" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Fabric</label>
                                <input required className="input" placeholder="e.g. Crepe Silk" value={formData.fabric} onChange={(e) => setFormData({ ...formData, fabric: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="label">Category</label>
                            <select className="input" value={formData.childType || 'none'} onChange={(e) => setFormData({ ...formData, childType: e.target.value as any })}>
                                <option value="none">Adult Collection</option>
                                <option value="boys">Boys</option>
                                <option value="girls">Girls</option>
                                <option value="unisex">Unisex Kids</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Marketing Label</label>
                            <input className="input" placeholder="e.g. LIMITED EDITION" value={formData.label || ''} onChange={(e) => setFormData({ ...formData, label: e.target.value })} />
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', background: 'var(--bg-secondary)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-subtle)' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Registry Note</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            New designs are registered with zero inventory. You can manage stock levels in the Dashboard Ledger after saving.
                        </p>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ height: '56px', fontSize: '1.1rem' }} disabled={isUploading}>
                        <Save size={20} />
                        {editingDesign ? 'Update Collection' : 'Register Collection'}
                    </button>
                </div>
            </form>
            <style>{`
                .label { display: block; margin-bottom: 8px; font-size: 0.8rem; font-weight: 700; color: var(--text-main); }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default DesignManager;
