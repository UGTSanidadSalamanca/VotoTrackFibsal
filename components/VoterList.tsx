import React from 'react';
import { Voter } from '../types';
import VoterCard from './VoterCard';
import { Card, CardContent } from './ui/Card';
import { Accordion } from './ui/Accordion';
import { Button } from './ui/Button';
import { Send } from 'lucide-react';
import { voterService } from '../lib/data';

interface VoterListProps {
    voters: Voter[];
    onStatusChange: (voterId: number, hasVoted: boolean) => void;
}

const VoterList: React.FC<VoterListProps> = ({ voters, onStatusChange }) => {
    const noVotados = voters.filter(v => !v.haVotado && v.afiliadoUGT).map(v => v.id);

    return (
        <Card>
            <CardContent className="p-6">
                {noVotados.length > 0 && (
                    <div className="flex items-center justify-between mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <span className="text-sm font-medium text-primary">
                            Hay {noVotados.length} personas que aún no han votado
                        </span>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => voterService.sendMassReminder(noVotados)}
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Recordatorio Masivo (WhatsApp)
                        </Button>
                    </div>
                )}
                <Accordion type="single" collapsible>
                    {voters.map(voter => (
                        <VoterCard
                            key={voter.id}
                            voter={voter}
                            onStatusChange={onStatusChange}
                        />
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
};

export default VoterList;
