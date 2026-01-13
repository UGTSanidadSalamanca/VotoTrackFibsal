
import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Calculator, PieChart, TrendingUp, Users, Info, RotateCcw, FileDown, Printer, CheckCircle2 } from 'lucide-react';

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

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = 190;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, Math.min(pdfHeight, 277));
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
            {/* UI HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 shadow-lg print:hidden">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Calculator className="text-primary w-6 h-6" />
                        Escrutinio Profesional
                    </h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Control de Elecciones Sindicales FIBSAL</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetResults} className="text-gray-400 border-white/10 hover:bg-white/5">
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Reiniciar
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="text-gray-400 border-white/10 hover:bg-white/5">
                        <Printer className="w-3.5 h-3.5 mr-1.5" />Imprimir
                    </Button>
                    <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF || calculation.totalVotes === 0} className="bg-primary hover:bg-primary/90 text-white font-bold h-9 shadow-lg shadow-primary/20">
                        {isGeneratingPDF ? (
                            <RotateCcw className="w-4 h-4 animate-spin" />
                        ) : (
                            <><FileDown className="w-4 h-4 mr-2" /> Descargar PDF</>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
                {/* INPUT PANEL */}
                <Card className="md:col-span-1 border-white/10 bg-white/5 backdrop-blur-md">
                    <CardHeader className="pb-2 border-b border-white/5">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">Datos del Escrutinio</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-red-500 uppercase">UGT</label>
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            </div>
                            <Input type="number" name="ugt" value={results.ugt || ''} onChange={handleInputChange} className="bg-black/40 border-white/10 text-white font-mono text-lg h-10 focus:border-red-500/50" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-orange-500 uppercase">CCOO</label>
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                            </div>
                            <Input type="number" name="ccoo" value={results.ccoo || ''} onChange={handleInputChange} className="bg-black/40 border-white/10 text-white font-mono text-lg h-10 focus:border-orange-500/50" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-blue-500 uppercase">CSIF</label>
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                            </div>
                            <Input type="number" name="csif" value={results.csif || ''} onChange={handleInputChange} className="bg-black/40 border-white/10 text-white font-mono text-lg h-10 focus:border-blue-500/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase">Blanco</label>
                                <Input type="number" name="blank" value={results.blank || ''} onChange={handleInputChange} className="bg-black/40 border-white/10 text-white h-9" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase">Nulo</label>
                                <Input type="number" name="null" value={results.null || ''} onChange={handleInputChange} className="bg-black/40 border-white/10 text-white h-9" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* SUMMARY PANEL */}
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="border-white/10 bg-gradient-to-br from-primary/10 to-transparent p-5 relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Índice Participación</p>
                                <h3 className="text-4xl font-black text-white">{calculation.participation.toFixed(2)}%</h3>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{calculation.totalVotes} de {censusTotal} votos</span>
                                </div>
                            </div>
                            <PieChart className="absolute -bottom-4 -right-4 w-24 h-24 text-primary opacity-10 group-hover:scale-110 transition-transform" />
                        </Card>
                        <Card className="border-white/10 bg-gradient-to-br from-green-500/10 to-transparent p-5 relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Puestos a Repartir</p>
                                <h3 className="text-4xl font-black text-white">9</h3>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Criterio Proporcional</span>
                                </div>
                            </div>
                            <TrendingUp className="absolute -bottom-4 -right-4 w-24 h-24 text-green-500 opacity-10 group-hover:scale-110 transition-transform" />
                        </Card>
                    </div>

                    <Card className="border-white/10 bg-white/5 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-[10px] uppercase font-black text-gray-500 border-b border-white/10">
                                    <th className="px-6 py-4">Candidatura</th>
                                    <th className="px-6 py-4 text-center">Votos</th>
                                    <th className="px-6 py-4 text-right">Delegados</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {calculation.distribution.length > 0 ? (
                                    calculation.distribution.map(l => (
                                        <tr key={l.name} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-1.5 h-10 rounded-full ${l.color} shadow-lg`} />
                                                    <span className="font-black text-white text-xl uppercase tracking-tighter">{l.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center font-mono text-2xl text-white font-bold">{l.votes}</td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="inline-flex items-center justify-center min-w-[3rem] h-12 px-4 bg-primary/20 border border-primary/30 text-primary text-3xl font-black rounded-xl shadow-xl shadow-primary/10">
                                                    {l.seats}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                                    <Info className="w-6 h-6 text-gray-600" />
                                                </div>
                                                <p className="text-sm text-gray-500 italic max-w-[200px]">Introduce los resultados para comenzar la adjudicación.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>

            {/* COMPACT STYLED REPORT FOR PRINT/PDF */}
            <div id="printable-report" className="hidden-for-screen">
                <div ref={reportRef} className="report-root">
                    <div className="report-header">
                        <div className="brand">
                            <h1 className="main-title">Informe Electoral</h1>
                            <p className="sub-title">FIBSAL - Resultados de Votación</p>
                        </div>
                        <div className="date-box">
                            <p className="label">FECHA DE EMISIÓN</p>
                            <p className="value">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <p className="kpi-label">CENSO TOTAL</p>
                            <p className="kpi-value">{censusTotal}</p>
                        </div>
                        <div className="kpi-card">
                            <p className="kpi-label">VOTOS EMITIDOS</p>
                            <p className="kpi-value">{calculation.totalVotes}</p>
                        </div>
                        <div className="kpi-card highlight">
                            <p className="kpi-label">PARTICIPACIÓN</p>
                            <p className="kpi-value">{calculation.participation.toFixed(2)}%</p>
                        </div>
                    </div>

                    <div className="main-content">
                        <div className="table-section">
                            <h3 className="section-title">Análisis del Escrutinio</h3>
                            <table className="analysis-table">
                                <tbody>
                                    <tr>
                                        <td>Votos válidos a candidaturas</td>
                                        <td className="val">{results.ugt + results.ccoo + results.csif}</td>
                                    </tr>
                                    <tr>
                                        <td>Votos válidos en blanco</td>
                                        <td className="val">{results.blank}</td>
                                    </tr>
                                    <tr className="total-row">
                                        <td>TOTAL VOTOS VÁLIDOS</td>
                                        <td className="val">{calculation.validVotes}</td>
                                    </tr>
                                    <tr className="null-row">
                                        <td>Votos nulos / Otros</td>
                                        <td className="val">{results.null}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="barrier-notice">
                                <p><strong>Barrera Electoral (5%):</strong> Mínimo de <strong>{calculation.threshold.toFixed(2)}</strong> votos para entrar en reparto.</p>
                            </div>
                        </div>

                        <div className="results-section">
                            <h3 className="section-title">Adjudicación de 9 Delegados</h3>
                            <table className="results-table">
                                <thead>
                                    <tr>
                                        <th>Sindicato</th>
                                        <th className="center">Votos</th>
                                        <th className="center">% Vál.</th>
                                        <th className="right">Escaños</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calculation.distribution.map(l => (
                                        <tr key={l.name}>
                                            <td className="name-col">
                                                <div className="swatch" style={{ backgroundColor: l.barColor }} />
                                                <span className="name">{l.name}</span>
                                            </td>
                                            <td className="center votes">{l.votes}</td>
                                            <td className="center pct">{((l.votes / (calculation.validVotes || 1)) * 100).toFixed(1)}%</td>
                                            <td className="right">
                                                <span className="seats-badge">{l.seats}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="final-sum">
                                        <td colSpan={3} className="label">TOTAL DELEGADOS ASIGNADOS</td>
                                        <td className="right total">9</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="report-footer">
                        <p>GENERADO POR SISTEMA VOTOTRACK FIBSAL - SISTEMA DE ALTA PRECISIÓN ELECTORAL</p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        /* HIDE FROM SCREEN, ONLY VISIBLE TO PRINTPERVIEW/EXPORT */
        .hidden-for-screen {
          position: fixed;
          top: 0;
          left: -4000px;
          pointer-events: none;
        }

        .report-root {
          width: 190mm;
          padding: 15mm;
          background: white;
          color: black;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 4px solid #ef4444;
          padding-bottom: 15px;
          margin-bottom: 30px;
        }
        .main-title { margin: 0; font-size: 28px; font-weight: 900; text-transform: uppercase; color: #ef4444; letter-spacing: -1px; }
        .sub-title { margin: 0; font-size: 16px; font-weight: 700; color: #4B5563; }
        .date-box { text-align: right; }
        .date-box .label { margin: 0; font-size: 9px; font-weight: 800; color: #9CA3AF; letter-spacing: 2px; }
        .date-box .value { margin: 0; font-size: 14px; font-weight: 800; }

        .kpi-grid { display: grid; grid-cols: 3; gap: 15px; display: flex; margin-bottom: 30px; }
        .kpi-card { flex: 1; padding: 15px; border-radius: 12px; background: #F3F4F6; border: 1px solid #E5E7EB; }
        .kpi-card.highlight { background: #FEF2F2; border: 1px solid #FEE2E2; }
        .kpi-label { margin: 0 0 5px 0; font-size: 9px; font-weight: 800; color: #6B7280; letter-spacing: 1px; }
        .kpi-value { margin: 0; font-size: 32px; font-weight: 900; line-height: 1; }
        .kpi-card.highlight .kpi-value { color: #DC2626; }

        .section-title { font-size: 11px; font-weight: 800; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px; margin-top: 0; margin-bottom: 15px; }

        .main-content { display: grid; grid-template-columns: 1fr 1.5fr; gap: 30px; }
        
        .analysis-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .analysis-table td { padding: 8px 0; border-bottom: 1px solid #F3F4F6; font-weight: 600; color: #374151; }
        .analysis-table td.val { text-align: right; font-weight: 900; color: black; }
        .analysis-table .total-row td { border-bottom: 2px solid black; font-size: 15px; padding-top: 15px; color: black; }
        .analysis-table .total-row td.val { color: #DC2626; }
        .analysis-table .null-row td { color: #9CA3AF; font-size: 11px; font-style: italic; border: none; }

        .barrier-notice { margin-top: 20px; padding: 12px; background: #F9FAFB; border-radius: 8px; border: 1px dashed #E5E7EB; font-size: 11px; }

        .results-table { width: 100%; border-collapse: collapse; }
        .results-table th { text-align: left; padding: 10px; font-size: 10px; font-weight: 800; color: #9CA3AF; text-transform: uppercase; }
        .results-table td { padding: 12px 10px; border-bottom: 1px solid #F3F4F6; }
        .results-table .center { text-align: center; }
        .results-table .right { text-align: right; }
        
        .name-col { display: flex; items-center; gap: 10px; }
        .swatch { width: 5px; height: 30px; border-radius: 99px; }
        .name { font-size: 18px; font-weight: 900; letter-spacing: -0.5px; }
        .votes { font-size: 22px; font-weight: 900; }
        .pct { font-size: 12px; font-weight: 700; color: #6B7280; }
        .seats-badge { display: inline-flex; align-items: center; justify-content: center; width: 45px; height: 45px; background: black; color: white; border-radius: 12px; font-size: 24px; font-weight: 900; }
        
        .final-sum td { padding-top: 20px; border: none; }
        .final-sum .label { font-size: 10px; font-weight: 900; color: #9CA3AF; text-align: right; }
        .final-sum .total { font-size: 30px; font-weight: 900; color: black; }

        .report-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #F3F4F6; text-align: center; }
        .report-footer p { margin: 0; font-size: 9px; font-weight: 800; color: #D1D5DB; letter-spacing: 4px; }

        /* PRINT OVERRIDES */
        @media print {
          @page { size: A4; margin: 0; }
          body > * { display: none !important; }
          #printable-report, 
          #printable-report *,
          .report-root, 
          .report-root * { 
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
          }
          #printable-report { 
            left: 0 !important;
            padding: 0 !important;
          }
          .kpi-grid { display: flex !important; flex-direction: row !important; }
        }
      `}} />
        </div>
    );
};

export default ElectionResults;
