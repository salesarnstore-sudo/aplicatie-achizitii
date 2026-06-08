'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2, Plus, X } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function CardVanzari({ comanda, onUpdate }: { comanda: any, onUpdate: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmLivrare, setShowConfirmLivrare] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const handleAction = async (nextStep: string) => {
    const { error } = await supabase.from('comenzi').update({ status_producator: nextStep }).eq('id', comanda.id);
    if (!error) { onUpdate(); setShowConfirm(false); setShowConfirmLivrare(false); }
    else alert("Eroare: " + error.message);
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('comenzi').delete().eq('id', comanda.id);
    if (!error) { onUpdate(); setShowConfirmDelete(false); }
    else alert("Eroare ștergere: " + error.message);
  };

  return (
    <div className={`bg-white p-6 rounded-3xl border shadow-xl w-72 flex flex-col relative ${comanda.status === 'Se poate produce' ? 'shadow-emerald-200' : 'shadow-amber-200'}`}>
      {selectedImg && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedImg(null)}>
          <img src={selectedImg} className="max-w-full max-h-full object-contain" />
        </div>
      )}
      {comanda.status_producator === 'Intrebari Furnizori' && !showConfirmDelete && (
        <button onClick={() => setShowConfirmDelete(true)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 z-10"><Trash2 size={16}/></button>
      )}
      <div className="absolute top-4 left-4 bg-red-100 text-red-600 px-2 py-1 rounded-lg text-[8px] font-bold uppercase">{comanda.tip_comanda}</div>
      <h3 className="font-bold text-sm mb-4 mt-6">{comanda.denumire_produs}</h3>
      <div className="space-y-2 mb-4">
        <img src={comanda.imagine_produs_url} className="w-full h-24 object-cover rounded-xl bg-gray-100" />
        <p className="text-[9px] font-bold text-gray-400 uppercase">FINISAJ: {comanda.finisaj_tesatura}</p>
        <img src={comanda.imagine_finisaj_url} className="w-full h-24 object-cover rounded-xl bg-gray-100" />
      </div>
      
      {comanda.atasamente && comanda.atasamente.length > 0 && (
        <div className="grid grid-cols-4 gap-1 mb-4">
            {comanda.atasamente.map((url: string, index: number) => (
                <div key={index} onClick={() => setSelectedImg(url)} className="w-full aspect-square rounded bg-gray-100 overflow-hidden cursor-pointer">
                    <img src={url} className="w-full h-full object-cover" />
                </div>
            ))}
        </div>
      )}

      <div className="text-[11px] text-gray-600 bg-gray-50 p-3 rounded-lg mb-4 space-y-1">
        <p>Obs. Achiziții: {comanda.observatii_achizitii || 'Nicio observație'}</p>
        <p className="font-bold">Cantitate: {comanda.cantitate} | Dimensiuni: {comanda.dimensiuni}</p>
        <p className="font-bold text-black">Preț: {comanda.pret_vanzare} | Discount: {comanda.discount_maxim}%</p>
        <p>Recepție: {comanda.data_estimata_receptie || 'În așteptare'}</p>
        <p className="italic">Termen Client: {comanda.perioada_livrare_client}</p>
      </div>
      <div className="mb-4 text-[10px] font-bold uppercase text-blue-600 bg-blue-50 py-1 px-3 rounded-full text-center">Etapa: {comanda.status_producator}</div>
      
      {showConfirmDelete && (
         <div className="mb-4 p-2 bg-red-50 rounded text-center"><p className="text-[10px] font-bold mb-1">Sigur ștergi?</p><button onClick={handleDelete} className="bg-red-600 text-white px-4 py-1 rounded text-[10px] font-bold">DA</button></div>
      )}
      
      {comanda.status === 'Se poate produce' && comanda.status_producator === 'Intrebari Furnizori' && !showConfirm && !showConfirmDelete && (
        <button onClick={() => setShowConfirm(true)} className="w-full bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold mb-2">Avans Încasat & Plasare Comandă</button>
      )}
      {showConfirm && (
        <div className="mb-4 p-2 bg-emerald-50 rounded text-center"><p className="text-[10px] font-bold mb-1">Confirmi?</p><button onClick={() => handleAction('Comenzi de Plasat')} className="bg-emerald-600 text-white px-4 py-1 rounded text-[10px] font-bold">DA</button></div>
      )}
      
      {comanda.status_producator === 'Comenzi in Depozit' && !showConfirmLivrare && !showConfirmDelete && (
        <button onClick={() => setShowConfirmLivrare(true)} className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-bold mb-2">Livrare Comandă</button>
      )}
      {showConfirmLivrare && (
        <div className="mb-4 p-2 bg-blue-50 rounded text-center"><p className="text-[10px] font-bold mb-1">Confirmi livrarea?</p><button onClick={() => handleAction('Comenzi Livrate')} className="bg-blue-600 text-white px-4 py-1 rounded text-[10px] font-bold">DA</button></div>
      )}
      
      <div className="w-full text-center py-2 rounded-full border text-[10px] uppercase font-bold text-gray-700 bg-gray-50 mt-auto">{comanda.status}</div>
    </div>
  );
}

export default function VanzariDashboard() {
  const [comenzi, setComenzi] = useState<any[]>([]);
  const [restocari, setRestocari] = useState<any[]>([]);
  const [facturi, setFacturi] = useState<any[]>([]);
  const [activeView, setActiveView] = useState('Comenzi in Lucru');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ denumire_produs: '', cantitate: '', dimensiuni: '', finisaj_tesatura: '', intrebari_suplimentare: '', perioada_livrare_client: '', numar_factura: '' });
  const [fileProdus, setFileProdus] = useState<File | null>(null);
  const [fileFinisaj, setFileFinisaj] = useState<File | null>(null);
  const [facturaFile, setFacturaFile] = useState<File | null>(null);
  const [selectate, setSelectate] = useState<string[]>([]);

  const loadData = async () => { 
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data } = await supabase.from('comenzi').select('*').eq('agent_id', user.id); 
        setComenzi(data || []); 
    }
    const { data: res } = await supabase.from('comenzi').select('*').eq('tip_comanda', 'Comanda Restocare');
    setRestocari(res || []);
    const { data: f } = await supabase.from('facturi').select('*');
    setFacturi(f || []);
  };

  const handleAddOrder = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let imagine_produs_url = '', imagine_finisaj_url = '';
    if (fileProdus) { const { data } = await supabase.storage.from('comenzi-media').upload(`${Date.now()}_produs`, fileProdus); if (data) imagine_produs_url = supabase.storage.from('comenzi-media').getPublicUrl(data.path).data.publicUrl; }
    if (fileFinisaj) { const { data } = await supabase.storage.from('comenzi-media').upload(`${Date.now()}_finisaj`, fileFinisaj); if (data) imagine_finisaj_url = supabase.storage.from('comenzi-media').getPublicUrl(data.path).data.publicUrl; }
    
    const { error } = await supabase.from('comenzi').insert([{
        agent_id: user.id,
        tip_comanda: 'Comanda Client',
        denumire_produs: form.denumire_produs,
        cantitate: form.cantitate,
        dimensiuni: form.dimensiuni,
        finisaj_tesatura: form.finisaj_tesatura,
        intrebari_suplimentare: form.intrebari_suplimentare,
        perioada_livrare_client: form.perioada_livrare_client,
        imagine_produs_url,
        imagine_finisaj_url,
        status_producator: 'Intrebari Furnizori',
        status: 'Asteapta raspuns'
    }]);
    
    if (error) alert("Eroare DB: " + error.message);
    else { setIsModalOpen(false); loadData(); }
    setLoading(false);
  };

  const handleCreateFactura = async () => {
    if (!facturaFile || selectate.length === 0 || !form.numar_factura) return;
    setLoading(true);
    const { data, error } = await supabase.storage.from('facturi').upload(`f_${Date.now()}`, facturaFile);
    if (error) { alert("Eroare Upload: " + error.message); setLoading(false); return; }
    
    const { data: urlData } = supabase.storage.from('facturi').getPublicUrl(data.path);
    const { data: f, error: dbError } = await supabase.from('facturi').insert([{ url: urlData.publicUrl, numar_factura: form.numar_factura }]).select().single();
    
    if (dbError) { alert("Eroare DB: " + dbError.message); setLoading(false); return; }
    await supabase.from('comenzi').update({ factura_id: f.id, status_producator: 'Comenzi de Plasat' }).in('id', selectate);
    
    setIsFacturaModalOpen(false); setLoading(false); loadData();
  };

  useEffect(() => { 
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setIsModalOpen(false); setIsFacturaModalOpen(false); } };
    window.addEventListener('keydown', handleEsc);
    loadData(); 
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans">
      <aside className="w-64 bg-white border-r p-6">
        <h1 className="font-bold mb-8 text-lg">ARN Sales</h1>
        <button onClick={() => setActiveView('Comenzi in Lucru')} className="block w-full p-2 text-left font-bold">Comenzile mele</button>
        <button onClick={() => setActiveView('Restocare')} className="block w-full p-2 text-left font-bold text-purple-600">Produse în Restocare</button>
        <button onClick={() => setActiveView('Facturi')} className="block w-full p-2 text-left font-bold">Facturi</button>
        <button onClick={() => setActiveView('Arhiva')} className="block w-full p-2 text-left font-bold">Arhivă</button>
      </aside>
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="flex justify-between mb-8">
            <h2 className="text-xl font-bold">{activeView}</h2>
            {activeView !== 'Restocare' && (
                <button onClick={() => activeView === 'Facturi' ? setIsFacturaModalOpen(true) : setIsModalOpen(true)} className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><Plus size={14}/> {activeView === 'Facturi' ? 'Adaugă Factură' : 'Adaugă Comandă'}</button>
            )}
        </div>
        
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-3xl w-96 max-h-[90vh] overflow-y-auto space-y-2">
                    <div className="flex justify-between mb-4"><h3 className="font-bold">Comandă Nouă</h3><button onClick={() => setIsModalOpen(false)}><X/></button></div>
                    <input className="w-full border p-2 rounded" placeholder="Denumire" onChange={(e) => setForm({...form, denumire_produs: e.target.value})} />
                    <input className="w-full border p-2 rounded" placeholder="Cantitate" onChange={(e) => setForm({...form, cantitate: e.target.value})} />
                    <input className="w-full border p-2 rounded" placeholder="Dimensiuni" onChange={(e) => setForm({...form, dimensiuni: e.target.value})} />
                    <input className="w-full border p-2 rounded" placeholder="Finisaj" onChange={(e) => setForm({...form, finisaj_tesatura: e.target.value})} />
                    <label className="text-[10px] font-bold block">Poză Produs</label>
                    <input type="file" onChange={(e) => setFileProdus(e.target.files?.[0] || null)} />
                    <label className="text-[10px] font-bold block">Poză Finisaj</label>
                    <input type="file" onChange={(e) => setFileFinisaj(e.target.files?.[0] || null)} />
                    <input className="w-full border p-2 rounded" placeholder="Întrebări suplimentare" onChange={(e) => setForm({...form, intrebari_suplimentare: e.target.value})} />
                    <input className="w-full border p-2 rounded" placeholder="Termen Client" onChange={(e) => setForm({...form, perioada_livrare_client: e.target.value})} />
                    <button onClick={handleAddOrder} disabled={loading} className="w-full bg-black text-white py-2 rounded-xl">{loading ? 'Se salvează...' : 'Salvează'}</button>
                </div>
            </div>
        )}

        {isFacturaModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-3xl w-[500px] max-h-[90vh] overflow-y-auto space-y-4">
                    <h3 className="font-bold">Factură Nouă</h3>
                    <input className="w-full border p-2 rounded" placeholder="Număr Factură" onChange={(e) => setForm({...form, numar_factura: e.target.value})} />
                    <input type="file" onChange={(e) => setFacturaFile(e.target.files?.[0] || null)} />
                    {comenzi.filter(c => c.status_producator === 'Intrebari Furnizori' && c.status === 'Se poate produce' && !c.factura_id).map(c => (
                        <label key={c.id} className="flex items-center gap-2 p-2 border rounded text-sm font-bold cursor-pointer">
                            <input type="checkbox" onChange={(e) => e.target.checked ? setSelectate([...selectate, c.id]) : setSelectate(selectate.filter(i => i !== c.id))} />
                            {c.denumire_produs}
                        </label>
                    ))}
                    <button onClick={handleCreateFactura} disabled={loading} className="w-full bg-black text-white py-2 rounded-xl">{loading ? 'Se salvează...' : 'Salvează'}</button>
                </div>
            </div>
        )}

        {activeView === 'Facturi' ? (
            <div className="space-y-6">
                {facturi.map(f => (
                    <div key={f.id} className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-4">
                            <h3 className="font-bold text-lg">Factura {f.numar_factura}</h3>
                            <a href={f.url} target="_blank" className="text-blue-600 underline text-xs font-bold">Descarcă PDF</a>
                        </div>
                        <table className="w-full text-xs">
                            <thead><tr className="text-gray-400 uppercase text-[10px]"><th className="text-left pb-2">Produs</th><th className="text-left pb-2">Denumire</th><th className="text-left pb-2">Dimensiuni</th><th className="text-left pb-2">Finisaj</th><th className="text-left pb-2">Cantitate</th></tr></thead>
                            <tbody>{comenzi.filter(c => c.factura_id === f.id).map(c => (
                                <tr key={c.id} className="border-t">
                                    <td className="py-2"><img src={c.imagine_produs_url} className="w-10 h-10 object-cover rounded" /></td>
                                    <td className="py-2 font-bold">{c.denumire_produs}</td>
                                    <td className="py-2">{c.dimensiuni}</td>
                                    <td className="py-2"><img src={c.imagine_finisaj_url} className="w-10 h-10 object-cover rounded" /></td>
                                    <td className="py-2">{c.cantitate}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                ))}
            </div>
        ) : activeView === 'Restocare' ? (
            <div className="space-y-4">
                <input className="border p-2 rounded-xl w-64 text-sm" placeholder="Caută..." onChange={(e) => setSearchTerm(e.target.value)} />
                <table className="w-full bg-white rounded-xl shadow-sm border text-xs">
                    <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-bold">
                        <tr><th className="p-4">Produs</th><th className="p-4">Denumire</th><th className="p-4">Dimensiuni</th><th className="p-4">Finisaj</th><th className="p-4">Preț/Disc</th><th className="p-4">Recepție</th><th className="p-4">Observații</th></tr>
                    </thead>
                    <tbody>{restocari.filter(r => r.denumire_produs?.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                        <tr key={r.id} className="border-t font-bold">
                            <td className="p-4"><img src={r.imagine_produs_url} className="w-12 h-12 object-cover rounded" /></td>
                            <td className="p-4">{r.denumire_produs}</td>
                            <td className="p-4">{r.dimensiuni}</td>
                            <td className="p-4"><img src={r.imagine_finisaj_url} className="w-12 h-12 object-cover rounded" /></td>
                            <td className="p-4">{r.pret_vanzare} / {r.discount_maxim}%</td>
                            <td className="p-4">{r.data_estimata_receptie || '-'}</td>
                            <td className="p-4 text-[10px] font-normal">{r.observatii_achizitii}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        ) : (
            <div className="grid grid-cols-4 gap-8">
                {comenzi.filter(c => activeView === 'Arhiva' ? c.status_producator === 'Comenzi Livrate' : c.status_producator !== 'Comenzi Livrate').map((c) => <CardVanzari key={c.id} comanda={c} onUpdate={loadData} />)}
            </div>
        )}
      </main>
    </div>
  );
}