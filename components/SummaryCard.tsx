
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Progress } from './ui/Progress';
import { Users, UserCheck, UserX } from 'lucide-react';

interface SummaryCardProps {
    totalVoters: number;
    votersWhoVoted: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ totalVoters, votersWhoVoted }) => {
    const notVoted = totalVoters - votersWhoVoted;
    const participationPercentage = totalVoters > 0 ? (votersWhoVoted / totalVoters) * 100 : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resumen de Participación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                        <Users className="w-4 h-4" />
                        <span>Censo Total</span>
                    </div>
                    <span className="font-bold">{totalVoters}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-green-400">
                        <UserCheck className="w-4 h-4" />
                        <span>Han Votado</span>
                    </div>
                    <span className="font-bold">{votersWhoVoted}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-red-400">
                        <UserX className="w-4 h-4" />
                        <span>No Han Votado</span>
                    </div>
                    <span className="font-bold">{notVoted}</span>
                </div>
                <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-primary">Participación Total</span>
                        <span className="text-sm font-bold text-primary">{participationPercentage.toFixed(2)}%</span>
                    </div>
                    <Progress value={participationPercentage} />
                </div>
            </CardContent>
        </Card>
    );
};

export default SummaryCard;
