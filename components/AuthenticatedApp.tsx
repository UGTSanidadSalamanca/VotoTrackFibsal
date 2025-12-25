import React, { useState, useMemo, useContext, useCallback, useEffect } from 'react';
import { voterService, VOTING_CENTERS, SHEET_CSV_URL } from '../lib/data';
import { Voter, User } from '../types';
import Header from './Header';
import SummaryCard from './SummaryCard';
import StatisticsCard from './StatisticsCard';
import FilterControls from './FilterControls';
import VoterList from './VoterList';
import UserManagement from './UserManagement';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AuthContext } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Users, UserCog, RefreshCw, AlertCircle, Clock } from 'lucide-react';

const normalizeText = (text: string) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const AuthenticatedApp: React.FC = () => {
  const auth = useContext(AuthContext);
  const currentUser = auth?.user as User;

  const [activeTab, setActiveTab] = useState<'voters' | 'users'>('voters');
  const [allVoters, setAllVoters] = useLocalStorage<Voter[]>('voto-track-voters', []);
  const [lastSync, setLastSync] = useLocalStorage<string | null>('voto-track-last-sync', null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [affiliationFilter, setAffiliationFilter] = useState('todos');
  const [voteStatusFilter, setVoteStatusFilter] = useState('todos');
  const [centerFilter, setCenterFilter] = useState(currentUser.role === 'mesa' ? currentUser.center : 'todos');
  
  const loadFromSheet = useCallback(async () => {
    if (!SHEET_CSV_URL || !SHEET_CSV_URL.includes('spreadsheets')) {
        setError('Configuración de enlace no válida.');
        return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await voterService.fetchFromSheet(SHEET_CSV_URL);
      if (data && data.length > 0) {
        setAllVoters(data);
        setLastSync(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error(err);
      setError('Error al sincronizar. Revisa la conexión.');
    } finally {
      setIsLoading(false);
    }
  }, [setAllVoters, setLastSync]);

  useEffect(() => {
    if (allVoters.length === 0) {
      loadFromSheet();
    }
  }, []);

  const handleVoterStatusChange = useCallback(async (voterId: number, hasVoted: boolean) => {
    const result = await voterService.updateVoterStatus(voterId, hasVoted);
    if(result.success) {
        setAllVoters(prevVoters => 
            prevVoters.map(v => 
                v.id === voterId ? { ...v, haVotado: hasVoted, horaVoto: result.horaVoto } : v
            )
        );
    }
  }, [setAllVoters]);

  const votersForUser = useMemo(() => {
    if (currentUser.role === 'mesa') {
        return allVoters.filter(v => v.centroVotacion === currentUser.center);
    }
    return allVoters;
  }, [allVoters, currentUser]);

  const filteredVoters = useMemo(() => {
    return votersForUser
      .filter(voter => {
        const normalizedSearch = normalizeText(searchTerm);
        const nameMatch = normalizeText(voter.nombre + ' ' + voter.apellido + ' ' + voter.apellido2).includes(normalizedSearch);
        const emailMatch = normalizeText(voter.email).includes(normalizedSearch);
        const phoneMatch = voter.telefono.includes(normalizedSearch);
        return nameMatch || emailMatch || phoneMatch;
      })
      .filter(voter => {
        if (affiliationFilter === 'afiliados') return voter.afiliadoUGT;
        if (affiliationFilter === 'no_afiliados') return !voter.afiliadoUGT;
        return true;
      })
      .filter(voter => {
        if (voteStatusFilter === 'votado') return voter.haVotado;
        if (voteStatusFilter === 'no_votado') return !voter.haVotado;
        return true;
      })
      .filter(voter => {
        if (currentUser.role === 'admin' && centerFilter !== 'todos') {
            return voter.centroVotacion === centerFilter;
        }
        return true; 
      });
  }, [votersForUser, searchTerm, affiliationFilter, voteStatusFilter, centerFilter, currentUser.role]);
  
  const votingCenters = useMemo(() => ['todos', ...VOTING_CENTERS], []);

  const totalVoters = votersForUser.length;
  const votersWhoVoted = votersForUser.filter(v => v.haVotado).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Header />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
            {currentUser.role === 'admin' && (
                <div className="flex gap-2 bg-card p-1 border border-white/10 rounded-lg w-fit">
                <Button 
                    variant={activeTab === 'voters' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setActiveTab('voters')}
                >
                    <Users className="w-4 h-4 mr-2" />
                    Censo
                </Button>
                <Button 
                    variant={activeTab === 'users' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setActiveTab('users')}
                >
                    <UserCog className="w-4 h-4 mr-2" />
                    Usuarios
                </Button>
                </div>
            )}
            {lastSync && (
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wider ml-1">
                    <Clock className="w-3 h-3" />
                    Sincronizado: {lastSync}
                </div>
            )}
        </div>

        <div className="flex items-center gap-2">
            {error && (
                <span className="flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">
                    <AlertCircle className="w-3 h-3" /> {error}
                </span>
            )}
            <Button 
                variant="outline" 
                size="sm" 
                onClick={loadFromSheet} 
                disabled={isLoading}
                className="gap-2 bg-white/5"
            >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Sincronizando...' : 'Refrescar Datos'}
            </Button>
        </div>
      </div>

      {activeTab === 'voters' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 flex flex-col gap-6">
            <SummaryCard 
              totalVoters={totalVoters}
              votersWhoVoted={votersWhoVoted}
            />
            <StatisticsCard voters={votersForUser} />
          </aside>

          <main className="lg:col-span-2 flex flex-col gap-6">
            <FilterControls
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                affiliationFilter={affiliationFilter}
                setAffiliationFilter={setAffiliationFilter}
                voteStatusFilter={voteStatusFilter}
                setVoteStatusFilter={setVoteStatusFilter}
                centerFilter={centerFilter}
                setCenterFilter={setCenterFilter}
                votingCenters={votingCenters}
                user={currentUser}
                filteredVoters={filteredVoters}
            />
            {isLoading && allVoters.length === 0 ? (
                <div className="p-12 text-center text-gray-400 border border-dashed border-white/10 rounded-xl">
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
                    Cargando censo desde FIBSAL...
                </div>
            ) : (
                <VoterList 
                    voters={filteredVoters} 
                    onStatusChange={handleVoterStatusChange} 
                />
            )}
          </main>
        </div>
      ) : (
        <UserManagement />
      )}
    </div>
  );
};

export default AuthenticatedApp;
