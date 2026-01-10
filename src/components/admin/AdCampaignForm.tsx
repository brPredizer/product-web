import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AdCampaignFormData {
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

interface AdCampaignFormProps {
  onSubmit: (data: AdCampaignFormData) => void;
  onCancel?: () => void;
}

export default function AdCampaignForm({ onSubmit, onCancel }: AdCampaignFormProps) {
  const [formData, setFormData] = useState<AdCampaignFormData>({
    name: '',
    advertiser: '',
    creative_url: '',
    destination_url: '',
    slot: 'header_banner',
    budget: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'draft',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome da Campanha</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Banner Principal - Q1 2025"
          required
        />
      </div>

      <div>
        <Label htmlFor="advertiser">Anunciante</Label>
        <Input
          id="advertiser"
          value={formData.advertiser}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, advertiser: e.target.value })}
          placeholder="Nome do anunciante"
          required
        />
      </div>

      <div>
        <Label htmlFor="creative_url">URL do Criativo</Label>
        <Input
          id="creative_url"
          value={formData.creative_url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, creative_url: e.target.value })}
          placeholder="https://exemplo.com/banner.jpg"
        />
      </div>

      <div>
        <Label htmlFor="destination_url">URL de Destino</Label>
        <Input
          id="destination_url"
          value={formData.destination_url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, destination_url: e.target.value })}
          placeholder="https://exemplo.com/landing"
          required
        />
      </div>

      <div>
        <Label htmlFor="slot">Posição do Anúncio</Label>
        <Select value={formData.slot} onValueChange={(value: string) => setFormData({ ...formData, slot: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a posição" />
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
        <Label htmlFor="budget">Orçamento (R$)</Label>
        <Input
          id="budget"
          type="number"
          step="0.01"
          value={String(formData.budget)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Data de Início</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="end_date">Data de Término</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value: string) => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="paused">Pausada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          Criar Campanha
        </Button>
      </div>
    </form>
  );
}
