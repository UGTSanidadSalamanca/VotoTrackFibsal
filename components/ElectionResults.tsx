
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
            setResults({ ugt: 0, ccoo: 0, csif: 0, blank: 0, null: 0 });
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
            return { totalVotes, validVotes, participation: censusTotal > 0 ? (totalVotes / censusTotal) * 100 : 0, distribution: [], threshold };
        }

        const quota = validVotes / totalSeats;
        let initialDistribution = eligibleLists.map(list => {
            const cociente = list.votes / quota;
            return { ...list, cociente: cociente, seats: Math.floor(cociente), remainder: cociente - Math.floor(cociente) };
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

        return { totalVotes, validVotes, participation: censusTotal > 0 ? (totalVotes / censusTotal) * 100 : 0, distribution: initialDistribution, threshold };
    }, [results, censusTotal]);

    const handlePrint = () => window.print();

    const handleDownloadPDF = async () => {
        if (calculation.totalVotes === 0) return;
        setIsGeneratingPDF(true);
        try {
            const html2canvas = (await import('https://esm.sh/html2canvas@1.4.1')).default;
            const { jsPDF } = await import('https://esm.sh/jspdf@2.5.1');
            const element = reportRef.current;
            if (!element) return;
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(imgData, 'PNG', 10, 10, 190, (canvas.height * 190) / canvas.width);
            pdf.save(`Resultados_Fibsal_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error(error);
            alert('Error al generar PDF.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Botones UI */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/5 pb-4 print:hidden">
                <h2 className="text-2xl font-black text-white">Escrutinio FIBSAL</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetResults} className="text-gray-400 border-white/10"><RotateCcw className="w-4 h-4 mr-2" />Reiniciar</Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="text-gray-400 border-white/10"><Printer className="w-4 h-4 mr-2" />Imprimir</Button>
                    <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF || calculation.totalVotes === 0} className="bg-primary text-white font-bold h-9">
                        <FileDown className="w-4 h-4 mr-2" /> {isGeneratingPDF ? 'Generando...' : 'PDF'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
                {/* Lado Izquierdo: Formulario */}
                <Card className="md:col-span-1 border-white/10 bg-white/5">
                    <CardContent className="pt-6 space-y-4">
                        {['ugt', 'ccoo', 'csif'].map((k) => (
                            <div key={k} className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">{k}</label>
                                <Input type="number" name={k} value={(results as any)[k] || ''} onChange={handleInputChange} className="bg-black/40 border-white/20 text-white h-9" />
                            </div>
                        ))}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Blanco</label>
                                <Input type="number" name="blank" value={results.blank || ''} onChange={handleInputChange} className="bg-black/40 border-white/20 text-white h-9" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Nulo</label>
                                <Input type="number" name="null" value={results.null || ''} onChange={handleInputChange} className="bg-black/40 border-white/20 text-white h-9" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lado Derecho: Visualización rápida */}
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="border-white/10 bg-white/5 p-4 flex flex-col justify-center">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Participación</p>
                            <h3 className="text-3xl font-black text-primary">{calculation.participation.toFixed(2)}%</h3>
                        </Card>
                        <Card className="border-white/10 bg-white/5 p-4 flex flex-col justify-center">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Delegados</p>
                            <h3 className="text-3xl font-black text-white">9</h3>
                        </Card>
                    </div>
                    <Card className="border-white/10 bg-white/5 overflow-hidden">
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-white/5">
                                {calculation.distribution.map(l => (
                                    <tr key={l.name} className="py-2">
                                        <td className="px-4 py-3 font-bold text-white">{l.name}</td>
                                        <td className="px-4 py-3 text-center">{l.votes} votos</td>
                                        <td className="px-4 py-3 text-right font-black text-xl text-primary">{l.seats}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>

            {/* REPORTE ULTRA-COMPACTO (ESTILO TABLA OFICIAL) */}
            <div style={{ position: 'absolute', top: '-9999px', left: '0', width: '180mm', backgroundColor: '#fff' }} className="print:static print:visible">
                <div ref={reportRef} className="p-8 text-black font-sans text-sm leading-tight bg-white">
                    <div className="border-b-2 border-black pb-2 mb-4 flex justify-between items-end">
                        <div>
                            <h1 className="text-xl font-bold uppercase tracking-tight">Acta de Resultados Electorales</h1>
                            <p className="text-xs font-bold text-gray-600">FIBSAL - Centro de Investigación Biomédica de Salamanca</p>
                        </div>
                        <p className="text-xs font-bold">{new Date().toLocaleDateString('es-ES')}</p>
                    </div>

                    <table className="w-full border-collapse mb-4">
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 p-2 font-bold bg-gray-50 w-1/3">Censo Total</td>
                                <td className="border border-gray-300 p-2 text-center">{censusTotal}</td>
                                <td className="border border-gray-300 p-2 font-bold bg-gray-50 w-1/3">Votos Emitidos</td>
                                <td className="border border-gray-300 p-2 text-center">{calculation.totalVotes}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2 font-bold bg-gray-50">Índice Participación</td>
                                <td className="border border-gray-300 p-2 text-center font-bold text-blue-700">{calculation.participation.toFixed(2)}%</td>
                                <td className="border border-gray-300 p-2 font-bold bg-gray-50">Votos Nulos</td>
                                <td className="border border-gray-300 p-2 text-center">{results.null}</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3 className="text-xs font-bold uppercase mb-2 border-l-4 border-black pl-2 py-0.5">Escrutinio de Votos Válidos</h3>
                    <table className="w-full border-collapse mb-4">
                        <thead>
                            <tr className="bg-gray-100 text-[10px] font-bold uppercase">
                                <th className="border border-gray-300 p-1 text-left">Concepto</th>
                                <th className="border border-gray-300 p-1 text-right">Cantidad de Votos</th>
                                <th className="border border-gray-300 p-1 text-right">% s/ Válidos</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 p-1">Votos a candidaturas</td>
                                <td className="border border-gray-300 p-1 text-right">{results.ugt + results.ccoo + results.csif}</td>
                                <td className="border border-gray-300 p-1 text-right">{(calculation.validVotes > 0 ? ((results.ugt + results.ccoo + results.csif) / calculation.validVotes) * 100 : 0).toFixed(1)}%</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-1">Votos en Blanco</td>
                                <td className="border border-gray-300 p-1 text-right">{results.blank}</td>
                                <td className="border border-gray-300 p-1 text-right">{(calculation.validVotes > 0 ? (results.blank / calculation.validVotes) * 100 : 0).toFixed(1)}%</td>
                            </tr>
                            <tr className="font-bold bg-gray-50">
                                <td className="border border-gray-300 p-1 uppercase">Total Votos Válidos</td>
                                <td className="border border-gray-300 p-1 text-right text-blue-700">{calculation.validVotes}</td>
                                <td className="border border-gray-300 p-1 text-right">100.0%</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="mb-4 p-2 bg-gray-50 border border-gray-200 text-xs italic">
                        <strong>Barrera Electoral (5%):</strong> Para entrar en el reparto se requiere un mínimo de <strong>{calculation.threshold.toFixed(2)}</strong> votos.
                    </div>

                    <h3 className="text-xs font-bold uppercase mb-2 border-l-4 border-black pl-2 py-0.5">Adjudicación de Representantes (Delegados)</h3>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-[10px] font-bold uppercase">
                                <th className="border border-gray-300 p-1 text-left">Lista Sindical</th>
                                <th className="border border-gray-300 p-1 text-right">Votos</th>
                                <th className="border border-gray-300 p-1 text-right">Cociente</th>
                                <th className="border border-gray-300 p-1 text-right">Resto</th>
                                <th className="border border-gray-300 p-1 text-right">Delegados</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculation.distribution.map(l => (
                                <tr key={l.name}>
                                    <td className="border border-gray-300 p-1 font-bold">{l.name}</td>
                                    <td className="border border-gray-300 p-1 text-right">{l.votes}</td>
                                    <td className="border border-gray-300 p-1 text-right text-[10px] font-mono">{l.cociente.toFixed(4)}</td>
                                    <td className="border border-gray-300 p-1 text-right text-[10px] font-mono text-gray-500">{l.remainder.toFixed(4)}</td>
                                    <td className="border border-gray-300 p-2 text-right font-black text-lg bg-gray-50">{l.seats}</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-100 font-bold">
                                <td colSpan={4} className="border border-gray-300 p-1 text-right uppercase text-[10px]">Total Delegados Asignados</td>
                                <td className="border border-gray-300 p-1 text-right">9</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
                        VotoTrack FIBSAL - Sistema de Gestión Electoral
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          @page { size: A4; margin: 15mm; }
          body * { visibility: hidden; }
          .print-report-container, .print-report-container * { 
            visibility: visible !important;
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
          }
          html, body { background: white !important; overflow: visible !important; }
        }
      `}} />
        </div>
    );
};

export default ElectionResults;
