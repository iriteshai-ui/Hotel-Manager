import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { 
  Building2, 
  UtensilsCrossed, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Check, 
  DollarSign, 
  Percent, 
  Mail, 
  Phone, 
  Globe, 
  Palette, 
  Layers, 
  Eye, 
  ExternalLink,
  Copy,
  AlertCircle
} from 'lucide-react';

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
];

const CATEGORIES = ['Starters', 'Mains', 'Desserts', 'Beverages', 'Sides'];

const DIETARY_OPTIONS = [
  { id: 'Vegan', label: '🌱 Vegan', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { id: 'Vegetarian', label: '🥬 Vegetarian', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
  { id: 'Gluten-Free', label: '🌾 Gluten-Free', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { id: 'Halal', label: '🌙 Halal', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { id: 'Spicy', label: '🌶️ Spicy', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { id: 'Chef Special', label: '⭐ Chef Special', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' }
];

const SAMPLE_STARTER_MENU = [
  {
    id: 'sample-1',
    name: 'Truffle Burrata Crostini',
    category: 'Starters',
    price: 18,
    description: 'Creamy artisanal burrata with black truffle shavings on grilled sourdough.',
    dietaryTags: ['Vegetarian', 'Chef Special'],
    isAvailable: true
  },
  {
    id: 'sample-2',
    name: 'Dry-Aged Wagyu Ribeye',
    category: 'Mains',
    price: 54,
    description: 'Prime grade cut grilled over binchotan charcoal, served with roasted bone marrow jus.',
    dietaryTags: ['Halal', 'Chef Special'],
    isAvailable: true
  },
  {
    id: 'sample-3',
    name: 'Wild Forest Mushroom Risotto',
    category: 'Mains',
    price: 28,
    description: 'Acquerello carnaroli rice with porcini broth, parmesan foam, and fresh herbs.',
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    isAvailable: true
  },
  {
    id: 'sample-4',
    name: 'Madagascan Vanilla Bean Soufflé',
    category: 'Desserts',
    price: 16,
    description: 'Warm French soufflé with Grand Marnier anglaise and dark chocolate drizzle.',
    dietaryTags: ['Vegetarian'],
    isAvailable: true
  },
  {
    id: 'sample-5',
    name: 'Imperial Gold Espresso Martini',
    category: 'Beverages',
    price: 19,
    description: 'Vodka infused with organic vanilla, fresh single-origin espresso, and 24k gold leaf.',
    dietaryTags: ['Vegan'],
    isAvailable: true
  },
  {
    id: 'sample-6',
    name: 'Parmesan Truffle Pommes Frites',
    category: 'Sides',
    price: 12,
    description: 'Hand-cut russet potatoes tossed with white truffle oil, sea salt, and aged pecorino.',
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    isAvailable: true
  }
];

export default function HotelOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [onboardedResult, setOnboardedResult] = useState(null);

  // Workflow 1: Hotel Details State
  const [hotelData, setHotelData] = useState({
    name: '',
    slug: '',
    currency: 'USD',
    taxPercentage: '10',
    contactEmail: '',
    contactPhone: '',
    theme: {
      primaryColor: '#D97706',
      backgroundColor: '#0d0d0e',
      borderRadius: '12px',
      fontFamily: 'Inter'
    }
  });

  const [slugModified, setSlugModified] = useState(false);
  const [errors, setErrors] = useState({});

  // Workflow 2: Menu Builder State
  const [menuItems, setMenuItems] = useState(SAMPLE_STARTER_MENU);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [editingItemId, setEditingItemId] = useState(null);

  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: 'Starters',
    price: '',
    description: '',
    dietaryTags: [],
    isAvailable: true
  });

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to slugify hotel name
  const handleNameChange = (e) => {
    const val = e.target.value;
    setHotelData(prev => ({
      ...prev,
      name: val,
      slug: slugModified ? prev.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }));
  };

  const handleSlugChange = (e) => {
    setSlugModified(true);
    const val = e.target.value.toLowerCase().replace(/\s+/g, '-');
    setHotelData(prev => ({ ...prev, slug: val }));
  };

  // Validate Step 1
  const validateStep1 = () => {
    const errs = {};
    if (!hotelData.name.trim()) errs.name = 'Hotel Name is required';
    if (!hotelData.slug.trim()) {
      errs.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(hotelData.slug)) {
      errs.slug = 'Slug must only contain lowercase letters, numbers, and hyphens (no spaces)';
    }
    if (!hotelData.contactEmail.trim()) {
      errs.contactEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(hotelData.contactEmail)) {
      errs.contactEmail = 'Invalid email address';
    }
    const taxNum = parseFloat(hotelData.taxPercentage);
    if (isNaN(taxNum) || taxNum < 0 || taxNum > 100) {
      errs.taxPercentage = 'Tax must be between 0 and 100%';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validate Step 2
  const validateStep2 = () => {
    if (menuItems.length === 0) {
      showToast('Please add at least one menu item before proceeding', 'error');
      return false;
    }
    return true;
  };

  // Add / Save Menu Item
  const handleSaveMenuItem = (e) => {
    e.preventDefault();
    if (!newItemForm.name.trim()) {
      showToast('Dish name is required', 'error');
      return;
    }
    const priceNum = parseFloat(newItemForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Price must be a positive number', 'error');
      return;
    }

    if (editingItemId) {
      setMenuItems(prev => prev.map(item => item.id === editingItemId ? {
        ...newItemForm,
        id: editingItemId,
        price: priceNum
      } : item));
      setEditingItemId(null);
      showToast('Item updated successfully');
    } else {
      const createdItem = {
        ...newItemForm,
        id: `item-${Date.now()}`,
        price: priceNum
      };
      setMenuItems(prev => [createdItem, ...prev]);
      showToast('Item added to menu');
    }

    // Reset Form
    setNewItemForm({
      name: '',
      category: 'Starters',
      price: '',
      description: '',
      dietaryTags: [],
      isAvailable: true
    });
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setNewItemForm({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      dietaryTags: [...item.dietaryTags],
      isAvailable: item.isAvailable
    });
  };

  const handleDeleteItem = (id) => {
    setMenuItems(prev => prev.filter(i => i.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
      setNewItemForm({
        name: '',
        category: 'Starters',
        price: '',
        description: '',
        dietaryTags: [],
        isAvailable: true
      });
    }
    showToast('Item removed from menu');
  };

  const handleToggleAvailable = (id) => {
    setMenuItems(prev => prev.map(item => item.id === id ? {
      ...item,
      isAvailable: !item.isAvailable
    } : item));
  };

  const toggleDietaryTag = (tag) => {
    setNewItemForm(prev => {
      const exists = prev.dietaryTags.includes(tag);
      return {
        ...prev,
        dietaryTags: exists 
          ? prev.dietaryTags.filter(t => t !== tag)
          : [...prev.dietaryTags, tag]
      };
    });
  };

  // Submit to Supabase / Backend
  const handleLaunchHotel = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: hotelData.name,
        slug: hotelData.slug,
        currency: hotelData.currency,
        taxPercentage: parseFloat(hotelData.taxPercentage),
        theme: hotelData.theme,
        contactEmail: hotelData.contactEmail,
        contactPhone: hotelData.contactPhone,
        menuItems: menuItems
      };

      const res = await fetch('/api/hotels/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to onboard hotel');
      }

      setOnboardedResult(data);
      showToast('Hotel launched and menu published to Supabase!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = activeCategoryFilter === 'All'
    ? menuItems
    : menuItems.filter(i => i.category === activeCategoryFilter);

  const currencySymbol = CURRENCIES.find(c => c.code === hotelData.currency)?.symbol || '$';

  return (
    <div className="min-h-screen bg-charcoal text-cream selection:bg-brand selection:text-white pb-24">
      <NavBar title="PROPERTY ONBOARDING" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-xl border shadow-2xl flex items-center gap-3 animate-fade-in ${
          toastMessage.type === 'error' 
            ? 'bg-rose-950/90 text-rose-200 border-rose-500/40' 
            : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      <div className="max-w-[1300px] mx-auto px-6 pt-10">
        
        {/* Header Section */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light border border-brand/20 text-brand text-xs font-black tracking-widest uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Multi-Tenant Property Setup
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-cream mb-3">
            Hotel Onboarding & <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-amber-500">Menu Architect</span>
          </h1>
          <p className="text-cream-muted text-sm md:text-base">
            Configure brand identities, customize guest experiences, and assemble digital restaurant menus in a unified workflow.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-charcoal-border -z-0" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-brand to-amber-500 transition-all duration-500 -z-0"
              style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
            />

            {[
              { num: 1, label: 'Hotel Identity', icon: Building2 },
              { num: 2, label: 'Menu Architect', icon: UtensilsCrossed },
              { num: 3, label: 'Review & Launch', icon: CheckCircle2 }
            ].map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    if (step.num === 1) setCurrentStep(1);
                    if (step.num === 2 && validateStep1()) setCurrentStep(2);
                    if (step.num === 3 && validateStep1() && validateStep2()) setCurrentStep(3);
                  }}
                  className="flex flex-col items-center group relative z-10 cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-brand to-amber-600 text-charcoal shadow-lg shadow-brand/30 scale-110'
                      : isPast
                        ? 'bg-emerald-500 text-charcoal'
                        : 'bg-charcoal-light border border-charcoal-border text-cream-dim'
                  }`}>
                    {isPast ? <Check className="w-5 h-5 stroke-[3]" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-bold mt-2 uppercase tracking-wider transition-colors ${
                    isActive ? 'text-brand' : isPast ? 'text-cream' : 'text-cream-dim'
                  }`}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* WORKFLOW 1: STEP 1 - HOTEL IDENTITY & BRAND THEMING         */}
        {/* ─────────────────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Form Column */}
            <div className="lg:col-span-7 space-y-6 bg-charcoal-light/70 border border-charcoal-border rounded-2xl p-6 md:p-8 backdrop-blur-xl">
              <div>
                <h2 className="text-2xl font-black text-cream flex items-center gap-2 mb-1">
                  <Building2 className="w-6 h-6 text-brand" /> Property Specifications
                </h2>
                <p className="text-xs text-cream-muted">Enter primary hotel profile and URL slug mapping.</p>
              </div>

              <div className="space-y-4">
                {/* Hotel Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-1.5">
                    Hotel Property Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={hotelData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Grand Horizon Hotel & Spa"
                    className="w-full px-4 py-3 bg-charcoal border border-charcoal-border rounded-xl text-cream focus:outline-none focus:border-brand transition-colors text-sm font-medium"
                  />
                  {errors.name && <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.name}</p>}
                </div>

                {/* Unique URL Slug */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-1.5">
                    Tenant URL Slug <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center bg-charcoal border border-charcoal-border rounded-xl overflow-hidden focus-within:border-brand transition-colors">
                    <span className="px-3.5 py-3 text-xs text-cream-dim bg-charcoal-mid border-r border-charcoal-border select-none">
                      /menu?hotel=
                    </span>
                    <input
                      type="text"
                      value={hotelData.slug}
                      onChange={handleSlugChange}
                      placeholder="grand-horizon"
                      className="w-full px-4 py-3 bg-transparent text-cream focus:outline-none text-sm font-mono"
                    />
                  </div>
                  {errors.slug && <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.slug}</p>}
                </div>

                {/* Currency & Tax Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-1.5">
                      Operational Currency
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {CURRENCIES.map(curr => (
                        <button
                          key={curr.code}
                          type="button"
                          onClick={() => setHotelData(prev => ({ ...prev, currency: curr.code }))}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            hotelData.currency === curr.code
                              ? 'bg-brand text-charcoal border-brand shadow-md shadow-brand/20 font-black'
                              : 'bg-charcoal border-charcoal-border text-cream-muted hover:border-cream-dim'
                          }`}
                        >
                          {curr.code}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-1.5">
                      Default Tax Rate (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={hotelData.taxPercentage}
                        onChange={(e) => setHotelData(prev => ({ ...prev, taxPercentage: e.target.value }))}
                        className="w-full px-4 py-3 bg-charcoal border border-charcoal-border rounded-xl text-cream focus:outline-none focus:border-brand transition-colors text-sm font-medium"
                      />
                      <Percent className="w-4 h-4 text-cream-dim absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {errors.taxPercentage && <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.taxPercentage}</p>}
                  </div>
                </div>

                {/* Contact Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-1.5">
                      Front Desk / Admin Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={hotelData.contactEmail}
                        onChange={(e) => setHotelData(prev => ({ ...prev, contactEmail: e.target.value }))}
                        placeholder="concierge@horizon.com"
                        className="w-full pl-10 pr-4 py-3 bg-charcoal border border-charcoal-border rounded-xl text-cream focus:outline-none focus:border-brand transition-colors text-sm font-medium"
                      />
                      <Mail className="w-4 h-4 text-cream-dim absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {errors.contactEmail && <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.contactEmail}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-1.5">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={hotelData.contactPhone}
                        onChange={(e) => setHotelData(prev => ({ ...prev, contactPhone: e.target.value }))}
                        placeholder="+1 (555) 234-5678"
                        className="w-full pl-10 pr-4 py-3 bg-charcoal border border-charcoal-border rounded-xl text-cream focus:outline-none focus:border-brand transition-colors text-sm font-medium"
                      />
                      <Phone className="w-4 h-4 text-cream-dim absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Brand Theming Controls */}
                <div className="pt-4 border-t border-charcoal-border">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cream flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4 text-brand" /> Brand Palette & Visual Tokens
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Primary Color */}
                    <div>
                      <label className="block text-xs font-semibold text-cream-muted mb-1.5">Accent Color</label>
                      <div className="flex items-center gap-2 bg-charcoal border border-charcoal-border rounded-xl p-2">
                        <input
                          type="color"
                          value={hotelData.theme.primaryColor}
                          onChange={(e) => setHotelData(prev => ({
                            ...prev,
                            theme: { ...prev.theme, primaryColor: e.target.value }
                          }))}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          value={hotelData.theme.primaryColor}
                          onChange={(e) => setHotelData(prev => ({
                            ...prev,
                            theme: { ...prev.theme, primaryColor: e.target.value }
                          }))}
                          className="w-full bg-transparent text-xs font-mono text-cream focus:outline-none uppercase"
                        />
                      </div>
                    </div>

                    {/* Background Color */}
                    <div>
                      <label className="block text-xs font-semibold text-cream-muted mb-1.5">Surface Background</label>
                      <div className="flex items-center gap-2 bg-charcoal border border-charcoal-border rounded-xl p-2">
                        <input
                          type="color"
                          value={hotelData.theme.backgroundColor}
                          onChange={(e) => setHotelData(prev => ({
                            ...prev,
                            theme: { ...prev.theme, backgroundColor: e.target.value }
                          }))}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          value={hotelData.theme.backgroundColor}
                          onChange={(e) => setHotelData(prev => ({
                            ...prev,
                            theme: { ...prev.theme, backgroundColor: e.target.value }
                          }))}
                          className="w-full bg-transparent text-xs font-mono text-cream focus:outline-none uppercase"
                        />
                      </div>
                    </div>

                    {/* Border Radius */}
                    <div>
                      <label className="block text-xs font-semibold text-cream-muted mb-1.5">Corner Radius</label>
                      <select
                        value={hotelData.theme.borderRadius}
                        onChange={(e) => setHotelData(prev => ({
                          ...prev,
                          theme: { ...prev.theme, borderRadius: e.target.value }
                        }))}
                        className="w-full px-3 py-2.5 bg-charcoal border border-charcoal-border rounded-xl text-xs font-bold text-cream focus:outline-none focus:border-brand"
                      >
                        <option value="8px">Subtle (8px)</option>
                        <option value="12px">Classic (12px)</option>
                        <option value="16px">Modern (16px)</option>
                        <option value="24px">Pill / Soft (24px)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setCurrentStep(2);
                  }}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand to-amber-600 text-charcoal font-black text-sm uppercase tracking-wider shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  Configure Menu Items <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Interactive Brand Preview Card */}
            <div className="lg:col-span-5 sticky top-28 space-y-4">
              <div className="bg-charcoal-light/70 border border-charcoal-border rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black uppercase tracking-widest text-cream-dim flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-brand" /> Live Brand Mockup
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-light text-brand font-mono font-bold">
                    Theme Preview
                  </span>
                </div>

                {/* Mock Card Preview Styled with Selected Theme */}
                <div 
                  className="p-6 transition-all duration-300 shadow-2xl border"
                  style={{
                    backgroundColor: hotelData.theme.backgroundColor,
                    borderRadius: hotelData.theme.borderRadius,
                    borderColor: 'rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 flex items-center justify-center font-black text-lg transition-all"
                      style={{
                        backgroundColor: hotelData.theme.primaryColor,
                        borderRadius: hotelData.theme.borderRadius,
                        color: hotelData.theme.backgroundColor
                      }}
                    >
                      {hotelData.name ? hotelData.name.charAt(0).toUpperCase() : 'H'}
                    </div>
                    <div>
                      <h4 className="font-black text-cream text-base tracking-tight leading-tight">
                        {hotelData.name || 'Grand Horizon Hotel'}
                      </h4>
                      <p className="text-[11px] font-mono text-cream-dim">
                        {hotelData.slug ? `aura.dining/${hotelData.slug}` : 'aura.dining/hotel-slug'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-cream">Truffle Beef Medallion</span>
                      <span 
                        className="text-xs font-black"
                        style={{ color: hotelData.theme.primaryColor }}
                      >
                        {currencySymbol}38.00
                      </span>
                    </div>
                    <p className="text-[11px] text-cream-muted leading-relaxed">
                      Seared tenderloin with wild morel reduction and smoked potato puree.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="w-full py-2.5 font-black text-xs uppercase tracking-wider transition-all"
                    style={{
                      backgroundColor: hotelData.theme.primaryColor,
                      color: hotelData.theme.backgroundColor,
                      borderRadius: hotelData.theme.borderRadius
                    }}
                  >
                    View Guest Menu ({currencySymbol})
                  </button>
                </div>

                {/* JSON Preview Badge */}
                <div className="mt-4 pt-4 border-t border-charcoal-border">
                  <span className="text-[10px] font-mono text-cream-dim block mb-1">Generated JSONB Theme Payload:</span>
                  <pre className="text-[11px] font-mono bg-charcoal p-3 rounded-xl border border-charcoal-border text-cream-muted overflow-x-auto">
                    {JSON.stringify(hotelData.theme, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* WORKFLOW 2: STEP 2 - MULTI-ITEM MENU BUILDER                */}
        {/* ─────────────────────────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Left: Add / Edit Item Form */}
            <div className="lg:col-span-5 bg-charcoal-light/70 border border-charcoal-border rounded-2xl p-6 md:p-7 backdrop-blur-xl sticky top-28">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-cream flex items-center gap-2">
                  {editingItemId ? <Edit3 className="w-5 h-5 text-brand" /> : <Plus className="w-5 h-5 text-brand" />}
                  {editingItemId ? 'Edit Menu Item' : 'Add New Dish / Drink'}
                </h3>
                {editingItemId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItemId(null);
                      setNewItemForm({
                        name: '',
                        category: 'Starters',
                        price: '',
                        description: '',
                        dietaryTags: [],
                        isAvailable: true
                      });
                    }}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveMenuItem} className="space-y-4">
                {/* Item Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-1">
                    Dish / Drink Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newItemForm.name}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Lobster Bisque"
                    className="w-full px-3.5 py-2.5 bg-charcoal border border-charcoal-border rounded-xl text-cream focus:outline-none focus:border-brand text-sm"
                  />
                </div>

                {/* Category & Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-1">
                      Category
                    </label>
                    <select
                      value={newItemForm.category}
                      onChange={(e) => setNewItemForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-charcoal border border-charcoal-border rounded-xl text-cream focus:outline-none focus:border-brand text-xs font-bold"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-1">
                      Price ({currencySymbol}) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={newItemForm.price}
                        onChange={(e) => setNewItemForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="24.00"
                        className="w-full px-3.5 py-2.5 bg-charcoal border border-charcoal-border rounded-xl text-cream focus:outline-none focus:border-brand text-sm font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-1">
                    Culinary Description
                  </label>
                  <textarea
                    rows={2}
                    value={newItemForm.description}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ingredients, preparation technique, and tasting notes..."
                    className="w-full px-3.5 py-2.5 bg-charcoal border border-charcoal-border rounded-xl text-cream focus:outline-none focus:border-brand text-xs resize-none"
                  />
                </div>

                {/* Dietary Tags Multiselect */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-2">
                    Dietary Badges & Attributes
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DIETARY_OPTIONS.map(opt => {
                      const selected = newItemForm.dietaryTags.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleDietaryTag(opt.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            selected 
                              ? 'bg-brand/20 border-brand text-brand' 
                              : 'bg-charcoal border-charcoal-border text-cream-dim hover:text-cream-muted'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal border border-charcoal-border">
                  <div>
                    <span className="text-xs font-bold text-cream block">Available for Ordering</span>
                    <span className="text-[10px] text-cream-dim">Visible to guests immediately upon launch</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewItemForm(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      newItemForm.isAvailable ? 'bg-emerald-500' : 'bg-charcoal-border'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      newItemForm.isAvailable ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brand text-charcoal font-black text-xs uppercase tracking-wider hover:bg-brand-hover transition-all shadow-md shadow-brand/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {editingItemId ? 'Update Dish Details' : 'Add Dish to Menu'}
                </button>
              </form>
            </div>

            {/* Right: Dynamic Menu Item List */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-cream flex items-center gap-2">
                    <UtensilsCrossed className="w-6 h-6 text-brand" /> Property Menu Catalog
                  </h3>
                  <p className="text-xs text-cream-muted">
                    {menuItems.length} dish{menuItems.length === 1 ? '' : 'es'} configured for launch
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMenuItems(SAMPLE_STARTER_MENU);
                    showToast('Loaded luxury curated menu template');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-charcoal-light border border-charcoal-border text-xs font-bold text-cream-muted hover:text-brand hover:border-brand/30 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand" /> Reset to Curated Template
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['All', ...CATEGORIES].map(cat => {
                  const count = cat === 'All' ? menuItems.length : menuItems.filter(i => i.category === cat).length;
                  const isActive = activeCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategoryFilter(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-brand text-charcoal border-brand font-black'
                          : 'bg-charcoal-light border-charcoal-border text-cream-muted hover:border-cream-dim'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-charcoal text-brand' : 'bg-charcoal-mid text-cream-dim'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Items Grid */}
              <div className="space-y-3">
                {filteredItems.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-charcoal-border rounded-2xl bg-charcoal-light/30">
                    <UtensilsCrossed className="w-8 h-8 text-cream-dim mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-cream-muted">No dishes in this category yet.</p>
                    <p className="text-xs text-cream-dim mt-1">Use the builder form on the left to add your first recipe.</p>
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-charcoal-light/70 border border-charcoal-border hover:border-charcoal-mid transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-charcoal-mid border border-charcoal-border text-brand uppercase">
                            {item.category}
                          </span>
                          <h4 className="font-bold text-cream text-sm truncate">{item.name}</h4>
                          {!item.isAvailable && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Unavailable
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-xs text-cream-muted line-clamp-1 mb-2">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(item.dietaryTags || []).map(tag => {
                            const opt = DIETARY_OPTIONS.find(d => d.id === tag);
                            return (
                              <span 
                                key={tag} 
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  opt?.color || 'bg-white/5 text-cream-dim border-charcoal-border'
                                }`}
                              >
                                {opt?.label || tag}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-charcoal-border">
                        <span className="text-base font-black text-cream">
                          {currencySymbol}{parseFloat(item.price).toFixed(2)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleAvailable(item.id)}
                            title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                            className={`p-2 rounded-lg text-xs border transition-colors cursor-pointer ${
                              item.isAvailable 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                            }`}
                          >
                            {item.isAvailable ? 'In Stock' : 'Paused'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditItem(item)}
                            className="p-2 rounded-lg bg-charcoal border border-charcoal-border text-cream-muted hover:text-brand hover:border-brand/30 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 rounded-lg bg-charcoal border border-charcoal-border text-cream-muted hover:text-rose-400 hover:border-rose-500/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-charcoal-border">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-3 rounded-xl bg-charcoal border border-charcoal-border text-cream-muted text-xs font-bold uppercase tracking-wider hover:text-cream transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Hotel Identity
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setCurrentStep(3);
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand to-amber-600 text-charcoal font-black text-xs uppercase tracking-wider shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  Proceed to Launch Review <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* STEP 3: REVIEW & LAUNCH PROPERTY                            */}
        {/* ─────────────────────────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-charcoal-light/70 border border-charcoal-border rounded-2xl p-6 md:p-8 backdrop-blur-xl">
              <h2 className="text-2xl font-black text-cream flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-6 h-6 text-brand" /> Launch Verification & Summary
              </h2>
              <p className="text-xs text-cream-muted mb-6">
                Review your tenant details and catalog before publishing to the live database.
              </p>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-charcoal border border-charcoal-border">
                  <span className="text-[10px] font-bold text-cream-dim uppercase tracking-wider block mb-1">Property Profile</span>
                  <h4 className="text-base font-black text-cream">{hotelData.name}</h4>
                  <p className="text-xs font-mono text-brand mt-0.5">/menu?hotel={hotelData.slug}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-cream-muted">
                    <span>Currency: <strong className="text-cream">{hotelData.currency}</strong></span>
                    <span>Tax: <strong className="text-cream">{hotelData.taxPercentage}%</strong></span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-charcoal border border-charcoal-border">
                  <span className="text-[10px] font-bold text-cream-dim uppercase tracking-wider block mb-1">Branding Palette</span>
                  <div className="flex items-center gap-3 mt-2">
                    <div 
                      className="w-8 h-8 rounded-lg border border-white/20 shadow-md" 
                      style={{ backgroundColor: hotelData.theme.primaryColor }} 
                    />
                    <div>
                      <span className="text-xs font-mono text-cream block font-bold">{hotelData.theme.primaryColor}</span>
                      <span className="text-[10px] text-cream-dim">Primary Brand Accent</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Breakdown Summary */}
              <div className="p-4 rounded-xl bg-charcoal border border-charcoal-border mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-cream-muted">
                    Menu Items Breakdown ({menuItems.length} total)
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {menuItems.filter(i => i.isAvailable).length} Available for Orders
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CATEGORIES.map(cat => {
                    const count = menuItems.filter(i => i.category === cat).length;
                    return (
                      <div key={cat} className="p-2.5 rounded-lg bg-charcoal-mid border border-charcoal-border text-center">
                        <span className="text-xs font-black text-brand block">{count}</span>
                        <span className="text-[10px] text-cream-dim font-bold">{cat}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-charcoal-border">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-3 rounded-xl bg-charcoal border border-charcoal-border text-cream-muted text-xs font-bold uppercase tracking-wider hover:text-cream transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Menu Builder
                </button>

                <button
                  type="button"
                  onClick={handleLaunchHotel}
                  disabled={isSubmitting}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand to-amber-600 text-charcoal font-black text-sm uppercase tracking-wider shadow-xl shadow-brand/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-charcoal border-t-transparent rounded-full animate-spin" />
                      Publishing to Supabase...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Complete Onboarding & Launch Hotel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SUCCESS MODAL UPON SUCCESSFUL ONBOARDING                    */}
        {/* ─────────────────────────────────────────────────────────── */}
        {onboardedResult && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="max-w-md w-full bg-charcoal-light border border-brand/40 rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-amber-600 text-charcoal flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand/30">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <h3 className="text-2xl font-black text-cream mb-1">
                Property Successfully Onboarded!
              </h3>
              <p className="text-xs text-cream-muted mb-6">
                <strong>{onboardedResult.hotel.name}</strong> has been registered with {onboardedResult.menuItemsCount} customized menu items.
              </p>

              {/* Shareable Link Box */}
              <div className="p-3.5 rounded-xl bg-charcoal border border-charcoal-border text-left mb-6">
                <span className="text-[10px] font-bold text-cream-dim uppercase tracking-wider block mb-1">
                  Public Guest Menu Route:
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-brand truncate">
                    {window.location.origin}/menu?hotel={onboardedResult.hotel.slug}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/menu?hotel=${onboardedResult.hotel.slug}`);
                      showToast('Guest menu URL copied to clipboard');
                    }}
                    className="p-1.5 rounded-lg bg-charcoal-mid hover:bg-brand-light text-cream-muted hover:text-brand transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <a
                  href={`/menu?hotel=${onboardedResult.hotel.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-brand text-charcoal font-black text-xs uppercase tracking-wider hover:bg-brand-hover transition-all flex items-center justify-center gap-2 no-underline"
                >
                  <ExternalLink className="w-4 h-4" /> Open Guest Digital Menu
                </a>

                <button
                  type="button"
                  onClick={() => navigate('/manager')}
                  className="w-full py-3 rounded-xl bg-charcoal border border-charcoal-border text-cream font-bold text-xs uppercase tracking-wider hover:bg-charcoal-mid transition-all cursor-pointer"
                >
                  Go to Manager Console
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
