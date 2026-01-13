
import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Calculator, PieChart, TrendingUp, Users, Info, RotateCcw, FileDown, Printer, CheckCircle2, Award } from 'lucide-react';

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
            { name: 'UGT', votes: ugt, color: 'bg-red-500', barColor: '#ef4444', textColor: 'text-red-600' },
            { name: 'CCOO', votes: ccoo, color: 'bg-orange-500', barColor: '#f97316', textColor: 'text-orange-600' },
            { name: 'CSIF', votes: csif, color: 'bg-blue-600', barColor: '#2563eb', textColor: 'text-blue-600' }
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
            const pdfWidth = 210;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Informe_Elecciones_Fibsal_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error(error);
            alert('Error técnico al generar el PDF.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* UI DASHBOARD (PANTALLA) */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/5 pb-6 print:hidden">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Estadísticas Electorales</h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Gestión de Escrutinio FIBSAL</p>
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
                        className="bg-primary hover:bg-primary/90 text-white font-bold h-10 shadow-lg shadow-primary/20 transition-all border-none"
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
                {/* INPUTS */}
                <Card className="md:col-span-1 border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
                    <CardHeader className="border-b border-white/5">
                        <CardTitle className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tighter">
                            <Calculator className="w-5 h-5 text-primary" />
                            Entrada de Votos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-5">
                        {['ugt', 'ccoo', 'csif'].map((key) => (
                            <div key={key} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{key}</label>
                                    <div className={`w-2 h-2 rounded-full ${key === 'ugt' ? 'bg-red-500' : key === 'ccoo' ? 'bg-orange-500' : 'bg-blue-600'}`}></div>
                                </div>
                                <Input
                                    type="number"
                                    name={key}
                                    value={(results as any)[key] || ''}
                                    onChange={handleInputChange}
                                    className="bg-black/40 border-white/20 focus:border-primary/50 text-xl font-mono text-white transition-all h-11"
                                    placeholder="0"
                                />
                            </div>
                        ))}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">En Blanco</label>
                                <Input type="number" name="blank" value={results.blank || ''} onChange={handleInputChange} className="bg-black/20 border-white/10 text-white h-10" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nulos</label>
                                <Input type="number" name="null" value={results.null || ''} onChange={handleInputChange} className="bg-black/20 border-white/10 text-white h-10" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* STATS */}
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="bg-gradient-to-br from-primary/20 to-transparent border-white/10 p-1">
                            <div className="bg-black/20 backdrop-blur-sm p-4 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Participación</p>
                                    <h3 className="text-4xl font-black text-white">{calculation.participation.toFixed(2)}%</h3>
                                </div>
                                <PieChart className="w-12 h-12 text-primary opacity-30" />
                            </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-500/20 to-transparent border-white/10 p-1">
                            <div className="bg-black/20 backdrop-blur-sm p-4 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Delegados</p>
                                    <h3 className="text-4xl font-black text-white">9</h3>
                                </div>
                                <TrendingUp className="w-12 h-12 text-green-500 opacity-30" />
                            </div>
                        </Card>
                    </div>

                    <Card className="border-white/10 bg-white/5 overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-white/10">
                                    <th className="px-6 py-4">Sindicato</th>
                                    <th className="px-6 py-4 text-center">Votos</th>
                                    <th className="px-6 py-4 text-right">Escaños</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {calculation.distribution.map((list) => (
                                    <tr key={list.name} className="hover:bg-white/5 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-1.5 h-10 rounded-full ${list.color} shadow-lg shadow-black/50`} />
                                                <span className="font-black text-white text-2xl tracking-tighter uppercase">{list.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-mono text-2xl text-white font-bold">{list.votes}</span>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                                                {((list.votes / (calculation.validVotes || 1)) * 100).toFixed(1)}% Votos Válidos
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center justify-center min-w-[3.5rem] h-14 bg-primary/20 border border-primary/30 text-primary text-4xl font-black rounded-2xl shadow-xl shadow-primary/20">
                                                {list.seats}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {calculation.distribution.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-20 text-center text-gray-600 italic">
                                            Sin datos suficientes para el reparto automático.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>

            {/* REPORTE PREMIUM (OCULTO EN PANTALLA, USADO PARA PDF E IMPRESIÓN) */}
            <div id="premium-report-container" className="report-isolated-container">
                <div ref={reportRef} className="premium-report-body">
                    <div className="report-header">
                        <div className="brand-info">
                            <h1 className="report-main-title">Escrutinio General</h1>
                            <p className="report-sub-title">FIBSAL · Elecciones Sindicales 2026</p>
                        </div>
                        <div className="report-meta">
                            <p className="meta-label">DOCUMENTO OFICIAL</p>
                            <p className="meta-value">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="report-stats-grid">
                        <div className="report-stat-card">
                            <span className="stat-label">CENSO ELECTORAL</span>
                            <span className="stat-value">{censusTotal}</span>
                        </div>
                        <div className="report-stat-card">
                            <span className="stat-label">VOTOS EMITIDOS</span>
                            <span className="stat-value">{calculation.totalVotes}</span>
                        </div>
                        <div className="report-stat-card highlight">
                            <span className="stat-label">PARTICIPACIÓN</span>
                            <span className="stat-value">{calculation.participation.toFixed(2)}%</span>
                        </div>
                    </div>

                    <div className="report-main-content">
                        <div className="report-left-panel">
                            <h3 className="report-section-title">Resumen de Votación</h3>
                            <table className="report-data-table">
                                <tbody>
                                    <tr>
                                        <td>Votos a Candidaturas</td>
                                        <td className="text-right font-bold">{results.ugt + results.ccoo + results.csif}</td>
                                    </tr>
                                    <tr>
                                        <td>Votos en Blanco</td>
                                        <td className="text-right font-bold">{results.blank}</td>
                                    </tr>
                                    <tr className="major-row">
                                        <td>TOTAL VOTOS VÁLIDOS</td>
                                        <td className="text-right font-black text-xl text-red-600">{calculation.validVotes}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-gray-400">Votos Nulos</td>
                                        <td className="text-right text-gray-400 font-bold">{results.null}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="report-threshold-info">
                                <strong>BARRERA DEL 5%:</strong> El umbral mínimo de exclusión se sitúa en <strong>{calculation.threshold.toFixed(2)}</strong> votos.
                            </div>
                        </div>

                        <div className="report-right-panel">
                            <h3 className="report-section-title">Adjudicación de 9 Representantes</h3>
                            <table className="report-results-table">
                                <thead>
                                    <tr>
                                        <th>Candidatura</th>
                                        <th className="text-center">Votos</th>
                                        <th className="text-center">% Vál.</th>
                                        <th className="text-right">Delegados</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calculation.distribution.map(l => (
                                        <tr key={l.name}>
                                            <td className="cand-name-cell">
                                                <div className="cand-color-indicator" style={{ backgroundColor: l.barColor }}></div>
                                                <span className="cand-name">{l.name}</span>
                                            </td>
                                            <td className="text-center font-bold text-lg">{l.votes}</td>
                                            <td className="text-center text-gray-500 font-bold">{((l.votes / (calculation.validVotes || 1)) * 100).toFixed(1)}%</td>
                                            <td className="text-right">
                                                <span className="cand-seats-badge">{l.seats}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="report-final-total">
                                        <td colSpan={3} className="text-right font-bold text-gray-400 uppercase text-[10px] tracking-widest py-4">Total Delegados Asignados</td>
                                        <td className="text-right font-black text-3xl py-4">9</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="report-footer-signature">
                        <div className="signature-area">
                            <p>Autenticado digitalmente por VotoTrack FIBSAL</p>
                            <div className="signature-line"></div>
                            <p className="signature-tag">CONTROL DE SISTEMAS ELECTORALES</p>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        /* ESTILOS PARA EVITAR LA HOJA EN BLANCO */
        .report-isolated-container {
          position: fixed;
          left: -4000px;
          top: 0;
          width: 210mm;
          min-height: 297mm;
          background: white;
          z-index: -9999;
          pointer-events: none;
        }

        .premium-report-body {
          padding: 20mm;
          background: white;
          color: black;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
        }

        .report-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 5px solid #ef4444; padding-bottom: 20px; margin-bottom: 30px; }
        .report-main-title { margin: 0; font-size: 32px; font-weight: 950; text-transform: uppercase; color: #ef4444; letter-spacing: -1.5px; }
        .report-sub-title { margin: 0; font-size: 16px; font-weight: 700; color: #4B5563; }
        .report-meta { text-align: right; }
        .meta-label { margin: 0; font-size: 10px; font-weight: 900; color: #9CA3AF; letter-spacing: 2px; }
        .meta-value { margin: 0; font-size: 14px; font-weight: 800; }

        .report-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 40px; }
        .report-stat-card { padding: 20px; background: #F3F4F6; border-radius: 16px; display: flex; flex-direction: column; border: 1px solid #E5E7EB; }
        .report-stat-card.highlight { background: #FEF2F2; border: 1px solid #FEE2E2; }
        .stat-label { font-size: 10px; font-weight: 900; color: #6B7280; margin-bottom: 5px; letter-spacing: 1px; }
        .stat-value { font-size: 36px; font-weight: 950; color: black; line-height: 1; }
        .report-stat-card.highlight .stat-value { color: #DC2626; }

        .report-section-title { font-size: 12px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; border-bottom: 1px solid #F3F4F6; padding-bottom: 8px; }
        .report-main-content { display: grid; grid-template-columns: 1fr 1.6fr; gap: 40px; }

        .report-data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .report-data-table td { padding: 12px 0; border-bottom: 1px solid #F3F4F6; }
        .major-row td { border-bottom: 3px solid black; padding: 20px 0; font-weight: 900; color: black; }
        .report-threshold-info { margin-top: 30px; padding: 20px; background: #F9FAFB; border-radius: 12px; border: 1px dashed #D1D5DB; font-size: 12px; line-height: 1.5; }

        .report-results-table { width: 100%; border-collapse: collapse; }
        .report-results-table th { font-size: 10px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; padding: 10px; text-align: left; }
        .report-results-table td { padding: 15px 10px; border-bottom: 1px solid #F3F4F6; }
        .cand-name-cell { display: flex; align-items: center; gap: 12px; }
        .cand-color-indicator { width: 4px; height: 35px; border-radius: 99px; }
        .cand-name { font-size: 22px; font-weight: 950; letter-spacing: -0.8px; text-transform: uppercase; }
        .cand-seats-badge { display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: black; color: white; border-radius: 14px; font-size: 28px; font-weight: 950; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }

        .report-footer-signature { margin-top: 60px; text-align: center; }
        .signature-area { display: inline-block; text-align: center; }
        .signature-area p { margin: 5px 0; font-size: 10px; font-weight: 700; color: #D1D5DB; }
        .signature-line { width: 250px; height: 1px; background: #E5E7EB; margin: 20px auto 10px; }
        .signature-tag { font-size: 8px !important; letter-spacing: 5px; color: #E5E7EB !important; }

        /* REGLAS DE IMPRESIÓN MAESTRAS */
        @media print {
          /* 1. Ocultamos TODO lo que hay en el body */
          body > * { display: none !important; }

          /* 2. Forzamos que el contenedor del reporte se comporte como el único elemento raíz */
          #premium-report-container, 
          #premium-report-container * {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            z-index: 99999 !important;
          }

          /* 3. Ajustes de página A4 */
          @page {
            size: A4;
            margin: 0;
          }
          
          /* 4. Colores y fondos forzados en impresión */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 5. Asegurar visibilidad de flex/grid */
          .report-header, .report-stats-grid, .report-main-content {
            display: flex !important;
          }
          .report-stats-grid > div { flex: 1; }
          .report-left-panel { width: 35%; }
          .report-right-panel { width: 65%; }
        }
      `}} />
        </div>
    );
};

export default ElectionResults;
