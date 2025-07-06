import React, { useState, useEffect } from 'react';
import './PokemonFetcher.css';

const PokemonFetcher = () => {
  const [tipos, setTipos] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('aleatorio'); // Predeterminado
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState('10');
  const [pokemones, setPokemones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarAleatorio, setMostrarAleatorio] = useState(true);

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

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  useEffect(() => {
    const fetchPokemones = async () => {
      try {
        setCargando(true);
        setError(null);
        let cantidad = cantidadSeleccionada === 'todos' ? 30 : parseInt(cantidadSeleccionada, 10);
        const fetchedPokemones = [];
        const ids = new Set();

        if (tipoSeleccionado === 'aleatorio') {
          while (ids.size < cantidad) {
            const randomId = Math.floor(Math.random() * 898) + 1;
            ids.add(randomId);
          }

          for (const id of ids) {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`);
            const data = await res.json();
            fetchedPokemones.push({
              id: data.id,
              nombre: data.name,
              imagen: data.sprites.front_default,
              tipos: data.types.map((t) => t.type.name),
            });
          }

          setPokemones(fetchedPokemones);
          setMostrarAleatorio(true);
          return;
        }

        if (!tipoSeleccionado) {
          setMostrarAleatorio(true);
          return;
        }

        const response = await fetch(`https://pokeapi.co/api/v2/type/${tipoSeleccionado}/`);
        if (!response.ok) throw new Error('Error al cargar los Pokémon de este tipo');
        const data = await response.json();

        let listaPokemon = data.pokemon;

        if (cantidadSeleccionada === 'todos') {
          listaPokemon = shuffleArray(listaPokemon);
        } else {
          listaPokemon = listaPokemon.slice(0, cantidad);
        }

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
        setMostrarAleatorio(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchPokemones();
  }, [tipoSeleccionado, cantidadSeleccionada]);

  return (
    <div className="pokemon-container">
      <h2>
        {tipoSeleccionado === 'aleatorio'
          ? 'Pokémon aleatorios'
          : tipoSeleccionado
          ? `Pokémon tipo ${tipoSeleccionado}`
          : 'Conoce a tus Pokémon'}
      </h2>

      {/* Controles */}
      <div className="buscador">
        <label htmlFor="tipoSelect">Selecciona un tipo: </label>
        <select
          id="tipoSelect"
          value={tipoSeleccionado}
          onChange={(e) => setTipoSeleccionado(e.target.value)}
        >
          <option value="aleatorio">Aleatorio</option>
          <option value="">-- Elige un tipo --</option>
          {tipos.map((tipo) => (
            <option key={tipo.name} value={tipo.name}>
              {tipo.name.charAt(0).toUpperCase() + tipo.name.slice(1)}
            </option>
          ))}
        </select>
      </div>

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
          <option value="todos">Todos (máx 30 aleatorios)</option>
        </select>
      </div>

      {/* Estado de carga/error */}
      {cargando && <div className="cargando">Cargando Pokémon...</div>}
      {error && <div className="error">Error: {error}</div>}

      {/* Lista */}
      <div className="pokemon-list">
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
