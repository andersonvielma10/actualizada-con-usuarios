import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRightLeft, Lock, Save, Phone, Search, Globe, Clock, CheckCircle2, AlertCircle, RotateCw, Wifi, WifiOff, CloudCog } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// ------------------------------------------------------------------
// PASO 1: PEGA AQUÍ TUS CREDENCIALES DE FIREBASE
// Reemplaza todo lo que está dentro de las llaves con lo que copiaste
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCPEUxbaX83eBPoIfj9I0WXfJl69qMWAbA",
  authDomain: "cripto-cambios-d8860.firebaseapp.com",
  projectId: "cripto-cambios-d8860",
  storageBucket: "cripto-cambios-d8860.firebasestorage.app",
  messagingSenderId: "161882132231",
  appId: "1:161882132231:web:cad537a197f77a033c3fa2",
  measurementId: "G-5ZYLE2D4TJ"
};
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// PASO 2: DEFINE TU PIN DE ADMINISTRADOR
// Cambia "1234" por tu PIN secreto.
// ------------------------------------------------------------------
const ADMIN_PIN = "1505"; // <--- ¡¡CAMBIA ESTO POR TU PIN!!
// ------------------------------------------------------------------

// Inicialización de Firebase (SIN DUPLICADOS)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// CONFIGURACIÓN
const APP_ID = "cripto_cambios_web"; 
const COLLECTION_NAME = "routes_data";
const DOC_ID = "exchange_routes_v1"; 

const COUNTRIES = [
  { code: 'PE', name: 'Perú', currency: 'PEN', flag: '🇵🇪' },
  { code: 'CO', name: 'Colombia', currency: 'COP', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', currency: 'CLP', flag: '🇨🇱' },
  { code: 'US', name: 'Estados Unidos', currency: 'USD', flag: '🇺🇸' },
  { code: 'VE', name: 'Venezuela', currency: 'VES', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', currency: 'USD', flag: '🇪🇨' },
  { code: 'MX', name: 'México', currency: 'MXN', flag: '🇲🇽' },
  { code: 'BR', name: 'Brasil', currency: 'BRL', flag: '🇧🇷' },
  { code: 'EU', name: 'Europa', currency: 'EUR', flag: '🇪🇺' },
];

const MASTER_ROUTES = [
  { id: 'pe_ve', from: 'PE', to: 'VE', rate: 12.50 },
  { id: 've_pe', from: 'VE', to: 'PE', rate: 0.075 },
  { id: 'cl_ve', from: 'CL', to: 'VE', rate: 0.042 },
  { id: 've_cl', from: 'VE', to: 'CL', rate: 22.0 },
  { id: 'br_ve', from: 'BR', to: 'VE', rate: 7.5 },
  { id: 've_br', from: 'VE', to: 'BR', rate: 0.12 },
  { id: 'us_ve', from: 'US', to: 'VE', rate: 45.0 },
  { id: 've_us', from: 'VE', to: 'US', rate: 0.021 },
  { id: 'co_ve', from: 'CO', to: 'VE', rate: 0.011 },
  { id: 've_co', from: 'VE', to: 'CO', rate: 85.0 },
  { id: 'mx_ve', from: 'MX', to: 'VE', rate: 2.2 },
  { id: 've_mx', from: 'VE', to: 'MX', rate: 0.40 },
  { id: 've_ec', from: 'VE', to: 'EC', rate: 0.021 },
  { id: 'pe_cl', from: 'PE', to: 'CL', rate: 250 },
  { id: 'cl_pe', from: 'CL', to: 'PE', rate: 0.0038 },
  { id: 'pe_co', from: 'PE', to: 'CO', rate: 1050 },
  { id: 'co_pe', from: 'CO', to: 'PE', rate: 0.00090 },
  { id: 'br_pe', from: 'BR', to: 'PE', rate: 0.65 },
  { id: 'pe_br', from: 'PE', to: 'BR', rate: 1.45 },
  { id: 'pe_ec', from: 'PE', to: 'EC', rate: 0.26 },
  { id: 'co_cl', from: 'CO', to: 'CL', rate: 0.23 },
  { id: 'cl_co', from: 'CL', to: 'CO', rate: 4.1 },
  { id: 'br_cl', from: 'BR', to: 'CL', rate: 165 },
  { id: 'cl_br', from: 'CL', to: 'BR', rate: 0.0058 },
  { id: 'us_pe', from: 'US', to: 'PE', rate: 3.74 },
  { id: 'pe_us', from: 'PE', to: 'US', rate: 0.26 },
  { id: 'us_cl', from: 'US', to: 'CL', rate: 940 },
  { id: 'cl_us', from: 'CL', to: 'US', rate: 0.0010 },
  { id: 'co_us', from: 'CO', to: 'US', rate: 0.00025 },
  { id: 'us_co', from: 'US', to: 'CO', rate: 3900 },
  { id: 'br_us', from: 'BR', to: 'US', rate: 0.19 },
  { id: 'us_br', from: 'US', to: 'BR', rate: 5.10 },
  { id: 'us_ec', from: 'US', to: 'EC', rate: 1.0 },
  { id: 'eu_ve', from: 'EU', to: 'VE', rate: 48.0 },
  { id: 've_eu', from: 'VE', to: 'EU', rate: 0.019 },
];

export default function App() {
  const [routes, setRoutes] = useState(MASTER_ROUTES); 
  const [adminRoutes, setAdminRoutes] = useState(MASTER_ROUTES);
  const [amount, setAmount] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dbSource, setDbSource] = useState('conectando...');
  
  const [selectedFrom, setSelectedFrom] = useState('PE');
  const [selectedTo, setSelectedTo] = useState('VE');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const mergeRoutes = (savedRoutes) => {
    if (!savedRoutes || savedRoutes.length === 0) return MASTER_ROUTES;
    const merged = [...savedRoutes];
    MASTER_ROUTES.forEach(masterRoute => {
      const exists = merged.find(r => r.id === masterRoute.id);
      if (!exists) merged.push(masterRoute);
    });
    return merged;
  };

  useEffect(() => {
    let unsubData = () => {};
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const docRef = doc(db, 'app_data', APP_ID, COLLECTION_NAME, DOC_ID);
        
        unsubData();
        unsubData = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const fullRoutes = mergeRoutes(data.routes);
            setRoutes(fullRoutes);
            setDbSource('live');
            if (!isAdmin) setAdminRoutes(fullRoutes);
            if (data.lastUpdated) setLastUpdated(data.lastUpdated);
          } else {
            const now = new Date().toISOString();
            setDbSource('creating');
            setDoc(docRef, { routes: MASTER_ROUTES, lastUpdated: now })
               .then(() => setDbSource('live'))
               .catch(e => console.log("Error creating doc", e));
            setRoutes(MASTER_ROUTES);
            setAdminRoutes(MASTER_ROUTES);
            setLastUpdated(now);
          }
          setLoading(false);
        }, (error) => {
          console.error("Data error:", error);
          setDbSource('offline');
          setLoading(false);
        });
      } else {
        setLoading(true);
        signInAnonymously(auth).catch(e => console.error("Auth error", e));
      }
    });

    return () => {
      unsubAuth();
      unsubData();
    };
  }, [isAdmin]);

  const currentRoute = useMemo(() => {
    return routes.find(r => r.from === selectedFrom && r.to === selectedTo);
  }, [routes, selectedFrom, selectedTo]);

  const result = useMemo(() => {
    if (!amount || !currentRoute) return "---";
    const rateNum = parseFloat(currentRoute.rate);
    if (isNaN(rateNum)) return "---";
    return (parseFloat(amount) * rateNum).toFixed(2);
  }, [amount, currentRoute]);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getCountry = (code) => COUNTRIES.find(c => c.code === code) || { flag: '🌐', name: code, currency: '???' };

  const handleLogin = () => {
    // Esta es la línea que ahora usa tu PIN seguro
    if (pin === ADMIN_PIN) { 
      setIsAdmin(true);
      setShowPin(false);
      setPin('');
      setSaveSuccess(false);
      setAdminRoutes([...routes]); 
    } else {
      const input = document.getElementById('pin-input');
      if(input) {
        input.style.borderColor = 'red';
        setTimeout(() => input.style.borderColor = '', 1000);
      }
    }
  };

  const handleLocalRateChange = (routeId, newValue) => {
    setSaveSuccess(false); 
    setAdminRoutes(prev => prev.map(r => 
      r.id === routeId ? { ...r, rate: newValue } : r
    ));
  };

  const saveToDatabase = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    try {
      const u = auth.currentUser;
      if (u) {
        const routesToSave = adminRoutes.map(r => {
          let rateString = String(r.rate);
          rateString = rateString.replace(',', '.');
          const finalRate = parseFloat(rateString);
          return { ...r, rate: isNaN(finalRate) ? 0 : finalRate };
        });

        const docRef = doc(db, 'app_data', APP_ID, COLLECTION_NAME, DOC_ID);
        await setDoc(docRef, { routes: routesToSave, lastUpdated: now });
        
        setLastUpdated(now); 
        setRoutes(routesToSave); 
        setAdminRoutes(routesToSave); 
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Save error:", e);
      alert("Error al guardar. Verifica tu conexión.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1b0042] to-[#0a0020] text-purple-300">
      <RotateCw className="animate-spin mb-2" size={32}/>
      <span className="font-medium">Cargando Cripto Cambios...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b0042] to-[#0a0020] font-sans text-white pb-20">
      <header className="bg-gradient-to-r from-[#2a0050] to-[#1a0030] text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-[#5c00b3]/30 p-2 rounded-lg backdrop-blur-sm shadow-md">
              <Globe size={20} className="text-[#a070ff]" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight text-[#f0f0ff]">Cripto Cambios</h1>
              <span className="text-xs text-[#a070ff] font-medium flex items-center gap-1.5 mt-1">
                 <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div> 
                 Luxury Trade
              </span>
            </div>
          </div>
          <button 
            onClick={() => isAdmin ? setIsAdmin(false) : setShowPin(!showPin)} 
            className={`p-2 rounded-full transition-all ${isAdmin ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-white/10'}`}
          >
            {isAdmin ? <Lock size={20} /> : <Lock size={20} className="opacity-70 text-purple-200"/>}
          </button>
        </div>
      </header>

      {showPin && !isAdmin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center border border-purple-700">
            <div className="bg-purple-800/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-700">
              <Lock className="text-purple-400" size={24}/>
            </div>
            <h3 className="font-bold text-white text-lg mb-1">Acceso Administrador</h3>
            <p className="text-xs text-gray-400 mb-4">Ingresa tu PIN</p>
            <div className="flex gap-2">
              <input 
                id="pin-input"
                type="password" 
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="flex-1 bg-gray-700 border-2 border-transparent px-4 py-2 rounded-xl text-center font-bold text-xl outline-none focus:border-purple-500 focus:bg-gray-900 text-white transition-all"
                placeholder="••••"
                autoFocus
              />
              <button onClick={handleLogin} className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-xl font-bold transition-colors">➜</button>
            </div>
            <button onClick={() => setShowPin(false)} className="mt-4 text-xs text-gray-400 hover:text-white">Cancelar</button>
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto p-4 space-y-6 mt-2">
        <div className="bg-gray-900 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden border border-purple-900">
          <div className="bg-gray-800 p-3 border-b border-purple-900 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-blue-400" /> 
              <h2 className="font-bold text-gray-300 text-xs uppercase tracking-wider">Cotizador al Instante</h2>
            </div>
            {dbSource === 'live' ? (
              <div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-900/20 px-2 py-1 rounded-full border border-green-800/50"><Wifi size={10} /><span>En Vivo</span></div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-900/20 px-2 py-1 rounded-full border border-amber-800/50"><WifiOff size={10} /><span>Offline</span></div>
            )}
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Envías Desde</label>
                <div className="relative">
                  <select value={selectedFrom} onChange={(e) => setSelectedFrom(e.target.value)} className="w-full py-2 bg-transparent border-b-2 border-purple-700 text-white font-bold focus:outline-none focus:border-blue-500 cursor-pointer">
                    {COUNTRIES.map(c => <option key={c.code} value={c.code} className="bg-gray-800 text-white">{c.flag} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-purple-800/50 p-2 rounded-full text-blue-300 shadow-inner shadow-purple-900"><ArrowRightLeft size={16} /></div>
              <div className="flex flex-col space-y-1 text-right">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reciben En</label>
                <div className="relative">
                  <select value={selectedTo} onChange={(e) => setSelectedTo(e.target.value)} className="w-full py-2 bg-transparent border-b-2 border-purple-700 text-white font-bold focus:outline-none focus:border-blue-500 text-right cursor-pointer" style={{direction: 'rtl'}}>
                    {COUNTRIES.map(c => <option key={c.code} value={c.code} className="bg-gray-800 text-white">{c.flag} {c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-purple-900/40 rounded-xl p-4 border border-purple-800 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all group">
              <label className="text-xs font-bold text-purple-300 block mb-1">MONTO ({getCountry(selectedFrom)?.currency})</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100.00" className="w-full bg-transparent text-3xl font-bold text-white placeholder-gray-500 outline-none" />
            </div>

            {currentRoute ? (
              <div className="text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-center items-center text-xs text-gray-400 mb-3">
                  <span className="bg-gray-700 px-3 py-1 rounded-full flex items-center gap-1 border border-purple-800 shadow-inner shadow-black/20">
                    Tasa: 1 {getCountry(selectedFrom)?.currency} = <span className="font-bold text-blue-300">{currentRoute.rate}</span> {getCountry(selectedTo)?.currency}
                  </span>
                </div>
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden border border-blue-700">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-blue-500/30 rounded-full blur-xl"></div>
                  <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-purple-500/20 rounded-full blur-xl"></div>
                  <p className="text-sm text-gray-400 mb-1">Reciben (aprox):</p>
                  <div className="text-4xl font-bold tracking-tight flex items-baseline justify-center gap-2 text-blue-300">
                    {result} <span className="text-lg text-purple-400 font-medium">{getCountry(selectedTo)?.currency}</span>
                  </div>
                </div>
                <button onClick={() => window.open(`https://wa.me/51955555497?text=Hola,%20quiero%20enviar%20${amount}%20${getCountry(selectedFrom).currency}%20a%20${getCountry(selectedTo).name}.%20Vi%20la%20tasa%20de%20${currentRoute.rate}`, '_blank')} className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/50 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Phone size={20} /> <span>Solicitar Cambio por WhatsApp</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-800 rounded-xl border border-dashed border-purple-700">
                <p className="text-gray-400 font-medium">Ruta no disponible</p>
              </div>
            )}
            <div className="flex justify-between items-center pt-4 border-t border-gray-800 text-[10px] text-gray-500">
               <div className="flex items-center gap-1"><CloudCog size={10} /> v1.0 (Producción)</div>
               {lastUpdated && <div>Act: {formatTime(lastUpdated)}</div>}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-gray-900 border-2 border-indigo-500 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 relative overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-800 to-purple-800 text-white p-4 flex justify-between items-center">
               <h3 className="font-bold flex items-center gap-2"><Save size={20} /> Editor de Tasas</h3>
               <div className="flex items-center gap-2">
                  {saveSuccess && <span className="text-xs font-bold bg-green-500/30 text-green-300 px-2 py-1 rounded-full flex items-center gap-1 animate-in fade-in"><CheckCircle2 size={12}/> Guardado</span>}
                  <button onClick={() => setIsAdmin(false)} className="text-xs bg-indigo-700 hover:bg-indigo-800 px-3 py-1 rounded-lg transition-colors">Cerrar</button>
               </div>
            </div>
            <div className="p-4">
              <div className="bg-purple-900/40 text-purple-200 p-3 rounded-lg text-xs mb-4 flex gap-2 items-start border border-purple-700">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-300"/>
                <p>Usa puntos o comas. Presiona "GUARDAR CAMBIOS" al finalizar.</p>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {adminRoutes.map((route) => {
                  const cFrom = getCountry(route.from);
                  const cTo = getCountry(route.to);
                  if (!cFrom || !cTo) return null;
                  return (
                    <div key={route.id} className="bg-gray-800 p-2 rounded-lg border border-purple-800 flex items-center justify-between hover:border-indigo-500 transition-colors shadow-inner shadow-black/20">
                      <div className="flex items-center gap-3">
                         <div className="flex -space-x-1 text-lg opacity-90"><span>{cFrom.flag}</span><span>{cTo.flag}</span></div>
                         <div className="flex flex-col"><span className="font-bold text-gray-200 text-xs">{cFrom.name} ➜ {cTo.name}</span></div>
                      </div>
                      <input type="text" value={route.rate} onChange={(e) => handleLocalRateChange(route.id, e.target.value)} className="w-24 bg-gray-700 border border-purple-700 rounded px-2 py-1 text-right font-bold text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none" inputMode="decimal" />
                    </div>
                  );
                })}
              </div>
              <button onClick={saveToDatabase} disabled={saving} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 mt-4 ${saving ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : saveSuccess ? 'bg-green-600 text-white scale-95 shadow-green-900/50' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white active:scale-95 shadow-blue-900/50'}`}>
                {saving ? <><RotateCw className="animate-spin"/> Guardando...</> : saveSuccess ? <><CheckCircle2/> ¡Listo!</> : <><Save/> GUARDAR CAMBIOS</>}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}