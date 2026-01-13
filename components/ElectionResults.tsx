
import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Calculator, PieChart, TrendingUp, Users, Info, RotateCcw, FileDown, Printer, Award, Table as TableIcon } from 'lucide-react';

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
            { name: 'UGT', votes: ugt, color: 'bg-red-600', barColor: '#dc2626', textColor: 'text-red-600' },
            { name: 'CCOO', votes: ccoo, color: 'bg-orange-500', barColor: '#f97316', textColor: 'text-orange-600' },
            { name: 'CSIF', votes: csif, color: 'bg-blue-700', barColor: '#1d4ed8', textColor: 'text-blue-700' }
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
                logging: false,
                onclone: (clonedDoc) => {
                    // Ensure the cloned element is visible for capture
                    const report = clonedDoc.getElementById('printable-report-wrapper');
                    if (report) report.style.display = 'block';
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Acta_Resultados_Fibsal_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error(error);
            alert('Error técnico al generar el PDF.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* UI DESKTOP */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/5 pb-6 print:hidden">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Cálculo de Resultados</h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Escrutinio y Reparto de Delegados</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={resetResults} className="text-gray-400 hover:text-white border-white/10 h-10">
                        <RotateCcw className="w-4 h-4 mr-2" /> Reiniciar
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="text-gray-400 hover:text-white border-white/10 h-10">
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                    <Button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF || calculation.totalVotes === 0}
                        className="bg-primary hover:bg-primary/90 text-white font-bold h-10 shadow-lg shadow-primary/20 border-none px-6"
                    >
                        {isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
                {/* INPUTS SECTION */}
                <Card className="lg:col-span-1 border-white/10 bg-white/5 backdrop-blur-md">
                    <CardHeader className="border-b border-white/5">
                        <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-primary" />
                            Entrada de Votos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            {['ugt', 'ccoo', 'csif'].map((key) => (
                                <div key={key} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{key}</label>
                                        <div className={`w-2 h-2 rounded-full ${key === 'ugt' ? 'bg-red-600' : key === 'ccoo' ? 'bg-orange-500' : 'bg-blue-700'}`}></div>
                                    </div>
                                    <Input
                                        type="number"
                                        name={key}
                                        value={(results as any)[key] || ''}
                                        onChange={handleInputChange}
                                        className="bg-black/40 border-white/20 text-white text-xl font-mono h-12 text-right px-4"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Blancos</label>
                                <Input type="number" name="blank" value={results.blank || ''} onChange={handleInputChange} className="bg-black/20 border-white/10 text-white h-10 text-right" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nulos</label>
                                <Input type="number" name="null" value={results.null || ''} onChange={handleInputChange} className="bg-black/20 border-white/10 text-white h-10 text-right" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* STATS SECTION */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Participación</p>
                                <h3 className="text-4xl font-black text-white">{calculation.participation.toFixed(2)}%</h3>
                                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">{calculation.totalVotes} votos / {censusTotal} censo</p>
                            </div>
                            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                                <PieChart className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Delegados</p>
                                <h3 className="text-4xl font-black text-white">9</h3>
                                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Repantimiento Hamilton</p>
                            </div>
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                    </div>

                    <Card className="border-white/10 bg-white/5 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-white/10">
                                    <th className="px-6 py-4">Sindicato</th>
                                    <th className="px-6 py-4 text-center">Votos</th>
                                    <th className="px-6 py-4 text-right">Escaños</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {calculation.distribution.map((l) => (
                                    <tr key={l.name} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-10 rounded-full ${l.color}`}></div>
                                                <span className="text-xl font-black text-white tracking-tighter uppercase">{l.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <p className="text-2xl font-mono text-white font-bold">{l.votes}</p>
                                            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">{((l.votes / (calculation.validVotes || 1)) * 100).toFixed(1)}%</p>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="inline-flex min-w-[3.5rem] h-14 items-center justify-center bg-primary/20 border border-primary/30 text-primary text-3xl font-black rounded-2xl">
                                                {l.seats}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>

            {/* 
          PRINTABLE REPORT: 
          This is what becomes visible only on PRINT or when generating PDF.
      */}
            <div id="printable-report-wrapper" className="print-only-layout print:block hidden overflow-hidden">
                <div ref={reportRef} className="report-canvas">
                    {/* Header */}
                    <div className="report-top-header">
                        <div className="report-titles">
                            <h1 className="report-main-title">Acta de Escrutinio Final</h1>
                            <p className="report-sub-title">ELECCIONES SINDICALES FIBSAL 2026</p>
                        </div>
                        <div className="report-info-box">
                            <p className="info-label">FECHA DE EMISIÓN</p>
                            <p className="info-value">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="report-stats-stripe">
                        <div className="stripe-item">
                            <span className="item-lbl">CENSO TOTAL</span>
                            <span className="item-val">{censusTotal}</span>
                        </div>
                        <div className="stripe-item border-l">
                            <span className="item-lbl">VOTOS EMITIDOS</span>
                            <span className="item-val">{calculation.totalVotes}</span>
                        </div>
                        <div className="stripe-item border-l highlight">
                            <span className="item-lbl">PARTICIPACIÓN</span>
                            <span className="item-val">{calculation.participation.toFixed(2)}%</span>
                        </div>
                    </div>

                    {/* Breakdown Section */}
                    <div className="report-sections">
                        <div className="section-left">
                            <h3 className="section-hdr">Desglose de Votos</h3>
                            <table className="simple-report-table">
                                <tbody>
                                    <tr>
                                        <td>Votos a Candidaturas</td>
                                        <td className="text-right bold">{(results.ugt + results.ccoo + results.csif)}</td>
                                    </tr>
                                    <tr>
                                        <td>Votos en Blanco</td>
                                        <td className="text-right bold">{results.blank}</td>
                                    </tr>
                                    <tr className="accent-row">
                                        <td>TOTAL VOTOS VÁLIDOS</td>
                                        <td className="text-right bolder">{calculation.validVotes}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-slate-400">Votos Nulos</td>
                                        <td className="text-right text-slate-400">{results.null}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="barrera-alert">
                                <p>Barrera Electoral del <strong>5.00%</strong>: Los sindicatos requieren un mínimo de <strong>{calculation.threshold.toFixed(2)}</strong> votos para entrar en la adjudicación de escaños.</p>
                            </div>
                        </div>

                        <div className="section-right">
                            <h3 className="section-hdr">Adjudicación de 9 Representantes</h3>
                            <table className="results-report-table">
                                <thead>
                                    <tr>
                                        <th className="text-left">CANDIDATURA</th>
                                        <th className="text-center">VOTOS</th>
                                        <th className="text-center">% VÁL.</th>
                                        <th className="text-right">DELEGADOS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calculation.distribution.map(l => (
                                        <tr key={l.name}>
                                            <td className="flex-name">
                                                <div className="color-strip" style={{ backgroundColor: l.barColor }}></div>
                                                <span className="lbl-name">{l.name}</span>
                                            </td>
                                            <td className="text-center font-bold">{l.votes}</td>
                                            <td className="text-center text-slate-500">{((l.votes / (calculation.validVotes || 1)) * 100).toFixed(1)}%</td>
                                            <td className="text-right">
                                                <span className="seat-circle">{l.seats}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="final-stripe">
                                        <td colSpan={3} className="text-right font-bold text-slate-400 uppercase text-[10px]">Total Escaños Asignados</td>
                                        <td className="text-right font-black text-2xl">9</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="report-footer-banner">
                        <p>SISTEMA DE GESTIÓN ELECTORAL VOTOTRACK FIBSAL - DOCUMENTO VÁLIDO PARA INFORMACIÓN</p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        /* REPORT STORES STYLES - WHITE THEME FOR PRINT */
        .report-canvas {
          width: 190mm;
          min-height: 270mm;
          background: #ffffff !important;
          color: #000000 !important;
          padding: 10mm;
          font-family: 'Inter', sans-serif !important;
          box-sizing: border-box;
          text-align: left;
        }

        .report-top-header { border-bottom: 5px solid #dc2626; padding-bottom: 10px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
        .report-main-title { margin: 0; font-size: 30px; font-weight: 900; color: #dc2626 !important; text-transform: uppercase; letter-spacing: -1.5px; line-height: 1; }
        .report-sub-title { margin: 5px 0 0 0; font-size: 14px; font-weight: 800; color: #4b5563 !important; }
        .info-label { margin: 0; font-size: 9px; font-weight: 900; color: #9ca3af !important; letter-spacing: 2px; }
        .info-value { margin: 0; font-size: 14px; font-weight: 800; color: #000 !important; }

        .report-stats-stripe { display: flex; background: #f3f4f6 !important; border-radius: 12px; margin-bottom: 30px; overflow: hidden; border: 1px solid #e5e7eb; }
        .stripe-item { flex: 1; padding: 15px; text-align: center; }
        .item-lbl { display: block; font-size: 9px; font-weight: 900; color: #6b7280 !important; margin-bottom: 5px; }
        .item-val { display: block; font-size: 28px; font-weight: 950; color: #000 !important; }
        .border-l { border-left: 1px solid #e5e7eb; }
        .stripe-item.highlight .item-val { color: #dc2626 !important; }

        .report-sections { display: flex; gap: 30px; }
        .section-left { width: 38%; }
        .section-right { width: 62%; }
        .section-hdr { font-size: 11px; font-weight: 900; color: #9ca3af !important; border-bottom: 2px solid #f3f4f6; padding-bottom: 5px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1.5px; }

        .simple-report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .simple-report-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .bold { font-weight: 700; }
        .accent-row td { padding: 15px 0; border-bottom: 2px solid #000; }
        .bolder { font-size: 20px; font-weight: 900; color: #dc2626 !important; }
        .barrera-alert { margin-top: 20px; padding: 15px; background: #fffcf0 !important; border: 1px dashed #eab308; border-radius: 10px; font-size: 11px; color: #854d0e !important; }

        .results-report-table { width: 100%; border-collapse: collapse; }
        .results-report-table th { font-size: 9px; font-weight: 900; color: #9ca3af !important; padding: 10px; border-bottom: 2px solid #f3f4f6; }
        .results-report-table td { padding: 12px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        .flex-name { display: flex; align-items: center; gap: 10px; }
        .color-strip { width: 4px; height: 35px; border-radius: 99px; }
        .lbl-name { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
        .seat-circle { display: inline-flex; width: 45px; height: 45px; background: #000 !important; color: #fff !important; border-radius: 12px; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; }
        .final-stripe td { border: none; padding-top: 20px; }

        .report-footer-banner { margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: center; }
        .report-footer-banner p { font-size: 9px; font-weight: 900; color: #d1d5db !important; letter-spacing: 3px; margin: 0; }

        .text-right { text-align: right; }
        .text-center { text-align: center; }

        @media print {
          /* REMOVE EVERYTHING BLACK FROM THE PAGE */
          html, body { background: #ffffff !important; color: #000000 !important; margin: 0 !important; padding: 0 !important; height: auto !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          /* HIDE SCREEN ELEMENTS */
          body > * { display: none !important; }
          
          /* SHOW ONLY REPORT */
          #printable-report-wrapper { 
            display: block !important; 
            visibility: visible !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            z-index: 99999 !important;
          }
          
          .report-canvas {
            display: block !important;
            visibility: visible !important;
            width: 190mm !important;
            margin: 0 auto !important;
          }
          
          /* FORCE COLORS */
          .report-top-header { border-bottom-color: #dc2626 !important; }
          .report-stats-stripe { background-color: #f3f4f6 !important; }
          .item-val { color: #000 !important; }
          .stripe-item.highlight .item-val { color: #dc2626 !important; }
          .seat-circle { background-color: #000 !important; color: #fff !important; }
        }
      `}} />
        </div>
    );
};

export default ElectionResults;
