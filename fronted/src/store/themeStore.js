import { create } from 'zustand';

const useThemeStore = create((set) => ({
    theme: 'light', // 'light' o 'dark'

    // Inicializar tema desde localStorage
    init: () => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') || 'light';

            // Aplicar clase al documento
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            set({ theme: savedTheme });
        }
    },

    // Cambiar tema
    toggleTheme: () => {
        set((state) => {
            const newTheme = state.theme === 'light' ? 'dark' : 'light';

            // Guardar en localStorage
            localStorage.setItem('theme', newTheme);

            // Aplicar clase al documento
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            return { theme: newTheme };
        });
    },

    // Establecer tema específico
    setTheme: (theme) => {
        localStorage.setItem('theme', theme);

        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        set({ theme });
    },
}));

export default useThemeStore;