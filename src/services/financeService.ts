import type { ICobranca, IMarcarPagoInput, IPagamentoInterno, StatusCobranca } from '@/@types/finance';
import { BUCKETS } from '@/constants/storage';
import { AppError } from '@/utils/appError';
import { receiptExtension } from '@/utils/finance';
import { resizeImage } from '@/utils/image';
import { supabase } from './supabaseService';

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

// Comprovante no bucket privado: {competicao_id}/cobrancas/{id}.{ext} (seção 10.3).
async function uploadReceipt(competicaoId: string, cobrancaId: string, file: File): Promise<string> {
  const isPdf = file.type === 'application/pdf';
  if (isPdf && file.size > MAX_RECEIPT_BYTES) throw new AppError('O comprovante precisa ter até 5 MB.');
  const body = isPdf ? file : await resizeImage(file);
  const path = `${competicaoId}/cobrancas/${cobrancaId}.${receiptExtension(file)}`;
  const { error } = await supabase.storage
    .from(BUCKETS.comprovantes)
    .upload(path, body, { upsert: true, contentType: isPdf ? 'application/pdf' : 'image/webp' });
  if (error) throw error;
  return path;
}

export const financeService = {
  async listCharges(competicaoId: string): Promise<ICobranca[]> {
    const { data, error } = await supabase
      .from('cobrancas')
      .select('*, time:times(nome), jogador:jogadores(nome)')
      .eq('competicao_id', competicaoId)
      .order('referencia')
      .order('vencimento');
    if (error) throw error;
    return data as unknown as ICobranca[];
  },

  async generateCharges(competicaoId: string): Promise<number> {
    const { data, error } = await supabase.rpc('gerar_cobrancas', { p_competicao_id: competicaoId });
    if (error) throw error;
    return data;
  },

  async markPaid(cobranca: Pick<ICobranca, 'id' | 'competicao_id'>, input: IMarcarPagoInput): Promise<void> {
    const comprovante = input.comprovante
      ? await uploadReceipt(cobranca.competicao_id, cobranca.id, input.comprovante)
      : undefined;
    const { error } = await supabase
      .from('cobrancas')
      .update({
        status: 'pago',
        pago_em: input.pagoEm,
        observacao: input.observacao.trim() || null,
        ...(comprovante && { comprovante_url: comprovante }),
      })
      .eq('id', cobranca.id);
    if (error) throw error;
  },

  // Isentar ou desfazer (volta a pendente). pago_em é limpo pelo banco.
  async setStatus(id: string, status: Exclude<StatusCobranca, 'pago'>): Promise<void> {
    const { error } = await supabase.from('cobrancas').update({ status }).eq('id', id);
    if (error) throw error;
  },

  async receiptUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage.from(BUCKETS.comprovantes).createSignedUrl(path, 60 * 10);
    if (error) throw error;
    return data.signedUrl;
  },

  // Pagamentos internos do elenco (8.2).
  async listTeamPayments(timeId: string): Promise<IPagamentoInterno[]> {
    const { data, error } = await supabase
      .from('pagamentos_internos')
      .select('*, jogador:jogadores(nome, numero)')
      .eq('time_id', timeId)
      .order('referencia', { ascending: false });
    if (error) throw error;
    return data as unknown as IPagamentoInterno[];
  },

  async generateTeamPayments(timeId: string, referencia: string, valor: number): Promise<number> {
    const { data, error } = await supabase.rpc('gerar_pagamentos_elenco', {
      p_time_id: timeId,
      p_referencia: referencia,
      p_valor: valor,
    });
    if (error) throw error;
    return data;
  },

  async setTeamPaymentStatus(id: string, status: StatusCobranca): Promise<void> {
    const { error } = await supabase.from('pagamentos_internos').update({ status }).eq('id', id);
    if (error) throw error;
  },
};
