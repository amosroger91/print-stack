import { DollarSign, Clock, Package, TrendingUp } from 'lucide-react';

interface CostBreakdownProps {
    cost: {
        filamentGrams: number;
        printTimeSeconds: number;
        filamentCost: number;
        electricityCost: number;
        machineCost: number;
        totalCost: number;
    };
}

export function CostBreakdown({ cost }: CostBreakdownProps) {
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <DollarSign className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-100">Cost Estimate</h3>
                        <p className="text-sm text-slate-400">Pricing breakdown for this print</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-400 mb-1">Total Cost</div>
                    <div className="text-3xl font-bold text-green-400">
                        ${cost.totalCost.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Summary Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Package className="w-4 h-4" />
                        <span>Material Used</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-100">
                        {cost.filamentGrams.toFixed(1)}g
                    </div>
                    <div className="text-xs text-slate-500 mt-1">PLA Filament</div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Clock className="w-4 h-4" />
                        <span>Print Time</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-100">
                        {formatTime(cost.printTimeSeconds)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Estimated duration</div>
                </div>
            </div>

            {/* Cost Breakdown Details */}
            <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
                    <span className="text-slate-300 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        Filament Cost
                    </span>
                    <span className="text-slate-100 font-semibold font-mono">
                        ${cost.filamentCost.toFixed(2)}
                    </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
                    <span className="text-slate-300 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        Electricity
                    </span>
                    <span className="text-slate-100 font-semibold font-mono">
                        ${cost.electricityCost.toFixed(2)}
                    </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
                    <span className="text-slate-300 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        Machine Time
                    </span>
                    <span className="text-slate-100 font-semibold font-mono">
                        ${cost.machineCost.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Markup Notice */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-400">
                    Price includes material, operating costs, and service markup.
                    Final quote may vary based on complexity and priority.
                </p>
            </div>
        </div>
    );
}
