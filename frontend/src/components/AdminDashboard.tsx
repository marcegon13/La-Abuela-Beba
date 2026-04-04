import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LayoutDashboard, Leaf, Settings, LogOut, CheckCircle, Search, Camera, Upload, FileUp, Database, ClipboardList, Check, XCircle, Mail, MessageCircle, X, BedDouble, Menu, Home, Plus } from 'lucide-react';
import AdminBedManager from './AdminBedManager';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<'users' | 'stats' | 'content' | 'gallery' | 'csv' | 'solicitudes' | 'beds' | 'prices'>('stats');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleViewChange = (v: typeof view) => {
        setView(v);
        setMobileMenuOpen(false);
    };
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
    const [galleryItems, setGalleryItems] = useState<any[]>([]);
    const [uploadCat, setUploadCat] = useState('Obra');
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState('');
    // CSV Carga Masiva state
    const [csvUploading, setCsvUploading] = useState(false);
    const [csvResult, setCsvResult] = useState<any>(null);
    const [huespedStats, setHuespedStats] = useState<any>(null);
    const [pricingConfig, setPricingConfig] = useState<any>(null);
    const [pricingSaving, setPricingSaving] = useState(false);


    // User Detail Modal State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userHistory, setUserHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [roleUpdating, setRoleUpdating] = useState(false);
    const [newRole, setNewRole] = useState('');

    useEffect(() => {
        if (selectedUser?.dni) {
            setHistoryLoading(true);
            fetch(`/api/admin/huespedes?dni=${selectedUser.dni}`)
                .then(res => res.json())
                .then(data => {
                    setUserHistory(data || []);
                    setHistoryLoading(false);
                })
                .catch(() => setHistoryLoading(false));
            setNewRole(selectedUser.role);
        } else {
            setUserHistory([]);
            setNewRole('');
        }
    }, [selectedUser]);

    const handleUpdateRole = async () => {
        if (!selectedUser) return;
        setRoleUpdating(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                fetchUsers();
                setSelectedUser(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setRoleUpdating(false);
        }
    };
    // Solicitudes state
    const [solicitudes, setSolicitudes] = useState<any[]>([]);
    const [solicitudFilter, setSolicitudFilter] = useState<'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA' | ''>('PENDIENTE');
    const [solicitudView, setSolicitudView] = useState<'cards' | 'table'>('cards');
    const [showManualForm, setShowManualForm] = useState(false);
    const [solicitudUpdating, setSolicitudUpdating] = useState<string | null>(null);

    useEffect(() => {
        // Auth Check (Simple Role Check)
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        if (userInfo.role !== 'ADMIN') {
            navigate('/');
            return;
        }

        fetchStats();
        if (view === 'users') fetchUsers();
        if (view === 'gallery') fetchGallery();
        if (view === 'solicitudes') fetchSolicitudes();
        if (view === 'prices') fetchPricing();
        fetchSolicitudesCount();
    }, [view, navigate, solicitudFilter]);

    const fetchPricing = async () => {
        try {
            const res = await fetch('/api/admin/pricing');
            if (res.ok) {
                const data = await res.json();
                // Ensure valid state structure
                const formatted = {
                    compartido: {
                        base_price: data.compartido?.base_price || 18000,
                        discount_nights: JSON.parse(data.compartido?.discount_nights || '[]'),
                        discount_guests: JSON.parse(data.compartido?.discount_guests || '[]'),
                        discount_lead_time: JSON.parse(data.compartido?.discount_lead_time || '[]'),
                    },
                    privado: {
                        base_price: data.privado?.base_price || 38000,
                        discount_nights: JSON.parse(data.privado?.discount_nights || '[]'),
                        discount_guests: JSON.parse(data.privado?.discount_guests || '[]'),
                        discount_lead_time: JSON.parse(data.privado?.discount_lead_time || '[]'),
                    }
                };
                setPricingConfig(formatted);
            }
        } catch (error) {
            console.error("Failed to fetch pricing", error);
        }
    };

    const handleSavePricing = async (roomType: 'compartido' | 'privado') => {
        setPricingSaving(true);
        try {
            const config = pricingConfig[roomType];
            const body = {
                room_type: roomType,
                base_price: Number(config.base_price),
                discount_nights: JSON.stringify(config.discount_nights),
                discount_guests: JSON.stringify(config.discount_guests),
                discount_lead_time: JSON.stringify(config.discount_lead_time),
            };

            const res = await fetch('/api/admin/pricing', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert(`¡Configuración de ${roomType} guardada exitosamente!`);
            } else {
                alert('Error al guardar configuración.');
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión.');
        } finally {
            setPricingSaving(false);
        }
    };


    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) setStats(await res.json());
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) setUsers(await res.json());
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const handleApprove = async (userId: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/approve`, { method: 'POST' });
            if (res.ok) {
                fetchUsers(); // Refresh list
                fetchStats(); // Update stats
            }
        } catch (error) {
            console.error("Failed to approve user", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_info');
        navigate('/login');
    };

    // Solicitudes functions
    const [pendingCount, setPendingCount] = useState(0);

    const fetchSolicitudesCount = async () => {
        try {
            const res = await fetch('/api/admin/solicitudes?status=PENDIENTE');
            if (res.ok) {
                const data = await res.json();
                setPendingCount(data.length);
            }
        } catch { /* silent */ }
    };

    const fetchSolicitudes = async () => {
        try {
            const url = solicitudFilter
                ? `/api/admin/solicitudes?status=${solicitudFilter}`
                : '/api/admin/solicitudes';
            const res = await fetch(url);
            if (res.ok) setSolicitudes(await res.json());
        } catch (error) {
            console.error('Failed to fetch solicitudes', error);
        }
    };

    const handleSolicitudUpdate = async (id: string, status: 'CONFIRMADA' | 'RECHAZADA', notas: string = '') => {
        setSolicitudUpdating(id);
        try {
            const res = await fetch(`/api/admin/solicitudes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, notas }),
            });
            if (res.ok) {
                fetchSolicitudes();
                fetchSolicitudesCount();
            }
        } catch (error) {
            console.error('Failed to update solicitud', error);
        } finally {
            setSolicitudUpdating(null);
        }
    };

    const fetchGallery = async () => {
        try {
            const res = await fetch('/api/gallery');
            if (res.ok) setGalleryItems(await res.json());
        } catch (error) {
            console.error('Failed to fetch gallery', error);
        }
    };

    const handleGalleryUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        const fileInput = document.getElementById('gallery-files') as HTMLInputElement;
        if (!fileInput?.files?.length) return;

        setUploading(true);
        setUploadMsg('');
        const formData = new FormData();
        formData.append('categoria', uploadCat);
        formData.append('titulo', uploadTitle || uploadCat);
        for (let i = 0; i < fileInput.files.length; i++) {
            formData.append('fotos', fileInput.files[i]);
        }

        try {
            const res = await fetch('/api/gallery/upload', {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setUploadMsg(data.message);
                fileInput.value = '';
                setUploadTitle('');
                fetchGallery();
            } else {
                setUploadMsg('Error al subir fotos.');
            }
        } catch {
            setUploadMsg('Error de conexión.');
        } finally {
            setUploading(false);
        }
    };

    // Filter Users
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.dni?.includes(searchTerm);

        const matchesStatus =
            filterStatus === 'ALL' ? true :
                filterStatus === 'ACTIVE' ? user.is_active :
                    filterStatus === 'PENDING' ? !user.is_active : true;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex h-[100dvh] bg-black text-zinc-100 font-sans overflow-hidden">
            {/* Mobile Top Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-bold tracking-tight text-white font-['Arial']">LA BEBA <span className="text-emerald-500 text-xs">Admin</span></h1>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-zinc-400 hover:text-white">
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:relative z-40 md:z-auto top-0 left-0 h-full w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col overflow-y-auto transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 border-b border-zinc-800">
                    <h1 className="text-xl font-bold tracking-tight text-white font-['Arial']">LA BEBA <span className="text-emerald-500 text-sm block">Admin Panel</span></h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => handleViewChange('stats')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'stats' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <LayoutDashboard size={18} /> Resumen
                    </button>
                    <button
                        onClick={() => handleViewChange('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'users' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <Users size={18} /> Gestión de Socios
                    </button>
                    <button
                        onClick={() => handleViewChange('gallery')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'gallery' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <Camera size={18} /> Galerías de Fotos
                    </button>
                    <button
                        onClick={() => handleViewChange('solicitudes')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative ${view === 'solicitudes' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <ClipboardList size={18} /> Solicitudes
                        {pendingCount > 0 && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-emerald-500 text-black text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => handleViewChange('csv')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'csv' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <Database size={18} /> Carga Masiva
                    </button>
                    <button
                        onClick={() => handleViewChange('beds')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'beds' ? 'bg-blue-900/50 text-blue-400 border border-blue-500/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <BedDouble size={18} /> Gestión de Camas
                    </button>
                    <button
                        onClick={() => handleViewChange('prices')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'prices' ? 'bg-orange-900/50 text-orange-400 border border-orange-500/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <Settings size={18} /> Config. de Precios
                    </button>
                    <button
                        onClick={() => handleViewChange('content')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'content' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <Settings size={18} /> Contenido
                    </button>
                </nav>

                {/* Chapadmalal Quick Reference */}
                <div className="p-4 border-t border-zinc-800">
                    <div className="bg-zinc-900/50 rounded-lg p-3 mb-6">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">📍 Ubicación</p>
                        <p className="text-zinc-400 text-xs leading-relaxed">Calle 0 e/ 815 y 817<br />Chapadmalal, Buenos Aires</p>
                        <a
                            href="https://maps.app.goo.gl/J1DX9mQthirGfjCr9"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Cómo llegar →
                        </a>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg text-sm transition-colors">
                        <LogOut size={18} /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-black p-4 pt-16 md:p-8 md:pt-8">
                {/* Stats View */}
                {view === 'stats' && stats && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-bold mb-6 font-['Arial']">Panel Principal</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Card 1: Socios */}
                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-zinc-400 text-sm">Socios Totales</p>
                                        <h3 className="text-3xl font-bold text-white mt-1">{stats.users.total}</h3>
                                    </div>
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                        <Users size={20} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-emerald-400 font-medium">{stats.users.active} Aprobados</span>
                                    <span className="text-zinc-600">|</span>
                                    <span className="text-zinc-500">{stats.users.total - stats.users.active} Pendientes</span>
                                </div>
                            </div>

                            {/* Card 2: Tokens */}
                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-zinc-400 text-sm">Tokens Disponibles</p>
                                        <h3 className="text-3xl font-bold text-yellow-500 mt-1">{stats.tokens.remaining} <span className="text-lg text-zinc-600 font-normal">/ 30</span></h3>
                                    </div>
                                    <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                                        <Leaf size={20} />
                                    </div>
                                </div>
                                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-yellow-500 h-full" style={{ width: `${(stats.tokens.claimed / stats.tokens.total) * 100}%` }}></div>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">{stats.tokens.claimed} Tokens reclamados</p>
                            </div>

                            {/* Card 3: Impacto/Ingresos Mock */}
                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-zinc-400 text-sm">Fondo de Inversión (Est.)</p>
                                        <h3 className="text-3xl font-bold text-white mt-1">${stats.impact.revenue.toLocaleString()}</h3>
                                    </div>
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                        <LayoutDashboard size={20} />
                                    </div>
                                </div>
                                <p className="text-sm text-zinc-400">Equivale a <span className="text-white font-bold">{stats.impact.sqm_bio} m²</span> de bioconstrucción</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users View */}
                {view === 'users' && (
                    <div className="animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold font-['Arial']">Gestión de Socios</h2>
                            <div className="flex items-center gap-3">
                                {/* Status Filter */}
                                <select
                                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'ACTIVE' | 'PENDING')}
                                >
                                    <option value="ALL">Todos</option>
                                    <option value="PENDING">Pendientes</option>
                                    <option value="ACTIVE">Activos</option>
                                </select>

                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, email o DNI..."
                                        className="bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-700 w-64"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs font-bold tracking-wider border-b border-zinc-800">
                                    <tr>
                                        <th className="px-6 py-4 font-['Arial']">Usuario</th>
                                        <th className="px-6 py-4 font-['Arial']">Contacto</th>
                                        <th className="px-6 py-4 font-['Arial']">Estado</th>
                                        <th className="px-6 py-4 text-right font-['Arial']">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-white text-base">{user.full_name}</p>
                                                <p className="text-zinc-500 text-xs">{user.email}</p>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-300">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded w-fit text-zinc-400">{user.dni}</span>
                                                    <span className="text-xs text-zinc-500">{user.phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 tracking-wide">
                                                        <CheckCircle size={12} /> ACTIVO
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold border border-yellow-500/20 tracking-wide animate-pulse">
                                                        PENDIENTE
                                                    </span>
                                                )}
                                                {user.role === 'ADMIN' && <span className="ml-2 text-[10px] text-purple-400 font-bold border border-purple-500/30 px-2 py-0.5 rounded-full tracking-wider">ADMIN</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!user.is_active && (
                                                    <button
                                                        onClick={() => handleApprove(user.id)}
                                                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold tracking-wide transition-all shadow-lg shadow-emerald-900/20 hover:scale-105"
                                                    >
                                                        APROBAR
                                                    </button>
                                                )}
                                                {user.is_active && (
                                                    <button
                                                        onClick={() => setSelectedUser(user)}
                                                        className="text-zinc-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Configurar"
                                                    >
                                                        <Settings size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && (
                                <div className="p-12 text-center">
                                    <div className="bg-zinc-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="text-zinc-600" size={24} />
                                    </div>
                                    <p className="text-zinc-400 font-medium">No se encontraron socios.</p>
                                    <p className="text-zinc-600 text-sm mt-1">Intenta con otro término de búsqueda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Gallery Management */}
                {view === 'gallery' && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-bold mb-6 font-['Arial']">Galerías de Fotos</h2>

                        {/* Upload Form */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Upload size={18} className="text-emerald-400" /> Subir a Galería</h3>
                            <form onSubmit={handleGalleryUpload} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs uppercase tracking-wider text-zinc-500 mb-1 block">Categoría</label>
                                        <select value={uploadCat} onChange={(e) => setUploadCat(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                                            <option value="Obra">Obra</option>
                                            <option value="Entorno">Entorno</option>
                                            <option value="Social">Social</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase tracking-wider text-zinc-500 mb-1 block">Título (opcional)</label>
                                        <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Ej: Avance semana 12" className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase tracking-wider text-zinc-500 mb-1 block">Fotos (múltiple)</label>
                                        <input id="gallery-files" type="file" multiple accept="image/*" className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-emerald-600 file:text-white cursor-pointer" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button type="submit" disabled={uploading} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-full transition-all disabled:opacity-50">
                                        {uploading ? 'Subiendo...' : 'SUBIR FOTOS'}
                                    </button>
                                    {uploadMsg && <span className="text-sm text-emerald-400">{uploadMsg}</span>}
                                </div>
                            </form>
                        </div>

                        {/* Gallery Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {galleryItems.map((item: any) => (
                                <div key={item.id} className="group relative aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all">
                                    <img src={item.imagen_url} alt={item.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${item.categoria === 'Obra' ? 'bg-yellow-500/20 text-yellow-400' : item.categoria === 'Entorno' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>{item.categoria}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {galleryItems.length === 0 && (
                            <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-xl">
                                <Camera className="mx-auto text-zinc-700 mb-4" size={40} />
                                <p className="text-zinc-400">No hay fotos en la galería aún.</p>
                                <p className="text-zinc-600 text-sm mt-1">Subí fotos de la obra usando el formulario de arriba.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Content Management Mockup */}
                {view === 'content' && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-bold mb-6 font-['Arial']">Administrar Contenido</h2>
                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <h3 className="text-lg font-bold text-white mb-4">Hero Slider</h3>
                            <p className="text-sm text-zinc-400 mb-6">Gestiona las imágenes y videos principales de la Landing Page.</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="group relative aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700">
                                    <img src="/assets/hero_sol.jpg" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-bold uppercase tracking-wide bg-black/50 px-2 py-1 rounded backdrop-blur-sm">Slide 1: Amanecer</span>
                                    </div>
                                    <button className="absolute top-2 right-2 p-1 bg-zinc-800 rounded hover:bg-zinc-700"><Settings size={12} /></button>
                                </div>
                                <div className="group relative aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700">
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">VIDEO MOCK</div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-bold uppercase tracking-wide bg-black/50 px-2 py-1 rounded backdrop-blur-sm">Slide 2: Dron</span>
                                    </div>
                                    <button className="absolute top-2 right-2 p-1 bg-zinc-800 rounded hover:bg-zinc-700"><Settings size={12} /></button>
                                </div>
                                <div className="group relative aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700">
                                    <img src="/assets/hero_fogata.jpg" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-bold uppercase tracking-wide bg-black/50 px-2 py-1 rounded backdrop-blur-sm">Slide 3: Fogata</span>
                                    </div>
                                    <button className="absolute top-2 right-2 p-1 bg-zinc-800 rounded hover:bg-zinc-700"><Settings size={12} /></button>
                                </div>
                            </div>

                            <button className="mt-6 px-4 py-2 border border-dashed border-zinc-700 text-zinc-500 rounded-lg w-full hover:border-zinc-500 hover:text-zinc-300 transition-colors text-sm">
                                + Agregar Nuevo Slide
                            </button>
                        </div>
                    </div>
                )}

                {/* CSV Carga Masiva View */}
                {view === 'csv' && (
                    <div className="animate-fade-in-up max-w-4xl mx-auto">
                        <h2 className="text-[48px] font-normal mb-2 font-['Arial'] text-white">Carga Masiva</h2>
                        <p className="text-[22px] text-zinc-400 font-['Calibri'] italic mb-8 border-b border-zinc-800 pb-6">Importá reservas históricas desde archivos CSV.</p>

                        {/* Upload Zone */}
                        <div className="bg-zinc-900/80 border-2 border-dashed border-zinc-700 rounded-2xl p-10 text-center mb-8 hover:border-yellow-500/40 transition-colors">
                            <FileUp size={48} className="mx-auto text-zinc-600 mb-4" />
                            <h4 className="text-white font-bold text-lg mb-2 font-['Arial']">Subir archivo CSV</h4>
                            <p className="text-zinc-500 text-sm mb-6 max-w-md mx-auto">Seleccioná un archivo .csv con las columnas: <span className="text-zinc-300 font-mono">nombre, dni, procedencia, canal_origen, fecha_reserva</span></p>
                            <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-yellow-900/20">
                                <Upload size={18} />
                                {csvUploading ? 'Procesando...' : 'Seleccionar CSV'}
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    disabled={csvUploading}
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setCsvUploading(true);
                                        setCsvResult(null);
                                        const formData = new FormData();
                                        formData.append('archivo', file);
                                        try {
                                            const res = await fetch('/api/admin/huespedes/import', {
                                                method: 'POST',
                                                body: formData,
                                            });
                                            const data = await res.json();
                                            setCsvResult(data);
                                            // Refresh stats
                                            const statsRes = await fetch('/api/admin/huespedes/stats');
                                            setHuespedStats(await statsRes.json());
                                        } catch (err) {
                                            setCsvResult({ error: 'Error de conexión con el servidor' });
                                        } finally {
                                            setCsvUploading(false);
                                        }
                                    }}
                                />
                            </label>
                        </div>

                        {/* Import Results */}
                        {csvResult && !csvResult.error && (
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-8 mb-8 animate-fade-in-up">
                                <h3 className="text-xl font-bold text-white mb-4 font-['Arial'] flex items-center gap-2">
                                    <CheckCircle size={20} className="text-emerald-400" /> Resultado de Importación
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-black/50 rounded-lg border border-zinc-800">
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Filas totales</p>
                                        <p className="text-2xl font-bold text-white">{csvResult.total_rows || 0}</p>
                                    </div>
                                    <div className="p-4 bg-black/50 rounded-lg border border-emerald-500/20">
                                        <p className="text-xs text-emerald-500 uppercase tracking-wider mb-1">Importados</p>
                                        <p className="text-2xl font-bold text-emerald-400">{csvResult.imported || 0}</p>
                                    </div>
                                    <div className="p-4 bg-black/50 rounded-lg border border-yellow-500/20">
                                        <p className="text-xs text-yellow-500 uppercase tracking-wider mb-1">Duplicados</p>
                                        <p className="text-2xl font-bold text-yellow-400">{csvResult.duplicates || 0}</p>
                                    </div>
                                    <div className="p-4 bg-black/50 rounded-lg border border-blue-500/20">
                                        <p className="text-xs text-blue-500 uppercase tracking-wider mb-1">Vinculados SaaS</p>
                                        <p className="text-2xl font-bold text-blue-400">{csvResult.linked_to_user || 0}</p>
                                    </div>
                                    <div className="p-4 bg-black/50 rounded-lg border border-pink-500/20">
                                        <p className="text-xs text-pink-500 uppercase tracking-wider mb-1">→ Socios Fundadores</p>
                                        <p className="text-2xl font-bold text-pink-400">{csvResult.promoted_to_fundador || 0}</p>
                                    </div>
                                    {csvResult.errors > 0 && (
                                        <div className="p-4 bg-black/50 rounded-lg border border-red-500/20">
                                            <p className="text-xs text-red-500 uppercase tracking-wider mb-1">Errores</p>
                                            <p className="text-2xl font-bold text-red-400">{csvResult.errors}</p>
                                        </div>
                                    )}
                                </div>
                                {csvResult.error_details && csvResult.error_details.length > 0 && (
                                    <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg max-h-32 overflow-y-auto">
                                        <p className="text-xs text-red-400 font-bold mb-1">Detalles de errores:</p>
                                        {csvResult.error_details.map((e: string, i: number) => (
                                            <p key={i} className="text-xs text-red-300/70">{e}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {csvResult?.error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
                                <p className="text-red-400 font-bold">Error: {csvResult.error}</p>
                            </div>
                        )}

                        {/* Huesped Stats */}
                        {(() => {
                            // Auto-fetch stats on mount
                            if (!huespedStats && !csvUploading) {
                                fetch('/api/admin/huespedes/stats')
                                    .then(r => r.json())
                                    .then(setHuespedStats)
                                    .catch(() => { });
                            }
                            return null;
                        })()}
                        {huespedStats && (
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-8">
                                <h3 className="text-xl font-bold text-white mb-4 font-['Arial'] flex items-center gap-2">
                                    <Database size={20} className="text-yellow-400" /> Base de Datos Histórica
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="p-4 bg-black/50 rounded-lg border border-zinc-800 text-center">
                                        <p className="text-3xl font-bold text-white">{huespedStats.total_registros || 0}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Registros totales</p>
                                    </div>
                                    <div className="p-4 bg-black/50 rounded-lg border border-zinc-800 text-center">
                                        <p className="text-3xl font-bold text-emerald-400">{huespedStats.huespedes_unicos || 0}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Huéspedes únicos</p>
                                    </div>
                                    <div className="p-4 bg-black/50 rounded-lg border border-zinc-800 text-center">
                                        <p className="text-3xl font-bold text-blue-400">{huespedStats.vinculados_saas || 0}</p>
                                        <p className="text-xs text-zinc-500 mt-1">Vinculados SaaS</p>
                                    </div>
                                    <div className="p-4 bg-black/50 rounded-lg border border-zinc-800 text-center">
                                        <p className="text-3xl font-bold text-yellow-400">
                                            {huespedStats.canales_top ? Object.keys(huespedStats.canales_top).length : 0}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">Canales de origen</p>
                                    </div>
                                </div>
                                {huespedStats.canales_top && Object.keys(huespedStats.canales_top).length > 0 && (
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Top Canales de Origen</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(huespedStats.canales_top)
                                                .sort((a: any, b: any) => b[1] - a[1])
                                                .map(([canal, cnt]: any) => (
                                                    <span key={canal} className="px-3 py-1.5 bg-zinc-800 rounded-full text-sm">
                                                        <span className="text-white font-medium">{canal}</span>
                                                        <span className="text-zinc-500 ml-1.5">({cnt})</span>
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Format Guide */}
                        <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                            <h4 className="text-white font-bold text-sm mb-3 font-['Arial']">📋 Formato esperado del CSV</h4>
                            <div className="bg-black/80 p-4 rounded-lg font-mono text-xs text-zinc-400 overflow-x-auto">
                                <p className="text-emerald-400">nombre,dni,procedencia,canal_origen,fecha_reserva</p>
                                <p>Juan Pérez,35123456,CABA,Airbnb,15/01/2024</p>
                                <p>María López,28987654,La Plata,Amigo,22/03/2023</p>
                                <p>Carlos Ruiz,40555888,Rosario,Booking,01/12/2025</p>
                            </div>
                            <p className="text-zinc-600 text-xs mt-3 italic">El sistema auto-detecta columnas por nombre. Los DNI se limpian automáticamente (sin puntos ni guiones). Si un huésped tiene reservas en 2+ años distintos, se lo clasifica como <strong className="text-yellow-400">Socio Fundador</strong>.</p>
                        </div>
                    </div>
                )}

                {/* Prices Management View (NEW) */}
                {view === 'prices' && pricingConfig && (
                    <div className="animate-fade-in-up max-w-5xl">
                        <div className="mb-8">
                            <h2 className="text-[48px] font-normal text-white font-['Arial'] leading-tight">Configuración de Precios y Promos</h2>
                            <p className="text-[22px] text-zinc-400 font-['Calibri'] italic">Gestioná las tarifas base y reglas de descuento automáticas.</p>
                        </div>

                        <div className="space-y-12">
                            {(['compartido', 'privado'] as const).map(rt => (
                                <div key={rt} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                                    <div className="p-8 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                                {rt === 'compartido' ? <Users size={24} /> : <Home size={24} />}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">{rt === 'compartido' ? 'Cabaña Compartida' : 'Cuarto Privado'}</h3>
                                                <p className="text-zinc-500 text-sm">Tarifas y promociones específicas para este tipo de alojamiento.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleSavePricing(rt)}
                                            disabled={pricingSaving}
                                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-50"
                                        >
                                            {pricingSaving ? 'Guardando...' : 'GUARDAR CAMBIOS'}
                                        </button>
                                    </div>

                                    <div className="p-8">
                                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                            {/* Base Price */}
                                            <div className="space-y-4">
                                                <h4 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                                    <Database size={16} className="text-zinc-500" /> Precio Base
                                                </h4>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Monto por {rt === 'compartido' ? 'Cama' : 'Noche'}</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                                                        <input 
                                                            type="number" 
                                                            value={pricingConfig[rt].base_price}
                                                            onChange={(e) => setPricingConfig({
                                                                ...pricingConfig,
                                                                [rt]: { ...pricingConfig[rt], base_price: e.target.value }
                                                            })}
                                                            className="w-full bg-black border border-zinc-800 rounded-xl py-3 pl-8 pr-4 text-white font-bold focus:border-emerald-500 transition-all outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Discount: Nights */}
                                            <div className="space-y-4 col-span-1 lg:col-span-1 border-l border-zinc-800 lg:pl-8">
                                                <h4 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                                    <ClipboardList size={16} className="text-orange-500" /> Descuento estadía
                                                </h4>
                                                {[0, 1, 2].map(i => (
                                                    <div key={i} className="flex items-end gap-2">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] text-zinc-600 uppercase font-bold block mb-1">Mín. Noches</label>
                                                            <input 
                                                                type="number" 
                                                                placeholder="3"
                                                                value={pricingConfig[rt].discount_nights[i]?.min || ''}
                                                                onChange={(e) => {
                                                                    const newArr = [...pricingConfig[rt].discount_nights];
                                                                    newArr[i] = { ...newArr[i], min: parseInt(e.target.value) };
                                                                    if (isNaN(newArr[i].min)) newArr.splice(i, 1);
                                                                    setPricingConfig({ ...pricingConfig, [rt]: { ...pricingConfig[rt], discount_nights: newArr }});
                                                                }}
                                                                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-xs outline-none focus:border-orange-500" 
                                                            />
                                                        </div>
                                                        <div className="w-20">
                                                            <label className="text-[10px] text-zinc-600 uppercase font-bold block mb-1">% Off</label>
                                                            <input 
                                                                type="number" 
                                                                placeholder="15"
                                                                value={pricingConfig[rt].discount_nights[i]?.pct || ''}
                                                                onChange={(e) => {
                                                                    const newArr = [...pricingConfig[rt].discount_nights];
                                                                    newArr[i] = { ...newArr[i], pct: parseInt(e.target.value) };
                                                                    setPricingConfig({ ...pricingConfig, [rt]: { ...pricingConfig[rt], discount_nights: newArr }});
                                                                }}
                                                                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-xs outline-none focus:border-orange-500" 
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Discount: Guests */}
                                            <div className="space-y-4 col-span-1 lg:col-span-1 border-l border-zinc-800 lg:pl-8">
                                                <h4 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                                    <Users size={16} className="text-blue-500" /> Descuento grupo
                                                </h4>
                                                {[0, 1, 2].map(i => (
                                                    <div key={i} className="flex items-end gap-2">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] text-zinc-600 uppercase font-bold block mb-1">Mín. Huéspedes</label>
                                                            <input 
                                                                type="number" 
                                                                placeholder="4"
                                                                value={pricingConfig[rt].discount_guests[i]?.min || ''}
                                                                onChange={(e) => {
                                                                    const newArr = [...pricingConfig[rt].discount_guests];
                                                                    newArr[i] = { ...newArr[i], min: parseInt(e.target.value) };
                                                                    if (isNaN(newArr[i].min)) newArr.splice(i, 1);
                                                                    setPricingConfig({ ...pricingConfig, [rt]: { ...pricingConfig[rt], discount_guests: newArr }});
                                                                }}
                                                                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-xs outline-none focus:border-blue-500" 
                                                            />
                                                        </div>
                                                        <div className="w-20">
                                                            <label className="text-[10px] text-zinc-600 uppercase font-bold block mb-1">% Off</label>
                                                            <input 
                                                                type="number" 
                                                                placeholder="10"
                                                                value={pricingConfig[rt].discount_guests[i]?.pct || ''}
                                                                onChange={(e) => {
                                                                    const newArr = [...pricingConfig[rt].discount_guests];
                                                                    newArr[i] = { ...newArr[i], pct: parseInt(e.target.value) };
                                                                    setPricingConfig({ ...pricingConfig, [rt]: { ...pricingConfig[rt], discount_guests: newArr }});
                                                                }}
                                                                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-xs outline-none focus:border-blue-500" 
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Discount: Lead Time */}
                                            <div className="space-y-4 col-span-1 lg:col-span-1 border-l border-zinc-800 lg:pl-8">
                                                <h4 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                                    <Search size={16} className="text-purple-500" /> Antelación
                                                </h4>
                                                {[0, 1, 2].map(i => (
                                                    <div key={i} className="flex items-end gap-2">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] text-zinc-600 uppercase font-bold block mb-1">Días antes</label>
                                                            <input 
                                                                type="number" 
                                                                placeholder="30"
                                                                value={pricingConfig[rt].discount_lead_time[i]?.min || ''}
                                                                onChange={(e) => {
                                                                    const newArr = [...pricingConfig[rt].discount_lead_time];
                                                                    newArr[i] = { ...newArr[i], min: parseInt(e.target.value) };
                                                                    if (isNaN(newArr[i].min)) newArr.splice(i, 1);
                                                                    setPricingConfig({ ...pricingConfig, [rt]: { ...pricingConfig[rt], discount_lead_time: newArr }});
                                                                }}
                                                                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-xs outline-none focus:border-purple-500" 
                                                            />
                                                        </div>
                                                        <div className="w-20">
                                                            <label className="text-[10px] text-zinc-600 uppercase font-bold block mb-1">% Off</label>
                                                            <input 
                                                                type="number" 
                                                                placeholder="20"
                                                                value={pricingConfig[rt].discount_lead_time[i]?.pct || ''}
                                                                onChange={(e) => {
                                                                    const newArr = [...pricingConfig[rt].discount_lead_time];
                                                                    newArr[i] = { ...newArr[i], pct: parseInt(e.target.value) };
                                                                    setPricingConfig({ ...pricingConfig, [rt]: { ...pricingConfig[rt], discount_lead_time: newArr }});
                                                                }}
                                                                className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-xs outline-none focus:border-purple-500" 
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-zinc-950/30 text-zinc-600 text-[10px] italic flex justify-center border-t border-zinc-800/50">
                                        * Los descuentos se aplican de forma acumulativa en el motor de reservas.
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* Solicitudes View */}
                {view === 'solicitudes' && (
                    <div className="animate-fade-in-up max-w-5xl">
                        <div className="mb-8">
                            <h2 className="text-[48px] font-normal text-white font-['Arial'] leading-tight">Solicitudes</h2>
                            <p className="text-[22px] text-zinc-400 font-['Calibri'] italic">Reservas pendientes de confirmación manual.</p>
                        </div>

                        {/* View Toggle and Actions */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex gap-2">
                                {[
                                    { value: 'PENDIENTE', label: 'Pendientes', color: 'yellow' },
                                    { value: 'CONFIRMADA', label: 'Confirmadas', color: 'emerald' },
                                    { value: 'RECHAZADA', label: 'Rechazadas', color: 'red' },
                                    { value: '', label: 'Todas', color: 'zinc' },
                                ].map(f => (
                                    <button
                                        key={f.value}
                                        onClick={() => { setSolicitudFilter(f.value as any); }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${solicitudFilter === f.value
                                            ? f.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                : f.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : f.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                        : 'bg-zinc-800 text-white border border-zinc-700'
                                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex">
                                    <button 
                                        onClick={() => setSolicitudView('cards')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${solicitudView === 'cards' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        Mosaico
                                    </button>
                                    <button 
                                        onClick={() => setSolicitudView('table')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${solicitudView === 'table' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        Planilla
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowManualForm(true)}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2"
                                >
                                    <Check size={14} /> Nueva Reserva Manual
                                </button>
                                <button
                                    onClick={() => {
                                        // Simple CSV Export matching Google Sheet
                                        const headers = "Marca temporal,Nombre y Apellido,DNI,Email,Teléfono,Check-in,Check-out,Cuarto,Noches,Total";
                                        const rows = solicitudes.map(s => {
                                            return `${new Date(s.created_at).toLocaleString()},"${s.nombre}",${s.dni},${s.email},${s.telefono},${s.check_in},${s.check_out},${s.tipo_habitacion},${s.noches},${s.precio_total}`;
                                        }).join("\n");
                                        const blob = new Blob([headers + "\n" + rows], { type: 'text/csv' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.setAttribute('hidden', '');
                                        a.setAttribute('href', url);
                                        a.setAttribute('download', `reservas_beba_${new Date().toISOString().split('T')[0]}.csv`);
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                    }}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-all border border-zinc-700"
                                >
                                    📥 Exportar CSV
                                </button>
                            </div>
                        </div>

                        {/* Solicitudes List */}
                        {solicitudes.length === 0 ? (
                            <div className="text-center py-20">
                                <ClipboardList size={48} className="text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-500 text-lg">No hay solicitudes {solicitudFilter ? solicitudFilter.toLowerCase() + 's' : ''}.</p>
                                <p className="text-zinc-700 text-sm mt-1 font-['Calibri'] italic">Las nuevas reservas aparecerán aquí cuando los huéspedes envíen solicitudes desde la web.</p>
                            </div>
                        ) : solicitudView === 'cards' ? (
                            <div className="space-y-4">
                                {solicitudes.map((s: any) => (
                                    <div key={s.id} className={`bg-zinc-900/80 border rounded-xl overflow-hidden transition-all ${s.status === 'PENDIENTE' ? 'border-yellow-500/30' :
                                        s.status === 'CONFIRMADA' ? 'border-emerald-500/30' :
                                            'border-red-500/30'
                                        }`}>
                                        <div className="p-5">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${s.status === 'PENDIENTE' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        s.status === 'CONFIRMADA' ? 'bg-emerald-500/20 text-emerald-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {s.status === 'PENDIENTE' ? '⏳' : s.status === 'CONFIRMADA' ? '✅' : '❌'}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold text-base">{s.nombre}</h4>
                                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                            <span>DNI: {s.dni}</span>
                                                            {s.es_historico && (
                                                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/20">
                                                                    🔄 HUÉSPED RECURRENTE
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.status === 'PENDIENTE' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    s.status === 'CONFIRMADA' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {s.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                                <div className="bg-black/30 rounded-lg p-3">
                                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Tipo</p>
                                                    <p className="text-white text-sm font-medium">
                                                        {s.tipo_habitacion === 'privada' ? '🏠 Hab. Privada' : '🛏️ Compartido'}
                                                    </p>
                                                    <div className="flex gap-2 mt-1">
                                                        <span className="text-zinc-600 text-xs">{s.plazas} plaza{s.plazas > 1 ? 's' : ''}</span>
                                                        {s.plataforma && s.plataforma !== 'directo' && (
                                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase">
                                                                {s.plataforma}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="bg-black/30 rounded-lg p-3">
                                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Check-in</p>
                                                    <p className="text-white text-sm font-medium">{new Date(s.check_in).toLocaleDateString('es-AR')}</p>
                                                </div>
                                                <div className="bg-black/30 rounded-lg p-3">
                                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Check-out</p>
                                                    <p className="text-white text-sm font-medium">{new Date(s.check_out).toLocaleDateString('es-AR')}</p>
                                                </div>
                                                <div className="bg-black/30 rounded-lg p-3">
                                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Total</p>
                                                    <p className="text-emerald-400 text-sm font-bold">${Number(s.precio_total).toLocaleString('es-AR')} ARS</p>
                                                    <p className="text-zinc-600 text-xs">{s.noches} noche{s.noches > 1 ? 's' : ''}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-zinc-600 mb-4">
                                                <span>📞 {s.telefono || '—'}</span>
                                                <span>📧 {s.email || '—'}</span>
                                                <span className="ml-auto">{new Date(s.created_at).toLocaleString('es-AR')}</span>
                                            </div>

                                            {s.notas_admin && (
                                                <div className="p-3 bg-zinc-800/50 rounded-lg mb-4 border border-zinc-700/50">
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Notas Admin</p>
                                                    <p className="text-zinc-300 text-sm">{s.notas_admin}</p>
                                                </div>
                                            )}

                                            {/* Action Buttons — only for PENDIENTE */}
                                            {s.status === 'PENDIENTE' && (
                                                <div className="flex gap-2 pt-3 border-t border-zinc-800">
                                                    <button
                                                        onClick={() => handleSolicitudUpdate(s.id, 'CONFIRMADA')}
                                                        disabled={solicitudUpdating === s.id}
                                                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                                    >
                                                        <Check size={16} /> Confirmar Reserva
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const notas = prompt('Motivo del rechazo (opcional):') || '';
                                                            handleSolicitudUpdate(s.id, 'RECHAZADA', notas);
                                                        }}
                                                        disabled={solicitudUpdating === s.id}
                                                        className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white font-bold rounded-lg transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                                                    >
                                                        <XCircle size={16} /> Rechazar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Table View (Planilla) */
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto shadow-2xl">
                                <table className="w-full text-left text-[11px] font-sans border-collapse">
                                    <thead className="bg-zinc-950 text-zinc-500 uppercase font-bold tracking-wider border-b border-zinc-800">
                                        <tr>
                                            <th className="px-4 py-3 border-r border-zinc-800">Marca Temporal</th>
                                            <th className="px-4 py-3 border-r border-zinc-800">Nombre y Apellido</th>
                                            <th className="px-4 py-3 border-r border-zinc-800">DNI</th>
                                            <th className="px-4 py-3 border-r border-zinc-800">Check-in</th>
                                            <th className="px-4 py-3 border-r border-zinc-800">Check-out</th>
                                            <th className="px-4 py-3 border-r border-zinc-800">Cuarto</th>
                                            <th className="px-4 py-3 border-r border-zinc-800">Noches</th>
                                            <th className="px-4 py-3 border-r border-zinc-800 text-emerald-400">Total</th>
                                            <th className="px-4 py-3 border-r border-zinc-800">Estado</th>
                                            <th className="px-4 py-3 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {solicitudes.map((s: any) => (
                                            <tr key={s.id} className="hover:bg-zinc-800/50 transition-colors group">
                                                <td className="px-4 py-2 border-r border-zinc-800 text-zinc-600 whitespace-nowrap">
                                                    {new Date(s.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                                                </td>
                                                <td className="px-4 py-2 border-r border-zinc-800 font-bold text-white whitespace-nowrap">
                                                    {s.nombre}
                                                </td>
                                                <td className="px-4 py-2 border-r border-zinc-800 text-zinc-400">
                                                    {s.dni}
                                                </td>
                                                <td className="px-4 py-2 border-r border-zinc-800 text-zinc-300">
                                                    {new Date(s.check_in).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-2 border-r border-zinc-800 text-zinc-300">
                                                    {new Date(s.check_out).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-2 border-r border-zinc-800 text-zinc-400">
                                                    {s.tipo_habitacion === 'privada' ? '🏠 Privada' : '🛏️ Shared'}
                                                </td>
                                                <td className="px-4 py-2 border-r border-zinc-800 text-center text-zinc-300">
                                                    {s.noches}
                                                </td>
                                                <td className="px-4 py-2 border-r border-zinc-800 font-bold text-emerald-400">
                                                    ${Number(s.precio_total).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2 border-r border-zinc-800 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                        s.status === 'PENDIENTE' ? 'bg-yellow-500/10 text-yellow-500' :
                                                        s.status === 'CONFIRMADA' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        'bg-red-500/10 text-red-400'
                                                    }`}>
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {s.status === 'PENDIENTE' && (
                                                            <>
                                                                <button onClick={() => handleSolicitudUpdate(s.id, 'CONFIRMADA')} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded" title="Confirmar"><Check size={14}/></button>
                                                                <button onClick={() => handleSolicitudUpdate(s.id, 'RECHAZADA')} className="p-1 text-red-500 hover:bg-red-500/10 rounded" title="Rechazar"><X size={14}/></button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                // Copy to clipboard in CSV format for quick pasting
                                                                const text = `"${s.nombre}",${s.dni},${s.check_in},${s.check_out},${s.tipo_habitacion},${s.noches},${s.precio_total}`;
                                                                navigator.clipboard.writeText(text);
                                                                alert('¡Fila copiada al portapapeles! Pegala en el Excel.');
                                                            }}
                                                            className="p-1 text-zinc-500 hover:text-white" title="Copiar fila"><Settings size={12}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Manual Booking Modal (NEW) */}
                {showManualForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-xl p-8 shadow-2xl relative">
                            <button onClick={() => setShowManualForm(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
                                <X size={24} />
                            </button>
                            <h2 className="text-3xl font-bold text-white mb-2 font-['Arial']">Reserva Manual</h2>
                            <p className="text-zinc-500 mb-6 italic">Agregá una reserva que se tomó fuera de la web (Wsp, Airbnb, etc).</p>

                            <form className="space-y-4" onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const checkIn = formData.get('check_in') as string;
                                const checkOut = formData.get('check_out') as string;
                                
                                // Calcular noches
                                const d1 = new Date(checkIn);
                                const d2 = new Date(checkOut);
                                const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
                                const numNights = diff > 0 ? diff : 1;

                                const data = {
                                    nombre: formData.get('nombre'),
                                    dni: formData.get('dni'),
                                    tipo_habitacion: formData.get('cuarto'),
                                    check_in: checkIn,
                                    check_out: checkOut,
                                    noches: numNights,
                                    plazas: (formData.get('cuarto') === 'privada') ? 3 : 1,
                                    precio_total: Number(formData.get('precio_total')),
                                    plataforma: formData.get('plataforma'),
                                    status: 'CONFIRMADA'
                                };

                                try {
                                    const res = await fetch('/api/solicitudes', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(data),
                                    });
                                    if (res.ok) {
                                        setShowManualForm(false);
                                        fetchSolicitudes();
                                        alert('Reserva manual guardada y unificada.');
                                    } else {
                                        const err = await res.text();
                                        alert('Error del servidor: ' + err);
                                    }
                                } catch (err) {
                                    alert('Error al guardar reserva.');
                                }
                            }}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Nombre Completo</label>
                                        <input name="nombre" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">DNI / Pasaporte</label>
                                        <input name="dni" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Plataforma Origen</label>
                                        <select name="plataforma" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500">
                                            <option value="WhatsApp">WhatsApp</option>
                                            <option value="Airbnb">Airbnb</option>
                                            <option value="HostelWorld">HostelWorld</option>
                                            <option value="Manual">Carga Manual</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Ingreso</label>
                                        <input name="check_in" type="date" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Egreso</label>
                                        <input name="check_out" type="date" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Habitación</label>
                                        <select name="cuarto" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500">
                                            <option value="compartido">🛏️ Compartido</option>
                                            <option value="privada">🏠 Privada</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Total Cobrado ($)</label>
                                        <input name="precio_total" type="number" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-emerald-900/20 mt-4">
                                    CONFIRMAR Y AGREGAR A PLANILLA
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Beds Management View */}
                {view === 'beds' && (
                    <AdminBedManager />
                )}

                {/* Prices & Promos View */}
                {view === 'prices' && pricingConfig && (
                    <div className="animate-fade-in-up pb-20">
                        <h2 className="text-3xl font-black text-white mb-8">Configuración de Precios y Promociones</h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {['compartido', 'privado'].map((type) => (
                                <div key={type} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                        {type === 'compartido' ? '🛏️ Cabaña Compartida' : '🏠 Cuarto Privado'}
                                    </h3>

                                    {/* Base Price */}
                                    <div className="mb-8 p-6 bg-zinc-950 rounded-2xl border border-zinc-800">
                                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 block">Precio Base ({type === 'compartido' ? 'por cama' : 'por noche'})</label>
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl text-zinc-500">$</span>
                                            <input 
                                                type="number" 
                                                value={pricingConfig[type].base_price}
                                                onChange={(e) => {
                                                    const newConf = { ...pricingConfig };
                                                    newConf[type].base_price = e.target.value;
                                                    setPricingConfig(newConf);
                                                }}
                                                className="bg-transparent text-4xl font-black text-white outline-none w-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Discount Tiers */}
                                    <div className="space-y-6">
                                        {/* Nights tiers */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">% Desc. por cantidad de noches</h4>
                                                <button onClick={() => {
                                                    const newConf = { ...pricingConfig };
                                                    newConf[type].discount_nights.push({ min: 1, pct: 5 });
                                                    setPricingConfig(newConf);
                                                }} className="p-1 hover:bg-zinc-800 rounded text-emerald-400"><Plus size={16}/></button>
                                            </div>
                                            <div className="space-y-2">
                                                {pricingConfig[type].discount_nights.map((tier: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                                        <span className="text-xs text-zinc-500">Min:</span>
                                                        <input type="number" value={tier.min} onChange={(e) => {
                                                            const newConf = { ...pricingConfig };
                                                            newConf[type].discount_nights[idx].min = Number(e.target.value);
                                                            setPricingConfig(newConf);
                                                        }} className="w-12 bg-transparent text-white text-sm font-bold outline-none border-b border-zinc-700 focus:border-emerald-500" />
                                                        <span className="text-xs text-zinc-500">noches →</span>
                                                        <input type="number" value={tier.pct} onChange={(e) => {
                                                            const newConf = { ...pricingConfig };
                                                            newConf[type].discount_nights[idx].pct = Number(e.target.value);
                                                            setPricingConfig(newConf);
                                                        }} className="w-12 bg-transparent text-emerald-400 text-sm font-black outline-none border-b border-zinc-700 focus:border-emerald-500" />
                                                        <span className="text-xs text-emerald-500">% Desc.</span>
                                                        <button onClick={() => {
                                                            const newConf = { ...pricingConfig };
                                                            newConf[type].discount_nights.splice(idx, 1);
                                                            setPricingConfig(newConf);
                                                        }} className="ml-auto text-zinc-600 hover:text-red-400"><X size={14}/></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Guests tiers */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">% Desc. por Huéspedes</h4>
                                                <button onClick={() => {
                                                    const newConf = { ...pricingConfig };
                                                    newConf[type].discount_guests.push({ min: 2, pct: 5 });
                                                    setPricingConfig(newConf);
                                                }} className="p-1 hover:bg-zinc-800 rounded text-emerald-400"><Plus size={16}/></button>
                                            </div>
                                            <div className="space-y-2">
                                                {pricingConfig[type].discount_guests.map((tier: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                                        <span className="text-xs text-zinc-500">Min:</span>
                                                        <input type="number" value={tier.min} onChange={(e) => {
                                                            const newConf = { ...pricingConfig };
                                                            newConf[type].discount_guests[idx].min = Number(e.target.value);
                                                            setPricingConfig(newConf);
                                                        }} className="w-12 bg-transparent text-white text-sm font-bold outline-none border-b border-zinc-700 focus:border-emerald-500" />
                                                        <span className="text-xs text-zinc-500">pers. →</span>
                                                        <input type="number" value={tier.pct} onChange={(e) => {
                                                            const newConf = { ...pricingConfig };
                                                            newConf[type].discount_guests[idx].pct = Number(e.target.value);
                                                            setPricingConfig(newConf);
                                                        }} className="w-12 bg-transparent text-emerald-400 text-sm font-black outline-none border-b border-zinc-700 focus:border-emerald-500" />
                                                        <span className="text-xs text-emerald-500">% Desc.</span>
                                                        <button onClick={() => {
                                                            const newConf = { ...pricingConfig };
                                                            newConf[type].discount_guests.splice(idx, 1);
                                                            setPricingConfig(newConf);
                                                        }} className="ml-auto text-zinc-600 hover:text-red-400"><X size={14}/></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Lead Time tiers */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">% Desc. por Antelación</h4>
                                                <button onClick={() => {
                                                    const newConf = { ...pricingConfig };
                                                    newConf[type].discount_lead_time.push({ min: 30, pct: 10 });
                                                    setPricingConfig(newConf);
                                                }} className="p-1 hover:bg-zinc-800 rounded text-emerald-400"><Plus size={16}/></button>
                                            </div>
                                            <div className="space-y-2">
                                                {pricingConfig[type].discount_lead_time.map((tier: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                                        <span className="text-xs text-zinc-500">Min:</span>
                                                        <input type="number" value={tier.min} onChange={(e) => {
                                                            const newConf = { ...pricingConfig };
                                                            newConf[type].discount_lead_time[idx].min = Number(e.target.value);
                                                            setPricingConfig(newConf);
                                                        }} className="w-12 bg-transparent text-white text-sm font-bold outline-none border-b border-zinc-700 focus:border-emerald-500" />
                                                        <span className="text-xs text-zinc-500">días antes →</span>
                                                        <input type="number" value={tier.pct} onChange={(e) => {
                                                            const newConf = { ...pricingConfig };
                                                            newConf[type].discount_lead_time[idx].pct = Number(e.target.value);
                                                            setPricingConfig(newConf);
                                                        }} className="w-12 bg-transparent text-emerald-400 text-sm font-black outline-none border-b border-zinc-700 focus:border-emerald-500" />
                                                        <span className="text-xs text-emerald-500">% Desc.</span>
                                                        <button onClick={() => {
                                                            const newConf = { ...pricingConfig };
                                                            newConf[type].discount_lead_time.splice(idx, 1);
                                                            setPricingConfig(newConf);
                                                        }} className="ml-auto text-zinc-600 hover:text-red-400"><X size={14}/></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSavePricing(type as any)}
                                        disabled={pricingSaving}
                                        className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {pricingSaving ? 'Guardando...' : `Guardar Cambios ${type === 'privado' ? 'Privado' : 'Compartido'}`}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
                            <X size={24} />
                        </button>

                        {/* Header */}
                        <h2 className="text-[48px] font-['Arial'] text-white leading-tight mb-6">{selectedUser.full_name}</h2>

                        {/* History Stats */}
                        <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-8 p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                            <div>
                                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 font-bold">DNI</p>
                                <p className="text-[22px] font-['Calibri'] italic text-white flex items-center gap-2">
                                    {selectedUser.dni || '-'}
                                    {userHistory.length > 0 && <span className="text-xs not-italic bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">Verificado</span>}
                                </p>
                            </div>
                            <div>
                                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 font-bold">Frecuencia Histórica</p>
                                <p className="text-[22px] font-['Calibri'] italic text-white">
                                    {historyLoading ? '...' : `${userHistory.length} visitas reg.`}
                                </p>
                            </div>
                            <div>
                                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 font-bold">Procedencia</p>
                                <p className="text-[22px] font-['Calibri'] italic text-white">
                                    {historyLoading ? '...' : (userHistory[0]?.procedencia || 'Sin datos')}
                                </p>
                            </div>
                            <div>
                                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 font-bold">Canal de Origen</p>
                                <p className="text-[22px] font-['Calibri'] italic text-white">
                                    {historyLoading ? '...' : (userHistory[0]?.canal_origen || 'Sin datos')}
                                </p>
                            </div>
                        </div>

                        {/* Category Edit */}
                        <div className="mb-8">
                            <label className="text-zinc-500 text-xs uppercase tracking-wider mb-2 block font-bold">Categoría de Socio</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full appearance-none bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium"
                                    >
                                        <option value="USER">Invitado (Default)</option>
                                        <option value="HUESPED_RECURRENTE">Huésped Recurrente</option>
                                        <option value="SOCIO_FUNDADOR">Socio Fundador</option>
                                        <option value="ADMIN">Administrador</option>
                                        <option value="VIP">VIP / Amigo</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                                <button
                                    onClick={handleUpdateRole}
                                    disabled={roleUpdating || newRole === selectedUser.role}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                                >
                                    {roleUpdating ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                            <p className="text-zinc-600 text-xs mt-2 italic">
                                * "Socio Fundador" activa token y beneficios en el perfil del usuario.
                            </p>
                        </div>

                        {/* Contact Actions */}
                        <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-8">
                            <a
                                href={`mailto:${selectedUser.email}?subject=Contacto La Beba&body=Hola ${selectedUser.full_name},`}
                                className="flex items-center justify-center gap-2 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors font-medium border border-zinc-800 hover:border-zinc-700"
                            >
                                <Mail size={20} className="text-zinc-400" /> Nuevo Correo
                            </a>
                            <a
                                href={`https://wa.me/${selectedUser.phone?.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 py-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl transition-colors font-medium border border-[#25D366]/20"
                            >
                                <MessageCircle size={20} /> WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            )}
            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
                            <X size={24} />
                        </button>

                        {/* Header */}
                        <h2 className="text-[48px] font-['Arial'] text-white leading-tight mb-6">{selectedUser.full_name}</h2>

                        {/* History Stats */}
                        <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-8 p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                            <div>
                                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 font-bold">DNI</p>
                                <p className="text-[22px] font-['Calibri'] italic text-white flex items-center gap-2">
                                    {selectedUser.dni || '-'}
                                    {userHistory.length > 0 && <span className="text-xs not-italic bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">Verificado</span>}
                                </p>
                            </div>
                            <div>
                                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 font-bold">Frecuencia Histórica</p>
                                <p className="text-[22px] font-['Calibri'] italic text-white">
                                    {historyLoading ? '...' : `${userHistory.length} visitas reg.`}
                                </p>
                            </div>
                            <div>
                                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 font-bold">Procedencia</p>
                                <p className="text-[22px] font-['Calibri'] italic text-white">
                                    {historyLoading ? '...' : (userHistory[0]?.procedencia || 'Sin datos')}
                                </p>
                            </div>
                            <div>
                                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 font-bold">Canal de Origen</p>
                                <p className="text-[22px] font-['Calibri'] italic text-white">
                                    {historyLoading ? '...' : (userHistory[0]?.canal_origen || 'Sin datos')}
                                </p>
                            </div>
                        </div>

                        {/* Category Edit */}
                        <div className="mb-8">
                            <label className="text-zinc-500 text-xs uppercase tracking-wider mb-2 block font-bold">Categoría de Socio</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full appearance-none bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium"
                                    >
                                        <option value="USER">Invitado (Default)</option>
                                        <option value="HUESPED_RECURRENTE">Huésped Recurrente</option>
                                        <option value="SOCIO_FUNDADOR">Socio Fundador</option>
                                        <option value="ADMIN">Administrador</option>
                                        <option value="VIP">VIP / Amigo</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                                <button
                                    onClick={handleUpdateRole}
                                    disabled={roleUpdating || newRole === selectedUser.role}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                                >
                                    {roleUpdating ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                            <p className="text-zinc-600 text-xs mt-2 italic">
                                * "Socio Fundador" activa token y beneficios en el perfil del usuario.
                            </p>
                        </div>

                        {/* Contact Actions */}
                        <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-8">
                            <a
                                href={`mailto:${selectedUser.email}?subject=Contacto La Beba&body=Hola ${selectedUser.full_name},`}
                                className="flex items-center justify-center gap-2 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors font-medium border border-zinc-800 hover:border-zinc-700"
                            >
                                <Mail size={20} className="text-zinc-400" /> Nuevo Correo
                            </a>
                            <a
                                href={`https://wa.me/${selectedUser.phone?.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 py-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl transition-colors font-medium border border-[#25D366]/20"
                            >
                                <MessageCircle size={20} /> WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
