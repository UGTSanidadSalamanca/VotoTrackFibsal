
import React, { useMemo } from 'react';
import { Voter } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Progress } from './ui/Progress';

interface StatisticsCardProps {
    voters: Voter[];
}

const StatBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span className="font-semibold">{value} / {total}</span>
            </div>
            <Progress value={percentage} indicatorColor={color} />
        </div>
    );
};


const StatisticsCard: React.FC<StatisticsCardProps> = ({ voters }) => {
    
    const statsByAffiliation = useMemo(() => {
        const afiliados = voters.filter(v => v.afiliadoUGT);
        const noAfiliados = voters.filter(v => !v.afiliadoUGT);
        return {
            afiliados: {
                total: afiliados.length,
                voted: afiliados.filter(v => v.haVotado).length
            },
            noAfiliados: {
                total: noAfiliados.length,
                voted: noAfiliados.filter(v => v.haVotado).length
            }
        }
    }, [voters]);

    const statsByCenter = useMemo(() => {
        const centers: { [key: string]: { total: number, voted: number } } = {};
        voters.forEach(voter => {
            if (!centers[voter.centroVotacion]) {
                centers[voter.centroVotacion] = { total: 0, voted: 0 };
            }
            centers[voter.centroVotacion].total++;
            if (voter.haVotado) {
                centers[voter.centroVotacion].voted++;
            }
        });
        return Object.entries(centers).sort(([a], [b]) => a.localeCompare(b));
    }, [voters]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Estadísticas Detalladas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="font-semibold mb-2">Por Afiliación</h4>
                    <div className="space-y-3">
                        <StatBar label="Afiliados" value={statsByAffiliation.afiliados.voted} total={statsByAffiliation.afiliados.total} color="bg-blue-500" />
                        <StatBar label="No Afiliados" value={statsByAffiliation.noAfiliados.voted} total={statsByAffiliation.noAfiliados.total} color="bg-gray-500" />
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">Por Centro de Votación</h4>
                    <div className="space-y-3">
                        {statsByCenter.length > 0 ? statsByCenter.map(([center, data]) => (
                            <StatBar key={center} label={center} value={data.voted} total={data.total} color="bg-teal-500"/>
                        )) : <p className="text-sm text-gray-400">No hay datos de centros.</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default StatisticsCard;
