import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { AddressSchema, rewardError } from './rewards-shared';
const pageInput = z.object({ page: z.number().int().min(1).max(100000).default(1) });
export const getRewards = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const [wallet, rewards, partners] = await Promise.all([context.supabase.rpc('get_reward_wallet'),context.supabase.from('rewards').select('*').eq('active',true).order('name'), context.supabase.from('reward_partners').select('id,name,instructions').eq('active',true)]);
 if(wallet.error || rewards.error || partners.error) throw new Error('Não foi possível carregar o clube.');
 return { wallet: wallet.data?.[0] ?? {earned:0,spent:0,reserved:0,available:0,enabled:false}, rewards: rewards.data ?? [], partners: partners.data ?? [] };
});
export const getRedemptions = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>pageInput.parse(v)).handler(async ({ context,data }) => {
 const result = await context.supabase.from('reward_redemptions').select('*',{count:'exact'}).eq('user_id',context.userId).order('created_at',{ascending:false}).range((data.page-1)*20,data.page*20-1);
 if(result.error) throw new Error('Não foi possível carregar seus resgates.');
 return { rows:result.data ?? [], count:result.count ?? 0 };
});
export const getWalletHistory = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>pageInput.parse(v)).handler(async ({ context,data }) => {
 const result=await context.supabase.from('reward_wallet_entries').select('*',{count:'exact'}).eq('user_id',context.userId).order('created_at',{ascending:false}).range((data.page-1)*20,data.page*20-1);
 if(result.error) throw new Error('Não foi possível carregar as movimentações.');
 return { rows:result.data ?? [],count:result.count ?? 0 };
});
export const getRedemptionDetails = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({id:z.string().uuid()}).parse(v)).handler(async ({context,data})=>{
 const request=await context.supabase.from('reward_redemptions').select('id').eq('id',data.id).eq('user_id',context.userId).maybeSingle();
 if(request.error || !request.data) throw new Error('Solicitação não encontrada.');
 const [delivery,codes,history]=await Promise.all([context.supabase.from('reward_delivery').select('instructions,tracking,address').eq('redemption_id',data.id).maybeSingle(),context.supabase.from('reward_codes').select('code,expires_at').eq('redemption_id',data.id),context.supabase.from('reward_status_history').select('status,note,created_at').eq('redemption_id',data.id).order('created_at')]);
 if(delivery.error||codes.error||history.error) throw new Error('Não foi possível carregar os detalhes.');
 return {delivery:delivery.data,codes:codes.data??[],history:history.data??[]};
});
export const requestReward = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({rewardId:z.string().uuid(),key:z.string().uuid(),expectedCost:z.number().int().positive(),address:AddressSchema.optional()}).parse(v)).handler(async ({context,data})=>{
 const {data:id,error}=await context.supabase.rpc('request_reward',{_reward_id:data.rewardId,_key:data.key,_expected_cost:data.expectedCost,...(data.address?{_address:data.address}:{})});
 if(error) throw new Error(rewardError(error.message)); if(!id) throw new Error('O resgate não foi confirmado.'); return {id};
});
export const cancelReward = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({id:z.string().uuid()}).parse(v)).handler(async ({context,data})=>{
 const {data:id,error}=await context.supabase.rpc('process_reward',{_id:data.id,_status:'canceled'});
 if(error) throw new Error(rewardError(error.message)); if(!id) throw new Error('O cancelamento não foi confirmado.'); return {id};
});
