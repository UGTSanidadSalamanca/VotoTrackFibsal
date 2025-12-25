
import React from 'react';
import { Voter } from '../types';
import VoterCard from './VoterCard';
import { Card, CardContent } from './ui/Card';
import { Accordion } from './ui/Accordion';

interface VoterListProps {
    voters: Voter[];
    onStatusChange: (voterId: number, hasVoted: boolean) => void;
}

const VoterList: React.FC<VoterListProps> = ({ voters, onStatusChange }) => {
    if (voters.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-gray-400">
                    <p>No se encontraron votantes que coincidan con los filtros seleccionados.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardContent className="p-0">
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
