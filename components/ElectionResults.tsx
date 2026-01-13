
import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Calculator, PieChart, TrendingUp, Users, Info, RotateCcw } from 'lucide-react';

interface ElectionResultsProps {
    censusTotal: number;
}

interface ResultsState {
    ugt: number;
    ccoo: number;
    csif: number;
    blank: number;
    null: number;
}

const ElectionResults: React.FC<ElectionResultsProps> = ({ censusTotal }) => {
    const [results, setResults] = useState<ResultsState>({
        ugt: 0,
        ccoo: 0,
        csif: 0,
        blank: 0,
        null: 0,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setResults(prev => ({
            ...prev,
            [name]: Math.max(0, parseInt(value) || 0)
        }));
    };

    const resetResults = () => {
        setResults({
            ugt: 0,
            ccoo: 0,
            csif: 0,
            blank: 0,
            null: 0,
        });
    };

    const calculation = useMemo(() => {
        const { ugt, ccoo, csif, blank, null: nullVotes } = results;
        const totalVotes = ugt + ccoo + csif + blank + nullVotes;
        const validVotes = ugt + ccoo + csif + blank;

        const threshold = validVotes * 0.05;
        const totalSeats = 9;

        const lists = [
            { name: 'UGT', votes: ugt, color: 'bg-red-500' },
            { name: 'CCOO', votes: ccoo, color: 'bg-orange-500' },
            { name: 'CSIF', votes: csif, color: 'bg-blue-600' }
        ];

        // Filter by threshold (5% of valid votes)
        const eligibleLists = lists.filter(list => list.votes >= threshold && list.votes > 0);

        if (validVotes === 0 || eligibleLists.length === 0) {
            return {
                totalVotes,
                validVotes,
                participation: censusTotal > 0 ? (totalVotes / censusTotal) * 100 : 0,
                distribution: [],
                threshold
            };
        }

        // Largest Remainder Method (Hamilton)
        const quota = validVotes / totalSeats;

        let initialDistribution = eligibleLists.map(list => {
            const cociente = list.votes / quota;
            return {
                ...list,
                cociente: cociente,
                seats: Math.floor(cociente),
                remainder: cociente - Math.floor(cociente)
            };
        });

        let assignedSeats = initialDistribution.reduce((acc, l) => acc + l.seats, 0);
        let remainingSeats = totalSeats - assignedSeats;

        if (remainingSeats > 0) {
            const sortedByRemainder = [...initialDistribution].sort((a, b) => b.remainder - a.remainder);
            for (let i = 0; i < remainingSeats; i++) {
                const listToUpdate = sortedByRemainder[i % sortedByRemainder.length];
                const index = initialDistribution.findIndex(l => l.name === listToUpdate.name);
                initialDistribution[index].seats += 1;
            }
        }

        return {
            totalVotes,
            validVotes,
            participation: censusTotal > 0 ? (totalVotes / censusTotal) * 100 : 0,
            distribution: initialDistribution,
            threshold
        };
    }, [results, censusTotal]);

    const participationColor = useMemo(() => {
        if (calculation.participation > 70) return 'text-green-400';
        if (calculation.participation > 40) return 'text-yellow-400';
        return 'text-red-400';
    }, [calculation.participation]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white tracking-tight">Escrutinio y Reparto de Delegados</h2>
                <Button variant="outline" size="sm" onClick={resetResults} className="text-gray-400 hover:text-white border-white/10">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reiniciar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Input Card */}
                <Card className="md:col-span-1 border-white/10 bg-white/5 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calculator className="w-5 h-5 text-primary" />
                            Introducir Votos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">UGT</label>
                            <Input
                                type="number"
                                name="ugt"
                                value={results.ugt || ''}
                                onChange={handleInputChange}
                                className="bg-black/40 border-white/10 focus:border-primary/50 transition-all font-mono text-lg"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CCOO</label>
                            <Input
                                type="number"
                                name="ccoo"
                                value={results.ccoo || ''}
                                onChange={handleInputChange}
                                className="bg-black/40 border-white/10 focus:border-primary/50 transition-all font-mono text-lg"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CSIF</label>
                            <Input
                                type="number"
                                name="csif"
                                value={results.csif || ''}
                                onChange={handleInputChange}
                                className="bg-black/40 border-white/10 focus:border-primary/50 transition-all font-mono text-lg"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Blanco</label>
                                <Input
                                    type="number"
                                    name="blank"
                                    value={results.blank || ''}
                                    onChange={handleInputChange}
                                    className="bg-black/40 border-white/10 focus:border-primary/50 transition-all font-mono"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nulo</label>
                                <Input
                                    type="number"
                                    name="null"
                                    value={results.null || ''}
                                    onChange={handleInputChange}
                                    className="bg-black/40 border-white/10 focus:border-primary/50 transition-all font-mono"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="pt-6 border-t border-white/10 mt-6 space-y-2">
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-gray-500">Votos Emitidos:</span>
                                <span className="font-mono font-bold text-white">{calculation.totalVotes}</span>
                            </div>
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-gray-500">Votos Válidos:</span>
                                <span className="font-mono font-bold text-primary">{calculation.validVotes}</span>
                            </div>
                            <div className="flex justify-between text-[10px] items-center text-gray-500">
                                <span>Umbral de Exclusión (5%):</span>
                                <span className="font-mono px-1.5 py-0.5 bg-white/5 rounded">{calculation.threshold.toFixed(1)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Stats */}
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="border-white/10 bg-gradient-to-br from-white/10 to-transparent shadow-lg">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Índice de Participación</p>
                                        <h3 className={`text-4xl font-black ${participationColor}`}>
                                            {calculation.participation.toFixed(2)}%
                                        </h3>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <PieChart className="w-8 h-8 text-primary" />
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest">
                                    <Users className="w-3 h-3" />
                                    <span>Censo: <span className="text-white font-bold">{censusTotal}</span> electores</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-gradient-to-br from-white/10 to-transparent shadow-lg">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Puestos a Repartir</p>
                                        <h3 className="text-4xl font-black text-white">9</h3>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <TrendingUp className="w-8 h-8 text-green-500" />
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest">
                                    <Info className="w-3 h-3" />
                                    <span>Sistema: <span className="text-white font-bold">Resto Mayor</span></span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-white/10 bg-white/2 shadow-2xl overflow-hidden border-t-4 border-t-primary/20">
                        <CardHeader className="border-b border-white/5 bg-white/5">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-300">Asignación de Delegados</CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5 text-[10px] uppercase tracking-wider text-gray-500">
                                        <th className="px-6 py-4 font-bold">Sindicato</th>
                                        <th className="px-6 py-4 font-bold">Votos</th>
                                        <th className="px-6 py-4 font-bold">% Válidos</th>
                                        <th className="px-6 py-4 font-bold text-right">Delegados</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {calculation.distribution.length > 0 ? (
                                        calculation.distribution.map((list) => (
                                            <tr key={list.name} className="hover:bg-white/5 transition-all group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-1.5 h-10 rounded-full ${list.color} shadow-[0_0_15px_rgba(0,0,0,0.5)]`} />
                                                        <div>
                                                            <div className="font-black text-white text-lg tracking-tight group-hover:text-primary transition-colors">{list.name}</div>
                                                            <div className="text-[10px] text-gray-500 font-mono">Resto: {list.remainder.toFixed(3)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="text-xl font-mono font-bold text-white">{list.votes}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="text-sm font-medium text-gray-300">
                                                        {calculation.validVotes > 0 ? ((list.votes / calculation.validVotes) * 100).toFixed(1) : 0}%
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-2xl font-black text-primary shadow-lg">
                                                        {list.seats}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="p-4 bg-white/5 rounded-full">
                                                        <Users className="w-8 h-8 text-gray-600" />
                                                    </div>
                                                    <p className="text-sm text-gray-500 italic max-w-xs">
                                                        Introduce los votos en la calculadora para ver el reparto de los 9 delegados. Solo participan listas con más del 5%.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ElectionResults;
