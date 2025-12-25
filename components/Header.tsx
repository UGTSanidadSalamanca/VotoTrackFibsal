import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User as UserIcon, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from './ui/DropdownMenu';
import { Button } from './ui/Button';

const Header: React.FC = () => {
    const auth = useContext(AuthContext);
    const user = auth?.user;

    if (!user) return null;

    return (
        <header className="flex justify-between items-center p-4 bg-card border border-white/10 rounded-xl shadow-lg">
            <div>
                <h1 className="text-2xl font-bold text-primary">VotoTrack FIBSAL</h1>
                <p className="text-sm text-gray-400">Seguimiento de censo en tiempo real</p>
            </div>
            <DropdownMenu trigger={
                <Button variant="ghost" className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5" />
                    <span>{user.username}</span>
                </Button>
            }>
                <DropdownMenuLabel>Cuenta</DropdownMenuLabel>
                <DropdownMenuItem className="flex flex-col items-start !pointer-events-none">
                    <span className="font-semibold">{user.username}</span>
                    <span className="text-xs text-gray-400 capitalize">{user.role}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={auth.logout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                </DropdownMenuItem>
            </DropdownMenu>
        </header>
    );
};

export default Header;