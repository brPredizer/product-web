import React from 'react';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { mockApi } from '@/api/mockClient';
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Compass, 
  Briefcase, 
  Wallet, 
  GraduationCap,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Shield,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Home' },
  { name: 'Explorar', icon: Compass, page: 'Explore' },
  { name: 'Portfólio', icon: Briefcase, page: 'Portfolio' },
  { name: 'Carteira', icon: Wallet, page: 'Wallet' },
  { name: 'Aprender', icon: GraduationCap, page: 'Learn' },
];

export default function Header({ currentPage, user, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const visibleNavItems = React.useMemo(() => {
    if (user) return navItems;
    return navItems.filter((item) => item.page !== 'Portfolio' && item.page !== 'Wallet');
  }, [user]);

  const switchUser = async (userId) => {
    try {
      await mockApi.auth.switchUser(userId);
    } catch (err) {
      console.error('Failed to switch user', err);
    }
  };

  return (
    <header className="relative bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-slate-900">Predict<span className="text-emerald-600">X</span></span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleNavItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <Link
                  key={item.page}
                  href={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive 
                      ? "bg-emerald-50 text-emerald-600" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Balance */}
                <Link 
                  href={createPageUrl('Wallet')}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Wallet className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold text-slate-900">
                    R$ {(user.balance || 0).toFixed(2)}
                  </span>
                </Link>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium text-slate-900">{user.full_name || 'Usuário'}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={createPageUrl('Portfolio')} className="cursor-pointer">
                        <Briefcase className="w-4 h-4 mr-2" />
                        Meu Portfólio
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={createPageUrl('Wallet')} className="cursor-pointer">
                        <Wallet className="w-4 h-4 mr-2" />
                        Carteira
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/CreateMarket" className="cursor-pointer text-purple-700">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Criar Mercado
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={createPageUrl('Admin')} className="cursor-pointer text-emerald-600">
                            <Shield className="w-4 h-4 mr-2" />
                            Admin Hub
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout} className="text-rose-600 cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/Login">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Entrar
                  </Button>
                </Link>
                <Link href="/Signup">
                  <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    Criar conta
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100">
            <nav className="flex flex-col gap-1">
              {visibleNavItems.map((item) => {
                const isActive = currentPage === item.page;
                return (
                  <Link
                    key={item.page}
                    href={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive 
                        ? "bg-emerald-50 text-emerald-600" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            {!user && (
              <div className="mt-4 px-1 space-y-2">
                <Link
                  href="/Signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors"
                >
                  Criar conta
                </Link>
                <Link
                  href="/Login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Entrar
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}