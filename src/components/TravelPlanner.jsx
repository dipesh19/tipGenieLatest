import React, { useEffect, useState } from 'react';
import AsyncCreatableSelect from 'react-select/async-creatable';
import Select from 'react-select';
import { initFirebase, logSearch } from '../../lib/firebaseClient';
const Card = ({ children }) => <div className='card'>{children}</div>;
const Button = ({ children, ...p }) => <button {...p} className='btn'>{children}</button>;
const Input = (props) => <input {...props} className='border rounded px-2 py-1' />;
export default function TravelPlanner(){ useEffect(()=>{ const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''; if(id && typeof window !== 'undefined' && !window.dataLayer){ window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', id); const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`; document.head.appendChild(s);} try{ const conf = process.env.NEXT_PUBLIC_FIREBASE_CONFIG; if(conf) initFirebase(JSON.parse(conf)); }catch(e){} },[]);
 const [formData,setFormData]=useState({startDate:'',endDate:'',travelers:[{name:'',nationalities:[],residencies:[],age:'',shareCost:true}],preferences:{visaFree:false,budget:true},selectedDestinations:[]});
 const [results,setResults]=useState([]); const [loading,setLoading]=useState(false);
 const residencyOptions=['US Green Card','EU Permanent Resident','UK Settlement Visa','Canadian PR','Australian PR','Schengen Visa','US Tourist Visa'];
 const nationalityOptions=['India','United States','United Kingdom','Canada','Australia','Germany','France','Japan','China','Brazil','South Africa','Singapore','Mexico','UAE'];
 const loadOptions=(list)=>async(inputValue='')=>{ const q=(inputValue||'').toLowerCase(); const filtered=list.filter(opt=>opt.toLowerCase().includes(q)); const dynamic = inputValue && !filtered.includes(inputValue)?[{label:inputValue,value:inputValue}]:[]; return [...filtered.map(opt=>({label:opt,value:opt})),...dynamic]; };
 const loadNationalityOptions = loadOptions(nationalityOptions); const loadResidencyOptions = loadOptions(residencyOptions);
 const loadDestinationOptions = async (inputValue='')=>{ if(!inputValue || inputValue.length<2) return []; try{ const res = await fetch(`https://api.teleport.org/api/cities/?search=${encodeURIComponent(inputValue)}&limit=10`); const j = await res.json(); const results = (j._embedded && j._embedded['city:search-results']) || []; return results.map(r=>{ const label = r.matching_full_name; const link = r._links && r._links['city:item'] && r._links['city:item'].href; return { label, value: JSON.stringify({ name: label, cityHref: link }) }; }); }catch(e){return [];} };
 const addTraveler=()=>setFormData(p=>({...p,travelers:[...p.travelers,{name:'',nationalities:[],residencies:[],age:'',shareCost:true}]}));
 const updateTravelerField=(index,field,value)=>setFormData(p=>{ const t=[...p.travelers]; t[index]={...t[index],[field]:value}; return {...p,travelers:t}; });
 const removeTraveler=(index)=>setFormData(p=>({...p,travelers:p.travelers.filter((_,i)=>i!==index)}));
 const calculateShared=(amount,travelers)=>{ const sharers=(travelers||[]).filter(t=>t.shareCost).length||1; return Math.round(amount/sharers); };
 const handleDestinationsChange=(selected)=>{ const limited=(selected||[]).slice(0,5); const parsed=limited.map(s=>{ try{return JSON.parse(s.value);}catch(e){return {name:s.value};} }); setFormData(p=>({...p,selectedDestinations:parsed})); };
 async function fetchIntegratedResults(){ setLoading(true); try{ const chosen = formData.selectedDestinations.length?formData.selectedDestinations:[]; const queries = chosen.map(c=>c.name); const imgRes = await fetch('/api/images',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({queries})}); const imgJson = imgRes.ok?await imgRes.json():{destinations:queries.map(q=>({name:q,image:'/placeholder.png'}))}; const flightsRes = await fetch('/api/flights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({origin:formData.travelers[0]?.nationalities?.[0]||'JFK',destinations:chosen,dates:{start:formData.startDate,end:formData.endDate}})}); const flightsJson = flightsRes.ok?await flightsRes.json():{}; const visaPayload={travelers:formData.travelers.map(t=>({name:t.name,nationalities:t.nationalities||[],residencies:t.residencies||[]})),destinations:chosen}; const visaRes=await fetch('/api/visa',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(visaPayload)}); const visaJson=visaRes.ok?await visaRes.json():{}; const costsRes=await fetch('/api/costs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({destinations:chosen})}); const costsJson=costsRes.ok?await costsRes.json():{}; const combined = chosen.map((destObj,idx)=>{ const dest=destObj.name; const img=imgJson.destinations[idx]?.image||'/placeholder.png'; const flight=flightsJson[dest]||{price:Math.floor(Math.random()*400+300)}; const costInfo=costsJson[dest]||{dailyCost:Math.floor(Math.random()*80+30),avgDailyExpense:Math.floor(Math.random()*120+50)}; const visaForDest=visaJson[dest]||[]; const travelerBreakdown=formData.travelers.map((t,tIdx)=>{ const visaInfo=visaForDest[tIdx]||{}; const visaFee=typeof visaInfo.visaFee==='number'?visaInfo.visaFee:(visaInfo.visaRequired==='Required'?estimateDefaultVisaFee(visaInfo,dest):0); const individualCost=calculateShared((flight.price||0)+(costInfo.dailyCost||0)*5+visaFee,formData.travelers); return { name:t.name||`Traveler ${tIdx+1}`, nationalities:t.nationalities||[], residencies:t.residencies||[], visaNeeded:visaInfo.visaRequired||'Unknown', visaFee, individualCost }; }); const totalVisa = travelerBreakdown.reduce((s,tb)=>s+(tb.visaFee||0),0); const totalEstimated = Math.round((flight.price||0)+(costInfo.avgDailyExpense||0)*5+totalVisa); return { destination:dest, image:img, flightCost:flight.price||0, dailyCost:costInfo.dailyCost||0, avgDailyExpense:costInfo.avgDailyExpense||0, totalVisa, totalCost:totalEstimated, travelerBreakdown }; }); setResults(combined); try{ await logSearch({ query: formData, resultsCount: combined.length }); }catch(e){} }catch(err){ console.error(err); alert('Live API fetch failed; check console for details.'); } finally{ setLoading(false); } }
 const handleSubmit=async(e)=>{ e?.preventDefault(); await fetchIntegratedResults(); };
 function estimateDefaultVisaFee(visaInfo,destination){ const destLower=(destination||'').toLowerCase(); if(destLower.includes('paris')||destLower.includes('rome')) return 90; if(destLower.includes('usa')||destLower.includes('new york')) return 160; if(destLower.includes('india')) return 25; if(destLower.includes('tokyo')||destLower.includes('japan')) return 30; return 80; }
 return (
  <div>
    <div style={{textAlign:'center',marginBottom:16}}>
      <h1 style={{fontSize:28}}>✈️ Trips Genie - Plan Smart, Travel Better</h1>
      <p style={{color:'#444'}}>Compare up to 5 city destinations worldwide — multi-nationality & multi-residency supported.</p>
    </div>
    <Card>
      <form onSubmit={handleSubmit}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div><label className='block text-sm'>Start Date</label><Input type='date' value={formData.startDate} onChange={e=>setFormData(p=>({...p,startDate:e.target.value}))} required/></div>
          <div><label className='block text-sm'>End Date</label><Input type='date' value={formData.endDate} onChange={e=>setFormData(p=>({...p,endDate:e.target.value}))} required/></div>
        </div>
        <div style={{marginTop:12}}>
          <label className='block text-sm'>Select destinations to compare (city-level, up to 5)</label>
          <AsyncCreatableSelect isMulti cacheOptions loadOptions={loadDestinationOptions} defaultOptions placeholder='Type a city name (e.g. Paris, Tokyo)' onChange={handleDestinationsChange} value={(formData.selectedDestinations||[]).map(s=>({label:s.name,value:JSON.stringify(s)}))} />
        </div>
        {formData.travelers.map((trav,idx)=>(
          <div key={idx} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,marginTop:12}}>
            <Input placeholder='Name (optional)' value={trav.name} onChange={e=>updateTravelerField(idx,'name',e.target.value)} />
            <AsyncCreatableSelect isMulti cacheOptions loadOptions={loadNationalityOptions} defaultOptions placeholder='Nationality (multi)' onChange={opts=>updateTravelerField(idx,'nationalities', opts?opts.map(o=>o.value):[])} value={(trav.nationalities||[]).map(n=>({label:n,value:n}))} />
            <AsyncCreatableSelect isMulti cacheOptions loadOptions={loadResidencyOptions} defaultOptions placeholder='Residency / Visa Status (multi)' onChange={opts=>updateTravelerField(idx,'residencies', opts?opts.map(o=>o.value):[])} value={(trav.residencies||[]).map(r=>({label:r,value:r}))} />
            <Input type='number' min={0} placeholder='Age' value={trav.age} onChange={e=>updateTravelerField(idx,'age',e.target.value)} />
            <div style={{gridColumn:'1 / -1',marginTop:6}}><label><input type='checkbox' checked={!!trav.shareCost} onChange={e=>updateTravelerField(idx,'shareCost',e.target.checked)} /> <span style={{marginLeft:8}}>Share cost</span></label><Button type='button' style={{marginLeft:8}} onClick={()=>removeTraveler(idx)}>Remove</Button></div>
          </div>
        ))}
        <div style={{marginTop:10}}><Button type='button' onClick={addTraveler}>+ Add Traveler</Button></div>
        <div style={{display:'flex',gap:12,marginTop:12}}>
          <label><input type='checkbox' checked={!!formData.preferences.visaFree} onChange={e=>setFormData(p=>({...p,preferences:{...p.preferences,visaFree:e.target.checked}}))} /> <span style={{marginLeft:8}}>Visa-free only</span></label>
          <label><input type='checkbox' checked={!!formData.preferences.budget} onChange={e=>setFormData(p=>({...p,preferences:{...p.preferences,budget:e.target.checked}}))} /> <span style={{marginLeft:8}}>Budget traveler</span></label>
        </div>
        <div style={{marginTop:16}}><Button type='submit' className='bg-indigo-600 text-white'>{loading? 'Analyzing...' : 'Find Best Trips'}</Button></div>
      </form>
    </Card>
    {results.length>0 && (
      <div style={{marginTop:18}}>
        <h2 style={{textAlign:'center'}}>Comparative Destination Picks</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:12,marginTop:12}}>
          {results.map((r,i)=>(
            <Card key={i}><img src={r.image} alt={r.destination} style={{width:'100%',height:180,objectFit:'cover',borderRadius:8}}/><h3 style={{marginTop:8}}>{r.destination}</h3><p>Flight: ${r.flightCost}</p><p>Avg Daily Expense: ${r.avgDailyExpense}</p><p style={{fontWeight:600}}>Visa Fees (total): ${r.totalVisa}</p><p style={{fontWeight:800}}>Total Estimated: ${r.totalCost}</p>
              <div style={{marginTop:8,borderTop:'1px solid #eee',paddingTop:8}}><strong>Traveler breakdown</strong>{r.travelerBreakdown.map((t,idx)=>(<div key={idx} style={{display:'flex',justifyContent:'space-between',padding:'6px 0'}}><div style={{maxWidth:'55%'}}><div style={{fontWeight:600}}>{t.name}</div><div style={{fontSize:12,color:'#666'}}>{(t.nationalities||[]).join(', ')} — {(t.residencies||[]).join(', ')}</div></div><div style={{textAlign:'right'}}><div style={{fontSize:13}}>{t.visaNeeded}</div><div style={{fontWeight:600}}>${t.individualCost}</div><div style={{fontSize:12,color:'#666'}}>Visa: ${t.visaFee}</div></div></div>))}</div>
              <div style={{marginTop:8}}><Button onClick={()=>alert('Booking flow to be implemented')}>Book Flight ✈️</Button></div>
            </Card>
          ))}
        </div>
      </div>
    )}
  </div>
 ); }
