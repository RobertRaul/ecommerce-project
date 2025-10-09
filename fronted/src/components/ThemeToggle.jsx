import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import useThemeStore from '@/store/themeStore';

export default function ThemeToggle() {
    const { theme, toggleTheme, init } = useThemeStore();

    useEffect(() => {
        init();
    }, [init]);

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        >
            {theme === 'light' ? (
                <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            ) : (
                <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            )}
        </button>
    );
}