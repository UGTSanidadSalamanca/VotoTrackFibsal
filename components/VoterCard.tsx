import React from 'react';
import { Voter } from '../types';
import { AccordionItem, AccordionTrigger, AccordionContent } from './ui/Accordion';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { voterService } from '../lib/data';
import { ThumbsUp, ThumbsDown, Send, Mail, Phone, MapPin } from 'lucide-react';

interface VoterCardProps {
    voter: Voter;
    onStatusChange: (voterId: number, hasVoted: boolean) => void;
}

const VoterCard: React.FC<VoterCardProps> = ({ voter, onStatusChange }) => {
    const fullName = `${voter.nombre} ${voter.apellido} ${voter.apellido2}`;

    return (
        <AccordionItem value={`voter-${voter.id}`}>
            <AccordionTrigger>
                 <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-lg">{fullName}</span>
                    <div className="flex items-center gap-2">
                        {voter.afiliadoUGT && <Badge variant="default">Afiliado</Badge>}
                        {voter.haVotado ? (
                            <Badge variant="accent">Ha Votado</Badge>
                        ) : (
                            <Badge variant="destructive">No ha Votado</Badge>
                        )}
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="text-sm text-gray-300 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" />
                            <span>{voter.email}</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-primary" />
                            <span>{voter.telefono}</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{voter.centroVotacion}</span>
                        </div>
                        {voter.haVotado && voter.horaVoto && (
                             <div className="flex items-center gap-2">
                                <ThumbsUp className="w-4 h-4 text-accent" />
                                <span>Votó a las: {voter.horaVoto}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                        {voter.haVotado ? (
                            <Button variant="destructive" size="sm" onClick={() => onStatusChange(voter.id, false)}>
                                <ThumbsDown className="w-4 h-4 mr-2" />
                                Anular Voto
                            </Button>
                        ) : (
                            <>
                                <Button variant="accent" size="sm" onClick={() => onStatusChange(voter.id, true)}>
                                    <ThumbsUp className="w-4 h-4 mr-2" />
                                    Marcar como Votado
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => voterService.sendReminder(voter.id)}>
                                    <Send className="w-4 h-4 mr-2" />
                                    Enviar Recordatorio
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default VoterCard;
