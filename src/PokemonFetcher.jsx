import React, { useState, useEffect } from 'react';
import './PokemonFetcher.css';

const PokemonFetcher = () => {
  // Estados
  const [tipos, setTipos] = useState([]);                // Lista de tipos de Pokémon
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');  // Tipo elegido por el usuario
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState('10'); // Cantidad a mostrar
  const [pokemones, setPokemones] = useState([]);         // Lista de Pokémon a renderizar
  const [cargando, setCargando] = useState(false);        // Indicador de carga
  const [error, setError] = useState(null);               // Errores

  // Al montar: obtener lista de tipos
  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/type/');
        if (!response.ok) throw new Error('Error al cargar los tipos');
        const data = await response.json();
        setTipos(data.results);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchTipos();
  }, []);

  // Función para mezclar aleatoriamente un array (Fisher-Yates)
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Cuando el tipo o la cantidad cambian => recargar la lista de Pokémon
  useEffect(() => {
    if (!tipoSeleccionado) {
      setPokemones([]);
      return;
    }

    const fetchPokemonesPorTipo = async () => {
      try {
        setCargando(true);
        setError(null);

        // Obtener todos los Pokémon de ese tipo
        const response = await fetch(`https://pokeapi.co/api/v2/type/${tipoSeleccionado}/`);
        if (!response.ok) throw new Error('Error al cargar los Pokémon de este tipo');
        const data = await response.json();

        let listaPokemon = data.pokemon;

        // Si la cantidad es "todos", mezclamos aleatoriamente
        if (cantidadSeleccionada === 'todos') {
          listaPokemon = shuffleArray(listaPokemon);
        } else {
          // Si no, limitamos a la cantidad seleccionada
          listaPokemon = listaPokemon.slice(0, parseInt(cantidadSeleccionada, 10));
        }

        // Obtener detalles de cada Pokémon para imagen/nombre/tipos
        const detallesPromises = listaPokemon.map(async (pokeEntry) => {
          const res = await fetch(pokeEntry.pokemon.url);
          const pokeData = await res.json();
          return {
            id: pokeData.id,
            nombre: pokeData.name,
            imagen: pokeData.sprites.front_default,
            tipos: pokeData.types.map((t) => t.type.name),
          };
        });

        const detalles = await Promise.all(detallesPromises);
        setPokemones(detalles);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchPokemonesPorTipo();
  }, [tipoSeleccionado, cantidadSeleccionada]); // <-- Dependencias

  return (
    <div className="pokemon-container">
      <h2>Buscador de Pokémon por Tipo</h2>

      {/* Selector de tipo */}
      <div className="buscador">
        <label htmlFor="tipoSelect">Selecciona un tipo: </label>
        <select
          id="tipoSelect"
          value={tipoSeleccionado}
          onChange={(e) => setTipoSeleccionado(e.target.value)}
        >
          <option value="">-- Elige un tipo --</option>
          {tipos.map((tipo) => (
            <option key={tipo.name} value={tipo.name}>
              {tipo.name.charAt(0).toUpperCase() + tipo.name.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de cantidad */}
      <div className="buscador">
        <label htmlFor="cantidadSelect">Cantidad de Pokémon: </label>
        <select
          id="cantidadSelect"
          value={cantidadSeleccionada}
          onChange={(e) => setCantidadSeleccionada(e.target.value)}
        >
          <option value="6">6</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="todos">Todos (aleatorio)</option>
        </select>
      </div>

      {/* Estado de carga o error */}
      {cargando && <div className="cargando">Cargando Pokémon...</div>}
      {error && <div className="error">Error: {error}</div>}

      {/* Lista de Pokémon */}
      <div className="pokemon-list">
        {pokemones.length === 0 && !cargando && !error && (
          <p>Selecciona un tipo para ver sus Pokémon.</p>
        )}

        {pokemones.map((pokemon) => (
          <div key={pokemon.id} className="pokemon-card">
            <h3>{pokemon.nombre.charAt(0).toUpperCase() + pokemon.nombre.slice(1)}</h3>
            {pokemon.imagen ? (
              <img src={pokemon.imagen} alt={pokemon.nombre} />
            ) : (
              <p>(Sin imagen)</p>
            )}
            <p>
              <strong>Tipos:</strong>{' '}
              {pokemon.tipos.map((tipo) => tipo.charAt(0).toUpperCase() + tipo.slice(1)).join(', ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PokemonFetcher;
