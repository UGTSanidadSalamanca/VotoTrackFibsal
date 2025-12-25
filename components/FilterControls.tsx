
import React from 'react';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { User, Voter } from '../types';
import { voterService } from '../lib/data';
import { Send } from 'lucide-react';

interface FilterControlsProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    affiliationFilter: string;
    setAffiliationFilter: (value: string) => void;
    voteStatusFilter: string;
    setVoteStatusFilter: (value: string) => void;
    centerFilter: string;
    setCenterFilter: (value: string) => void;
    votingCenters: string[];
    user: User;
    filteredVoters: Voter[];
}

const FilterControls: React.FC<FilterControlsProps> = ({
    searchTerm,
    setSearchTerm,
    affiliationFilter,
    setAffiliationFilter,
    voteStatusFilter,
    setVoteStatusFilter,
    centerFilter,
    setCenterFilter,
    votingCenters,
    user,
    filteredVoters
}) => {

    const handleMassReminder = () => {
        const voterIds = filteredVoters.map(v => v.id);
        if (voterIds.length > 0) {
            voterService.sendMassReminder(voterIds);
        } else {
            alert('No hay votantes que cumplan los criterios para el envío masivo.');
        }
    };
    
    const showMassReminderButton = affiliationFilter === 'afiliados' && voteStatusFilter === 'no_votado';

    return (
        <Card>
            <CardContent className="p-4 space-y-4">
                <Input
                    type="text"
                    placeholder="Buscar por nombre, apellido, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select value={affiliationFilter} onChange={(e) => setAffiliationFilter(e.target.value)}>
                        <option value="todos">Todos (Afiliación)</option>
                        <option value="afiliados">Afiliados</option>
                        <option value="no_afiliados">No Afiliados</option>
                    </Select>
                    <Select value={voteStatusFilter} onChange={(e) => setVoteStatusFilter(e.target.value)}>
                        <option value="todos">Todos (Voto)</option>
                        <option value="votado">Han Votado</option>
                        <option value="no_votado">No Han Votado</option>
                    </Select>
                    <Select value={centerFilter} onChange={(e) => setCenterFilter(e.target.value)} disabled={user.role === 'mesa'}>
                        {votingCenters.map(center => (
                            <option key={center} value={center}>{center === 'todos' ? 'Todos los Centros' : center}</option>
                        ))}
                    </Select>
                </div>
                {showMassReminderButton && (
                     <Button variant="accent" onClick={handleMassReminder} className="w-full md:w-auto">
                        <Send className="w-4 h-4 mr-2" />
                        Envío Masivo de Recordatorios ({filteredVoters.length})
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default FilterControls;
