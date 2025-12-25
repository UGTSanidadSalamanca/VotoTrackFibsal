
import React, { useState } from 'react';
import { User } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { mockUsers, VOTING_CENTERS } from '../lib/data';
import { UserPlus, Trash2, Shield, MapPin } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useLocalStorage<User[]>('voto-track-managed-users', mockUsers);
  const [currentUser] = useLocalStorage<User | null>('voto-track-user', null);
  
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'mesa'>('mesa');
  const [newCenter, setNewCenter] = useState(VOTING_CENTERS[0]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    if (users.some(u => u.username === newUsername)) {
      alert('El nombre de usuario ya existe.');
      return;
    }

    const newUser: User = {
      username: newUsername,
      password: newPassword,
      role: newRole,
      center: newRole === 'admin' ? 'Todos' : newCenter,
    };

    setUsers([...users, newUser]);
    setNewUsername('');
    setNewPassword('');
  };

  const handleDeleteUser = (username: string) => {
    if (username === currentUser?.username) {
      alert('No puedes eliminar tu propia cuenta de administrador.');
      return;
    }
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario ${username}?`)) {
      setUsers(users.filter(u => u.username !== username));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Añadir Nuevo Usuario
          </CardTitle>
          <CardDescription>Crea accesos para nuevos administradores o delegados de mesa</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Usuario</label>
              <Input 
                placeholder="Nombre de usuario" 
                value={newUsername} 
                onChange={(e) => setNewUsername(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Contraseña</label>
              <Input 
                type="password" 
                placeholder="Contraseña" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Rol</label>
              <Select value={newRole} onChange={(e) => setNewRole(e.target.value as any)}>
                <option value="mesa">Delegado de Mesa</option>
                <option value="admin">Administrador</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Centro</label>
              <Select 
                value={newCenter} 
                onChange={(e) => setNewCenter(e.target.value)} 
                disabled={newRole === 'admin'}
              >
                {newRole === 'admin' ? (
                  <option value="Todos">Todos</option>
                ) : (
                  VOTING_CENTERS.map(c => <option key={c} value={c}>{c}</option>)
                )}
              </Select>
            </div>
            {/* Fix: Changed variant from "primary" to "default" as "primary" is not a valid variant in ButtonProps */}
            <Button type="submit" variant="default" className="w-full">
              Crear Usuario
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10 text-xs text-gray-400 uppercase">
                <tr>
                  <th className="px-6 py-3">Usuario</th>
                  <th className="px-6 py-3">Rol</th>
                  <th className="px-6 py-3">Centro Asignado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((u) => (
                  <tr key={u.username} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{u.username}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Shield className={`w-3.5 h-3.5 ${u.role === 'admin' ? 'text-primary' : 'text-gray-400'}`} />
                        <span className="capitalize">{u.role === 'admin' ? 'Administrador' : 'Mesa'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <MapPin className="w-3.5 h-3.5" />
                        {u.center}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        onClick={() => handleDeleteUser(u.username)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
