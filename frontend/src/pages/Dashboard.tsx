import React, { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import { Moon, Sun, LogOut, TrendingUp, Wallet, Bell } from 'lucide-react';

interface Price {
    symbol: string;
    price: string;
}

interface Coin {
    symbol: string;
    quantity: number;
    buyPrice: number;
}

interface Portfolio {
    userId: string;
    totalValue: number;
    alertsEnabled: boolean;
    alertThreshold?: number;
    coins: Coin[];
}

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [prices, setPrices] = useState<Price[]>([]);
    const [searchResults, setSearchResults] = useState<Price[]>([]);
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [darkMode, setDarkMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [liveValue, setLiveValue] = useState(0);
    const [profit, setProfit] = useState(0);

    // Toggle Dark Mode
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                const portfolioRes = await api.get('/portfolio-service/portfolio');
                setPortfolio(portfolioRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    // Search API Effect
    useEffect(() => {
        const search = async () => {
            if (!searchTerm) {
                setSearchResults([]);
                return;
            }
            try {
                const res = await api.get(`/price-service/prices/search?q=${searchTerm}`);
                setSearchResults(res.data);
            } catch (error) {
                console.error('Search error:', error);
            }
        };

        const timeoutId = setTimeout(search, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // WebSocket Connection
    useEffect(() => {
        const socket = io('http://localhost:3005');

        socket.on('connect', () => {
            console.log('Connected to WebSocket');
            if (user?.id) {
                socket.emit('join', user.id);
            }
        });

        socket.on('price_update', (data: Price[]) => {
            setPrices(data); // Show all prices
        });

        socket.on('portfolio_update', (data: Partial<Portfolio>) => {
            console.log('Portfolio Update:', data);
            setPortfolio(prev => prev ? { ...prev, ...data } : data as Portfolio);
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    // Calculate Live Portfolio Value and Profit
    useEffect(() => {
        if (!portfolio || !portfolio.coins || prices.length === 0) return;

        let currentTotal = 0;
        let totalInvested = 0;

        portfolio.coins.forEach(coin => {
            const priceData = prices.find(p => p.symbol === coin.symbol);
            const currentPrice = priceData ? parseFloat(priceData.price) : 0;

            if (currentPrice > 0) {
                currentTotal += coin.quantity * currentPrice;
            }
            totalInvested += coin.quantity * coin.buyPrice;
        });

        setLiveValue(currentTotal);
        setProfit(currentTotal - totalInvested);

    }, [portfolio, prices]);

    const handleAddCoin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const symbol = (formData.get('symbol') as string).toUpperCase();
        const quantity = formData.get('quantity');
        const buyPrice = formData.get('buyPrice');

        try {
            await api.post('/portfolio-service/portfolio/add', { symbol, quantity, buyPrice });
            const res = await api.get('/portfolio-service/portfolio');
            setPortfolio(res.data);
            e.currentTarget.reset();
        } catch (error) {
            alert('Failed to add coin');
        }
    };

    const toggleAlerts = async () => {
        if (!portfolio) return;
        try {
            const newStatus = !portfolio.alertsEnabled;
            // If enabling, prompt for threshold if not set
            let threshold = portfolio.alertThreshold || 0;
            if (newStatus) {
                const input = prompt("Enter minimum portfolio value for alerts ($):", threshold.toString());
                if (input === null) return; // Cancelled
                threshold = parseFloat(input) || 0;
            }

            await api.put('/portfolio-service/portfolio/settings', {
                alertsEnabled: newStatus,
                alertThreshold: threshold
            });
            setPortfolio(prev => prev ? { ...prev, alertsEnabled: newStatus, alertThreshold: threshold } : null);
        } catch (error) {
            console.error('Failed to update settings');
        }
    };

    const displayPrices = searchTerm ? searchResults : prices;

    return (
        <div className="min-h-screen p-6 transition-colors duration-200 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <TrendingUp className="text-blue-500" /> Crypto Tracker
                </h1>
                <div className="flex items-center gap-4">
                    <span className="font-medium">Welcome, {user?.name}</span>
                    <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button onClick={logout} className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Portfolio Section */}
                <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800 lg:col-span-1">
                    <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
                        <Wallet className="text-green-500" /> Your Portfolio
                    </h2>
                    {portfolio ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    ${liveValue > 0 ? liveValue.toFixed(2) : Number(portfolio.totalValue || 0).toFixed(2)}
                                </p>
                                <div className={`mt-2 text-sm font-medium ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {profit >= 0 ? '+' : ''}{profit.toFixed(2)} ({liveValue > 0 ? ((profit / (liveValue - profit)) * 100).toFixed(2) : '0.00'}%)
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium block">Email Alerts</span>
                                    {portfolio.alertsEnabled && (
                                        <span className="text-xs text-gray-500">Threshold: ${portfolio.alertThreshold}</span>
                                    )}
                                </div>
                                <button
                                    onClick={toggleAlerts}
                                    className={`p-2 rounded-full ${portfolio.alertsEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                                >
                                    <Bell size={20} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold">Holdings</h3>
                                <ul className="space-y-2 max-h-60 overflow-y-auto">
                                    {portfolio.coins?.map((coin, idx) => {
                                        const priceData = prices.find(p => p.symbol === coin.symbol);
                                        const currentPrice = priceData ? parseFloat(priceData.price) : 0;
                                        const coinValue = currentPrice * coin.quantity;
                                        const coinProfit = coinValue - (coin.quantity * coin.buyPrice);

                                        return (
                                            <li key={idx} className="flex justify-between text-sm items-center">
                                                <div>
                                                    <span className="font-bold">{coin.symbol}</span>
                                                    <div className="text-xs text-gray-500">{coin.quantity} @ ${coin.buyPrice}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div>${coinValue > 0 ? coinValue.toFixed(2) : '-'}</div>
                                                    <div className={`text-xs ${coinProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {coinProfit >= 0 ? '+' : ''}{coinProfit.toFixed(2)}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            <form onSubmit={handleAddCoin} className="pt-4 border-t dark:border-gray-700 space-y-3">
                                <h3 className="font-semibold text-sm">Add Coin</h3>
                                <input name="symbol" placeholder="Symbol (e.g. BTCUSDT)" className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600" required />
                                <div className="flex gap-2">
                                    <input name="quantity" type="number" step="any" placeholder="Qty" className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600" required />
                                    <input name="buyPrice" type="number" step="any" placeholder="Price" className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600" required />
                                </div>
                                <button type="submit" className="w-full py-2 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700">Add</button>
                            </form>
                        </div>
                    ) : (
                        <p>Loading portfolio...</p>
                    )}
                </div>

                {/* Market Section */}
                <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Live Market</h2>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="px-4 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                                <tr className="text-gray-500 border-b dark:border-gray-700">
                                    <th className="pb-2">Symbol</th>
                                    <th className="pb-2 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {displayPrices.length > 0 ? (
                                    displayPrices.map((p) => (
                                        <tr key={p.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="py-3 font-medium">{p.symbol}</td>
                                            <td className="py-3 text-right font-mono text-blue-600 dark:text-blue-400">
                                                ${Number(p.price).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="py-4 text-center text-gray-500">
                                            Waiting for updates...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
