'use client';


import { useState, useEffect } from 'react';
import { Settings, Store, Mail, Truck, CreditCard, Save, Plus, Edit, Trash2, X } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ConfiguracionPage() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [shippingZones, setShippingZones] = useState([]);
    const [showShippingModal, setShowShippingModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDeleteZoneModal, setShowDeleteZoneModal] = useState(false);
    const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
    const [zoneToDelete, setZoneToDelete] = useState(null);
    const [paymentToDelete, setPaymentToDelete] = useState(null);
    const [editingZone, setEditingZone] = useState(null);
    const [editingPayment, setEditingPayment] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);

    const [newPaymentMethod, setNewPaymentMethod] = useState({
        name: '',
        code: '',
        description: '',
        icon: '💳',
        requires_proof: false
    });

    useEffect(() => {
        if (activeTab === 'envio') {
            fetchShippingZones();
        } else if (activeTab === 'pago') {
            fetchPaymentMethods();
        }
    }, [activeTab]);

    const fetchShippingZones = async () => {
        try {
            const response = await api.get('/shipping-zones/');
            const data = response.data.results || response.data;
            setShippingZones(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar zonas de envío');
            setShippingZones([]);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const response = await api.get('/payment-methods/');
            const data = response.data.results || response.data;
            setPaymentMethods(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar métodos de pago');
            setPaymentMethods([]);
        }
    };

    const handleSaveShippingZone = async (zoneData) => {
        try {
            if (editingZone) {
                await api.patch(`/shipping-zones/${editingZone.id}/`, zoneData);
                toast.success('Zona actualizada');
            } else {
                await api.post('/shipping-zones/', zoneData);
                toast.success('Zona creada');
            }
            fetchShippingZones();
            setShowShippingModal(false);
            setEditingZone(null);
        } catch (error) {
            toast.error('Error al guardar zona');
        }
    };

    const handleDeleteZone = (zone) => {
        setZoneToDelete(zone);
        setShowDeleteZoneModal(true);
    };

    const confirmDeleteZone = async () => {
        try {
            await api.delete(`/shipping-zones/${zoneToDelete.id}/`);
            toast.success('Zona eliminada exitosamente');
            fetchShippingZones();
            setShowDeleteZoneModal(false);
            setZoneToDelete(null);
        } catch (error) {
            toast.error('Error al eliminar zona');
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Configuración guardada exitosamente');
        } catch (error) {
            toast.error('Error al guardar configuración');
        } finally {
            setLoading(false);
        }
    };

    const togglePaymentMethod = async (method) => {
        try {
            await api.patch(`/payment-methods/${method.id}/`, {
                is_enabled: !method.is_enabled
            });
            toast.success(method.is_enabled ? 'Método deshabilitado' : 'Método habilitado');
            fetchPaymentMethods();
        } catch (error) {
            toast.error('Error al actualizar método');
            console.error('Error:', error);
        }
    };

    const handleSavePaymentMethod = async (methodData) => {
        try {
            if (editingPayment) {
                await api.patch(`/payment-methods/${editingPayment.id}/`, methodData);
                toast.success('Método actualizado');
            } else {
                await api.post('/payment-methods/', methodData);
                toast.success('Método creado');
            }
            fetchPaymentMethods();
            setShowPaymentModal(false);
            setEditingPayment(null);
            setNewPaymentMethod({ name: '', code: '', description: '', icon: '💳', requires_proof: false });
        } catch (error) {
            const errorMsg = error.response?.data?.code?.[0] || error.response?.data?.name?.[0] || 'Error al guardar método';
            toast.error(errorMsg);
            console.error('Error:', error);
        }
    };

    const handleAddPaymentMethod = () => {
        if (!newPaymentMethod.name.trim()) {
            toast.error('El nombre es requerido');
            return;
        }
        if (!newPaymentMethod.code.trim()) {
            toast.error('El código es requerido');
            return;
        }
        handleSavePaymentMethod({
            name: newPaymentMethod.name,
            code: newPaymentMethod.code.toLowerCase().replace(/\s+/g, '_'),
            description: newPaymentMethod.description,
            icon: newPaymentMethod.icon,
            requires_proof: newPaymentMethod.requires_proof,
            is_enabled: true,
            display_order: paymentMethods.length + 1
        });
    };

    const handleDeletePaymentMethod = (method) => {
        setPaymentToDelete(method);
        setShowDeletePaymentModal(true);
    };

    const confirmDeletePaymentMethod = async () => {
        try {
            await api.delete(`/payment-methods/${paymentToDelete.id}/`);
            toast.success('Método eliminado');
            fetchPaymentMethods();
            setShowDeletePaymentModal(false);
            setPaymentToDelete(null);
        } catch (error) {
            toast.error('Error al eliminar método');
            console.error('Error:', error);
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Store },
        { id: 'email', label: 'Email', icon: Mail },
        { id: 'envio', label: 'Envío', icon: Truck },
        { id: 'pago', label: 'Pagos', icon: CreditCard },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
                        <p className="text-gray-600 mt-1">Administra los ajustes de tu tienda</p>
                    </div>
                    <button onClick={handleSave} disabled={loading} className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 shadow-lg">
                        <Save className="h-5 w-5" />
                        <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition ${activeTab === tab.id ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                        <Icon className="h-5 w-5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-gray-900">Información General</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Tienda</label>
                                        <input type="text" defaultValue="Mi Ecommerce" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contacto</label>
                                        <input type="email" defaultValue="contacto@tienda.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                                        <input type="tel" defaultValue="+51 999 999 999" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                                        <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                                            <option value="PEN">PEN - Soles Peruanos</option>
                                            <option value="USD">USD - Dólares</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                                        <textarea rows={3} defaultValue="Av. Principal 123, Lima, Perú" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'email' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-gray-900">Configuración de Email</h2>
                                <p className="text-gray-600">Configura el servidor SMTP para envío de emails automáticos</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Servidor SMTP</label>
                                        <input type="text" placeholder="smtp.gmail.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Puerto</label>
                                        <input type="number" placeholder="587" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                                        <input type="email" placeholder="tu-email@gmail.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                                        <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'envio' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Configuración de Envío</h2>
                                        <p className="text-gray-600">Gestiona las zonas y costos de envío</p>
                                    </div>
                                    <button onClick={() => { setEditingZone(null); setShowShippingModal(true); }} className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition">
                                        <Plus className="h-5 w-5" />
                                        <span>Agregar Zona</span>
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    {shippingZones.map((zone) => (
                                        <div key={zone.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-500 transition">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                                                <p className="text-sm text-gray-500">
                                                    Envío: S/ {zone.cost} | Gratis desde: S/ {zone.free_shipping_threshold || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => { setEditingZone(zone); setShowShippingModal(true); }} className="text-purple-600 hover:text-purple-700 font-medium p-2">
                                                    <Edit className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleDeleteZone(zone)} className="text-red-600 hover:text-red-700 font-medium p-2">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {shippingZones.length === 0 && (
                                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                                            <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                            <p className="text-gray-600">No hay zonas de envío configuradas</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'pago' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Métodos de Pago</h2>
                                        <p className="text-gray-600">Activa o desactiva los métodos de pago disponibles</p>
                                    </div>
                                    <button onClick={() => { setEditingPayment(null); setNewPaymentMethod({ name: '', code: '', description: '', icon: '💳', requires_proof: false }); setShowPaymentModal(true); }} className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition">
                                        <Plus className="h-5 w-5" />
                                        <span>Agregar Método</span>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {paymentMethods.map((method) => (
                                        <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    checked={method.is_enabled}
                                                    onChange={() => togglePaymentMethod(method)}
                                                    className="w-5 h-5 text-purple-600 rounded cursor-pointer"
                                                />
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-2xl">{method.icon || '💳'}</span>
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <h3 className="font-semibold text-gray-900">{method.name}</h3>
                                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{method.code}</span>
                                                            {method.requires_proof && (
                                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Req. comprobante</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500">{method.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => { setEditingPayment(method); setNewPaymentMethod({ name: method.name, code: method.code, description: method.description, icon: method.icon || '💳', requires_proof: method.requires_proof }); setShowPaymentModal(true); }} className="text-purple-600 hover:text-purple-700 font-medium p-2">
                                                    <Edit className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleDeletePaymentMethod(method)} className="text-red-600 hover:text-red-700 font-medium p-2">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {paymentMethods.length === 0 && (
                                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                                            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                            <p className="text-gray-600">No hay métodos de pago configurados</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Shipping Zone Modal */}
            {showShippingModal && (
                <ShippingZoneModal
                    zone={editingZone}
                    onClose={() => { setShowShippingModal(false); setEditingZone(null); }}
                    onSave={handleSaveShippingZone}
                />
            )}

            {/* Payment Method Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{editingPayment ? 'Editar' : 'Agregar'} Método de Pago</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Método *</label>
                                <input type="text" value={newPaymentMethod.name} onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, name: e.target.value }))} placeholder="Ej: PagoEfectivo" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Código *</label>
                                <input
                                    type="text"
                                    value={newPaymentMethod.code}
                                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, code: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                                    placeholder="Ej: pago_efectivo"
                                    disabled={editingPayment}
                                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${editingPayment ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                                <p className="text-xs text-gray-500 mt-1">Solo letras minúsculas, números y guiones bajos</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                                <textarea value={newPaymentMethod.description} onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, description: e.target.value }))} rows={3} placeholder="Describe el método de pago..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Icono (emoji)</label>
                                <input type="text" value={newPaymentMethod.icon} onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, icon: e.target.value }))} placeholder="💳" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="requires_proof"
                                    checked={newPaymentMethod.requires_proof}
                                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, requires_proof: e.target.checked }))}
                                    className="w-5 h-5 text-purple-600 rounded"
                                />
                                <label htmlFor="requires_proof" className="text-sm font-medium text-gray-900">
                                    Requiere comprobante de pago
                                </label>
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all">Cancelar</button>
                            <button onClick={handleAddPaymentMethod} className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 shadow-lg transition-all">{editingPayment ? 'Actualizar' : 'Agregar'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Zone Confirmation Modal */}
            {showDeleteZoneModal && (
                <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteZoneModal(false)}>
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start space-x-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <Truck className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Zona de Envío</h3>
                                <p className="text-gray-600 text-sm">
                                    ¿Estás seguro de que deseas eliminar la zona "<strong>{zoneToDelete?.name}</strong>"?
                                </p>
                                <p className="text-gray-500 text-xs mt-2">
                                    Los clientes de esta zona no podrán realizar compras hasta que agregues una nueva zona.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex space-x-3 mt-6">
                            <button onClick={() => setShowDeleteZoneModal(false)} className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all">Cancelar</button>
                            <button onClick={confirmDeleteZone} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 shadow-lg transition-all">Eliminar Zona</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Payment Method Confirmation Modal */}
            {showDeletePaymentModal && (
                <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeletePaymentModal(false)}>
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start space-x-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <CreditCard className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Método de Pago</h3>
                                <p className="text-gray-600 text-sm">
                                    ¿Estás seguro de que deseas eliminar el método "<strong>{paymentToDelete?.name}</strong>"?
                                </p>
                                <p className="text-gray-500 text-xs mt-2">
                                    Los clientes no podrán usar este método para realizar pagos.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex space-x-3 mt-6">
                            <button onClick={() => setShowDeletePaymentModal(false)} className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all">Cancelar</button>
                            <button onClick={confirmDeletePaymentMethod} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 shadow-lg transition-all">Eliminar Método</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function ShippingZoneModal({ zone, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: zone?.name || '',
        cost: zone?.cost || '',
        free_shipping_threshold: zone?.free_shipping_threshold || '',
        estimated_days: zone?.estimated_days || '',
        is_active: zone?.is_active ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{zone ? 'Editar' : 'Nueva'} Zona de Envío</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Zona</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Ej: Lima Metropolitana" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Costo de Envío (S/)</label>
                            <input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))} placeholder="10.00" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Envío Gratis Desde</label>
                            <input type="number" step="0.01" value={formData.free_shipping_threshold} onChange={(e) => setFormData(prev => ({ ...prev, free_shipping_threshold: e.target.value }))} placeholder="100.00" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Días Estimados</label>
                        <input type="text" value={formData.estimated_days} onChange={(e) => setFormData(prev => ({ ...prev, estimated_days: e.target.value }))} placeholder="2-3 días" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))} className="w-5 h-5 text-purple-600 rounded" />
                        <span className="text-sm font-medium text-gray-900">Zona Activa</span>
                    </label>

                    <div className="flex space-x-3 mt-6">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 shadow-lg transition-all">{zone ? 'Actualizar' : 'Crear'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
