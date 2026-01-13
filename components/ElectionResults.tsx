
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

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            const pageHeight = pdf.internal.pageSize.getHeight();

            if (pdfHeight > pageHeight) {
                // Reducimos un pelín el ancho para asegurar márgenes laterales en el PDF y escalamos alto
                pdf.addImage(imgData, 'PNG', 5, 5, pdfWidth - 10, pageHeight - 15);
            } else {
                pdf.addImage(imgData, 'PNG', 5, 5, pdfWidth - 10, pdfHeight);
            }

            pdf.save(`Informe_Elecciones_Fibsal_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error técnico al generar el PDF.');
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
                {/* UI normal del cálculo */}
                <Card className="md:col-span-1 border-white/10 bg-white/5 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
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

                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="border-white/10 bg-white/5">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Participación</p>
                                        <h3 className={`text-4xl font-black ${participationColor}`}>
                                            {calculation.participation.toFixed(2)}%
                                        </h3>
                                    </div>
                                    <PieChart className="w-8 h-8 text-primary opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-white/10 bg-white/5">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Delegados</p>
                                        <h3 className="text-4xl font-black text-white">9</h3>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-white/10 bg-white/5 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-[10px] uppercase font-black text-gray-500 border-b border-white/10">
                                    <th className="px-6 py-4">Sindicato</th>
                                    <th className="px-6 py-4 text-center">Votos</th>
                                    <th className="px-6 py-4 text-right">Escaños</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {calculation.distribution.map((list) => (
                                    <tr key={list.name}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 h-6 rounded-full ${list.color}`} />
                                                <span className="font-bold text-white uppercase text-sm">{list.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-xl text-white">{list.votes}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="bg-primary/20 text-primary px-3 py-1 rounded font-black text-xl">
                                                {list.seats}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>

            {/* REPORTE ULTRACONCENTRADO PARA PDF E IMPRESIÓN */}
            <div
                style={{
                    position: 'absolute',
                    top: '-9999px',
                    left: '0',
                    width: '190mm', // Un poco más estrecho para evitar cortes laterales
                    backgroundColor: '#ffffff'
                }}
                className="print-report-container"
            >
                <div ref={reportRef} className="p-6 text-black font-sans bg-white" style={{ width: '190mm' }}>
                    {/* Cabecera */}
                    <div className="flex justify-between items-end border-b-2 border-red-600 pb-2 mb-4">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-red-600 leading-none">ACTA DE ESCRUTINIO</h1>
                            <p className="text-base font-bold text-gray-600">FIBSAL - Resultados Oficiales</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase">Emisión</p>
                            <p className="text-sm font-black">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* Estadísticas clave */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-gray-500 uppercase leading-none mb-1">Censo</p>
                            <p className="text-2xl font-black leading-none">{censusTotal}</p>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-gray-500 uppercase leading-none mb-1">Escrutados</p>
                            <p className="text-2xl font-black leading-none">{calculation.totalVotes}</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg border border-red-100 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-red-700 uppercase leading-none mb-1">Participación</p>
                            <p className="text-2xl font-black text-red-600 leading-none">{calculation.participation.toFixed(2)}%</p>
                        </div>
                    </div>

                    {/* Análisis de votos */}
                    <div className="mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 text-gray-300 border-b border-gray-50 pb-1">RESULTADOS DE VOTO</h3>
                        <div className="flex gap-6 items-start">
                            <table className="flex-1 text-xs">
                                <tbody>
                                    <tr className="border-b border-gray-50">
                                        <td className="py-1.5 font-bold text-gray-600">Votos a Candidaturas</td>
                                        <td className="py-1.5 text-right font-black">{results.ugt + results.ccoo + results.csif}</td>
                                    </tr>
                                    <tr className="border-b border-gray-50">
                                        <td className="py-1.5 font-bold text-gray-600">Votos en Blanco</td>
                                        <td className="py-1.5 text-right font-black">{results.blank}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-black text-black text-sm">VOTOS VÁLIDOS EMITIDOS</td>
                                        <td className="py-2 text-right font-black text-xl text-red-600">{calculation.validVotes}</td>
                                    </tr>
                                    <tr className="text-gray-400 text-[10px] italic">
                                        <td className="py-1">Papeletas Nulas / Otros</td>
                                        <td className="py-1 text-right font-bold">{results.null}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="w-48 bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                                <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Barrera Electoral (5%)</p>
                                <p className="text-lg font-black">{calculation.threshold.toFixed(2)}</p>
                                <p className="text-[7px] text-gray-400 mt-1 uppercase leading-tight font-bold">Votos mínimos necesarios</p>
                            </div>
                        </div>
                    </div>

                    {/* Adjudicación */}
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 text-gray-300 border-b border-gray-50 pb-1">REPARTO DE 9 DELEGADOS (SISTEMA DE RESTOS MAYORES)</h3>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[8px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                    <th className="py-2 px-2">Candidatura</th>
                                    <th className="py-2 text-center">Votos</th>
                                    <th className="py-2 text-center">% S/ Válidos</th>
                                    <th className="py-2 text-right">Delegados Obt.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {calculation.distribution.map((list) => (
                                    <tr key={list.name}>
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: list.barColor }} />
                                                <span className="text-lg font-black uppercase">{list.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-center text-lg font-bold">{list.votes}</td>
                                        <td className="py-3 text-center text-gray-500 font-bold text-sm">{((list.votes / calculation.validVotes) * 100).toFixed(1)}%</td>
                                        <td className="py-3 text-right">
                                            <span className="inline-block px-4 py-1.5 bg-black text-white text-xl font-black rounded-md">
                                                {list.seats}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center text-[8px] font-bold text-gray-300 uppercase tracking-widest">
                        <p>© VotoTrack FIBSAL 2026</p>
                        <p>Documento de caracter informativo generado por el sistema</p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: hidden !important;
          }
          body * { 
            visibility: hidden !important; 
          }
          .print-report-container, .print-report-container * { 
            visibility: visible !important;
            display: block !important;
          }
          .print-report-container { 
            position: absolute !important; 
            top: 0 !important; 
            left: 50% !important;
            transform: translateX(-50%) scale(0.95) !important;
            transform-origin: top center !important;
            width: 190mm !important;
            margin: 0 !important;
            padding: 10mm 0 !important;
            background: white !important;
            z-index: 9999 !important;
          }
        }
      `}} />
        </div>
    );
};

export default ElectionResults;
