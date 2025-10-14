import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
                                     title,
                                     value,
                                     icon: Icon,
                                     trend,
                                     trendUp = true,
                                     color = 'purple'
                                 }) {
    const colorClasses = {
        purple: 'bg-purple-100 text-purple-600',
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        orange: 'bg-orange-100 text-orange-600',
        red: 'bg-red-100 text-red-600',
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
                {trend && (
                    <div className={`flex items-center space-x-1 text-sm font-semibold ${
                        trendUp ? 'text-green-600' : 'text-red-600'
                    }`}>
                        {trendUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span>{trend}</span>
                    </div>
                )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
    );
}