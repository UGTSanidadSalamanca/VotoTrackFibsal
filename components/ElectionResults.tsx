
import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Calculator, PieChart, TrendingUp, Users, Info, RotateCcw, FileDown, Printer } from 'lucide-react';

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

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setResults(prev => ({
            ...prev,
            [name]: Math.max(0, parseInt(value) || 0)
        }));
    };

    const resetResults = () => {
        if (confirm('¿Estás seguro de que quieres borrar todos los datos introducidos?')) {
            setResults({
                ugt: 0,
                ccoo: 0,
                csif: 0,
                blank: 0,
                null: 0,
            });
        }
    };

    const calculation = useMemo(() => {
        const { ugt, ccoo, csif, blank, null: nullVotes } = results;
        const totalVotes = ugt + ccoo + csif + blank + nullVotes;
        const validVotes = ugt + ccoo + csif + blank;

        const threshold = validVotes * 0.05;
        const totalSeats = 9;

        const lists = [
            { name: 'UGT', votes: ugt, color: 'bg-red-500', barColor: '#ef4444' },
            { name: 'CCOO', votes: ccoo, color: 'bg-orange-500', barColor: '#f97316' },
            { name: 'CSIF', votes: csif, color: 'bg-blue-600', barColor: '#2563eb' }
        ];

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

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (calculation.totalVotes === 0) return;

        setIsGeneratingPDF(true);
        try {
            const html2canvas = (await import('https://esm.sh/html2canvas@1.4.1')).default;
            const { jsPDF } = await import('https://esm.sh/jspdf@2.5.1');

            const element = reportRef.current;
            if (!element) return;

            // Importante: El elemento debe ser visible para html2canvas
            // Pero lo tenemos fuera de la pantalla con CSS
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Informe_Elecciones_Fibsal_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error técnico al generar el PDF. Por favor, usa la opción de "Imprimir" y elige "Guardar como PDF".');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const participationColor = useMemo(() => {
        if (calculation.participation > 70) return 'text-green-400';
        if (calculation.participation > 40) return 'text-yellow-400';
        return 'text-red-400';
    }, [calculation.participation]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Botones de acción (Heredan estilos de la aplicación) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6 print:hidden">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Escrutinio y Estadística</h2>
                    <p className="text-gray-400 text-sm">Control de resultados y reparto de delegados</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={resetResults} className="text-gray-400 hover:text-white border-white/10 h-10">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reiniciar
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="text-gray-400 hover:text-white border-white/10 h-10">
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir
                    </Button>
                    <Button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF || calculation.totalVotes === 0}
                        className="bg-primary hover:bg-primary/90 text-white font-bold h-10 shadow-lg shadow-primary/20"
                    >
                        {isGeneratingPDF ? (
                            <span className="flex items-center gap-2 px-2">
                                <RotateCcw className="w-4 h-4 animate-spin" />
                                Generando...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 px-2">
                                <FileDown className="w-4 h-4" />
                                Descargar PDF
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
                {/* Input Card */}
                <Card className="md:col-span-1 border-white/10 bg-white/5 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <Calculator className="w-5 h-5 text-primary" />
                            Introducir Votos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">UGT</label>
                            <Input
                                type="number"
                                name="ugt"
                                value={results.ugt || ''}
                                onChange={handleInputChange}
                                className="bg-black/40 border-white/20 focus:border-primary/50 transition-all font-mono text-lg text-white"
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">CCOO</label>
                            <Input
                                type="number"
                                name="ccoo"
                                value={results.ccoo || ''}
                                onChange={handleInputChange}
                                className="bg-black/40 border-white/20 focus:border-primary/50 transition-all font-mono text-lg text-white"
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">CSIF</label>
                            <Input
                                type="number"
                                name="csif"
                                value={results.csif || ''}
                                onChange={handleInputChange}
                                className="bg-black/40 border-white/20 focus:border-primary/50 transition-all font-mono text-lg text-white"
                                placeholder="0"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Blanco</label>
                                <Input
                                    type="number"
                                    name="blank"
                                    value={results.blank || ''}
                                    onChange={handleInputChange}
                                    className="bg-black/40 border-white/20 focus:border-primary/50 transition-all font-mono text-white"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nulo</label>
                                <Input
                                    type="number"
                                    name="null"
                                    value={results.null || ''}
                                    onChange={handleInputChange}
                                    className="bg-black/40 border-white/20 focus:border-primary/50 transition-all font-mono text-white"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Stats Panel */}
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="border-white/10 bg-white/5 border-l-4 border-l-primary">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Participación</p>
                                        <h3 className={`text-4xl font-black ${participationColor}`}>
                                            {calculation.participation.toFixed(2)}%
                                        </h3>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl">
                                        <PieChart className="w-8 h-8 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5 border-l-4 border-l-green-500">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Delegados</p>
                                        <h3 className="text-4xl font-black text-white">9</h3>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl">
                                        <TrendingUp className="w-8 h-8 text-green-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-white/10 bg-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/10">
                                        <th className="px-6 py-4 font-black">Sindicato</th>
                                        <th className="px-6 py-4 font-black text-center">Votos</th>
                                        <th className="px-6 py-4 font-black text-center">%</th>
                                        <th className="px-6 py-4 font-black text-right">Escaños</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {calculation.distribution.length > 0 ? (
                                        calculation.distribution.map((list) => (
                                            <tr key={list.name} className="hover:bg-white/5 transition-all">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-1 h-8 rounded-full ${list.color}`} />
                                                        <span className="font-black text-white text-lg">{list.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono text-xl text-white">{list.votes}</td>
                                                <td className="px-6 py-4 text-center text-gray-400 font-bold">
                                                    {calculation.validVotes > 0 ? ((list.votes / calculation.validVotes) * 100).toFixed(1) : 0}%
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="inline-block w-10 h-10 leading-10 text-center bg-primary/20 border border-primary/30 text-primary text-2xl font-black rounded-lg">
                                                        {list.seats}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-16 text-center text-gray-500 italic">
                                                Sin datos suficientes para el reparto.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            {/* REPORTE PARA IMPRESIÓN Y PDF (Fuera de pantalla pero capturable) */}
            <div
                style={{
                    position: 'absolute',
                    top: '-9999px', // Fuera de la vista
                    left: '0',
                    width: '210mm',
                    backgroundColor: '#ffffff'
                }}
                className="print-report-container"
            >
                <div ref={reportRef} className="p-16 text-black font-sans bg-white min-h-[297mm]">
                    <div className="flex justify-between items-start border-b-[6px] border-red-600 pb-8 mb-10">
                        <div>
                            <h1 className="text-5xl font-black uppercase tracking-tighter text-red-600 mb-1">Informe Electoral</h1>
                            <p className="text-2xl font-bold text-gray-700">FIBSAL - Resultados de Votación</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Emisión del Informe</p>
                            <p className="text-xl font-black">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-12">
                        <div className="p-8 bg-gray-100 rounded-3xl">
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Censo Electoral</p>
                            <p className="text-5xl font-black">{censusTotal}</p>
                        </div>
                        <div className="p-8 bg-gray-100 rounded-3xl">
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Votos Totales</p>
                            <p className="text-5xl font-black">{calculation.totalVotes}</p>
                        </div>
                        <div className="p-8 bg-gray-100 rounded-3xl border-2 border-red-100">
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Participación</p>
                            <p className="text-5xl font-black text-red-600">{calculation.participation.toFixed(2)}%</p>
                        </div>
                    </div>

                    <div className="mb-12">
                        <h3 className="text-xl font-black uppercase tracking-widest mb-6 border-b-2 border-gray-100 pb-2">Distribución de Papeletas</h3>
                        <table className="w-full text-lg">
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="py-4 font-bold text-gray-600 uppercase text-sm tracking-wider">Votos a Candidaturas</td>
                                    <td className="py-4 text-right font-black text-2xl">{results.ugt + results.ccoo + results.csif}</td>
                                </tr>
                                <tr>
                                    <td className="py-4 font-bold text-gray-600 uppercase text-sm tracking-wider">Votos Blancos</td>
                                    <td className="py-4 text-right font-black text-2xl">{results.blank}</td>
                                </tr>
                                <tr className="bg-gray-50 px-4">
                                    <td className="py-5 font-black text-black uppercase text-base tracking-widest">SUBTOTAL VOTOS VÁLIDOS</td>
                                    <td className="py-5 text-right font-black text-3xl text-red-600">{calculation.validVotes}</td>
                                </tr>
                                <tr>
                                    <td className="py-4 font-bold text-gray-400 uppercase text-xs tracking-widest italic">Votos Nulos</td>
                                    <td className="py-4 text-right font-bold text-gray-400 text-xl italic">{results.null}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <h3 className="text-xl font-black uppercase tracking-widest mb-6 border-b-2 border-gray-100 pb-2">Reparto de Representantes (Delegados)</h3>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-200">
                                    <th className="py-4 px-2">Candidatura</th>
                                    <th className="py-4 text-center">Votos</th>
                                    <th className="py-4 text-center">% S/ Válidos</th>
                                    <th className="py-4 text-right">Delegados Obt.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {calculation.distribution.map((list) => (
                                    <tr key={list.name}>
                                        <td className="py-6 px-2">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-10 rounded-full" style={{ backgroundColor: list.barColor }} />
                                                <span className="text-2xl font-black">{list.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-6 text-center text-2xl font-mono font-bold">{list.votes}</td>
                                        <td className="py-6 text-center text-gray-500 font-bold text-lg">{((list.votes / calculation.validVotes) * 100).toFixed(1)}%</td>
                                        <td className="py-6 text-right">
                                            <span className="inline-block px-8 py-3 bg-black text-white text-3xl font-black rounded-2xl shadow-lg">
                                                {list.seats}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-8 p-4 bg-gray-50 rounded-xl text-center">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Criterio Aplicado: Sistema de Restos Mayores (Coeficiente de Representación Circular)</p>
                        </div>
                    </div>

                    <div className="mt-auto pt-20 text-center">
                        <div className="inline-block border-t-2 border-gray-100 pt-4 px-12">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Autenticado por Sistema VotoTrack FIBSAL</p>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          /* Ocultar todo lo que no sea el reporte */
          body * { visibility: hidden; }
          .print-report-container, .print-report-container * { 
            visibility: visible !important;
            display: block !important;
          }
          .print-report-container { 
            position: fixed !important; 
            top: 0 !important; 
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Forzar fondo blanco e imprimir colores */
          html, body { background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}} />
        </div>
    );
};

export default ElectionResults;
