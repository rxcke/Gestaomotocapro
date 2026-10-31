import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { PartnerSchema, ProcessSchema, RewardSchema, rewardError } from './rewards-shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
async function admin(client:SupabaseClient<Database>,id:string) { const role=await client.rpc('has_role',{_user_id:id,_role:'admin'}); if(role.error||!role.data) throw new Error('Acesso administrativo necessário.'); }
export const getRewardAdmin = createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({page:z.number().int().min(1).max(100000).default(1)}).parse(v)).handler(async ({context,data})=>{
 await admin(context.supabase,context.userId);
 const [rewards,partners,requests,audit,settings]=await Promise.all([context.supabase.from('rewards').select('*').order('name'),context.supabase.from('reward_partners').select('*').order('name'),context.supabase.from('reward_redemptions').select('*',{count:'exact'}).order('created_at',{ascending:false}).range((data.page-1)*20,data.page*20-1),context.supabase.from('reward_audit').select('*',{count:'exact'}).order('created_at',{ascending:false}).range((data.page-1)*20,data.page*20-1),context.supabase.from('rewards_settings').select('redemptions_enabled').maybeSingle()]);
 if(rewards.error||partners.error||requests.error||audit.error||settings.error) throw new Error('Não foi possível carregar a administração do clube.');
 return {rewards:rewards.data??[],partners:partners.data??[],requests:requests.data??[],requestCount:requests.count??0,audit:audit.data??[],auditCount:audit.count??0,enabled:settings.data?.redemptions_enabled??false};
});
export const saveReward = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>RewardSchema.parse(v)).handler(async ({context,data})=>{
 await admin(context.supabase,context.userId); const r=await context.supabase.rpc('save_reward',{_data:data}); if(r.error) throw new Error(rewardError(r.error.message)); return r.data;
});
export const savePartner = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>PartnerSchema.parse(v)).handler(async ({context,data})=>{
 await admin(context.supabase,context.userId); const r=await context.supabase.rpc('save_reward_partner',{_data:data}); if(r.error) throw new Error(rewardError(r.error.message)); return r.data;
});
export const processReward = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>ProcessSchema.parse(v)).handler(async ({context,data})=>{
 await admin(context.supabase,context.userId); const r=await context.supabase.rpc('process_reward',{_id:data.id,_status:data.status,_note:data.note,_tracking:data.tracking,_instructions:data.instructions}); if(r.error) throw new Error(rewardError(r.error.message)); return r.data;
});
export const addRewardCodes = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({rewardId:z.string().uuid(),codes:z.array(z.string().trim().min(1).max(500)).min(1).max(100),expiresAt:z.string().datetime().optional()}).parse(v)).handler(async ({context,data})=>{
 await admin(context.supabase,context.userId); const r=await context.supabase.rpc('add_reward_codes',{_reward_id:data.rewardId,_codes:data.codes,...(data.expiresAt?{_expires_at:data.expiresAt}:{})}); if(r.error) throw new Error(rewardError(r.error.message)); return r.data;
});
export const getAdminDelivery = createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({id:z.string().uuid()}).parse(v)).handler(async ({context,data})=>{
 await admin(context.supabase,context.userId); const [d,c]=await Promise.all([context.supabase.from('reward_delivery').select('*').eq('redemption_id',data.id).maybeSingle(),context.supabase.from('reward_codes').select('code,expires_at').eq('redemption_id',data.id)]); if(d.error||c.error) throw new Error('Não foi possível consultar a entrega.'); return {delivery:d.data,codes:c.data??[]};
});
