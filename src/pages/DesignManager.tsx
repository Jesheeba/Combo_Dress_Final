import React, { useState, useEffect, useRef } from 'react';
import type { Design, AdultSizeStock, KidsSizeStock } from '../types';
import { Save, ArrowLeft, Sparkles, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { uploadImage } from '../data';

interface DesignManagerProps {
    editingDesign: Design | null;
    onSave: (design: Partial<Design>) => void;
    onCancel: () => void;
}

const emptyAdult = (): AdultSizeStock => ({ M: 0, L: 0, XL: 0, XXL: 0, '3XL': 0 });
const emptyKids = (): KidsSizeStock => ({
    '0-1': 0, '1-2': 0, '2-3': 0, '3-4': 0, '4-5': 0, '5-6': 0,
    '6-7': 0, '7-8': 0, '9-10': 0, '11-12': 0, '13-14': 0
});

const DesignManager: React.FC<DesignManagerProps> = ({ editingDesign, onSave, onCancel }) => {
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.imageUrl) {
            alert('Please upload an image first.');
            return;
        }
        onSave(formData);
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px 48px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {editingDesign ? 'Edit Design' : 'Add New Design'}
                    <Sparkles color="var(--primary)" />
                </h1>
                <button onClick={onCancel} className="btn btn-ghost">
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </button>
            </div>

            <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>
                    {/* Image Upload Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '100%',
                                height: '300px',
                                background: 'rgba(0,0,0,0.2)',
                                border: `2px dashed ${formData.imageUrl ? 'var(--primary)' : 'var(--glass-border)'}`,
                                borderRadius: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                position: 'relative',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isUploading ? (
                                <div style={{ textAlign: 'center' }}>
                                    <Loader2 className="spin" size={32} color="var(--primary)" />
                                    <p style={{ marginTop: '12px', fontSize: '0.8rem' }}>Uploading...</p>
                                </div>
                            ) : formData.imageUrl ? (
                                <>
                                    <img src={formData.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                                    <div style={{
                                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s'
                                    }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: 600 }}>
                                            <Upload size={20} />
                                            Change Image
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <ImageIcon size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <p style={{ fontWeight: 600 }}>Click to Upload Cloth Image</p>
                                    <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>PNG, JPG or JPEG</p>
                                </div>
                            )}
                            <input
                                type="file" ref={fileInputRef} hidden accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    {/* Form Details Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Design Name</label>
                                <input
                                    required className="input" placeholder="e.g. Traditional Motif Print"
                                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Color Theme</label>
                                    <input
                                        required className="input" placeholder="e.g. Royal Blue / Gold"
                                        value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fabric Type</label>
                                    <input
                                        required className="input" placeholder="e.g. Banarasi Silk"
                                        value={formData.fabric} onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Child Category</label>
                                <select
                                    className="input"
                                    value={formData.childType || 'none'}
                                    onChange={(e) => setFormData({ ...formData, childType: e.target.value as any })}
                                >
                                    <option value="none">Not Specified (Adult Only)</option>
                                    <option value="boys">Boys</option>
                                    <option value="girls">Girls</option>
                                    <option value="unisex">Unisex (Both)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Product Badge / Label</label>
                                <input
                                    className="input" placeholder="e.g. PREMIUM DESIGN, NEW ARRIVAL, TRENDING"
                                    value={formData.label || ''} onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Upload size={18} color="var(--primary)" />
                                Initial Registry Setup
                            </h3>
                            <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                <p style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--text-muted)' }}>
                                    New designs are added at <strong>zero stock</strong>.
                                </p>
                                <p style={{ fontSize: '0.85rem' }}>
                                    Once saved, use the <strong>Stock Ledger</strong> to enter your actual counts for each family size.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '32px' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '12px 64px', fontSize: '1.1rem' }} disabled={isUploading}>
                        <Save size={20} />
                        {editingDesign ? 'Sync Updates' : 'Launch Design'}
                    </button>
                </div>
            </form>
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default DesignManager;
