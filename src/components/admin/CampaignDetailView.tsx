import React, { useEffect, useState } from 'react';
import { mockApi } from '@/api/mockClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Edit2,
  Play,
  Pause,
  Archive,
  Eye,
  MousePointer,
  Target,
  DollarSign,
  TrendingUp,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Campaign {
  id: string | number;
  name?: string;
  advertiser?: string;
  creative_url?: string;
  destination_url?: string;
  slot?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  status?: 'draft'|'active'|'paused'|'completed'|'rejected'|string;
  clicks?: number;
  impressions?: number;
  spent?: number;
  conversions?: number;
}

interface FormDataType {
  name: string;
  advertiser: string;
  creative_url: string;
  destination_url: string;
  slot: string;
  budget: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface CampaignDetailViewProps {
  campaignId?: string | number;
  open: boolean;
  onClose: (open: boolean) => void;
}

export default function CampaignDetailView({ campaignId, open, onClose }: CampaignDetailViewProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    advertiser: '',
    creative_url: '',
    destination_url: '',
    slot: 'header_banner',
    budget: 0,
    start_date: '',
    end_date: '',
    status: 'draft'
  });

  

  

  const { data: campaign, isLoading } = useQuery<Campaign | undefined>({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const campaigns = await (mockApi as any).entities.AdCampaign.list();
      return (campaigns || []).find((c: Campaign) => c.id === campaignId);
    },
    enabled: !!campaignId && open
  });

  const updateCampaignMutation = useMutation<void, unknown, { id: string | number; data: Partial<FormDataType> }>({
    mutationFn: async ({ id, data }) => (mockApi as any).entities.AdCampaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Campanha atualizada!');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Erro ao atualizar campanha');
    }
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        advertiser: campaign.advertiser || '',
        creative_url: campaign.creative_url || '',
        destination_url: campaign.destination_url || '',
        slot: campaign.slot || 'header_banner',
        budget: campaign.budget ?? 0,
        start_date: campaign.start_date?.split('T')[0] || '',
        end_date: campaign.end_date?.split('T')[0] || '',
        status: campaign.status || 'draft'
      });
    }
  }, [campaign]);

  if (!open || !campaignId) return null;

  const handleSave = () => {
    updateCampaignMutation.mutate({ id: campaignId as string | number, data: formData });
  };

  const handleStatusChange = (newStatus: string) => {
    updateCampaignMutation.mutate({
      id: campaignId as string | number,
      data: { status: newStatus }
    });
  };

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">Carregando...</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!campaign) return null;

  const ctr = campaign.clicks && campaign.impressions
    ? ((campaign.clicks / campaign.impressions * 100)).toFixed(2)
    : '0.00';

  const cpm = campaign.impressions
    ? ((campaign.spent ?? 0) / ((campaign.impressions ?? 1) / 1000)).toFixed(2)
    : '0.00';

  const progressPercent = (campaign.budget && campaign.budget > 0)
    ? Math.min(((campaign.spent ?? 0) / campaign.budget) * 100, 100).toFixed(1)
    : '0';

  const daysLeft = campaign.end_date
    ? Math.ceil((new Date(campaign.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const performanceData = Array.from({ length: 7 }, (_, i) => ({
    date: format(new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000), 'dd/MM'),
    impressions: Math.floor(((campaign.impressions ?? 0) / 7) + Math.random() * 5000),
    clicks: Math.floor(((campaign.clicks ?? 0) / 7) + Math.random() * 100)
  }));

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    active: 'bg-emerald-100 text-emerald-700',
    paused: 'bg-amber-100 text-amber-700',
    completed: 'bg-blue-100 text-blue-700',
    rejected: 'bg-rose-100 text-rose-700'
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isEditing ? 'Editar Campanha' : campaign.name}
            <Badge className={statusColors[campaign.status ?? 'draft']}>
              {campaign.status === 'draft' ? 'Rascunho' :
               campaign.status === 'active' ? 'Ativa' :
               campaign.status === 'paused' ? 'Pausada' :
               campaign.status === 'completed' ? 'Concluída' : 'Rejeitada'}
            </Badge>
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{campaign.advertiser}</p>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="flex flex-wrap gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </Button>

                {campaign.status === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('paused')}
                    className="text-amber-600 border-amber-200"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </Button>
                )}

                {(campaign.status === 'paused' || campaign.status === 'draft') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('active')}
                    className="text-emerald-600 border-emerald-200"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Ativar
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('completed')}
                  className="text-slate-600 border-slate-200"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Arquivar
                </Button>

                {campaign.destination_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(campaign.destination_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver Destino
                  </Button>
                )}
              </>
            )}

            {isEditing && (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={Boolean((updateCampaignMutation as any).isLoading || (updateCampaignMutation as any).isPending || (updateCampaignMutation as any).status === 'pending' || (updateCampaignMutation as any).status === 'loading')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Salvar Alterações
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
              </>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label>Nome da Campanha</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Anunciante</Label>
                <Input
                  value={formData.advertiser}
                  onChange={(e) => setFormData({ ...formData, advertiser: e.target.value })}
                />
              </div>

              <div>
                <Label>URL do Criativo</Label>
                <Input
                  value={formData.creative_url}
                  onChange={(e) => setFormData({ ...formData, creative_url: e.target.value })}
                />
              </div>

              <div>
                <Label>URL de Destino</Label>
                <Input
                  value={formData.destination_url}
                  onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
                />
              </div>

              <div>
                <Label>Posição</Label>
                <Select value={formData.slot} onValueChange={(value) => setFormData({ ...formData, slot: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header_banner">Banner Cabeçalho</SelectItem>
                    <SelectItem value="sidebar_card">Card Lateral</SelectItem>
                    <SelectItem value="feed_inline">Inline no Feed</SelectItem>
                    <SelectItem value="market_page">Página de Mercado</SelectItem>
                    <SelectItem value="footer">Rodapé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Orçamento (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={String(formData.budget)}
                  onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data de Término</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="paused">Pausada</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-slate-500">Impressões</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {(campaign.impressions ?? 0).toLocaleString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MousePointer className="w-4 h-4 text-emerald-600" />
                      <p className="text-xs text-slate-500">Cliques</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {(campaign.clicks ?? 0).toLocaleString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-purple-600" />
                      <p className="text-xs text-slate-500">CTR</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {ctr}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                      <p className="text-xs text-slate-500">CPM</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      R$ {cpm}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Orçamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Gasto</span>
                      <span className="font-semibold">R$ {(campaign.spent ?? 0).toFixed(2)} / R$ {(campaign.budget ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {progressPercent}% utilizado
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações da Campanha</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Posição</p>
                    <Badge variant="outline">
                      {campaign.slot === 'header_banner' ? 'Banner Cabeçalho' :
                       campaign.slot === 'sidebar_card' ? 'Card Lateral' :
                       campaign.slot === 'feed_inline' ? 'Inline no Feed' :
                       campaign.slot === 'market_page' ? 'Página de Mercado' : 'Rodapé'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Data de Início</p>
                      <p className="text-sm font-medium text-slate-900">
                        {campaign.start_date ? format(new Date(campaign.start_date), "d 'de' MMM, yyyy", { locale: ptBR }) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Data de Término</p>
                      <p className="text-sm font-medium text-slate-900">
                        {campaign.end_date ? format(new Date(campaign.end_date), "d 'de' MMM, yyyy", { locale: ptBR }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {daysLeft > 0 && campaign.status === 'active' && (
                    <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-700">
                        {daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'}
                      </p>
                    </div>
                  )}

                  {(campaign.conversions ?? 0) > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Conversões</p>
                      <p className="text-sm font-semibold text-emerald-600">{campaign.conversions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Performance (Últimos 7 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis dataKey="date" stroke="var(--chart-tick)" fontSize={12} />
                      <YAxis stroke="var(--chart-tick)" fontSize={12} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="impressions"
                        stroke="var(--chart-blue)"
                        strokeWidth={2}
                        name="Impressões"
                      />
                      <Line
                        type="monotone"
                        dataKey="clicks"
                        stroke="var(--chart-green)"
                        strokeWidth={2}
                        name="Cliques"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {campaign.creative_url && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Preview do Criativo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={campaign.creative_url}
                      alt="Criativo"
                      className="w-full rounded-lg border border-slate-200"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.style.display = 'none';
                        const next = img.nextElementSibling as HTMLElement | null;
                        if (next) next.style.display = 'block';
                      }}
                    />
                    <div style={{ display: 'none' }} className="bg-slate-100 rounded-lg p-8 text-center">
                      <p className="text-slate-500 text-sm">Imagem não disponível</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
