'use client';

import { useState } from 'react';

interface ParticipantData {
    nom: string;
    prenom: string;
    commune: string;
    email: string;
    telephone: string;
}

interface ParticipantFormProps {
    onSubmit: (data: ParticipantData) => void;
    disabled?: boolean;
}

export default function ParticipantForm({ onSubmit, disabled = false }: ParticipantFormProps) {
    const [formData, setFormData] = useState<ParticipantData>({
        nom: '',
        prenom: '',
        commune: '',
        email: '',
        telephone: ''
    });

    const [consent, setConsent] = useState(false);
    const [errors, setErrors] = useState<Partial<ParticipantData>>({});

    const validateForm = () => {
        const newErrors: Partial<ParticipantData> = {};

        if (!formData.nom.trim()) newErrors.nom = 'Nom requis';
        if (!formData.prenom.trim()) newErrors.prenom = 'Prénom requis';
        if (!formData.commune.trim()) newErrors.commune = 'Commune requise';

        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'Email requis';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Email invalide';
        }

        // Validation téléphone (format français flexible)
        const phoneRegex = /^(?:(?:\+33|0)[1-9](?:[0-9]{8}))$/;
        if (!formData.telephone.trim()) {
            newErrors.telephone = 'Téléphone requis';
        } else if (!phoneRegex.test(formData.telephone.replace(/[\s.-]/g, ''))) {
            newErrors.telephone = 'Numéro invalide (format: 06 12 34 56 78)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!consent) {
            alert('Vous devez accepter les conditions de collecte des données');
            return;
        }

        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const handleInputChange = (field: keyof ParticipantData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Effacer l'erreur du champ quand l'utilisateur tape
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom *
                    </label>
                    <input
                        type="text"
                        id="prenom"
                        value={formData.prenom}
                        onChange={(e) => handleInputChange('prenom', e.target.value)}
                        disabled={disabled}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.prenom ? 'border-red-500' : 'border-gray-300'
                            } ${disabled ? 'bg-gray-100' : ''}`}
                        placeholder="Votre prénom"
                    />
                    {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
                </div>

                <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                        Nom *
                    </label>
                    <input
                        type="text"
                        id="nom"
                        value={formData.nom}
                        onChange={(e) => handleInputChange('nom', e.target.value)}
                        disabled={disabled}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nom ? 'border-red-500' : 'border-gray-300'
                            } ${disabled ? 'bg-gray-100' : ''}`}
                        placeholder="Votre nom"
                    />
                    {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
                </div>
            </div>

            <div>
                <label htmlFor="commune" className="block text-sm font-medium text-gray-700 mb-1">
                    Commune *
                </label>
                <input
                    type="text"
                    id="commune"
                    value={formData.commune}
                    onChange={(e) => handleInputChange('commune', e.target.value)}
                    disabled={disabled}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.commune ? 'border-red-500' : 'border-gray-300'
                        } ${disabled ? 'bg-gray-100' : ''}`}
                    placeholder="Votre commune de résidence"
                />
                {errors.commune && <p className="text-red-500 text-xs mt-1">{errors.commune}</p>}
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                </label>
                <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={disabled}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                        } ${disabled ? 'bg-gray-100' : ''}`}
                    placeholder="votre@email.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                </label>
                <input
                    type="tel"
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => handleInputChange('telephone', e.target.value)}
                    disabled={disabled}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.telephone ? 'border-red-500' : 'border-gray-300'
                        } ${disabled ? 'bg-gray-100' : ''}`}
                    placeholder="06 12 34 56 78"
                />
                {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <input
                        type="checkbox"
                        id="consent"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        disabled={disabled}
                        className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="consent" className="text-sm text-gray-700">
                        <strong>Consentement RGPD :</strong> J&apos;accepte que mes données personnelles et mon enregistrement audio soient collectés et traités par les Victoires Populaires dans le cadre de cette campagne d&apos;écoute citoyenne. Ces données seront conservées 2 ans maximum et peuvent être supprimées sur demande.
                    </label>
                </div>
            </div>

            <button
                type="submit"
                disabled={disabled || !consent}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${disabled || !consent
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
            >
                {disabled ? 'Traitement en cours...' : 'Valider et continuer'}
            </button>
        </form>
    );
}
