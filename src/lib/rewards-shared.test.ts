import { describe,it } from 'node:test';
import assert from 'node:assert/strict';
import { AddressSchema,RewardSchema,rewardError,rewardPage } from './rewards-shared';
const reward={name:'Real benefit',description:'',image_url:null,category:'digital',partner_id:null,points_cost:4,stock:null,conditions:'Real conditions',delivery_method:'Manual delivery',delivery_days:1,active:false,expires_at:null,uses_codes:false};
describe('rewards validation',()=>{
 it('requires positive integer point cost',()=>{assert.equal(RewardSchema.safeParse({...reward,points_cost:0}).success,false);assert.equal(RewardSchema.safeParse({...reward,points_cost:1.5}).success,false);assert.equal(RewardSchema.safeParse(reward).success,true);});
 it('rejects extra private shipping data',()=>{const address={recipient:'Test Recipient',postal_code:'30100000',street:'Test Street',number:'1',district:'Test District',city:'Test City',state:'MG'};assert.equal(AddressSchema.safeParse(address).success,true);assert.equal(AddressSchema.safeParse({...address,cpf:'extra'}).success,false);});
 it('does not accept negative stock',()=>assert.equal(RewardSchema.safeParse({...reward,stock:-1}).success,false));
 it('bounds pagination',()=>{assert.equal(rewardPage(-1),1);assert.equal(rewardPage(2),2);assert.equal(rewardPage(100001),100000);});
 it('returns failure rather than success on stock or insufficient points',()=>{assert.equal(rewardError('points_insufficient'),'Seu saldo disponível é insuficiente.');assert.equal(rewardError('stock_insufficient'),'Não há disponibilidade para este resgate.');});
});
