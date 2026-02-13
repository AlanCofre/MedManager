import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import SkeletonLoader from '../components/SkeletonLoader';

const VerificarResultados = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      try {
        // Simular carga inicial
        await new Promise(resolve => setTimeout(resolve, 800));
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/licencias/mis-licencias', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.msg || json.error || 'Error');
      // json.data es el array de licencias
      setResults(json.data || []);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      // Simular verificación
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <LoadingSpinner size="large" text="Cargando verificador..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
      <Navbar />
      
      <main id="main-content" className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Verificar Resultados</h1>
          
          {/* Formulario de búsqueda */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <form onSubmit={handleSearch}>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar por nombre, RUT o ID de documento
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Juan Pérez, 12345678-9, LM-2024-001"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Buscando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Buscar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Resultados */}
          {results.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Resultados de búsqueda</h2>
              <div className="space-y-4">
                {results.map((licencia) => (
                  <div key={licencia.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">ID: {licencia.id} • Fecha: {licencia.fecha_creacion}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          licencia.estado === 'aceptado'
                            ? 'bg-green-100 text-green-800'
                            : licencia.estado === 'rechazado'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {licencia.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón de verificación */}
          <div className="mt-8">
            <button
              onClick={handleVerify}
              disabled={loading}
              className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold transition ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="small" color="white" />
                  Verificando...
                </div>
              ) : (
                'Verificar Resultados'
              )}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VerificarResultados;