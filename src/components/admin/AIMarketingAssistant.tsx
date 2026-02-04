import React, { useState } from 'react';
import { mockApi } from '@/app/api/mockClient';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  FileText,
  TrendingUp,
  Lightbulb,
  Wand2,
  ArrowRight,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

interface AIMarketingAssistantProps {
  markets?: any[];
  contentPosts?: any[];
  onCreatePost?: (post: any) => Promise<void> | void;
  user?: any;
  adminLevel?: number;
}

export default function AIMarketingAssistant({ markets = [], contentPosts = [], onCreatePost, user, adminLevel = 0 }: AIMarketingAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftExcerpt, setDraftExcerpt] = useState('');
  const [draftCategory, setDraftCategory] = useState('market_update');
  const [draftTags, setDraftTags] = useState('');
  const [draftPosition, setDraftPosition] = useState('yes');
  const [draftValue, setDraftValue] = useState('');

  const createDraft = async () => {
    if (!draftTitle || !draftContent) {
      toast.error('Preencha título e conteúdo');
      return;
    }

    try {
      setLoading(true);
      await onCreatePost?.({
        title: draftTitle,
        content: draftContent,
        excerpt: draftExcerpt,
        category: draftCategory,
        tags: draftTags.split(',').map((t: string) => t.trim()).filter(Boolean),
        status: 'review',
        metadata: {
          position: draftPosition,
          value: draftValue,
          created_by: user?.email || user?.id
        }
      });

      toast.success('Rascunho criado e enviado para aprovação!');
      setDraftDialogOpen(false);
      setDraftTitle('');
      setDraftContent('');
      setDraftExcerpt('');
      setDraftTags('');
      setDraftPosition('yes');
      setDraftValue('');
    } catch (error) {
      console.error('Erro ao criar rascunho:', error);
      toast.error('Erro ao criar rascunho');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingPosts = async () => {
    try {
      const posts = (contentPosts || []).filter(p => p.status === 'review');
      setPendingPosts(posts);
      setApprovalDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar rascunhos:', error);
      toast.error('Erro ao carregar rascunhos');
    }
  };

  const approvePost = async (post: any) => {
    try {
      setLoading(true);
      await mockApi.entities.ContentPost.update(post.id, {
        status: 'published',
        published_date: new Date().toISOString()
      });

      const metadata = typeof post.metadata === 'string' ? JSON.parse(post.metadata) : post.metadata;
      if (metadata?.value) {
        const probability = parseFloat(metadata.value) / 100;
        const yesPrice = metadata.position === 'yes' ? probability : (1 - probability);
        const closingDate = new Date();
        closingDate.setDate(closingDate.getDate() + 30);

        const categoryMap: Record<string,string> = {
          'education': 'all',
          'market_update': 'trending',
          'transparency': 'all',
          'guide': 'all',
          'institutional': 'all'
        };

        await mockApi.entities.Market.create({
          title: post.title,
          description: post.excerpt || post.content.substring(0, 200),
          category: categoryMap[post.category] || 'all',
          resolution_source: 'Análise da equipe Predizer',
          closing_date: closingDate.toISOString(),
          status: 'open',
          yes_price: yesPrice,
          no_price: 1 - yesPrice,
          volume_total: 0,
          yes_contracts: 0,
          no_contracts: 0,
          tags: post.tags || [],
          featured: true
        });
      }

      toast.success('Rascunho aprovado e publicado!');
      await loadPendingPosts();
    } catch (error) {
      console.error('Erro ao aprovar rascunho:', error);
      toast.error('Erro ao aprovar rascunho');
    } finally {
      setLoading(false);
    }
  };

  const rejectPost = async (post: any, reason?: string) => {
    try {
      setLoading(true);
      await mockApi.entities.ContentPost.update(post.id, {
        status: 'draft',
        rejection_reason: reason
      });
      toast.success('Rascunho rejeitado e devolvido para refazer');
      await loadPendingPosts();
    } catch (error) {
      console.error('Erro ao rejeitar rascunho:', error);
      toast.error('Erro ao rejeitar rascunho');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      toast.success('Copiado!');
    }
  };

  const canApprove = (adminLevel || 0) >= 2;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Dialog open={draftDialogOpen} onOpenChange={setDraftDialogOpen}>
        <DialogTrigger asChild>
          <Card className="p-6 hover:shadow-lg transition-all group cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-indigo-100">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <Badge className="bg-indigo-100 text-indigo-700">IA + Mercado</Badge>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Criar Rascunho de Postagem</h3>
            <p className="text-sm text-slate-600 mb-4">Crie rascunhos de posts com análises e probabilidades para aprovação.</p>
            <div className="flex items-center text-indigo-600 font-medium">
              <span>Criar Rascunho</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto focus:outline-none focus-visible:outline-none focus:ring-0 ring-0">
          <DialogHeader>
            <DialogTitle>Criar Rascunho de Postagem</DialogTitle>
            <DialogDescription>O rascunho será enviado para aprovação antes de ser publicado</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Título</label>
              <Input
                placeholder="Ex: O dólar vai fechar acima de R$6,00 em Julho 2025?"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Posição Recomendada</label>
                <Select value={draftPosition} onValueChange={setDraftPosition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">✅ SIM</SelectItem>
                    <SelectItem value="no">❌ NÃO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Probabilidade (%)</label>
                <Input
                  type="number"
                  min="1"
                  max="99"
                  placeholder="Ex: 65"
                  value={draftValue}
                  onChange={(e) => setDraftValue(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Resumo</label>
              <Textarea
                placeholder="Breve descrição da análise..."
                value={draftExcerpt}
                onChange={(e) => setDraftExcerpt(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Análise Completa</label>
              <Textarea
                placeholder="Desenvolva sua análise aqui..."
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Categoria</label>
              <Select value={draftCategory} onValueChange={setDraftCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="education">Educacional</SelectItem>
                  <SelectItem value="market_update">Atualização de Mercado</SelectItem>
                  <SelectItem value="transparency">Transparência</SelectItem>
                  <SelectItem value="guide">Guia</SelectItem>
                  <SelectItem value="institutional">Institucional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Tags (separadas por vírgula)</label>
              <Input
                placeholder="Ex: economia, dólar, previsão"
                value={draftTags}
                onChange={(e) => setDraftTags(e.target.value)}
              />
            </div>

            <Button
              onClick={createDraft}
              disabled={!draftTitle || !draftContent || loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {loading ? 'Enviando...' : 'Enviar para Aprovação'}
            </Button>

            {draftValue && (
              <p className="text-xs text-slate-500 text-center">✨ Após aprovação, um mercado votável será criado com {draftValue}% para {draftPosition === 'yes' ? 'SIM' : 'NÃO'}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {canApprove && (
        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
          <DialogTrigger asChild>
            <Card className="p-6 hover:shadow-lg transition-all group cursor-pointer" onClick={loadPendingPosts}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-purple-100">
                  <Lightbulb className="w-6 h-6 text-purple-600" />
                </div>
                <Badge className="bg-purple-100 text-purple-700">{(contentPosts || []).filter(p => p.status === 'review').length} pendentes</Badge>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aprovar Rascunhos</h3>
              <p className="text-sm text-slate-600 mb-4">Revise e aprove ou rejeite rascunhos criados pela equipe.</p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Ver Rascunhos Pendentes
              </Button>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto focus:outline-none focus-visible:outline-none focus:ring-0 ring-0">
            <DialogHeader>
              <DialogTitle>Rascunhos Aguardando Aprovação</DialogTitle>
              <DialogDescription>Revise os rascunhos e aprove ou rejeite para devolução</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {pendingPosts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Nenhum rascunho pendente de aprovação</p>
                </div>
              ) : (
                pendingPosts.map(post => {
                  const metadata = typeof post.metadata === 'string' ? JSON.parse(post.metadata) : post.metadata;
                  return (
                    <Card key={post.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 mb-1">{post.title}</h4>
                            <p className="text-sm text-slate-600 mb-2">{post.excerpt}</p>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline">{post.category}</Badge>
                              {metadata?.position && metadata?.value && (
                                <Badge className={metadata.position === 'yes' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                                  {metadata.position === 'yes' ? '✅ SIM' : '❌ NÃO'} {metadata.value}%
                                </Badge>
                              )}
                              {metadata?.created_by && (
                                <Badge variant="outline" className="text-xs">Por: {metadata.created_by}</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                          <p className="text-sm text-slate-600">{post.content.substring(0, 300)}...</p>
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={() => approvePost(post)} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Aprovar e Publicar
                          </Button>
                          <Button
                            onClick={() => {
                              const reason = prompt('Motivo da rejeição:');
                              if (reason) rejectPost(post, reason);
                            }}
                            disabled={loading}
                            variant="outline"
                            className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                          >
                            ❌ Rejeitar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
