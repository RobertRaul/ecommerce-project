'use client';

import { useEffect } from 'react';

export default function DebugNotifications() {
    useEffect(() => {
        console.log('✅ DebugNotifications MONTADO');
        console.log('🔐 Token:', localStorage.getItem('access_token') ? 'SÍ' : 'NO');
        console.log('📍 URL:', window.location.href);
        console.log('🌐 Host:', window.location.host);
    }, []);

    return null; // No renderiza nada, solo debuguea
}