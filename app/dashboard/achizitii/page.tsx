'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User, BarChart3, Package, X, Trash2, FileText, Paperclip } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function CardComanda({ comanda, onUpdate, etape }: { comanda: any, onUpdate: () => void, etape: string[] }) {
  const [pret, setPret] = useState(comanda.pret_vanzare || '');
  const [discount, setDiscount] = useState(comanda.discount_maxim || '');
  const [observatii, setObservatii] = useState(comanda.observatii_achizitii || '');
  const [producator, setProducator] = useState(comanda.producator || '');
  const [finisaj, setFinisaj] = useState(comanda.finisaj_tesatura || '');
  const [dataReceptie, setDataReceptie] = useState(comanda.data_estimata_receptie ? comanda.data_estimata_receptie.split('T')[0] : '');
  const [status, setStatus] = useState(comanda.status || 'Asteapta raspuns');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [facturaUrl, setFacturaUrl] = useState<string | null>(null);

  useEffect(() => {
    if (comanda.factura_id) {
        supabase.from('facturi').select('url').eq('id', comanda.factura_id).single().then(({data}) => {
            if (data) setFacturaUrl(data.url);
        });
    }
  }, [comanda.factura_id]);

  const handleSave = async () => {
    const { error } = await supabase.from('comenzi').update({
      pret_vanzare: Number(pret) || 0,
      discount_maxim: Number(discount) || 0,
      observatii_achizitii: observatii,
      producator: producator,
      finisaj_tesatura: finisaj,
      status: status,
      data_estimata_receptie: dataReceptie || null
    }).eq('id', comanda.id);

    if (error) alert("Eroare la salvare: " + error.message);
    else onUpdate();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const { data, error } = await supabase.storage.from('comenzi-media').upload(`${Date.now()}_${file.name}`, file);
    if (error) { alert("Eroare upload: " + error.message); return; }
    const url = supabase.storage.from('comenzi-media').getPublicUrl(data.path).data.publicUrl;
    await supabase.from('comenzi').update({ atasamente: [...(comanda.atasamente || []), url] }).eq('id', comanda.id);
    onUpdate();
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('comenzi').delete().eq('id', comanda.id);
    if (error) alert("Eroare ștergere: " + error.message);
    else { setShowConfirmDelete(false); onUpdate(); }
  };

  const handleNextStep = async () => {
    const currentIndex = etape.indexOf(comanda.status_producator);
    if (currentIndex < etape.length - 1) {
      await supabase.from('comenzi').update({ status_producator: etape[currentIndex + 1] }).eq('id', comanda.id);
      onUpdate();
    }
  };

  return (
    <div className={`bg-white p-6 rounded-3xl border shadow-xl w-72 flex flex-col relative ${comanda.status === 'Se poate produce' ? 'shadow-emerald-200' : 'shadow-amber-200'}`}>
      {comanda.tip_comanda === 'Comanda Restocare' && comanda.status_producator === 'Comenzi de Plasat' && !showConfirmDelete && (
        <button onClick={() => setShowConfirmDelete(true)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 z-10"><Trash2 size={16} /></button>
      )}
      {showConfirmDelete && (
         <div className="absolute top-4 right-4 bg-red-50 p-2 rounded-xl z-20 shadow-lg text-center">
            <p className="text-[9px] font-bold mb-1">Sigur ștergi?</p>
            <div className="flex gap-1"><button onClick={handleDelete} className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-bold">DA</button><button onClick={() => setShowConfirmDelete(false)} className="bg-gray-300 px-2 py-0.5 rounded text-[9px] font-bold">NU</button></div>
         </div>
      )}
      <div className="flex items-center gap-2 mb-2">
          {comanda.tip_comanda === 'Comanda Client' ? <div className="text-[8px] font-bold text-red-500 uppercase"><User size={10} className="inline"/> Comanda Client</div> : <div className="text-[8px] font-bold text-purple-600 uppercase"><Package size={10} className="inline"/> Restocare</div>}
      </div>
      <h3 className="font-bold text-sm mb-2">{comanda.denumire_produs}</h3>
      <div className="bg-gray-50 p-2 rounded-xl mb-4 text-[10px] space-y-1">
        <p><span className="font-bold">Întrebări Vânzări:</span> {comanda.intrebari_suplimentare || 'Nespecificat'}</p>
        <p><span className="font-bold">Termen Client:</span> {comanda.perioada_livrare_client || 'Nespecificat'}</p>
      </div>
      <div className="space-y-2 mb-4">
        <img src={comanda.imagine_produs_url} className="w-full h-24 object-contain bg-gray-50 rounded-xl" />
        <p className="text-[9px] font-bold text-gray-400 uppercase">FINISAJ: {finisaj || 'Nespecificat'}</p>
        <img src={comanda.imagine_finisaj_url} className="w-full h-24 object-contain bg-gray-50 rounded-xl" />
      </div>
      <div className="text-[11px] text-gray-600 mb-4 font-bold">Cantitate: {comanda.cantitate} | Dimensiuni: {comanda.dimensiuni}</div>
      <div className="space-y-2 mb-4">
        <input className="w-full text-xs border p-2 rounded" placeholder="Producător" value={producator} onChange={(e) => setProducator(e.target.value)} />
        <input className="w-full text-xs border p-2 rounded" placeholder="Finisaj" value={finisaj} onChange={(e) => setFinisaj(e.target.value)} />
        <input className="w-full text-xs border p-2 rounded" placeholder="Preț" value={pret} onChange={(e) => setPret(e.target.value)} />
        <input className="w-full text-xs border p-2 rounded" placeholder="Discount" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        <label className="text-[9px] font-bold uppercase text-gray-500 block">Data Estimată Recepție</label>
        <input type="date" className="w-full text-xs border p-2 rounded" value={dataReceptie} onChange={(e) => setDataReceptie(e.target.value)} />
        <textarea className="w-full text-xs border p-2 rounded" placeholder="Observații" value={observatii} onChange={(e) => setObservatii(e.target.value)} />
        <select className="w-full text-xs border p-2 rounded" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Asteapta raspuns">Asteapta raspuns</option>
          <option value="Se poate produce">Se poate produce</option>
        </select>
        <input type="file" onChange={handleFileUpload} className="hidden" id={`file-${comanda.id}`} />
        <label htmlFor={`file-${comanda.id}`} className="cursor-pointer block w-full bg-gray-100 p-2 rounded-xl text-center text-[10px] font-bold"><Paperclip size={12} className="inline"/> Atașează</label>
        <button onClick={handleSave} className="w-full bg-black text-white py-2 rounded-xl text-xs font-bold">Salvează Date</button>
        {comanda.status_producator !== 'Comenzi Livrate' && (<button onClick={handleNextStep} className="w-full bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold">Următoarea Etapă</button>)}
        
        {/* Buton Factura mutat jos */}
        {facturaUrl && (
            <a href={facturaUrl} target="_blank" rel="noopener noreferrer" className="block w-full bg-blue-100 text-blue-700 py-2 rounded-xl text-xs font-bold text-center mt-2 flex items-center justify-center gap-2">
                <FileText size={14}/> Vezi Factura
            </a>
        )}
      </div>
      <div className="mt-auto pt-4 border-t text-[11px] font-bold text-gray-500"><User size={14} className="inline mr-1" /> {comanda.profiles?.full_name || 'Agent'}</div>
    </div>
  );
}

export default function AchizitiiDashboard() {
  const [activeStep, setActiveStep] = useState('Intrebari Furnizori');
  const [view, setView] = useState('Flux');
  const [tipFiltru, setTipFiltru] = useState<'Toate' | 'Comanda Client' | 'Comanda Restocare'>('Toate');
  const [comenzi, setComenzi] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ denumire_produs: '', cantitate: '', dimensiuni: '', finisaj_tesatura: '', pret_vanzare: '', discount_maxim: '', observatii_achizitii: '', producator: '', data_estimata_receptie: '' });
  const etape = ['Intrebari Furnizori', 'Comenzi de Plasat', 'Comenzi in Lucru', 'Comenzi in Tranzit', 'Comenzi in Depozit', 'Comenzi Livrate'];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsModalOpen(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const loadData = async () => {
    const { data } = await supabase.from('comenzi').select('*, profiles(full_name)');
    if (data) setComenzi(data);
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveRestocare = async () => {
    const { error } = await supabase.from('comenzi').insert([{ 
        ...form, 
        tip_comanda: 'Comanda Restocare', 
        status_producator: 'Comenzi de Plasat', 
        status: 'Se poate produce',
        agent_id: (await supabase.auth.getUser()).data.user?.id 
    }]);
    if (error) alert("Eroare salvare: " + error.message);
    else { setIsModalOpen(false); loadData(); setForm({ denumire_produs: '', cantitate: '', dimensiuni: '', finisaj_tesatura: '', pret_vanzare: '', discount_maxim: '', observatii_achizitii: '', producator: '', data_estimata_receptie: '' }); }
  };

  const filteredComenzi = comenzi.filter(c => c.status_producator === activeStep && (tipFiltru === 'Toate' || c.tip_comanda === tipFiltru));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const statusData = etape.map(step => ({ name: step, value: comenzi.filter(c => c.status_producator === step).length }));
  
  const agentNames = [...new Set(comenzi.map(c => c.profiles?.full_name || 'Necunoscut'))];
  const agentPerformanceData = agentNames.map(name => {
    const agentOrders = comenzi.filter(c => (c.profiles?.full_name || 'Necunoscut') === name);
    return {
      name,
      'Intrebari': agentOrders.filter(c => c.status_producator === 'Intrebari Furnizori').length,
      'In Lucru': agentOrders.filter(c => c.status_producator === 'Comenzi in Lucru').length,
      'Livrate': agentOrders.filter(c => c.status_producator === 'Comenzi Livrate').length,
    };
  });

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans">
      <aside className="w-64 bg-white border-r p-6 overflow-y-auto">
        <h1 className="font-bold mb-8 text-lg">ARN Store</h1>
        <div className="space-y-4 mb-8">
            <button onClick={() => { setView('Flux'); setTipFiltru('Toate'); }} className="w-full text-left p-2 font-bold text-gray-800">Toate Comenzile</button>
            <button onClick={() => { setView('Flux'); setTipFiltru('Comanda Client'); }} className="w-full text-left p-2 font-bold text-red-600">Comenzi Client</button>
            <button onClick={() => { setView('Flux'); setTipFiltru('Comanda Restocare'); }} className="w-full text-left p-2 font-bold text-purple-600">Comenzi Restocare</button>
            <button onClick={() => setView('Analiza')} className="w-full text-left p-2 font-bold text-gray-600 flex items-center gap-2"><BarChart3 size={18}/> Analiză</button>
        </div>
        <div className="space-y-1">{etape.map(s => <button key={s} onClick={() => { setActiveStep(s); setView('Flux'); }} className={`w-full text-left px-3 py-2 text-[12px] rounded ${activeStep === s && view === 'Flux' ? 'bg-gray-100 font-bold' : ''}`}>{s}</button>)}</div>
      </aside>
      <main className="flex-1 p-10 overflow-y-auto">
        {view === 'Flux' ? (
            <>
                <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold mb-8">+ Adaugă Restocare</button>
                <div className="grid grid-cols-4 gap-8">{filteredComenzi.map(c => <CardComanda key={c.id} comanda={c} onUpdate={loadData} etape={etape} />)}</div>
            </>
        ) : (
            <div className="space-y-10">
                <div className="bg-white p-8 rounded-3xl shadow-sm">
                    <h2 className="font-bold mb-4">Analiză Status Comenzi</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart><Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>{statusData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip /><Legend /></PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm">
                    <h2 className="font-bold mb-4">Activitate pe Agent</h2>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={agentPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
                            <Bar dataKey="Intrebari" stackId="a" fill="#0088FE" /><Bar dataKey="In Lucru" stackId="a" fill="#FFBB28" /><Bar dataKey="Livrate" stackId="a" fill="#00C49F" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-3xl w-96 space-y-2 max-h-[90vh] overflow-y-auto">
                    <h3 className="font-bold mb-4">Restocare Nouă</h3>
                    {Object.keys(form).map(key => (<input key={key} type={key === 'data_estimata_receptie' ? 'date' : 'text'} className="w-full border p-2 rounded" placeholder={key} onChange={(e) => setForm({...form, [key]: e.target.value})} />))}
                    <button onClick={handleSaveRestocare} className="w-full bg-black text-white py-2 rounded-xl font-bold">Salvează</button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}