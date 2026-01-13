
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

            // Capturamos el canvas
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
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
                                <label className="text-[10px] font-bold text-gray-400 uppercase">{k}</label>
                                <Input type="number" name={k} value={(results as any)[k] || ''} onChange={handleInputChange} className="bg-black/40 border-white/20 text-white h-9" />
                            </div>
                        ))}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Blanco</label>
                                <Input type="number" name="blank" value={results.blank || ''} onChange={handleInputChange} className="bg-black/40 border-white/20 text-white h-9" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Nulo</label>
                                <Input type="number" name="null" value={results.null || ''} onChange={handleInputChange} className="bg-black/40 border-white/20 text-white h-9" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lado Derecho: Visualización rápida */}
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="border-white/10 bg-white/5 p-4 flex flex-col justify-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Participación</p>
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
                                        <td className="px-4 py-3 text-center text-gray-300">{l.votes} votos</td>
                                        <td className="px-4 py-3 text-right font-black text-xl text-primary">{l.seats}</td>
                                    </tr>
                                ))}
                                {calculation.distribution.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500 italic">Introduce datos para ver el reparto</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>

            {/* REPORTE OCULTO PARA PDF E IMPRESIÓN */}
            <div className="report-print-container">
                <div ref={reportRef} className="report-content">
                    <div className="report-header">
                        <div>
                            <h1 className="report-title">Acta de Resultados Electorales</h1>
                            <p className="report-subtitle">FIBSAL - Centro de Investigación Biomédica de Salamanca</p>
                        </div>
                        <p className="report-date">{new Date().toLocaleDateString('es-ES')}</p>
                    </div>

                    <table className="report-table main-stats">
                        <tbody>
                            <tr>
                                <td className="stats-label">Censo Total</td>
                                <td className="stats-value">{censusTotal}</td>
                                <td className="stats-label">Votos Emitidos</td>
                                <td className="stats-value">{calculation.totalVotes}</td>
                            </tr>
                            <tr>
                                <td className="stats-label">Índice Participación</td>
                                <td className="stats-value highlight">{calculation.participation.toFixed(2)}%</td>
                                <td className="stats-label">Votos Nulos</td>
                                <td className="stats-value">{results.null}</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3 className="section-title">Escrutinio de Votos Válidos</h3>
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Concepto</th>
                                <th className="text-right">Votos</th>
                                <th className="text-right">% Válidos</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Votos a candidaturas</td>
                                <td className="text-right">{results.ugt + results.ccoo + results.csif}</td>
                                <td className="text-right">{(calculation.validVotes > 0 ? ((results.ugt + results.ccoo + results.csif) / calculation.validVotes) * 100 : 0).toFixed(1)}%</td>
                            </tr>
                            <tr>
                                <td>Votos en Blanco</td>
                                <td className="text-right">{results.blank}</td>
                                <td className="text-right">{(calculation.validVotes > 0 ? (results.blank / calculation.validVotes) * 100 : 0).toFixed(1)}%</td>
                            </tr>
                            <tr className="row-total">
                                <td>Total Votos Válidos</td>
                                <td className="text-right">{calculation.validVotes}</td>
                                <td className="text-right">100.0%</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="threshold-box">
                        Barrera Electoral (5%): Requiere un mínimo de <strong>{calculation.threshold.toFixed(2)}</strong> votos.
                    </div>

                    <h3 className="section-title">Adjudicación de Representantes (9 Delegados)</h3>
                    <table className="report-table distribution">
                        <thead>
                            <tr>
                                <th>Lista Sindical</th>
                                <th className="text-right">Votos</th>
                                <th className="text-right">Cociente</th>
                                <th className="text-right">Resto</th>
                                <th className="text-right">Delegados</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculation.distribution.map(l => (
                                <tr key={l.name}>
                                    <td className="font-bold">{l.name}</td>
                                    <td className="text-right">{l.votes}</td>
                                    <td className="text-right font-mono text-xs">{l.cociente.toFixed(4)}</td>
                                    <td className="text-right font-mono text-xs text-gray-500">{l.remainder.toFixed(4)}</td>
                                    <td className="text-right font-bold text-xl bg-gray-50">{l.seats}</td>
                                </tr>
                            ))}
                            <tr className="row-final">
                                <td colSpan={4} className="text-right uppercase text-xs">Total Delegados Asignados</td>
                                <td className="text-right">9</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="report-footer">
                        VotoTrack FIBSAL - SISTEMA DE GESTIÓN ELECTORAL
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        /* Estilos generales del reporte oculto */
        .report-print-container {
          position: absolute;
          left: -9999px;
          top: 0;
          width: 180mm;
          z-index: -1;
        }

        .report-content {
          padding: 30px;
          background: white;
          color: black;
          font-family: sans-serif;
          line-height: 1.3;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 2px solid black;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        .report-title { margin: 0; font-size: 20px; font-weight: bold; text-transform: uppercase; }
        .report-subtitle { margin: 0; font-size: 12px; font-weight: bold; color: #444; }
        .report-date { margin: 0; font-size: 12px; font-weight: bold; }

        .report-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px; }
        .report-table th, .report-table td { border: 1px solid #ccc; padding: 6px; }
        .report-table th { background: #f0f0f0; text-transform: uppercase; font-size: 10px; text-align: left; }
        
        .main-stats td.stats-label { font-weight: bold; background: #f9f9f9; width: 25%; }
        .main-stats td.stats-value { text-align: center; width: 25%; }
        .main-stats td.highlight { font-weight: bold; color: #d32f2f; }

        .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; border-left: 4px solid black; padding-left: 8px; margin: 15px 0 8px 0; }
        
        .row-total td { font-weight: bold; background: #f9f9f9; }
        .threshold-box { background: #f9f9f9; border: 1px solid #ddd; padding: 8px; font-size: 11px; font-style: italic; margin-bottom: 15px; }
        
        .distribution td { vertical-align: middle; }
        .row-final td { font-weight: bold; background: #f0f0f0; }

        .report-footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center; font-size: 9px; color: #999; font-weight: bold; letter-spacing: 1px; }
        .text-right { text-align: right; }

        @media print {
          @page { size: A4; margin: 0; }
          html, body { height: auto; background: white !important; }
          
          /* Ocultar la UI */
          body > * { display: none !important; }
          
          /* Mostrar el reporte */
          body > .report-print-container, 
          .report-print-container, 
          .report-print-container * {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            z-index: 9999 !important;
          }
        }
      `}} />
        </div>
    );
};

export default ElectionResults;
