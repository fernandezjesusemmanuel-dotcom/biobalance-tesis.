'use client'

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function ConnectionTest() {
  const [status, setStatus] = useState<any>({});
  
  useEffect(() => {
    async function checkConnection() {
      const results: any = {};
      
      // 1. Verificar Variables de Entorno
      // Nota: Solo mostramos si existen, no mostramos el valor por seguridad
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      results.envVars = {
        UrlDetectada: url ? "✅ SÍ" : "❌ NO (Falta NEXT_PUBLIC_SUPABASE_URL)",
        KeyDetectada: key ? "✅ SÍ" : "❌ NO (Falta NEXT_PUBLIC_SUPABASE_ANON_KEY)",
        UrlValor: url ? url.substring(0, 15) + "..." : "N/A"
      };

      // 2. Probar Conexión Real con Supabase
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
           results.connection = "❌ FALLÓ: " + error.message;
        } else {
           results.connection = "✅ CONECTADO EXITOSAMENTE";
           results.session = data.session ? "Usuario Logueado" : "Modo Invitado (Sin sesión)";
        }
      } catch (err: any) {
        results.connection = "❌ ERROR CRÍTICO AL INICIAR CLIENTE: " + err.message;
      }

      setStatus(results);
    }

    checkConnection();
  }, []);

  return (
    <div className="p-10 font-mono text-sm bg-black min-h-screen text-green-400">
      <h1 className="text-xl font-bold mb-6 text-white border-b border-gray-700 pb-2">
        SCANNER DE CONEXIÓN SUPABASE
      </h1>

      <div className="space-y-6">
        <div>
          <h2 className="text-white mb-2">1. VARIABLES DE ENTORNO (.env.local)</h2>
          <pre className="bg-gray-900 p-4 rounded border border-gray-800">
            {JSON.stringify(status.envVars, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-white mb-2">2. PRUEBA DE CONEXIÓN</h2>
          <div className={`p-4 rounded border ${status.connection?.includes('✅') ? 'bg-green-900/30 border-green-800' : 'bg-red-900/30 border-red-800'}`}>
             {status.connection || "Probando..."}
          </div>
        </div>

        {status.session && (
            <div>
                <h2 className="text-white mb-2">3. ESTADO DE SESIÓN</h2>
                <div className="p-4 bg-blue-900/20 border border-blue-800 rounded">
                    {status.session}
                </div>
            </div>
        )}
      </div>

      <div className="mt-10 text-gray-500">
        Si ves alguna ❌ en la sección 1, revisa tu archivo .env.local<br/>
        Si ves una ❌ en la sección 2, tus credenciales son inválidas.
      </div>
    </div>
  );
}